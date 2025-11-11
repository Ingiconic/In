import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, userAnswers } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `شما یک معلم دقیق و حمایتگر هستید که آزمون‌ها را ارزیابی و تحلیل می‌کنید.

وظایف شما:
1. پاسخ‌های تشریحی را ارزیابی کنید (0-100 نمره)
2. پاسخ‌های جای خالی را بررسی کنید (با تساهل در املا)
3. تحلیل کامل عملکرد دانش‌آموز
4. نقاط قوت و ضعف
5. پیشنهادات برای بهبود
6. موضوعاتی که نیاز به تقویت دارد

برای هر سوال تشریحی:
- نمره از 100
- بازخورد مفصل
- نکات بهبود

در پایان یک کارنامه جامع با:
- نمره کل
- درصد
- تحلیل موضوعی
- پیشنهادات مطالعاتی`;

    let questionsText = "";
    questions.forEach((q: any, i: number) => {
      questionsText += `\nسوال ${i + 1} (${q.type}):\n${q.question}\n`;
      if (q.type === "multiple_choice") {
        questionsText += `جواب صحیح: ${q.correct_answer}\nپاسخ دانش‌آموز: ${userAnswers[i] || 'پاسخ داده نشده'}\n`;
      } else if (q.type === "fill_blank") {
        questionsText += `جواب صحیح: ${q.correct_answer}\nپاسخ دانش‌آموز: ${userAnswers[i] || 'پاسخ داده نشده'}\n`;
      } else if (q.type === "essay") {
        questionsText += `معیارهای ارزیابی: ${q.evaluation_criteria?.join(', ')}\n`;
        questionsText += `پاسخ دانش‌آموز: ${userAnswers[i] || 'پاسخ داده نشده'}\n`;
      }
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `این سوالات و پاسخ‌ها را ارزیابی کن:\n${questionsText}\n\nپاسخ را به فرمت JSON با این ساختار برگردان:\n{
  "scores": [{"question": 1, "score": 100, "feedback": "..."}],
  "totalScore": 85,
  "percentage": 85,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "topicsToReview": ["..."]
}` }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI evaluation failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const evaluation = JSON.parse(content);

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
