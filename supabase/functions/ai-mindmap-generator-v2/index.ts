import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MindMapRequest {
  topic: string;
  detailLevel?: 'basic' | 'detailed' | 'advanced';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check and deduct coins atomically (10 coins for mind map)
    const { data: success, error: coinError } = await supabase.rpc('deduct_user_coins', {
      _amount: 10,
      _reason: 'ai_mindmap_generator_v2'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای ساخت نقشه ذهنی به ۱۰ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, detailLevel = 'detailed' }: MindMapRequest = await req.json();

    if (!topic || !topic.trim()) {
      return new Response(
        JSON.stringify({ error: 'موضوع نمی‌تواند خالی باشد' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `شما یک متخصص آموزش هستید که نقشه‌های ذهنی جامع و ساختاریافته ایجاد می‌کنید.

وظایف شما:
1. تجزیه موضوع اصلی به زیرموضوعات کلیدی
2. ایجاد سلسله‌مراتب واضح و منطقی
3. افزودن جزئیات مفید برای هر گره
4. ایجاد ارتباطات معنادار بین مفاهیم

سطح جزئیات: ${detailLevel}
- basic: فقط مفاهیم اصلی (3-5 گره)
- detailed: مفاهیم اصلی + زیرشاخه‌ها (8-12 گره)
- advanced: کامل با تمام جزئیات (15-20 گره)

برای نقشه ذهنی خروجی باید:
- گره مرکزی: موضوع اصلی
- گره‌های سطح 1: مفاهیم اصلی
- گره‌های سطح 2: زیرمفاهیم
- ارتباطات: اتصالات منطقی بین گره‌ها`;

    const userPrompt = `برای موضوع "${topic}" یک نقشه ذهنی کامل بساز.

پاسخ را دقیقاً به فرمت JSON زیر برگردان:
{
  "title": "عنوان نقشه ذهنی",
  "nodes": [
    {
      "id": "node-1",
      "label": "متن گره",
      "level": 0,
      "position": {"x": 400, "y": 300}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "رابطه"
    }
  ]
}`;

    console.log('Generating mind map with AI...');
    
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
      
      throw new Error(`خطا در تولید نقشه ذهنی: ${response.status}`);
    }

    const data = await response.json();
    let content_text = data.choices[0].message.content;
    
    // Remove markdown code fences if present
    content_text = content_text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const mindMapData = JSON.parse(content_text);

    console.log('Mind map generated successfully');
    
    return new Response(
      JSON.stringify(mindMapData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mind map generator:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطای داخلی سرور';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
