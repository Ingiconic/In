import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExamRequest {
  content: string;
  questionCount: number;
  difficulty: string;
  questionTypes?: {
    multipleChoice?: number;
    fillBlank?: number;
    essay?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, questionCount, difficulty, questionTypes }: ExamRequest = await req.json();

    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'محتوا نباید خالی باشد' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    
    const response = await fetch('https://api.lovable.app/v1/chat/completions', {
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
    const content_text = data.choices[0].message.content;
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
