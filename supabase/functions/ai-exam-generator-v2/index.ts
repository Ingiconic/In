import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const examSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
  questionCount: z.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.object({
    multipleChoice: z.number().int().min(0).max(50).optional(),
    fillBlank: z.number().int().min(0).max(50).optional(),
    essay: z.number().int().min(0).max(50).optional(),
  }).optional(),
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

    // Create Supabase client
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

    // Check and deduct coins atomically (10 coins for exam generation)
    const { data: success, error: coinError } = await supabase.rpc('deduct_user_coins', {
      _amount: 10,
      _reason: 'ai_exam_generator_v2'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای ساخت آزمون به ۱۰ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    
    // Validate input
    const validation = examSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { content, questionCount, difficulty, questionTypes } = validation.data;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate question distribution
    const mcCount = questionTypes?.multipleChoice || Math.floor(questionCount * 0.5);
    const fbCount = questionTypes?.fillBlank || Math.floor(questionCount * 0.3);
    const essayCount = questionTypes?.essay || Math.floor(questionCount * 0.2);

    const systemPrompt = `شما یک مدرس حرفه‌ای هستید که آزمون‌های متنوع و دقیق طراحی می‌کنید.

سه نوع سوال ایجاد کنید:
1. چند گزینه‌ای (Multiple Choice): ${mcCount} سوال
2. جای خالی (Fill in the Blank): ${fbCount} سوال  
3. تشریحی (Essay): ${essayCount} سوال

برای سوالات چند گزینه‌ای:
- 4 گزینه با یک جواب صحیح
- گزینه‌های اشتباه باید معقول باشند

برای جای خالی:
- جمله‌ای با یک کلمه یا عبارت حذف شده (با ___ نشان داده شود)
- جواب صحیح را مشخص کنید

برای تشریحی:
- سوالی که نیاز به توضیح دارد
- معیارهای ارزیابی را مشخص کنید
- نکات کلیدی که باید در پاسخ باشد

سطح دشواری: ${difficulty}`;

    const userPrompt = `از روی این محتوا ${questionCount} سوال بساز:

${content}

پاسخ را دقیقاً به این فرمت JSON برگردان:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "متن سوال",
      "options": ["گزینه 1", "گزینه 2", "گزینه 3", "گزینه 4"],
      "correct_answer": "گزینه صحیح",
      "explanation": "توضیحات"
    },
    {
      "type": "fill_blank",
      "question": "متن با ___ جای خالی",
      "correct_answer": "کلمه صحیح",
      "explanation": "توضیحات"
    },
    {
      "type": "essay",
      "question": "سوال تشریحی",
      "evaluation_criteria": ["معیار 1", "معیار 2"],
      "key_points": ["نکته 1", "نکته 2"],
      "sample_answer": "یک نمونه پاسخ"
    }
  ]
}`;

    console.log('Calling Lovable AI Gateway for exam generation...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      
      if (response.status === 429) {
        throw new Error('تعداد درخواست‌ها زیاد است. لطفا کمی صبر کنید');
      } else if (response.status === 402) {
        throw new Error('اعتبار API تمام شده است');
      }
      
      throw new Error(`خطا در تولید آزمون: ${response.status}`);
    }

    const data = await response.json();
    let content_text = data.choices[0].message.content;
    
    // Remove markdown code fences if present
    content_text = content_text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const examData = JSON.parse(content_text);

    console.log('Exam generated successfully');
    
    return new Response(
      JSON.stringify(examData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in exam generator:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطای داخلی سرور';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
