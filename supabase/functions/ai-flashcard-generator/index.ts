import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'احراز هویت مورد نیاز است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create Supabase client for auth verification
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify the JWT and get user - pass the token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'احراز هویت نامعتبر' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Check and deduct coins atomically (5 coins for flashcard generation)
    const { data: success, error: coinError } = await supabaseAdmin.rpc('deduct_user_coins', {
      _amount: 5,
      _reason: 'ai_flashcard_generator'
    });

    if (coinError || !success) {
      return new Response(JSON.stringify({ error: 'سکه کافی نیست. برای ساخت فلش‌کارت به ۵ سکه نیاز دارید' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, count = 10, resourceId } = await req.json();

    if (!topic || topic.length < 3) {
      return new Response(
        JSON.stringify({ error: 'موضوع باید حداقل ۳ کاراکتر باشد' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let resourceContent = "";
    if (resourceId) {
      const { data: resource } = await supabase
        .from('resources')
        .select('content, title, description')
        .eq('id', resourceId)
        .eq('user_id', user.id)
        .single();
      
      if (resource) {
        resourceContent = `\n\nمنبع: ${resource.title}\n${resource.description || ''}\n${resource.content || ''}`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `شما یک دستیار هوشمند فارسی‌زبان هستید که فلش کارت می‌سازید. فلش کارت‌ها را به صورت JSON با فرمت زیر برگردانید:
{
  "flashcards": [
    {"question": "سوال یا مفهوم", "answer": "پاسخ یا توضیح"},
    {"question": "سوال بعدی", "answer": "پاسخ بعدی"}
  ]
}
${count} فلش کارت با کیفیت بالا بساز. فقط JSON برگردان، بدون توضیحات اضافی.`
          },
          {
            role: "user",
            content: `${count} فلش کارت برای موضوع "${topic}" بساز.${resourceContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت درخواست. لطفاً بعداً امتحان کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار کافی نیست. لطفاً اعتبار اضافه کنید." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`خطا در ارتباط با هوش مصنوعی: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid AI response structure:', JSON.stringify(data));
      throw new Error("ساختار پاسخ هوش مصنوعی نامعتبر است");
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response content length:', aiResponse?.length);
    
    if (!aiResponse) {
      throw new Error("هوش مصنوعی پاسخی ارسال نکرد");
    }
    
    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response. Content:', aiResponse.substring(0, 500));
      throw new Error("پاسخ هوش مصنوعی قابل تبدیل به فلش کارت نبود. لطفاً دوباره تلاش کنید.");
    }
    
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('JSON string:', jsonMatch[0].substring(0, 500));
      throw new Error("خطا در تجزیه پاسخ هوش مصنوعی");
    }
    
    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      console.error('Invalid flashcards structure:', JSON.stringify(flashcardsData));
      throw new Error("ساختار فلش کارت‌ها نامعتبر است");
    }
    
    if (flashcardsData.flashcards.length === 0) {
      throw new Error("هوش مصنوعی فلش کارتی تولید نکرد");
    }
    
    console.log(`Successfully generated ${flashcardsData.flashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ flashcards: flashcardsData.flashcards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطای ناشناخته" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
