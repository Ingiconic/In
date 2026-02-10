import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return Object.values(val);
  return [];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "no key", matches: [], standings: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both GET query params and POST body
    let type = "matches";
    let league = "PL";
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      type = url.searchParams.get("type") || "matches";
      league = url.searchParams.get("league") || "PL";
    } else {
      try {
        const body = await req.json();
        type = body.type || "matches";
        league = body.league || "PL";
      } catch { /* defaults */ }
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cacheId = type === "matches" ? "matches_global" : `standings_${league}`;
    const maxAge = type === "matches" ? 300000 : 1800000;

    // Check cache
    const { data: cached } = await supabase
      .from("sport_cache").select("data, updated_at").eq("id", cacheId).single();

    if (cached?.updated_at && cached?.data) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < maxAge) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    let prompt: string;

    if (type === "matches") {
      prompt = `Today is ${today}. Provide real football matches from yesterday, today and tomorrow from these leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Iran Pro League, Saudi Pro League. Return ONLY valid JSON array format: {"matches":[{"id":1,"competition":{"name":"Premier League","code":"PL","emblem":""},"utcDate":"${today}T15:00:00Z","status":"FINISHED","homeTeam":{"name":"Arsenal","shortName":"Arsenal","tla":"ARS","crest":""},"awayTeam":{"name":"Chelsea","shortName":"Chelsea","tla":"CHE","crest":""},"score":{"fullTime":{"home":2,"away":1},"halfTime":{"home":1,"away":0}}}]}. IMPORTANT: "matches" MUST be a JSON array [...], not an object. Status values: SCHEDULED, FINISHED, IN_PLAY, PAUSED. For FINISHED include real scores. Include 15-30 real matches.`;
    } else {
      const names: Record<string, string> = {
        PL: "Premier League", PD: "La Liga", SA: "Serie A", BL1: "Bundesliga",
        FL1: "Ligue 1", CL: "Champions League", IR: "Iran Pro League (Persian Gulf Pro League)",
        BR: "Brasileirao Serie A", SAU: "Saudi Pro League", WC: "FIFA World Cup", AC: "AFC Asian Cup",
      };
      prompt = `Provide current 2024-2025 ${names[league] || "Premier League"} standings with ALL teams. Return ONLY valid JSON: {"standings":[{"type":"TOTAL","table":[{"position":1,"team":{"name":"Team","shortName":"Team","tla":"TEA","crest":""},"playedGames":20,"won":15,"draw":3,"lost":2,"points":48,"goalsFor":45,"goalsAgainst":15,"goalDifference":30}]}]}. IMPORTANT: "table" MUST be a JSON array.`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown. No code fences. No extra text. Arrays must use [] syntax." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      console.error("AI error:", aiResp.status);
      if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ matches: [], standings: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      console.error("Parse fail:", content.substring(0, 200));
      if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      parsed = {};
    }

    // Normalize: ensure arrays
    if (type === "matches") {
      parsed.matches = toArray(parsed.matches);
    } else {
      if (parsed.standings) {
        parsed.standings = toArray(parsed.standings);
        parsed.standings.forEach((s: any) => { if (s.table) s.table = toArray(s.table); });
      } else {
        parsed.standings = [];
      }
    }

    const result = { ...parsed, fetchedAt: new Date().toISOString() };

    // Cache
    await supabase.from("sport_cache").upsert({
      id: cacheId, cache_type: type, league_code: type === "standings" ? league : null,
      data: result, updated_at: new Date().toISOString(),
    }, { onConflict: "id" }).then(() => {});

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e), matches: [], standings: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
