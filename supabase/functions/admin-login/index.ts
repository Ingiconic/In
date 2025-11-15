import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin credentials (in production, these should be in environment variables)
const ADMIN_USERNAME = "IngIconic";
const ADMIN_PASSWORD = "Ing131314#";

// Simple hash function for password verification
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate a secure random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'نام کاربری و رمز عبور الزامی است' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new Response(
        JSON.stringify({ error: 'نام کاربری یا رمز عبور اشتباه است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure session token
    const sessionToken = generateSessionToken();
    const loginTime = new Date().getTime();
    const expiresAt = loginTime + (24 * 60 * 60 * 1000); // 24 hours

    // Hash the session token for storage
    const hashedToken = await hashPassword(sessionToken);

    // Store session in Supabase (optional, for multi-device support)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // You can optionally store admin sessions in a table for tracking
    // For now, we'll just return the token

    return new Response(
      JSON.stringify({
        success: true,
        token: sessionToken,
        expiresAt
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Set secure cookie (optional)
          'Set-Cookie': `admin_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
        }
      }
    );

  } catch (error) {
    console.error('Error in admin-login function:', error);
    return new Response(
      JSON.stringify({ error: 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
