import { useState, useEffect, useCallback } from "react";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

const SUPABASE_URL = "https://ajhvxkbmpbuslllbgkab.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaHZ4a2JtcGJ1c2xsbGJna2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDMwNTMsImV4cCI6MjA3NzQxOTA1M30.z0pFauKITaI1nRRTPBf6J124XOHWnVJWSG9_KChe2w8";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Newspaper, Calendar, RefreshCw, Wifi, Globe, TrendingUp, Shield, Zap, Timer,
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

// ===== TYPES =====
interface Match {
  id: number;
  competition: { name: string; code: string; emblem: string };
  utcDate: string;
  status: string;
  homeTeam: { name: string; shortName: string; tla: string; crest: string };
  awayTeam: { name: string; shortName: string; tla: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } };
}
interface StandingRow {
  position: number;
  team: { name: string; shortName: string; tla: string; crest: string };
  playedGames: number; won: number; draw: number; lost: number;
  points: number; goalsFor: number; goalsAgainst: number; goalDifference: number;
}
interface NewsItem {
  title: string; titleFa: string | null; link: string;
  description: string; pubDate: string; image: string | null;
  source: string; lang: string;
}

// ===== CONSTANTS =====
const LEAGUES = [
  { code: "PL", name: "پریمیر لیگ", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD", name: "لالیگا", emoji: "🇪🇸" },
  { code: "SA", name: "سری آ", emoji: "🇮🇹" },
  { code: "BL1", name: "بوندسلیگا", emoji: "🇩🇪" },
  { code: "FL1", name: "لیگ فرانسه", emoji: "🇫🇷" },
  { code: "CL", name: "چمپیونز لیگ", emoji: "⭐" },
  { code: "WC", name: "جام جهانی", emoji: "🏆" },
  { code: "IR", name: "لیگ ایران", emoji: "🇮🇷" },
  { code: "BR", name: "لیگ برزیل", emoji: "🇧🇷" },
  { code: "SAU", name: "لیگ عربستان", emoji: "🇸🇦" },
  { code: "AC", name: "جام ملت‌ها", emoji: "🌏" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "برنامه‌ریزی", color: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  TIMED: { label: "زمان‌دار", color: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  IN_PLAY: { label: "🔴 زنده", color: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" },
  PAUSED: { label: "نیمه", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  FINISHED: { label: "پایان", color: "bg-muted text-muted-foreground border-transparent" },
  POSTPONED: { label: "تعویق", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  CANCELLED: { label: "لغو", color: "bg-destructive/15 text-destructive border-destructive/20" },
};

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}

// ===== MATCH CARD =====
const MatchCard = ({ match }: { match: Match }) => {
  const time = format(new Date(match.utcDate), "HH:mm");
  const date = format(new Date(match.utcDate), "d MMM", { locale: faIR });
  const status = STATUS_MAP[match.status] || { label: match.status, color: "bg-muted" };
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-4 transition-all duration-300 ${
        isLive
          ? "bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 shadow-lg shadow-red-500/5"
          : "bg-card/40 hover:bg-card/70 border border-border/30 hover:border-border/60"
      }`}
    >
      {isLive && (
        <div className="absolute top-2 left-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className={`text-sm font-semibold ${isLive ? "text-foreground" : ""}`}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
            {match.homeTeam.crest && (
              <img src={match.homeTeam.crest} alt="" className="w-7 h-7 object-contain" />
            )}
          </div>
        </div>

        {/* Score / Time */}
        <div className="w-28 mx-3 text-center shrink-0">
          {(isFinished || isLive) && match.score?.fullTime?.home !== null ? (
            <div className={`text-2xl font-black tracking-wider ${isLive ? "text-red-400" : "text-foreground"}`}>
              {match.score.fullTime.home} - {match.score.fullTime.away}
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-lg font-bold text-foreground">{time}</p>
              <p className="text-[11px] text-muted-foreground">{date}</p>
            </div>
          )}
          <Badge variant="outline" className={`text-[10px] mt-1.5 border ${status.color}`}>
            {status.label}
          </Badge>
        </div>

        {/* Away Team */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {match.awayTeam.crest && (
              <img src={match.awayTeam.crest} alt="" className="w-7 h-7 object-contain" />
            )}
            <span className={`text-sm font-semibold ${isLive ? "text-foreground" : ""}`}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===== NEWS CARD =====
const NewsCard = ({ news, index }: { news: NewsItem; index: number }) => {
  const displayTitle = news.titleFa || news.title;
  const timeAgo = getTimeAgo(news.pubDate);

  return (
    <motion.a
      href={news.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="block group"
    >
      <div className={`relative overflow-hidden rounded-2xl border border-border/30 bg-card/40 hover:bg-card/70 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 ${
        index === 0 ? "md:flex md:gap-0" : ""
      }`}>
        {news.image && (
          <div className={index === 0 ? "md:w-2/5" : ""}>
            <img
              src={news.image}
              alt=""
              className={`w-full object-cover ${index === 0 ? "h-48 md:h-full" : "h-40"}`}
              loading="lazy"
            />
          </div>
        )}
        <div className={`p-4 ${index === 0 && news.image ? "md:w-3/5 md:flex md:flex-col md:justify-center" : ""}`}>
          <h3 className={`font-bold line-clamp-2 group-hover:text-emerald-400 transition-colors mb-2 ${
            index === 0 ? "text-lg" : "text-sm"
          }`}>
            {displayTitle}
          </h3>
          {news.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{news.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50">
              <Globe className="w-3 h-3" />
              <span>{news.source}</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
            {news.titleFa && (
              <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-400 border-0">
                ترجمه شده
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
};

// ===== MAIN PAGE =====
const EasySport = () => {
  const [activeTab, setActiveTab] = useState("matches");
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [loadingNews, setLoadingNews] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const loadMatches = useCallback(async (force = false) => {
    try {
      if (!force) {
        const { data: cached } = await supabase
          .from("sport_cache").select("data, updated_at").eq("id", "matches_global").single();
        const cacheData = cached?.data as any;
        if (cacheData?.matches) {
          setMatches(Array.isArray(cacheData.matches) ? cacheData.matches : Object.values(cacheData.matches));
          setLastUpdate(cached.updated_at);
          setLoadingMatches(false);
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 60000) return;
        }
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sport-data`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "matches" }),
      });
      if (response.ok) {
        const data = await response.json();
        const matchArr = Array.isArray(data.matches) ? data.matches : Object.values(data.matches || {});
        setMatches(matchArr as Match[]);
        setLastUpdate(new Date().toISOString());
      }
    } catch (e) { console.error("Error loading matches:", e); }
    finally { setLoadingMatches(false); }
  }, []);

  const loadStandings = useCallback(async (league: string, force = false) => {
    setLoadingStandings(true);
    try {
      if (!force) {
        const { data: cached } = await supabase
          .from("sport_cache").select("data, updated_at").eq("id", `standings_${league}`).single();
        const cacheData = cached?.data as any;
        if (cacheData?.standings?.[0]?.table) {
          const tbl = cacheData.standings[0].table;
          setStandings(Array.isArray(tbl) ? tbl : Object.values(tbl));
          setLoadingStandings(false);
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 60000) return;
        }
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sport-data`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "standings", league }),
      });
      if (response.ok) {
        const data = await response.json();
        const stArr = Array.isArray(data.standings) ? data.standings : Object.values(data.standings || {});
        const firstStanding = stArr[0] as any;
        const tbl = firstStanding?.table;
        setStandings(Array.isArray(tbl) ? tbl : Object.values(tbl || {}));
      }
    } catch (e) { console.error("Error loading standings:", e); }
    finally { setLoadingStandings(false); }
  }, []);

  const loadNews = useCallback(async () => {
    try {
      const { data: cached } = await supabase
        .from("sport_cache").select("data, updated_at").eq("id", "news_feed").single();
      const cacheData = cached?.data as any;
      if (cacheData?.news) {
        setNews(cacheData.news);
        setLoadingNews(false);
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < 120000) return;
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sport-news`, {
        headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (e) { console.error("Error loading news:", e); }
    finally { setLoadingNews(false); }
  }, []);

  useEffect(() => { loadMatches(); loadNews(); }, []);
  useEffect(() => { if (activeTab === "standings") loadStandings(selectedLeague); }, [activeTab, selectedLeague]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "matches") loadMatches(true);
      if (activeTab === "standings") loadStandings(selectedLeague, true);
      if (activeTab === "news") loadNews();
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab, selectedLeague]);

  const matchesByComp = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.competition?.name || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const SkeletonCard = () => (
    <div className="rounded-2xl border border-border/20 p-4 space-y-3 bg-card/20">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );

  return (
    <PlatformLayout
      platformName="ایزی اسپورت"
      platformIcon={<Trophy className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-emerald-600 to-green-700"
    >
      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/15 via-emerald-500/5 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute top-20 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-x-1/2" />

          <div className="relative container mx-auto px-4 max-w-5xl pt-8 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <span className="text-xl">⚽</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                    ایزی اسپورت
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  نتایج زنده • اخبار لحظه‌ای • جداول لیگ‌ها
                </p>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>{format(new Date(lastUpdate), "HH:mm")}</span>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-1 h-auto">
                <TabsTrigger
                  value="matches"
                  className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-bold">بازی‌ها</span>
                </TabsTrigger>
                <TabsTrigger
                  value="standings"
                  className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">جدول</span>
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all"
                >
                  <Newspaper className="w-4 h-4" />
                  <span className="font-bold">اخبار</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-5xl pb-8">
          {/* ====== MATCHES ====== */}
          {activeTab === "matches" && (
            <div className="py-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
                  بازی‌های اخیر و آینده
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadMatches(true)}
                  className="gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" /> بروزرسانی
                </Button>
              </div>

              {loadingMatches ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}</div>
              ) : Object.keys(matchesByComp).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center bg-card/20">
                  <Trophy className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">بازی‌ای یافت نشد</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">منتظر بمانید تا اطلاعات بارگذاری شود</p>
                </div>
              ) : (
                Object.entries(matchesByComp).map(([comp, compMatches]) => (
                  <motion.div
                    key={comp}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/30 overflow-hidden bg-card/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border/20">
                      {compMatches[0]?.competition?.emblem && (
                        <img src={compMatches[0].competition.emblem} alt="" className="w-6 h-6 object-contain" />
                      )}
                      <h3 className="font-bold text-sm">{comp}</h3>
                      <Badge variant="secondary" className="text-[10px] mr-auto bg-muted/50">
                        {compMatches.length} بازی
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      {compMatches.map(match => <MatchCard key={match.id} match={match} />)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ====== STANDINGS ====== */}
          {activeTab === "standings" && (
            <div className="py-5 space-y-5">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-3">
                  {LEAGUES.map(league => (
                    <Button
                      key={league.code}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeague(league.code)}
                      className={`whitespace-nowrap gap-1.5 rounded-xl border transition-all ${
                        selectedLeague === league.code
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-green-600"
                          : "border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                      }`}
                    >
                      <span className="text-base">{league.emoji}</span>
                      <span className="text-xs font-bold">{league.name}</span>
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {loadingStandings ? (
                <div className="space-y-2">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
              ) : standings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center bg-card/20">
                  <Shield className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">جدول در دسترس نیست</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border/30 overflow-hidden bg-card/30 backdrop-blur-sm"
                >
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border/20">
                          <TableHead className="w-10 text-center text-xs font-bold">#</TableHead>
                          <TableHead className="text-xs font-bold">تیم</TableHead>
                          <TableHead className="text-center w-9 text-xs">ب</TableHead>
                          <TableHead className="text-center w-9 text-xs text-emerald-400">بر</TableHead>
                          <TableHead className="text-center w-9 text-xs">م</TableHead>
                          <TableHead className="text-center w-9 text-xs text-red-400">با</TableHead>
                          <TableHead className="text-center w-9 text-xs">گ+</TableHead>
                          <TableHead className="text-center w-9 text-xs">گ-</TableHead>
                          <TableHead className="text-center w-9 text-xs">ت</TableHead>
                          <TableHead className="text-center w-12 text-xs font-black">ام</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((row, idx) => {
                          const isTop4 = idx < 4;
                          const isBottom3 = idx >= standings.length - 3;
                          return (
                            <TableRow
                              key={row.position}
                              className={`transition-colors hover:bg-muted/30 ${
                                isTop4 ? "border-r-[3px] border-r-emerald-500"
                                : isBottom3 ? "border-r-[3px] border-r-red-500"
                                : "border-r-[3px] border-r-transparent"
                              }`}
                            >
                              <TableCell className="text-center">
                                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-lg text-xs font-bold ${
                                  isTop4 ? "bg-emerald-500/15 text-emerald-400" : isBottom3 ? "bg-red-500/15 text-red-400" : "text-muted-foreground"
                                }`}>
                                  {row.position}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {row.team.crest && <img src={row.team.crest} alt="" className="w-5 h-5 object-contain" />}
                                  <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                    {row.team.shortName || row.team.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.playedGames}</TableCell>
                              <TableCell className="text-center text-xs text-emerald-400 font-bold">{row.won}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.draw}</TableCell>
                              <TableCell className="text-center text-xs text-red-400">{row.lost}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.goalsFor}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.goalsAgainst}</TableCell>
                              <TableCell className={`text-center text-xs font-bold ${
                                row.goalDifference > 0 ? "text-emerald-400" : row.goalDifference < 0 ? "text-red-400" : "text-muted-foreground"
                              }`}>
                                {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-foreground/5 text-sm font-black">
                                  {row.points}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ====== NEWS ====== */}
          {activeTab === "news" && (
            <div className="py-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
                  آخرین اخبار فوتبال
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadNews}
                  className="gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" /> بروزرسانی
                </Button>
              </div>

              {loadingNews ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
              ) : news.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center bg-card/20">
                  <Newspaper className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">خبری یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {news.map((item, idx) => (
                      <NewsCard key={idx} news={item} index={idx} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default EasySport;
