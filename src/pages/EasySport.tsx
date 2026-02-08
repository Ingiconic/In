import { useState, useEffect, useCallback } from "react";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Newspaper, Calendar, RefreshCw, Clock,
  ChevronLeft, ChevronRight, Loader2, Wifi, Globe,
  TrendingUp, Shield,
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// League definitions with Persian names
const LEAGUES = [
  { code: "PL", name: "پریمیر لیگ", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "from-purple-600 to-purple-800" },
  { code: "PD", name: "لالیگا", emoji: "🇪🇸", color: "from-orange-500 to-red-600" },
  { code: "SA", name: "سری آ", emoji: "🇮🇹", color: "from-blue-600 to-green-600" },
  { code: "BL1", name: "بوندسلیگا", emoji: "🇩🇪", color: "from-red-600 to-yellow-500" },
  { code: "FL1", name: "لیگ فرانسه", emoji: "🇫🇷", color: "from-blue-600 to-red-500" },
  { code: "CL", name: "چمپیونز لیگ", emoji: "⭐", color: "from-blue-800 to-indigo-900" },
  { code: "WC", name: "جام جهانی", emoji: "🏆", color: "from-yellow-600 to-green-700" },
];

// Match status translations
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "برنامه‌ریزی", color: "bg-blue-500/10 text-blue-500" },
  TIMED: { label: "زمان‌دار", color: "bg-blue-500/10 text-blue-500" },
  IN_PLAY: { label: "🔴 زنده", color: "bg-red-500/20 text-red-500 animate-pulse" },
  PAUSED: { label: "نیمه", color: "bg-yellow-500/10 text-yellow-500" },
  FINISHED: { label: "پایان", color: "bg-muted text-muted-foreground" },
  POSTPONED: { label: "تعویق", color: "bg-orange-500/10 text-orange-500" },
  CANCELLED: { label: "لغو", color: "bg-destructive/10 text-destructive" },
};

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
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface NewsItem {
  title: string;
  titleFa: string | null;
  link: string;
  description: string;
  pubDate: string;
  image: string | null;
  source: string;
  lang: string;
}

