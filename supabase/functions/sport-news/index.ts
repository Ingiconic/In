import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// RSS/Atom feed sources for football news
const NEWS_SOURCES = [
  { url: "https://www.goal.com/feeds/en/news", name: "Goal.com", lang: "en" },
  { url: "https://www.skysports.com/rss/12040", name: "Sky Sports", lang: "en" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // First check cache
    const { data: cached } = await supabase
      .from("sport_cache")
      .select("*")
      .eq("id", "news_feed")
      .single();

    // If cache is fresh (less than 2 minutes old), return it
    if (cached && cached.updated_at) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 120000) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch news from multiple sources
    const allNews: any[] = [];

    for (const source of NEWS_SOURCES) {
      try {
        const resp = await fetch(source.url, {
          headers: { "User-Agent": "EasyDars-Sport/1.0" },
        });
        if (!resp.ok) continue;
        const text = await resp.text();
        
        // Parse RSS/XML
        const items = parseRSS(text, source.name, source.lang);
        allNews.push(...items);
      } catch (e) {
        console.error(`Error fetching ${source.name}:`, e);
      }
    }

    // Sort by date, take latest 30
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const latestNews = allNews.slice(0, 30);

    // Translate foreign news to Persian using AI if available
    if (LOVABLE_API_KEY && latestNews.length > 0) {
      const foreignNews = latestNews.filter(n => n.lang !== "fa").slice(0, 10);
      if (foreignNews.length > 0) {
        try {
          const titles = foreignNews.map(n => n.title).join("\n---\n");
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "Translate the following football news headlines to Persian (Farsi). Return ONLY the translated titles separated by ---. Keep it concise and natural." },
                { role: "user", content: titles },
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const translated = data.choices?.[0]?.message?.content?.split("---").map((t: string) => t.trim()) || [];
            foreignNews.forEach((n, i) => {
              if (translated[i]) {
                n.titleFa = translated[i];
              }
            });
          }
        } catch (e) {
          console.error("Translation error:", e);
        }
      }
    }

    const result = { news: latestNews, fetchedAt: new Date().toISOString() };

    // Cache
    await supabase.from("sport_cache").upsert({
      id: "news_feed",
      cache_type: "news",
      data: result,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sport-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseRSS(xml: string, sourceName: string, lang: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");
    const imageMatch = itemXml.match(/<media:content[^>]*url="([^"]*)"/) ||
                       itemXml.match(/<enclosure[^>]*url="([^"]*)"/) ||
                       itemXml.match(/<image>[^<]*<url>([^<]*)<\/url>/);
    const image = imageMatch ? imageMatch[1] : null;

    if (title) {
      items.push({
        title: cleanHtml(title),
        titleFa: null,
        link,
        description: cleanHtml(description || "").substring(0, 200),
        pubDate: pubDate || new Date().toISOString(),
        image,
        source: sourceName,
        lang,
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`) ) ||
                xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : "";
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
