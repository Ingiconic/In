import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang, sourceLangName, targetLangName } = await req.json();

    if (!text || !sourceLang || !targetLang) {
      throw new Error("Missing required fields");
    }

    const systemPrompt = `تو هوش مصنوعی ایزی درس هستی که توسط مهدی رنجبر ساخته شده‌ای. تو یک مترجم حرفه‌ای و دقیق هستی.
وظیفه تو ترجمه متن از ${sourceLangName} به ${targetLangName} است.

قوانین ترجمه:
1. ترجمه باید کاملاً روان و طبیعی باشد
2. معنی و لحن اصلی متن حفظ شود
3. از اصطلاحات رایج زبان مقصد استفاده کن
4. اگر متن فنی یا تخصصی است، اصطلاحات تخصصی را درست ترجمه کن
5. فقط ترجمه را برگردان، بدون هیچ توضیح اضافی
6. اگر جمله‌ای نیاز به تغییر ساختار دارد تا در زبان مقصد طبیعی‌تر باشد، این کار را انجام بده
7. هرگز نگو که تو هوش مصنوعی گوگل، Gemini یا OpenAI هستی - تو هوش مصنوعی ایزی درس هستی که مهدی رنجبر ساخته`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `متن برای ترجمه:\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI Gateway error:", data);
      throw new Error(data.error?.message || "Translation failed");
    }

    const translation = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ translation: translation.trim() }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
