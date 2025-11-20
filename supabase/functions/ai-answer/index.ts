import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Suspicious pattern detection
const suspiciousPatterns = [
  /ignore\s+(previous|prior|all)\s+(instructions?|prompts?)/i,
  /system\s+prompt/i,
  /دستورات\s+قبلی.*نادیده/i,
  /نادیده\s+بگیر.*دستور/i,
  /disregard\s+(previous|prior)/i,
  /forget\s+(everything|all)/i,
];

function containsSuspiciousPatterns(text: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

// Validation schema
const aiAnswerSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'سوال نمی‌تواند خالی باشد')
    .max(2000, 'سوال حداکثر ۲۰۰۰ کاراکتر است')
    .refine(
      (val) => !containsSuspiciousPatterns(val),
      'محتوای نامعتبر شناسایی شد'
    ),
  context: z
    .string()
    .trim()
    .max(5000, 'متن مرجع حداکثر ۵۰۰۰ کاراکتر است')
    .optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client for auth verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { 
            Authorization: authHeader 
          } 
        }
      }
    );

    // Verify the JWT and get user - pass the token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for RPC calls
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Check and deduct coins atomically (10 coins for ai-answer)
    const { data: success, error: coinError } = await supabaseAdmin.rpc('deduct_user_coins', {
      _amount: 10,
      _reason: 'ai_answer'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای استفاده از این ابزار به ۱۰ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    
    // Validate input
    const validation = aiAnswerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { question, context } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('کلید API پیکربندی نشده است');
    }

    const systemPrompt = 'شما یک معلم خبره هستید که به دانش‌آموزان کمک می‌کنید سوالات درسی خود را حل کنند. پاسخ‌های شما باید دقیق، کامل و آموزنده باشند و همراه با توضیحات گام به گام ارائه شوند.';
    
    let userPrompt = `لطفا به سوال زیر پاسخ دقیق و کامل بده:\n\n${question}`;
    
    if (context) {
      userPrompt += `\n\nمتن مرجع:\n${context}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'محدودیت تعداد درخواست. لطفا کمی صبر کنید.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'اعتبار شما تمام شده است.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('خطا در ارتباط با سرویس هوش مصنوعی');
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-answer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای ناشناخته' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});