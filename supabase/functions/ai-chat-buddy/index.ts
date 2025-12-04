import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const personalityPrompts = {
  friendly: "You are a friendly and supportive study buddy. Be warm, encouraging, and helpful. Use emojis occasionally.",
  energetic: "You are an energetic and enthusiastic study buddy! Be exciting, motivating, and full of energy! Use lots of emojis!",
  caring: "You are a caring and empathetic study buddy. Be gentle, understanding, and supportive. Show that you care.",
  smart: "You are an intelligent and knowledgeable study buddy. Be precise, informative, and educational. Focus on deep understanding.",
};

// Suspicious patterns to detect prompt injection
const suspiciousPatterns = [
  /ignore\s+(previous|prior|all)\s+(instructions?|prompts?)/i,
  /system\s+prompt/i,
  /you\s+are\s+now/i,
  /pretend\s+to\s+be/i,
  /act\s+as\s+if/i,
  /disregard\s+(all|any|previous)/i,
];

// Input validation schema
const chatSchema = z.object({
  message: z.string()
    .min(1, 'پیام نمی‌تواند خالی باشد')
    .max(2000, 'پیام نباید بیشتر از ۲۰۰۰ کاراکتر باشد')
    .refine(
      val => !suspiciousPatterns.some(p => p.test(val)),
      'محتوای نامعتبر'
    ),
  personality: z.enum(['friendly', 'energetic', 'caring', 'smart']).optional().default('friendly'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate input
    const validationResult = chatSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: validationResult.error.errors[0]?.message || 'ورودی نامعتبر است' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { message, personality } = validationResult.data;
    const systemPrompt = personalityPrompts[personality] || personalityPrompts.friendly;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'کلید API پیکربندی نشده است' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `${systemPrompt} You are helping an Iranian student. Always respond in Persian (Farsi). Be culturally aware and respectful.`,
          },
          {
            role: "user",
            content: message,
          },
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
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error('Error in ai-chat-buddy:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'خطای داخلی سرور' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
