import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const { title, content, action } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "enhance") {
      systemPrompt = `You are a professional Persian (Farsi) content editor and SEO expert. Your job is to enhance blog articles written by students. You must:
1. Fix all spelling and grammar mistakes in Persian
2. Improve sentence structure and readability
3. Add proper HTML formatting (headings, lists, tables where appropriate)
4. Keep the original meaning and tone
5. Add tables if data can be better presented that way
6. Return the enhanced content as clean HTML
7. Also suggest 3-5 relevant tags in Persian
8. Also suggest a short excerpt (max 200 chars) in Persian
9. Return JSON with: enhanced_content (HTML string), suggested_tags (array), suggested_excerpt (string)`;
      userPrompt = `Title: ${title}\n\nContent to enhance:\n${content}`;
    } else if (action === "extract_keywords") {
      systemPrompt = `You are an SEO expert. Extract the most important SEO keywords from this Persian blog article. Return JSON with: seo_keywords (array of 5-10 keywords in Persian), seo_description (meta description in Persian, max 160 chars)`;
      userPrompt = `Title: ${title}\n\nContent:\n${content}`;
    } else if (action === "generate_article") {
      systemPrompt = `You are a professional Persian (Farsi) educational content writer. Write a comprehensive, well-structured educational article. The article must:
1. Be written in fluent Persian
2. Use proper HTML formatting with headings (h2, h3), paragraphs, lists, and tables
3. Be educational and suitable for high school students
4. Include practical examples
5. Be at least 800 words
6. Return JSON with: title (string), content_html (HTML string), excerpt (string max 200 chars), tags (array of tags), category (string)`;
      userPrompt = content || "یک مقاله آموزشی جذاب در مورد یک موضوع مفید برای دانش‌آموزان بنویس. موضوع را خودت انتخاب کن.";
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: action === "enhance" ? "return_enhanced" : action === "extract_keywords" ? "return_keywords" : "return_article",
              description: action === "enhance" 
                ? "Return the enhanced blog content" 
                : action === "extract_keywords"
                ? "Return extracted SEO keywords"
                : "Return the generated article",
              parameters: action === "enhance" ? {
                type: "object",
                properties: {
                  enhanced_content: { type: "string", description: "Enhanced HTML content" },
                  suggested_tags: { type: "array", items: { type: "string" }, description: "Suggested tags" },
                  suggested_excerpt: { type: "string", description: "Short excerpt" },
                },
                required: ["enhanced_content", "suggested_tags", "suggested_excerpt"],
                additionalProperties: false,
              } : action === "extract_keywords" ? {
                type: "object",
                properties: {
                  seo_keywords: { type: "array", items: { type: "string" } },
                  seo_description: { type: "string" },
                },
                required: ["seo_keywords", "seo_description"],
                additionalProperties: false,
              } : {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content_html: { type: "string" },
                  excerpt: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  category: { type: "string" },
                },
                required: ["title", "content_html", "excerpt", "tags", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: action === "enhance" ? "return_enhanced" : action === "extract_keywords" ? "return_keywords" : "return_article" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No valid response from AI");
  } catch (e) {
    console.error("ai-blog-enhance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
