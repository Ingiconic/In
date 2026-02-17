import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const maxAge = type === "matches" ? 300000 : 1800000; // 5min matches, 30min standings

    // Check cache first
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
      prompt = `Today is ${today}. You are a sports data API. Return REAL football match results and schedules from yesterday, today, and tomorrow.

Include matches from: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Iran Pro League (Persian Gulf Pro League), Saudi Pro League.

Return ONLY a valid JSON object (no markdown, no code fences). The format MUST be exactly:
{"matches":[{"id":1,"competition":{"name":"Premier League","code":"PL","emblem":""},"utcDate":"${today}T15:00:00Z","status":"FINISHED","homeTeam":{"name":"Arsenal","shortName":"Arsenal","tla":"ARS","crest":""},"awayTeam":{"name":"Chelsea","shortName":"Chelsea","tla":"CHE","crest":""},"score":{"fullTime":{"home":2,"away":1},"halfTime":{"home":1,"away":0}}}]}

Status values: SCHEDULED, FINISHED, IN_PLAY, PAUSED.
For FINISHED matches include real scores.
For SCHEDULED matches set score to null.
Include 15-30 REAL matches. Do NOT invent fake matches.`;
    } else {
      const names: Record<string, string> = {
        PL: "English Premier League 2024-2025",
        PD: "Spanish La Liga 2024-2025",
        SA: "Italian Serie A 2024-2025",
        BL1: "German Bundesliga 2024-2025",
        FL1: "French Ligue 1 2024-2025",
        CL: "UEFA Champions League 2024-2025",
        IR: "Iran Persian Gulf Pro League 2024-2025",
        BR: "Brazilian Serie A 2024",
        SAU: "Saudi Pro League 2024-2025",
        WC: "FIFA World Cup 2026 Qualifiers",
        AC: "AFC Asian Cup",
      };
      const leagueName = names[league] || "English Premier League 2024-2025";
      prompt = `Return the CURRENT ${leagueName} standings with ALL teams. Use REAL data.

Return ONLY a valid JSON object (no markdown, no code fences). Format:
{"standings":[{"type":"TOTAL","table":[{"position":1,"team":{"name":"Team Name","shortName":"Team","tla":"TEA","crest":""},"playedGames":25,"won":18,"draw":4,"lost":3,"points":58,"goalsFor":52,"goalsAgainst":20,"goalDifference":32}]}]}

Include ALL teams in the league sorted by position. Use real current data.`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a sports data API. Return ONLY valid JSON. No markdown. No code fences. No extra text. No explanations." },
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
    
    // Clean up AI response
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    // Remove any leading/trailing non-JSON characters
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    let parsed: any;
    try { 
      parsed = JSON.parse(content); 
    } catch (e) {
      console.error("Parse fail, trying to fix JSON...");
      // Try to fix common JSON issues
      try {
        // Sometimes AI cuts off, try to close arrays/objects
        let fixed = content;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        
        // Close unclosed arrays and objects
        for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
        
        parsed = JSON.parse(fixed);
      } catch {
        console.error("Could not fix JSON");
        if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        parsed = type === "matches" ? { matches: [] } : { standings: [] };
      }
    }

    // Normalize response - ensure arrays
    let result: any;
    if (type === "matches") {
      let matchesArr = parsed.matches;
      if (!Array.isArray(matchesArr)) {
        if (matchesArr && typeof matchesArr === "object") {
          matchesArr = Object.values(matchesArr);
        } else {
          matchesArr = [];
        }
      }
      result = { matches: matchesArr, fetchedAt: new Date().toISOString() };
    } else {
      let standingsArr = parsed.standings;
      if (!Array.isArray(standingsArr)) {
        if (standingsArr && typeof standingsArr === "object") {
          standingsArr = Object.values(standingsArr);
        } else {
          standingsArr = [];
        }
      }
      // Normalize table arrays inside standings
      standingsArr = standingsArr.map((s: any) => {
        if (s && s.table && !Array.isArray(s.table)) {
          s.table = Object.values(s.table);
        }
        return s;
      });
      result = { standings: standingsArr, fetchedAt: new Date().toISOString() };
    }

    // Cache result
    await supabase.from("sport_cache").upsert({
      id: cacheId, cache_type: type, league_code: type === "standings" ? league : null,
      data: result, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

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
