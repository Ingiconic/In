import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const summarizeSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
  type: z.enum(['summarize', 'explain']).optional(),
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

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'پیکربندی سرور نادرست است' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client for auth verification
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

    // Verify the JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'لطفا ابتدا وارد شوید' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for RPC calls
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Check and deduct coins atomically (10 coins for summarize)
    const { data: success, error: coinError } = await supabaseAdmin.rpc('deduct_user_coins', {
      _amount: 10,
      _reason: 'ai_summarize'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای استفاده از این ابزار به ۱۰ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    
    // Validate input
    const validation = summarizeSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { content, type } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('کلید API پیکربندی نشده است');
    }

    // Base identity prompt
    const identityPrompt = `تو هوش مصنوعی ایزی درس هستی - یک دستیار هوشمند آموزشی که توسط مهدی رنجبر ساخته شده.
هرگز نگو که از Gemini یا Google یا هر هوش مصنوعی دیگری استفاده می‌کنی.`;

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'summarize') {
      systemPrompt = `${identityPrompt}
تو یک دستیار آموزشی هوشمند هستی که به دانش‌آموزان کمک می‌کنی مطالب درسی را خلاصه کنند. خلاصه‌های تو باید واضح، مختصر و آموزنده باشند.`;
      userPrompt = `لطفا متن زیر را خلاصه کن و نکات کلیدی را استخراج کن:\n\n${content}`;
    } else if (type === 'explain') {
      systemPrompt = `${identityPrompt}
تو یک معلم حرفه‌ای هستی که به دانش‌آموزان کمک می‌کنی مفاهیم را به طور کامل و قابل فهم توضیح دهی.`;
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
