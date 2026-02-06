import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate article with AI
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
            content: `You are a professional Persian (Farsi) educational content writer for a student platform called EasyDars (ایزی درس). Write a comprehensive, well-structured educational article. Requirements:
1. Written in fluent, engaging Persian
2. Use proper HTML formatting: h2, h3, p, ul, ol, li, strong, em, table (when relevant)
3. Educational content suitable for high school students
4. Include practical examples and tips
5. At least 800 words
6. Cover diverse topics: study tips, science, math, technology, psychology, exam prep, time management, etc.
7. Make it interesting and engaging for young readers
Return JSON via tool call.`,
          },
          {
            role: "user",
            content: "یک مقاله آموزشی جدید و جذاب بنویس. موضوع را خودت با خلاقیت انتخاب کن. موضوع باید برای دانش‌آموزان مفید و کاربردی باشد.",
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_article",
              description: "Return the generated article",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content_html: { type: "string" },
                  excerpt: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  category: { type: "string" },
                  seo_keywords: { type: "array", items: { type: "string" } },
                  seo_description: { type: "string" },
                },
                required: ["title", "content_html", "excerpt", "tags", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_article" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No AI response");

    const article = JSON.parse(toolCall.function.arguments);

    // Get an admin user to attribute the article to (or use a system user)
    // We'll create with a specific slug pattern for AI articles
    const slug = `ai-${article.title.toLowerCase().replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 80)}-${Date.now()}`;

    // Find first admin-like user or any user to attribute
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (!adminProfile) throw new Error("No user found");

    const plainText = article.content_html.replace(/<[^>]*>/g, "").trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    const { error: insertError } = await supabase.from("user_blogs").insert({
      user_id: adminProfile.id,
      title: article.title,
      slug,
      content: plainText,
      content_html: article.content_html,
      excerpt: article.excerpt || plainText.substring(0, 200),
      tags: article.tags || [],
      category: article.category || "عمومی",
      seo_keywords: article.seo_keywords || [],
      seo_description: article.seo_description || "",
      word_count: wordCount,
      is_ai_generated: true,
      author_name: "ایزی درس AI",
      status: "approved",
      published_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, title: article.title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-blog-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