// ============== MATCH CARD ==============
const MatchRow = ({ match }: { match: Match }) => {
  const time = format(new Date(match.utcDate), "HH:mm");
  const date = format(new Date(match.utcDate), "d MMM", { locale: faIR });
  const status = STATUS_MAP[match.status] || { label: match.status, color: "bg-muted" };
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 p-3 rounded-xl transition-all ${isLive ? "bg-red-500/5 border border-red-500/20" : "hover:bg-muted/50"}`}
    >
      {/* Time / Status */}
      <div className="w-16 text-center shrink-0">
        {isLive ? (
          <Badge className={status.color + " text-xs font-bold"}>{status.label}</Badge>
        ) : isFinished ? (
          <span className="text-xs text-muted-foreground">{status.label}</span>
        ) : (
          <div>
            <p className="text-sm font-bold">{time}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain" />}
          <span className={`text-sm truncate ${isLive ? "font-bold" : ""}`}>
            {match.homeTeam.shortName || match.homeTeam.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain" />}
          <span className={`text-sm truncate ${isLive ? "font-bold" : ""}`}>
            {match.awayTeam.shortName || match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Score */}
      {(isFinished || isLive) && match.score?.fullTime?.home !== null ? (
        <div className="w-12 text-center shrink-0">
          <div className={`text-lg font-black ${isLive ? "text-red-500" : ""}`}>
            {match.score.fullTime.home}
          </div>
          <div className={`text-lg font-black ${isLive ? "text-red-500" : ""}`}>
            {match.score.fullTime.away}
          </div>
        </div>
      ) : (
        <div className="w-12 text-center text-muted-foreground text-xs shrink-0">
          vs
        </div>
      )}
    </motion.div>
  );
};

// ============== NEWS CARD ==============
const NewsCard = ({ news }: { news: NewsItem }) => {
  const displayTitle = news.titleFa || news.title;
  const timeAgo = getTimeAgo(news.pubDate);

  return (
    <motion.a
      href={news.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="block group"
    >
      <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all">
        <div className="flex gap-3 p-3">
          {news.image && (
            <img src={news.image} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0" loading="lazy" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-emerald-500 transition-colors mb-1">
              {displayTitle}
            </h3>
            {news.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{news.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>{news.source}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              {news.titleFa && <Badge variant="secondary" className="text-[10px] h-4">ترجمه شده</Badge>}
            </div>
          </div>
        </div>
      </Card>
    </motion.a>
  );
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

// ============== MAIN PAGE ==============
const EasySport = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matches");
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [loadingNews, setLoadingNews] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Load matches from cache or fetch
  const loadMatches = useCallback(async (force = false) => {
    try {
      // Try cache first
      if (!force) {
        const { data: cached } = await supabase
          .from("sport_cache")
          .select("data, updated_at")
          .eq("id", "matches_global")
          .single();

        const cacheData = cached?.data as any;
        if (cacheData?.matches) {
          setMatches(cacheData.matches);
          setLastUpdate(cached.updated_at);
          setLoadingMatches(false);
          
          // If cache is fresh enough, don't refetch
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 60000) return; // less than 1 min old
        }
      }

      // Fetch fresh data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sport-fetch-data?type=matches`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
        setLastUpdate(new Date().toISOString());
      }
    } catch (e) {
      console.error("Error loading matches:", e);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // Load standings
  const loadStandings = useCallback(async (league: string, force = false) => {
    setLoadingStandings(true);
    try {
      // Try cache first
      if (!force) {
        const { data: cached } = await supabase
          .from("sport_cache")
          .select("data, updated_at")
          .eq("id", `standings_${league}`)
          .single();

        const cacheData = cached?.data as any;
        if (cacheData?.standings?.[0]?.table) {
          setStandings(cacheData.standings[0].table);
          setLoadingStandings(false);
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < 60000) return;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sport-fetch-data?type=standings&league=${league}`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setStandings(data.standings?.[0]?.table || []);
      }
    } catch (e) {
      console.error("Error loading standings:", e);
    } finally {
      setLoadingStandings(false);
    }
  }, []);

  // Load news
  const loadNews = useCallback(async () => {
    try {
      // Try cache first
      const { data: cached } = await supabase
        .from("sport_cache")
        .select("data, updated_at")
        .eq("id", "news_feed")
        .single();

      const cacheData = cached?.data as any;
      if (cacheData?.news) {
        setNews(cacheData.news);
        setLoadingNews(false);
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < 120000) return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sport-news`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (e) {
      console.error("Error loading news:", e);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    loadNews();
  }, []);

  useEffect(() => {
    if (activeTab === "standings") {
      loadStandings(selectedLeague);
    }
  }, [activeTab, selectedLeague]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "matches") loadMatches(true);
      if (activeTab === "standings") loadStandings(selectedLeague, true);
      if (activeTab === "news") loadNews();
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab, selectedLeague]);

  // Group matches by competition
  const matchesByComp = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.competition?.name || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <PlatformLayout
      platformName="ایزی اسپورت"
      platformIcon={<Trophy className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-emerald-600 to-green-700"
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-b from-emerald-600/10 to-transparent">
          <div className="container mx-auto px-4 max-w-5xl pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">
                  ⚽ ایزی اسپورت
                </h1>
                <p className="text-muted-foreground text-sm mt-1">نتایج زنده • اخبار • جدول لیگ‌ها</p>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  <span>آپدیت: {format(new Date(lastUpdate), "HH:mm")}</span>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 bg-muted/50">
                <TabsTrigger value="matches" className="gap-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4" />بازی‌ها
                </TabsTrigger>
                <TabsTrigger value="standings" className="gap-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4" />جدول
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Newspaper className="w-4 h-4" />اخبار
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-5xl pb-8">
          {/* ====== MATCHES TAB ====== */}
          {activeTab === "matches" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  بازی‌های اخیر و آینده
                </h2>
                <Button variant="ghost" size="sm" onClick={() => loadMatches(true)} className="gap-1 text-emerald-500">
                  <RefreshCw className="w-4 h-4" /> بروزرسانی
                </Button>
              </div>

              {loadingMatches ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : Object.keys(matchesByComp).length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">بازی‌ای یافت نشد</p>
                  <p className="text-xs text-muted-foreground mt-1">برای دریافت اطلاعات، کلید API فوتبال باید تنظیم شود</p>
                </Card>
              ) : (
                Object.entries(matchesByComp).map(([comp, compMatches]) => (
                  <Card key={comp} className="overflow-hidden border-0 bg-card/60">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/5 border-b border-border/40">
                      {compMatches[0]?.competition?.emblem && (
                        <img src={compMatches[0].competition.emblem} alt="" className="w-5 h-5 object-contain" />
                      )}
                      <h3 className="font-bold text-sm">{comp}</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">{compMatches.length} بازی</Badge>
                    </div>
                    <div className="divide-y divide-border/30">
                      {compMatches.map(match => (
                        <MatchRow key={match.id} match={match} />
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ====== STANDINGS TAB ====== */}
          {activeTab === "standings" && (
            <div className="py-4 space-y-4">
              {/* League selector */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {LEAGUES.map(league => (
                    <Button
                      key={league.code}
                      variant={selectedLeague === league.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLeague(league.code)}
                      className={`whitespace-nowrap gap-1.5 ${selectedLeague === league.code ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                    >
                      <span>{league.emoji}</span>
                      {league.name}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {loadingStandings ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : standings.length === 0 ? (
                <Card className="p-8 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">جدول در دسترس نیست</p>
                </Card>
              ) : (
                <Card className="overflow-hidden border-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-500/5">
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>تیم</TableHead>
                          <TableHead className="text-center w-10">بازی</TableHead>
                          <TableHead className="text-center w-10">برد</TableHead>
                          <TableHead className="text-center w-10">مساوی</TableHead>
                          <TableHead className="text-center w-10">باخت</TableHead>
                          <TableHead className="text-center w-10">گل‌زده</TableHead>
                          <TableHead className="text-center w-10">گل‌خورده</TableHead>
                          <TableHead className="text-center w-10">تفاضل</TableHead>
                          <TableHead className="text-center w-12 font-black">امتیاز</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((row, idx) => (
                          <TableRow
                            key={row.position}
                            className={`${idx < 4 ? "border-r-2 border-r-emerald-500" : idx >= standings.length - 3 ? "border-r-2 border-r-red-500" : ""}`}
                          >
                            <TableCell className="text-center font-bold text-xs">{row.position}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {row.team.crest && <img src={row.team.crest} alt="" className="w-5 h-5 object-contain" />}
                                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                  {row.team.shortName || row.team.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs">{row.playedGames}</TableCell>
                            <TableCell className="text-center text-xs text-emerald-500 font-bold">{row.won}</TableCell>
                            <TableCell className="text-center text-xs">{row.draw}</TableCell>
                            <TableCell className="text-center text-xs text-red-500">{row.lost}</TableCell>
                            <TableCell className="text-center text-xs">{row.goalsFor}</TableCell>
                            <TableCell className="text-center text-xs">{row.goalsAgainst}</TableCell>
                            <TableCell className={`text-center text-xs font-bold ${row.goalDifference > 0 ? "text-emerald-500" : row.goalDifference < 0 ? "text-red-500" : ""}`}>
                              {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                            </TableCell>
                            <TableCell className="text-center font-black text-sm">{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ====== NEWS TAB ====== */}
          {activeTab === "news" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-emerald-500" />
                  آخرین اخبار فوتبال
                </h2>
                <Button variant="ghost" size="sm" onClick={loadNews} className="gap-1 text-emerald-500">
                  <RefreshCw className="w-4 h-4" /> بروزرسانی
                </Button>
              </div>

              {loadingNews ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : news.length === 0 ? (
                <Card className="p-8 text-center">
                  <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">خبری یافت نشد</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {news.map((item, idx) => (
                      <NewsCard key={idx} news={item} />
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
