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

    const systemPrompt = `شما یک متخصص آموزش هستید که نقشه‌های ذهنی جامع، خلاقانه و زیبا ایجاد می‌کنید.

وظایف شما:
1. تجزیه موضوع اصلی به زیرموضوعات کلیدی
2. ایجاد سلسله‌مراتب واضح و منطقی با حداقل 3 سطح
3. افزودن جزئیات مفید و کاربردی برای هر گره
4. ایجاد ارتباطات معنادار بین مفاهیم
5. استفاده از رنگ‌های متنوع و شکل‌های مختلف برای هر سطح

سطح جزئیات: ${detailLevel}
- basic: مفاهیم اصلی (5-8 گره)
- detailed: مفاهیم اصلی + زیرشاخه‌ها (10-15 گره)
- advanced: کامل با تمام جزئیات (18-25 گره)

برای نقشه ذهنی خروجی:
- گره مرکزی (level: 0): موضوع اصلی - شکل دایره بزرگ
- گره‌های سطح 1 (level: 1): مفاهیم اصلی - شکل‌های مستطیل گرد
- گره‌های سطح 2 (level: 2): زیرمفاهیم - شکل‌های دایره کوچک
- گره‌های سطح 3 (level: 3): جزئیات - شکل‌های بیضی کوچک

برای هر گره حتماً level را مشخص کن (0, 1, 2, یا 3)`;

    const userPrompt = `برای موضوع "${topic}" یک نقشه ذهنی کامل، جذاب و کاربردی بساز.

پاسخ را دقیقاً به فرمت JSON زیر برگردان:
{
  "title": "عنوان نقشه ذهنی",
  "nodes": [
    {
      "id": "node-1",
      "label": "متن گره",
      "level": 0,
      "position": { "x": 400, "y": 300 }
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
}

الزامات:
1. حداقل 12 گره با محتوای مفید و کاربردی
2. گره مرکزی در مرکز (x: 400, y: 300)
3. گره‌های سطح 1 به صورت شعاعی دور مرکز (فاصله 250-300 پیکسل)
4. گره‌های سطح 2 و 3 به صورت منظم و زیبا
5. هر گره حتماً باید level داشته باشد (0 تا 3)
6. label ها باید کوتاه و مفید باشند (حداکثر 25 کاراکتر)

مهم: فقط JSON خالص برگردان، بدون توضیح اضافی.`;

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
