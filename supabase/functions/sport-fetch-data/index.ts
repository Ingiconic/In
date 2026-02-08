import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Football-Data.org free API (10 req/min)
const FOOTBALL_API = "https://api.football-data.org/v4";

// League codes mapping
const LEAGUES: Record<string, { code: string; name: string; nameFa: string }> = {
  PL: { code: "PL", name: "Premier League", nameFa: "پریمیر لیگ" },
  PD: { code: "PD", name: "La Liga", nameFa: "لالیگا" },
  SA: { code: "SA", name: "Serie A", nameFa: "سری آ ایتالیا" },
  BL1: { code: "BL1", name: "Bundesliga", nameFa: "بوندسلیگا" },
  FL1: { code: "FL1", name: "Ligue 1", nameFa: "لیگ فرانسه" },
  CL: { code: "CL", name: "Champions League", nameFa: "چمپیونز لیگ" },
  WC: { code: "WC", name: "World Cup", nameFa: "جام جهانی" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FOOTBALL_API_KEY = Deno.env.get("FOOTBALL_API_KEY");
    if (!FOOTBALL_API_KEY) {
      throw new Error("FOOTBALL_API_KEY not configured");
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "matches"; // matches, standings
    const league = url.searchParams.get("league") || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const headers = { "X-Auth-Token": FOOTBALL_API_KEY };

    if (type === "matches") {
      // Fetch matches for yesterday, today, tomorrow, day after
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

      const dateFrom = yesterday.toISOString().split("T")[0];
      const dateTo = dayAfter.toISOString().split("T")[0];

      const response = await fetch(
        `${FOOTBALL_API}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        { headers }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Football API error:", response.status, errText);
        throw new Error(`Football API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Group matches by competition and date
      const matches = (data.matches || []).map((m: any) => ({
        id: m.id,
        competition: {
          name: m.competition?.name,
          code: m.competition?.code,
          emblem: m.competition?.emblem,
        },
        utcDate: m.utcDate,
        status: m.status,
        matchday: m.matchday,
        homeTeam: {
          name: m.homeTeam?.name,
          shortName: m.homeTeam?.shortName,
          tla: m.homeTeam?.tla,
          crest: m.homeTeam?.crest,
        },
        awayTeam: {
          name: m.awayTeam?.name,
          shortName: m.awayTeam?.shortName,
          tla: m.awayTeam?.tla,
          crest: m.awayTeam?.crest,
        },
        score: {
          fullTime: m.score?.fullTime,
          halfTime: m.score?.halfTime,
        },
      }));

      // Cache in database
      await supabase.from("sport_cache").upsert({
        id: "matches_global",
        cache_type: "matches",
        data: { matches, dateFrom, dateTo, fetchedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      return new Response(JSON.stringify({ matches, dateFrom, dateTo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "standings") {
      const leagueCode = league || "PL";
      const leagueInfo = LEAGUES[leagueCode];
      if (!leagueInfo) {
        return new Response(JSON.stringify({ error: "Invalid league code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(
        `${FOOTBALL_API}/competitions/${leagueCode}/standings`,
        { headers }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Standings API error:", response.status, errText);
        throw new Error(`Standings API error: ${response.status}`);
      }

      const data = await response.json();
      
      const standings = (data.standings || []).map((s: any) => ({
        type: s.type,
        table: (s.table || []).map((t: any) => ({
          position: t.position,
          team: {
            name: t.team?.name,
            shortName: t.team?.shortName,
            tla: t.team?.tla,
            crest: t.team?.crest,
          },
          playedGames: t.playedGames,
          won: t.won,
          draw: t.draw,
          lost: t.lost,
          points: t.points,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDifference: t.goalDifference,
        })),
      }));

      // Cache
      await supabase.from("sport_cache").upsert({
        id: `standings_${leagueCode}`,
        cache_type: "standings",
        league_code: leagueCode,
        data: { standings, competition: data.competition, season: data.season, fetchedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      return new Response(JSON.stringify({ standings, competition: data.competition, leagueInfo }), {
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
