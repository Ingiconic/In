import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('Supabase URL present:', !!supabaseUrl);
    console.log('Supabase Anon Key present:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'پیکربندی سرور نادرست است' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { 
        global: { 
          headers: { 
            Authorization: authHeader 
          } 
        }
      }
    );

    console.log('Calling getUser with token');
    // Verify the JWT and get user - pass the token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log('getUser result - user:', !!user, 'error:', userError?.message);
    
    if (userError || !user) {
      console.error('Auth error details:', JSON.stringify(userError));
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Check and deduct coins atomically (10 coins for summarize)
    const { data: success, error: coinError } = await supabase.rpc('deduct_user_coins', {
      _amount: 10,
      _reason: 'ai_summarize'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای استفاده از این ابزار به ۱۰ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content, type } = await req.json();
    
    if (!content) {
      throw new Error('محتوا الزامی است');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('کلید API پیکربندی نشده است');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'summarize') {
      systemPrompt = 'شما یک دستیار آموزشی هوشمند هستید که به دانش‌آموزان کمک می‌کنید مطالب درسی را خلاصه کنند. خلاصه‌های شما باید واضح، مختصر و آموزنده باشند.';
      userPrompt = `لطفا متن زیر را خلاصه کن و نکات کلیدی را استخراج کن:\n\n${content}`;
    } else if (type === 'explain') {
      systemPrompt = 'شما یک معلم حرفه‌ای هستید که به دانش‌آموزان کمک می‌کنید مفاهیم را به طور کامل و قابل فهم توضیح دهید.';
      userPrompt = `لطفا این مفهوم را به طور کامل و با مثال توضیح بده:\n\n${content}`;
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
    const result = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-summarize:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای ناشناخته' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});