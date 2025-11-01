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
    const { subjects, startDate, endDate, grade, studentName } = await req.json();
    
    if (!subjects || !startDate || !endDate) {
      throw new Error('اطلاعات کامل نیست');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('کلید API پیکربندی نشده است');
    }

    const systemPrompt = `تو یک مشاور تحصیلی هوشمند و حرفه‌ای هستی که برنامه‌های مطالعاتی شخصی‌سازی شده می‌سازی.
برنامه‌ای دقیق و عملی بساز که شامل:
- تقسیم زمان روزانه برای هر درس
- اولویت‌بندی مباحث
- زمان استراحت و تفریح
- نکات مطالعه موثر
- هدف‌گذاری هفتگی

برنامه را به صورت ساختار یافته و مرحله به مرحله بنویس.`;

    const userName = studentName || 'دانش‌آموز';
    const userPrompt = `دانش‌آموز: ${userName}
پایه: ${grade || 'نامشخص'}
دروس: ${subjects.join('، ')}
تاریخ شروع: ${startDate}
تاریخ پایان: ${endDate}

یک برنامه مطالعاتی کامل و عملی برای این دوره زمانی بساز.`;

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
      console.error('AI gateway error:', response.status);
      
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
      
      throw new Error('خطا در ارتباط با سرویس هوش مصنوعی');
    }

    const data = await response.json();
    const studyPlan = data.choices?.[0]?.message?.content;

    console.log('Study plan generated successfully');

    return new Response(JSON.stringify({ studyPlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-study-planner:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای ناشناخته' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});