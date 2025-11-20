import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: IP -> { attempts: number, lastAttempt: timestamp }
const rateLimitMap = new Map<string, { attempts: number, lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Validation schema
const adminAuthSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
});

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window expired
  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
    return true;
  }
  
  // Check if too many attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  return true;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
  } else {
    record.attempts++;
    record.lastAttempt = now;
  }
}

// Load admin credentials from secure environment variables
const ADMIN_USERNAME = Deno.env.get('ADMIN_USERNAME');
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'تعداد تلاش‌های ناموفق زیاد است. لطفا ۱۵ دقیقه دیگر دوباره تلاش کنید' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = adminAuthSchema.safeParse(body);
    if (!validation.success) {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { username, password } = validation.data;

    // Check if credentials are configured
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'سرور به درستی پیکربندی نشده است' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Failed admin login attempt for username: ${username} from IP: ${clientIP}`);
      recordFailedAttempt(clientIP);
      
      return new Response(
        JSON.stringify({ error: 'نام کاربری یا رمز عبور اشتباه است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Successful admin login for username: ${username}`);

    // Create Supabase client with service role to sign in admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get admin email (username + domain)
    const adminEmail = `${username}@admin.easyders.com`;

    // Check if admin user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminUser = existingUsers?.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      // Create admin user if doesn't exist
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
      });

      // If user already exists (edge case where listUsers didn't return them), just continue to sign in
      if (createError) {
        if (createError.message?.includes('already been registered')) {
          console.log('Admin user already exists, proceeding to sign in');
        } else {
          console.error('Error creating admin user:', createError);
          return new Response(
            JSON.stringify({ error: 'خطا در ایجاد کاربر مدیریت' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (newUser?.user) {
        // Assign admin role for newly created user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role: 'admin' })
          .select()
          .single();

        if (roleError && !roleError.message?.includes('duplicate')) {
          console.error('Error assigning admin role:', roleError);
        }
      }
    }

    // Sign in the admin user and get session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: password,
    });

    if (signInError || !signInData.session) {
      console.error('Error signing in admin:', signInError);
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ error: 'خطا در ورود به سیستم' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limit on successful login
    rateLimitMap.delete(clientIP);

    return new Response(
      JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
