import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Newspaper, Calendar, RefreshCw, Wifi, TrendingUp, Shield, Zap, Timer, ChevronLeft, Eye,
} from "lucide-react";
import { format } from "date-fns-jalali";

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
interface NewsArticle {
  id?: string;
  title: string;
  titleOriginal?: string;
  summary?: string;
  content?: string;
  source?: string;
  category?: string;
  publishedAt?: string;
  published_at?: string;
  imageKeyword?: string;
}

const LEAGUES = [
  { code: "PL", name: "پریمیر لیگ", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD", name: "لالیگا", emoji: "🇪🇸" },
  { code: "SA", name: "سری آ", emoji: "🇮🇹" },
  { code: "BL1", name: "بوندسلیگا", emoji: "🇩🇪" },
  { code: "FL1", name: "لیگ فرانسه", emoji: "🇫🇷" },
  { code: "CL", name: "چمپیونز لیگ", emoji: "⭐" },
  { code: "IR", name: "لیگ ایران", emoji: "🇮🇷" },
  { code: "SAU", name: "لیگ عربستان", emoji: "🇸🇦" },
  { code: "BR", name: "لیگ برزیل", emoji: "🇧🇷" },
  { code: "WC", name: "جام جهانی", emoji: "🏆" },
  { code: "AC", name: "جام ملت‌ها", emoji: "🌏" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "برنامه‌ریزی شده", cls: "bg-sky-500/10 text-sky-400" },
  TIMED: { label: "زمان‌بندی شده", cls: "bg-sky-500/10 text-sky-400" },
  IN_PLAY: { label: "زنده", cls: "bg-red-500/15 text-red-400 animate-pulse" },
  PAUSED: { label: "استراحت", cls: "bg-amber-500/10 text-amber-400" },
  FINISHED: { label: "پایان یافته", cls: "bg-muted/60 text-muted-foreground" },
  POSTPONED: { label: "به تعویق افتاده", cls: "bg-orange-500/10 text-orange-400" },
  CANCELLED: { label: "لغو شده", cls: "bg-destructive/10 text-destructive" },
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الان";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.floor(h / 24)} روز پیش`;
}

const SUPABASE_URL = "https://ajhvxkbmpbuslllbgkab.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaHZ4a2JtcGJ1c2xsbGJna2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDMwNTMsImV4cCI6MjA3NzQxOTA1M30.z0pFauKITaI1nRRTPBf6J124XOHWnVJWSG9_KChe2w8";

// ===== MATCH CARD =====
const MatchCard = ({ match, onClick }: { match: Match; onClick: () => void }) => {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const status = STATUS_MAP[match.status] || { label: match.status, cls: "bg-muted" };
  const matchTime = new Date(match.utcDate);
  const timeStr = `${matchTime.getHours().toString().padStart(2, '0')}:${matchTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`relative p-3 sm:p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-all duration-200 ${
        isLive
          ? "bg-gradient-to-r from-red-500/8 to-red-500/3 border border-red-500/20 shadow-sm shadow-red-500/5"
          : "bg-card/50 border border-border/20 hover:border-emerald-500/20 hover:bg-card/80"
      }`}
    >
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold text-red-400">LIVE</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold truncate">{match.homeTeam.shortName || match.homeTeam.name}</p>
        </div>

        {/* Score */}
        <div className="shrink-0 w-20 text-center">
          {(isFinished || isLive) && match.score?.fullTime?.home !== null ? (
            <p className={`text-xl font-black tabular-nums ${isLive ? "text-red-400" : ""}`}>
              {match.score.fullTime.home} - {match.score.fullTime.away}
            </p>
          ) : (
            <p className="text-base font-bold text-muted-foreground">{timeStr}</p>
          )}
          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5 font-medium ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {/* Away */}
        <div className="flex-1">
          <p className="text-sm font-semibold truncate">{match.awayTeam.shortName || match.awayTeam.name}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ===== MATCH DETAIL VIEW =====
const MatchDetail = ({ match, onBack }: { match: Match; onBack: () => void }) => {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const status = STATUS_MAP[match.status] || { label: match.status, cls: "bg-muted" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground mb-2">
        <ChevronLeft className="w-4 h-4" /> بازگشت
      </Button>

      <div className={`rounded-3xl p-6 ${isLive ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20" : "bg-card/60 border border-border/30"}`}>
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground mb-1">{match.competition.name}</p>
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${status.cls}`}>{status.label}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 flex items-center justify-center text-3xl">⚽</div>
            <p className="font-bold text-sm">{match.homeTeam.name}</p>
          </div>

          <div className="text-center px-4">
            {(isFinished || isLive) && match.score?.fullTime?.home !== null ? (
              <div className="space-y-1">
                <p className={`text-4xl font-black tabular-nums ${isLive ? "text-red-400" : ""}`}>
                  {match.score.fullTime.home} - {match.score.fullTime.away}
                </p>
                {match.score?.halfTime?.home !== null && (
                  <p className="text-xs text-muted-foreground">نیمه اول: {match.score.halfTime.home} - {match.score.halfTime.away}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-muted-foreground">VS</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(match.utcDate).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 flex items-center justify-center text-3xl">⚽</div>
            <p className="font-bold text-sm">{match.awayTeam.name}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground">
            {new Date(match.utcDate).toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/40 border border-border/20 p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          اطلاعات بازی
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-muted/20 rounded-xl p-3">
            <p className="text-muted-foreground mb-1">مسابقات</p>
            <p className="font-semibold">{match.competition.name}</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3">
            <p className="text-muted-foreground mb-1">وضعیت</p>
            <p className="font-semibold">{status.label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===== NEWS ARTICLE VIEW =====
const NewsArticleView = ({ article, onBack }: { article: NewsArticle; onBack: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-4"
  >
    <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground mb-2">
      <ChevronLeft className="w-4 h-4" /> بازگشت
    </Button>

    <div className="rounded-3xl bg-card/60 border border-border/30 p-5 sm:p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">
            {article.category || "فوتبال"}
          </Badge>
          {article.source && <span>• {article.source}</span>}
          <span>• {timeAgo(article.publishedAt || article.published_at || new Date().toISOString())}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black leading-relaxed">{article.title}</h1>
        {article.titleOriginal && (
          <p className="text-xs text-muted-foreground/60 italic">{article.titleOriginal}</p>
        )}
      </div>

      {article.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed border-r-2 border-emerald-500 pr-3">
          {article.summary}
        </p>
      )}

      {article.content && (
        <div className="text-sm leading-7 text-foreground/90 whitespace-pre-line">
          {article.content}
        </div>
      )}

      <div className="pt-3 border-t border-border/20 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">
          ترجمه شده توسط AI
        </Badge>
        <span>ایزی اسپورت</span>
      </div>
    </div>
  </motion.div>
);

// ===== MAIN PAGE =====
const EasySport = () => {
  const [tab, setTab] = useState<"matches" | "standings" | "news">("matches");
  const [league, setLeague] = useState("PL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState({ matches: true, standings: false, news: true });
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  const callEdge = async (path: string, body?: any) => {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    return resp.json();
  };

  const loadMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(p => ({ ...p, matches: true }));
    try {
      // Try cache first
      const { data: cached } = await supabase
        .from("sport_cache").select("data, updated_at").eq("id", "matches_global").single();
      if (cached?.data) {
        const d = cached.data as any;
        const arr = Array.isArray(d.matches) ? d.matches : d.matches ? Object.values(d.matches) : [];
        if (arr.length > 0) {
          setMatches(arr as Match[]);
          setLastUpdate(cached.updated_at);
          setLoading(p => ({ ...p, matches: false }));
          // If cache is fresh enough, skip API call
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 120000) return;
        }
      }
      // Call edge function to refresh
      const data = await callEdge("sport-data", { type: "matches" });
      const arr = Array.isArray(data.matches) ? data.matches : data.matches ? Object.values(data.matches) : [];
      if (arr.length > 0) {
        setMatches(arr as Match[]);
        setLastUpdate(new Date().toISOString());
      }
    } catch (e) { console.error("matches error:", e); }
    finally { setLoading(p => ({ ...p, matches: false })); }
  }, []);

  const loadStandings = useCallback(async (lc: string, silent = false) => {
    if (!silent) setLoading(p => ({ ...p, standings: true }));
    try {
      const { data: cached } = await supabase
        .from("sport_cache").select("data, updated_at").eq("id", `standings_${lc}`).single();
      if (cached?.data) {
        const d = cached.data as any;
        const s = Array.isArray(d.standings) ? d.standings : d.standings ? Object.values(d.standings) : [];
        const tbl = (s[0] as any)?.table;
        const arr = Array.isArray(tbl) ? tbl : tbl ? Object.values(tbl) : [];
        if (arr.length > 0) {
          setStandings(arr as StandingRow[]);
          setLoading(p => ({ ...p, standings: false }));
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 300000) return;
        }
      }
      const data = await callEdge("sport-data", { type: "standings", league: lc });
      const s = Array.isArray(data.standings) ? data.standings : data.standings ? Object.values(data.standings) : [];
      const tbl = (s[0] as any)?.table;
      const arr = Array.isArray(tbl) ? tbl : tbl ? Object.values(tbl) : [];
      if (arr.length > 0) setStandings(arr as StandingRow[]);
    } catch (e) { console.error("standings error:", e); }
    finally { setLoading(p => ({ ...p, standings: false })); }
  }, []);

  const loadNews = useCallback(async (silent = false) => {
    if (!silent) setLoading(p => ({ ...p, news: true }));
    try {
      // Load from database first (instant)
      const { data: articles } = await supabase
        .from("sport_news_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(20);
      
      if (articles && articles.length > 0) {
        setNews(articles.map(a => ({
          id: a.id,
          title: a.title,
          titleOriginal: a.title_original,
          summary: a.summary,
          content: a.content,
          source: a.source_name,
          category: a.category,
          publishedAt: a.published_at,
        })));
        setLoading(p => ({ ...p, news: false }));
      }

      // Also try cache/edge for fresh news
      const { data: cached } = await supabase
        .from("sport_cache").select("data, updated_at").eq("id", "news_feed").single();
      if (cached?.data) {
        const d = cached.data as any;
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < 300000 && d.news?.length > 0) {
          if (!articles?.length) {
            setNews(d.news);
          }
          setLoading(p => ({ ...p, news: false }));
          return;
        }
      }

      // Refresh via edge function
      const data = await callEdge("sport-news");
      if (data.news?.length > 0 && (!articles?.length || articles.length < 5)) {
        setNews(data.news);
      }
    } catch (e) { console.error("news error:", e); }
    finally { setLoading(p => ({ ...p, news: false })); }
  }, []);

  useEffect(() => { loadMatches(); loadNews(); }, []);
  useEffect(() => { if (tab === "standings") loadStandings(league); }, [tab, league]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      if (tab === "matches") loadMatches(true);
      else if (tab === "standings") loadStandings(league, true);
      else loadNews(true);
    }, 60000);
    return () => clearInterval(iv);
  }, [tab, league]);

  const matchesByComp = matches.reduce<Record<string, Match[]>>((a, m) => {
    const k = m.competition?.name || "Other";
    (a[k] = a[k] || []).push(m);
    return a;
  }, {});

  // If viewing a match or news detail
  if (selectedMatch) return (
    <PlatformLayout platformName="ایزی اسپورت" platformIcon={<Trophy className="w-5 h-5 text-white" />} platformColor="bg-gradient-to-br from-emerald-600 to-green-700">
      <div className="container mx-auto px-4 max-w-lg py-4">
        <MatchDetail match={selectedMatch} onBack={() => setSelectedMatch(null)} />
      </div>
    </PlatformLayout>
  );

  if (selectedNews) return (
    <PlatformLayout platformName="ایزی اسپورت" platformIcon={<Trophy className="w-5 h-5 text-white" />} platformColor="bg-gradient-to-br from-emerald-600 to-green-700">
      <div className="container mx-auto px-4 max-w-lg py-4">
        <NewsArticleView article={selectedNews} onBack={() => setSelectedNews(null)} />
      </div>
    </PlatformLayout>
  );

  return (
    <PlatformLayout
      platformName="ایزی اسپورت"
      platformIcon={<Trophy className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-emerald-600 to-green-700"
    >
      <div className="min-h-screen bg-background">
        {/* Compact Header */}
        <div className="bg-gradient-to-b from-emerald-600/10 to-transparent">
          <div className="container mx-auto px-4 max-w-lg pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-lg">⚽</span>
                </div>
                <div>
                  <h1 className="text-lg font-black">ایزی اسپورت</h1>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-emerald-500" /> آپدیت هر ۱ دقیقه
                  </p>
                </div>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <Wifi className="w-3 h-3" />
                  {new Date(lastUpdate).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>

            {/* Tab Bar - PWA style */}
            <div className="grid grid-cols-3 bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl p-1 gap-1">
              {[
                { key: "matches" as const, label: "بازی‌ها", icon: <Calendar className="w-4 h-4" /> },
                { key: "standings" as const, label: "جدول", icon: <TrendingUp className="w-4 h-4" /> },
                { key: "news" as const, label: "اخبار", icon: <Newspaper className="w-4 h-4" /> },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    tab === t.key
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-lg pb-24">
          <AnimatePresence mode="wait">
            {/* MATCHES */}
            {tab === "matches" && (
              <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-emerald-500" /> بازی‌های اخیر و آینده
                  </h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400" onClick={() => loadMatches(false)}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {loading.matches ? (
                  <div className="space-y-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">در حال بارگذاری بازی‌ها...</p>
                    <Button size="sm" variant="outline" onClick={() => loadMatches(false)} className="gap-1.5 rounded-xl">
                      <RefreshCw className="w-3.5 h-3.5" /> تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  Object.entries(matchesByComp).map(([comp, cm]) => (
                    <div key={comp} className="space-y-1.5">
                      <div className="flex items-center gap-2 px-1 py-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-muted-foreground">{comp}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 bg-muted/40 ml-auto">{cm.length}</Badge>
                      </div>
                      {cm.map(m => <MatchCard key={m.id} match={m} onClick={() => setSelectedMatch(m)} />)}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* STANDINGS */}
            {tab === "standings" && (
              <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 space-y-4">
                <ScrollArea className="w-full">
                  <div className="flex gap-1.5 pb-2">
                    {LEAGUES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => setLeague(l.code)}
                        className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          league === l.code
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                            : "bg-card/50 text-muted-foreground hover:bg-card border border-border/20"
                        }`}
                      >
                        <span>{l.emoji}</span>
                        <span>{l.name}</span>
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {loading.standings ? (
                  <div className="space-y-1.5">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
                ) : standings.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">در حال بارگذاری جدول...</p>
                    <Button size="sm" variant="outline" onClick={() => loadStandings(league)} className="gap-1.5 rounded-xl">
                      <RefreshCw className="w-3.5 h-3.5" /> تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/20 overflow-hidden bg-card/40">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-emerald-500/5 border-b border-border/20">
                            <TableHead className="w-8 text-center text-[10px] font-bold">#</TableHead>
                            <TableHead className="text-[10px] font-bold">تیم</TableHead>
                            <TableHead className="text-center w-8 text-[10px]">ب</TableHead>
                            <TableHead className="text-center w-8 text-[10px] text-emerald-400">بر</TableHead>
                            <TableHead className="text-center w-8 text-[10px]">م</TableHead>
                            <TableHead className="text-center w-8 text-[10px] text-red-400">با</TableHead>
                            <TableHead className="text-center w-8 text-[10px]">ت</TableHead>
                            <TableHead className="text-center w-10 text-[10px] font-black">ام</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {standings.map((r, i) => {
                            const top = i < 4;
                            const bot = i >= standings.length - 3;
                            return (
                              <TableRow key={r.position} className={`text-xs ${top ? "border-r-2 border-r-emerald-500" : bot ? "border-r-2 border-r-red-500" : "border-r-2 border-r-transparent"} hover:bg-muted/20`}>
                                <TableCell className="text-center">
                                  <span className={`inline-flex w-5 h-5 items-center justify-center rounded-md text-[10px] font-bold ${top ? "bg-emerald-500/10 text-emerald-400" : bot ? "bg-red-500/10 text-red-400" : "text-muted-foreground"}`}>
                                    {r.position}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium text-xs truncate max-w-[100px]">{r.team.shortName || r.team.name}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{r.playedGames}</TableCell>
                                <TableCell className="text-center text-emerald-400 font-bold">{r.won}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{r.draw}</TableCell>
                                <TableCell className="text-center text-red-400">{r.lost}</TableCell>
                                <TableCell className={`text-center font-bold ${r.goalDifference > 0 ? "text-emerald-400" : r.goalDifference < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                  {r.goalDifference > 0 ? "+" : ""}{r.goalDifference}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-md bg-foreground/5 text-xs font-black">{r.points}</span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* NEWS */}
            {tab === "news" && (
              <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-emerald-500" /> آخرین اخبار
                  </h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400" onClick={() => loadNews(false)}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {loading.news ? (
                  <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                ) : news.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">در حال بارگذاری اخبار...</p>
                    <Button size="sm" variant="outline" onClick={() => loadNews(false)} className="gap-1.5 rounded-xl">
                      <RefreshCw className="w-3.5 h-3.5" /> تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  news.map((article, idx) => (
                    <motion.div
                      key={article.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedNews(article)}
                      className="p-3.5 rounded-2xl bg-card/50 border border-border/20 hover:border-emerald-500/20 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
                        {article.source && <span className="bg-muted/40 px-1.5 py-0.5 rounded-md">{article.source}</span>}
                        <span>{timeAgo(article.publishedAt || article.published_at || new Date().toISOString())}</span>
                        <Badge variant="secondary" className="text-[9px] h-3.5 bg-emerald-500/10 text-emerald-400 border-0 mr-auto">
                          ترجمه شده
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold leading-relaxed line-clamp-2">{article.title}</h3>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400">
                        <Eye className="w-3 h-3" /> مشاهده کامل خبر
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default EasySport;
