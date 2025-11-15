import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt validation schema with injection detection
const aiPromptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "پرامپت نمی‌تواند خالی باشد")
    .max(2000, "پرامپت حداکثر ۲۰۰۰ کاراکتر است")
    .refine(
      (val) => !containsSuspiciousPatterns(val),
      "محتوای نامعتبر شناسایی شد"
    ),
  groupId: z.string().uuid("شناسه گروه نامعتبر است")
});

function containsSuspiciousPatterns(text: string): boolean {
  const suspiciousPatterns = [
    /ignore\s+(previous|prior|all)\s+(instructions?|prompts?)/i,
    /system\s+prompt/i,
    /دستورات\s+قبلی.*نادیده/i,
    /نادیده\s+بگیر.*دستور/i,
    /disregard\s+(previous|prior)/i,
    /forget\s+(everything|all)/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'احراز هویت مورد نیاز است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT and get user - pass the token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'احراز هویت نامعتبر' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse and validate input with zod
    const body = await req.json();
    const validation = aiPromptSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'ورودی نامعتبر', 
          details: validation.error.issues.map(i => i.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, groupId } = validation.data;

    // 3. Verify group membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'شما عضو این گروه نیستید' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "شما یک دستیار هوشمند فارسی‌زبان هستید که در گروه چت عمومی ایزی درس فعالیت می‌کنید. به سوالات کاربران به زبان فارسی و با لحنی دوستانه پاسخ دهید. پاسخ‌های شما باید واضح، مفید و مختصر باشند.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت درخواست. لطفاً بعداً امتحان کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار تمام شده است. لطفاً به مدیریت اطلاع دهید." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("خطا در ارتباط با هوش مصنوعی");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save AI response to group (use service role to bypass RLS)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Create a system user ID for AI messages (using a fixed UUID)
    const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

    const { error: insertError } = await supabaseService.from("group_messages").insert({
      group_id: groupId,
      user_id: AI_USER_ID,
      content: `🤖 ${aiResponse}`,
    });

    if (insertError) {
      throw new Error("خطا در ذخیره پیام هوش مصنوعی");
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطای ناشناخته" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});