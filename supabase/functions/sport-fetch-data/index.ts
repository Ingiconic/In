import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEAGUES: Record<string, { name: string; nameFa: string }> = {
  PL: { name: "Premier League", nameFa: "پریمیر لیگ" },
  PD: { name: "La Liga", nameFa: "لالیگا" },
  SA: { name: "Serie A", nameFa: "سری آ" },
  BL1: { name: "Bundesliga", nameFa: "بوندسلیگا" },
  FL1: { name: "Ligue 1", nameFa: "لیگ فرانسه" },
  CL: { name: "Champions League", nameFa: "چمپیونز لیگ" },
  WC: { name: "World Cup", nameFa: "جام جهانی" },
  IR: { name: "Iran Pro League", nameFa: "لیگ برتر ایران" },
  BR: { name: "Brasileirão", nameFa: "لیگ برزیل" },
  SAU: { name: "Saudi Pro League", nameFa: "لیگ عربستان" },
  AC: { name: "AFC Asian Cup", nameFa: "جام ملت‌های آسیا" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "matches";
    const league = url.searchParams.get("league") || "PL";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (5 min for matches, 30 min for standings)
    const cacheId = type === "matches" ? "matches_global" : `standings_${league}`;
    const maxAge = type === "matches" ? 300000 : 1800000;

    const { data: cached } = await supabase
      .from("sport_cache")
      .select("data, updated_at")
      .eq("id", cacheId)
      .single();

    if (cached?.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < maxAge) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    if (type === "matches") {
      const prompt = `You are a football data API. Return ONLY valid JSON, no markdown.
Today is ${dateStr}. Provide real football matches from yesterday, today, tomorrow, and day after tomorrow.
Include matches from these competitions: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Iran Pro League, Saudi Pro League, Brasileirão.
Only include matches that are actually scheduled or were actually played. If you're not sure about a match, don't include it.

Return this exact JSON structure:
{
  "matches": [
    {
      "id": 1,
      "competition": {"name": "Premier League", "code": "PL", "emblem": ""},
      "utcDate": "2025-02-10T15:00:00Z",
      "status": "SCHEDULED",
      "homeTeam": {"name": "Arsenal", "shortName": "Arsenal", "tla": "ARS", "crest": ""},
      "awayTeam": {"name": "Chelsea", "shortName": "Chelsea", "tla": "CHE", "crest": ""},
      "score": {"fullTime": {"home": null, "away": null}, "halfTime": {"home": null, "away": null}}
    }
  ]
}

Status values: SCHEDULED, FINISHED, IN_PLAY, PAUSED, POSTPONED, CANCELLED.
For FINISHED matches, include actual scores. For others, scores should be null.
Include 15-30 real matches. Be accurate with team names and dates.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a football data provider. Return ONLY valid JSON. No markdown, no code blocks, no explanation." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error("AI error:", response.status);
        // Return cached data if available
        if (cached?.data) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI request failed");
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      
      // Clean markdown code blocks if present
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response:", content.substring(0, 500));
        if (cached?.data) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        parsed = { matches: [] };
      }

      const result = { matches: parsed.matches || [], fetchedAt: new Date().toISOString() };

      await supabase.from("sport_cache").upsert({
        id: "matches_global",
        cache_type: "matches",
        data: result,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "standings") {
      const leagueInfo = LEAGUES[league];
      if (!leagueInfo) {
        return new Response(JSON.stringify({ error: "Invalid league" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `You are a football data API. Return ONLY valid JSON, no markdown.
Provide the current ${leagueInfo.name} (${leagueInfo.nameFa}) standings for the 2024-2025 season.
Include all teams with their actual current stats. Be as accurate as possible.

Return this exact JSON structure:
{
  "standings": [{
    "type": "TOTAL",
    "table": [
      {
        "position": 1,
        "team": {"name": "Team Name", "shortName": "Short", "tla": "TLA", "crest": ""},
        "playedGames": 20,
        "won": 15,
        "draw": 3,
        "lost": 2,
        "points": 48,
        "goalsFor": 45,
        "goalsAgainst": 15,
        "goalDifference": 30
      }
    ]
  }]
}

Include all teams in the league, sorted by position. Use real current data for the 2024-2025 season.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a football data provider. Return ONLY valid JSON. No markdown, no code blocks." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        if (cached?.data) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI request failed");
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse standings:", content.substring(0, 500));
        if (cached?.data) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        parsed = { standings: [] };
      }

      const result = {
        standings: parsed.standings || [],
        leagueInfo,
        fetchedAt: new Date().toISOString(),
      };

      await supabase.from("sport_cache").upsert({
        id: `standings_${league}`,
        cache_type: "standings",
        league_code: league,
        data: result,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sport-fetch-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
