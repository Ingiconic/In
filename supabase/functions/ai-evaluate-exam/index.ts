import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const evaluateSchema = z.object({
  questions: z.array(z.object({
    question: z.string().max(1000),
    type: z.string(),
    correct_answer: z.any(),
    options: z.array(z.string()).optional(),
    evaluation_criteria: z.array(z.string()).optional(),
  })).min(1).max(100),
  userAnswers: z.array(z.any()).min(1).max(100),
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

    const body = await req.json();
    
    // Validate input
    const validation = evaluateSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { questions, userAnswers } = validation.data;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Evaluating exam with ${questions.length} questions for user ${user.id}`);

    const systemPrompt = `شما یک معلم دقیق هستید. پاسخ‌ها را سریع و دقیق ارزیابی کنید.

برای هر سوال:
- چند گزینه‌ای: اگر درست است 100، غلط 0
- جای خالی: مقایسه با جواب صحیح (تساهل در املا)
- تشریحی: نمره 0-100 بر اساس کیفیت

پاسخ JSON:
{
  "scores": [{"question": 1, "score": 100, "feedback": "توضیح کوتاه"}],
  "totalScore": 85,
  "percentage": 85,
  "strengths": ["نقطه قوت"],
  "weaknesses": ["نقطه ضعف"],
  "recommendations": ["پیشنهاد"],
  "topicsToReview": ["موضوع"]
}`;

    let questionsText = "";
    questions.forEach((q: any, i: number) => {
      questionsText += `\nس${i + 1}(${q.type}): ${q.question}\n`;
      if (q.type === "multiple_choice") {
        questionsText += `صحیح: ${q.correct_answer} | پاسخ: ${userAnswers[i] || '-'}\n`;
      } else if (q.type === "fill_blank") {
        questionsText += `صحیح: ${q.correct_answer} | پاسخ: ${userAnswers[i] || '-'}\n`;
      } else if (q.type === "essay") {
        questionsText += `معیار: ${q.evaluation_criteria?.join(', ')}\nپاسخ: ${userAnswers[i] || '-'}\n`;
      }
    });

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
          { role: 'user', content: questionsText }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'سرور شلوغ است. لطفا چند ثانیه صبر کنید.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI evaluation failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const evaluation = JSON.parse(content);
    
    console.log(`Exam evaluated successfully. Score: ${evaluation.totalScore}`);

    return new Response(
      JSON.stringify(evaluation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in exam evaluation:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
