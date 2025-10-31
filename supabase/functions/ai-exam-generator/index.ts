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
    const { content, questionCount, difficulty } = await req.json();
    
    if (!content) {
      throw new Error('محتوا الزامی است');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('کلید API پیکربندی نشده است');
    }

    const systemPrompt = `شما یک معلم حرفه‌ای هستید که سوالات امتحانی طراحی می‌کنید. 
سوالات باید متناسب با سطح ${difficulty || 'متوسط'} باشد.
سوالات را در قالب JSON با فرمت زیر برگردانید:
{
  "questions": [
    {
      "question": "متن سوال",
      "type": "multiple_choice",
      "options": ["گزینه 1", "گزینه 2", "گزینه 3", "گزینه 4"],
      "correct_answer": "گزینه صحیح",
      "explanation": "توضیح پاسخ"
    }
  ]
}`;

    const userPrompt = `براساس محتوای زیر، ${questionCount || 10} سوال امتحانی طراحی کن:\n\n${content}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_exam",
              description: "Generate exam questions from content",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        type: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" }
                      },
                      required: ["question", "type", "correct_answer"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_exam" } }
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const questions = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify(questions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-exam-generator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای ناشناخته' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});