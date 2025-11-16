import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { resourceId } = await req.json();

    if (!resourceId) {
      return new Response(JSON.stringify({ error: 'Resource ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get resource
    const { data: resource, error: resourceError } = await supabaseClient
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .eq('user_id', user.id)
      .single();

    if (resourceError || !resource) {
      return new Response(JSON.stringify({ error: 'منبع یافت نشد' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate content size to prevent memory exhaustion
    if (resource.content && resource.content.length > MAX_CONTENT_SIZE) {
      return new Response(
        JSON.stringify({ error: 'فایل بیش از حد بزرگ است. حداکثر اندازه مجاز ۱۰ مگابایت است.' }),
        { 
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Analyze with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `شما یک معلم حرفه‌ای هستید که منابع درسی را تحلیل می‌کنید. 
وظیفه شما:
1. خلاصه‌ای جامع از منبع ارائه دهید
2. مفاهیم کلیدی را استخراج کنید
3. نکات مهم را برجسته کنید
4. سوالات احتمالی از این منبع را پیشنهاد دهید
5. روش مطالعه بهینه این منبع را توصیه کنید

پاسخ خود را به فارسی و با فرمت ساختاریافته ارائه دهید.`;

    const userPrompt = `لطفاً این منبع را تحلیل کنید:

عنوان: ${resource.title}
${resource.description ? `توضیحات: ${resource.description}` : ''}
${resource.content ? `محتوا:\n${resource.content.substring(0, 4000)}` : ''}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      return new Response(JSON.stringify({ error: 'خطا در تحلیل منبع' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Update resource with analysis
    const { error: updateError } = await supabaseClient
      .from('resources')
      .update({ 
        content: resource.content || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId);

    if (updateError) {
      console.error('Error updating resource:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        resource: {
          title: resource.title,
          description: resource.description
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-analyze-resource:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطای سرور';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
