import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEWS_SOURCES = [
  { url: "https://www.skysports.com/rss/12040", name: "Sky Sports", lang: "en" },
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", name: "BBC Sport", lang: "en" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Check cache
    const { data: cached } = await supabase
      .from("sport_cache").select("data, updated_at").eq("id", "news_feed").single();

    if (cached?.updated_at && cached?.data) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < 180000) { // 3 min
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch RSS
    const allNews: any[] = [];
    for (const source of NEWS_SOURCES) {
      try {
        const resp = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; EasyDars/1.0)" } });
        if (!resp.ok) { console.log(`RSS ${source.name} status: ${resp.status}`); continue; }
        const text = await resp.text();
        console.log(`RSS ${source.name}: got ${text.length} chars`);
        const items = parseRSS(text, source.name, source.lang);
        allNews.push(...items);
      } catch (e) { console.error(`RSS error ${source.name}:`, e); }
    }

    // If RSS failed, use AI to generate news
    if (allNews.length === 0 && LOVABLE_API_KEY) {
      console.log("RSS empty, using AI for news...");
      try {
        const today = new Date().toISOString().split("T")[0];
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Return ONLY valid JSON. No markdown." },
              { role: "user", content: `Today is ${today}. Give me 10 real recent football news headlines translated to Persian. JSON format: {"news":[{"title":"عنوان فارسی","titleOriginal":"English title","description":"توضیح فارسی","source":"BBC Sport","pubDate":"${today}T12:00:00Z","image":null}]}` },
            ],
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          let content = aiData.choices?.[0]?.message?.content || "{}";
          content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
          const s = content.indexOf('{'), e2 = content.lastIndexOf('}');
          if (s !== -1 && e2 !== -1) content = content.substring(s, e2 + 1);
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.news)) {
              parsed.news.forEach((n: any) => {
                allNews.push({ title: n.titleOriginal || n.title, titleFa: n.title, description: n.description, descriptionFa: n.description, link: "", pubDate: n.pubDate || new Date().toISOString(), image: n.image, source: n.source || "AI News", lang: "fa" });
              });
            }
          } catch { console.error("AI news parse fail"); }
        }
      } catch (e2) { console.error("AI news error:", e2); }
    }

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const latestNews = allNews.slice(0, 20);

    // Translate titles to Persian (batch - fast)
    if (LOVABLE_API_KEY && latestNews.length > 0) {
      const foreignNews = latestNews.filter(n => n.lang !== "fa").slice(0, 15);
      if (foreignNews.length > 0) {
        try {
          const titles = foreignNews.map(n => `${n.title} ||| ${(n.description || '').substring(0, 100)}`).join("\n---\n");
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "Translate football news titles and descriptions to Persian. For each item separated by ---, return: translated_title ||| translated_description. Separate items with ---. Be concise and natural." },
                { role: "user", content: titles },
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const parts = (data.choices?.[0]?.message?.content || "").split("---").map((t: string) => t.trim());
            foreignNews.forEach((n, i) => {
              if (parts[i]) {
                const [title, desc] = parts[i].split("|||").map((s: string) => s.trim());
                n.titleFa = title || n.title;
                n.descriptionFa = desc || n.description;
              }
            });
          }
        } catch (e) { console.error("Translation error:", e); }
      }
    }

    // Save translated articles to DB
    for (const n of latestNews.slice(0, 10)) {
      try {
        // Check if already exists by title
        const { data: existing } = await supabase
          .from("sport_news_articles")
          .select("id")
          .eq("title_original", n.title)
          .limit(1);
        
        if (!existing || existing.length === 0) {
          await supabase.from("sport_news_articles").insert({
            title: n.titleFa || n.title,
            title_original: n.title,
            content: n.descriptionFa || n.description || n.titleFa || n.title,
            summary: n.descriptionFa || n.description,
            source_name: n.source,
            source_url: n.link,
            image_url: n.image,
            category: "football",
            published_at: n.pubDate ? new Date(n.pubDate).toISOString() : new Date().toISOString(),
            is_translated: !!n.titleFa,
            lang: "fa",
          });
        }
      } catch (e) { /* skip duplicate */ }
    }

    const result = { news: latestNews, fetchedAt: new Date().toISOString() };

    await supabase.from("sport_cache").upsert({
      id: "news_feed", cache_type: "news", data: result, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sport-news error:", e);
    return new Response(JSON.stringify({ news: [], error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseRSS(xml: string, sourceName: string, lang: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const x = match[1];
    const title = extractTag(x, "title");
    const link = extractTag(x, "link");
    const description = extractTag(x, "description");
    const pubDate = extractTag(x, "pubDate");
    const img = x.match(/<media:content[^>]*url="([^"]*)"/) || x.match(/<enclosure[^>]*url="([^"]*)"/) || x.match(/<image>[^<]*<url>([^<]*)<\/url>/);
    if (title) {
      items.push({
        title: clean(title), titleFa: null, descriptionFa: null,
        link, description: clean(description || "").substring(0, 200),
        pubDate: pubDate || new Date().toISOString(),
        image: img ? img[1] : null, source: sourceName, lang,
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)) ||
            xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : "";
}

function clean(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
