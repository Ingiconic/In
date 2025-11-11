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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'احراز هویت نامعتبر' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, resourceId } = await req.json();

    if (!topic || topic.length < 3) {
      return new Response(
        JSON.stringify({ error: 'موضوع باید حداقل ۳ کاراکتر باشد' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check coins
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single();

    if (!profile || profile.coins < 10) {
      return new Response(
        JSON.stringify({ error: 'سکه کافی ندارید. برای این عملیات ۱۰ سکه نیاز است.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
            content: `شما یک دستیار هوشمند فارسی‌زبان هستید که نقشه ذهنی می‌سازید. نقشه ذهنی را به صورت JSON با فرمت زیر برگردانید:
{
  "nodes": [
    {"id": "1", "data": {"label": "موضوع اصلی"}, "position": {"x": 0, "y": 0}, "type": "default"},
    {"id": "2", "data": {"label": "زیرموضوع ۱"}, "position": {"x": -200, "y": 100}, "type": "default"}
  ],
  "edges": [
    {"id": "e1-2", "source": "1", "target": "2", "type": "smoothstep"}
  ]
}
حداقل ۵ نود و روابط منطقی بین آن‌ها ایجاد کنید.`
          },
          {
            role: "user",
            content: `یک نقشه ذهنی برای موضوع "${topic}" بساز.${resourceContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت درخواست. لطفاً بعداً امتحان کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("خطا در ارتباط با هوش مصنوعی");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("خطا در تولید نقشه ذهنی");
    }
    
    const mindMapData = JSON.parse(jsonMatch[0]);

    // Deduct coins
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabaseService
      .from('profiles')
      .update({ coins: profile.coins - 10 })
      .eq('id', user.id);

    await supabaseService
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -10,
        reason: 'تولید نقشه ذهنی',
        resource_id: resourceId || null
      });

    return new Response(
      JSON.stringify({ mindMap: mindMapData }),
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
