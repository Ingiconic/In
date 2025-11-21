import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  level: number;
  xp: number;
  points: number;
  streak_days: number;
  exams_taken: number;
  achievements_count: number;
  rank: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load leaderboard - فقط 10 نفر اول
      const { data: leaderboardData } = await supabase
        .from("leaderboard")
        .select("*")
        .limit(10);

      setLeaders(leaderboardData || []);

      // Find current user's position
      if (user && leaderboardData) {
        const userEntry = leaderboardData.find((entry) => entry.id === user.id);
        setCurrentUser(userEntry || null);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-amber-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30";
      default:
        return "bg-secondary/30 border-border/30";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            جدول امتیازات 🏆
          </h1>
          <p className="text-muted-foreground">
            بهترین دانش‌آموزان را ببینید و با آن‌ها رقابت کنید
          </p>
        </div>

        {/* Current User Card */}
        {currentUser && (
          <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary">
                    رتبه #{currentUser.rank}
                  </div>
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback>{currentUser.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{currentUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">سطح {currentUser.level}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-primary">
                    {currentUser.xp.toLocaleString("fa-IR")} XP
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.achievements_count} جایزه
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="xp" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="xp">بر اساس XP</TabsTrigger>
            <TabsTrigger value="points">بر اساس امتیاز</TabsTrigger>
            <TabsTrigger value="streak">بر اساس Streak</TabsTrigger>
          </TabsList>

          <TabsContent value="xp" className="space-y-3">
            {leaders.map((leader) => (
              <Card
                key={leader.id}
                className={`${getRankBg(leader.rank)} border transition-all hover:scale-[1.02]`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 flex justify-center">
                        {getRankIcon(leader.rank)}
                      </div>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={leader.avatar_url} />
                        <AvatarFallback>{leader.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{leader.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{leader.username} • سطح {leader.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-lg">
                          {leader.xp.toLocaleString("fa-IR")} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>🏆 {leader.achievements_count}</span>
                        <span>📝 {leader.exams_taken}</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {leader.streak_days}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="points" className="space-y-3">
            {[...leaders]
              .sort((a, b) => b.points - a.points)
              .map((leader, index) => (
                <Card
                  key={leader.id}
                  className={`${getRankBg(index + 1)} border transition-all hover:scale-[1.02]`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 flex justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={leader.avatar_url} />
                          <AvatarFallback>{leader.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{leader.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{leader.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg text-primary">
                          {leader.points.toLocaleString("fa-IR")} امتیاز
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="streak" className="space-y-3">
            {[...leaders]
              .sort((a, b) => b.streak_days - a.streak_days)
              .map((leader, index) => (
                <Card
                  key={leader.id}
                  className={`${getRankBg(index + 1)} border transition-all hover:scale-[1.02]`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 flex justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={leader.avatar_url} />
                          <AvatarFallback>{leader.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{leader.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{leader.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Flame className="w-6 h-6 text-orange-500" />
                          <span className="font-bold text-lg text-orange-500">
                            {leader.streak_days} روز
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
