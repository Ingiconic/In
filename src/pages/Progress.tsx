import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Trophy, Target, BookOpen, Award, TrendingUp, Star, Zap, Flame, Brain } from "lucide-react";
import { logger } from "@/lib/logger";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { AchievementUnlockToast } from "@/components/gamification/AchievementUnlockToast";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

const Progress = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [achievementsChecked, setAchievementsChecked] = useState(false);
  
  const {
    achievements,
    userStats,
    currentLevel,
    nextLevel,
    loading: gamificationLoading,
    checkForNewAchievements,
  } = useGamification();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!achievementsChecked && !gamificationLoading && profile) {
      checkForNewAchievements().catch((error) =>
        logger.error("Failed to check achievements", error)
      );
      setAchievementsChecked(true);
    }
  }, [achievementsChecked, gamificationLoading, profile, checkForNewAchievements]);
 
  const handleShowAchievement = (achievement: any) => {
    setNewAchievement(achievement);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      logger.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || gamificationLoading) {
    return (
      <AppLayout>
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile || !userStats || !currentLevel || !nextLevel) {
    return null;
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Achievement unlock toast */}
        {newAchievement && (
          <AchievementUnlockToast
            achievement={newAchievement}
            show={showToast}
            onClose={() => setShowToast(false)}
          />
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            پیشرفت و دستاوردها
          </h1>
          <p className="text-muted-foreground">
            سفر یادگیری خود را دنبال کنید و جوایز کسب کنید
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سطح</p>
                  <p className="text-2xl font-bold">{userStats.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Star className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">XP</p>
                  <p className="text-2xl font-bold">{userStats.xp.toLocaleString("fa-IR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جوایز</p>
                  <p className="text-2xl font-bold">{userStats.achievements_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/20">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">روز متوالی</p>
                  <p className="text-2xl font-bold">{userStats.streak_days}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm border-primary/20">
          <CardContent className="p-8">
            <LevelProgress
              currentLevel={currentLevel.level}
              currentXp={userStats.xp}
              nextLevelXp={nextLevel.xp_required}
              levelName={currentLevel.name_fa}
              levelColor={currentLevel.color || "#3b82f6"}
            />
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              همه ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="unlocked">
              باز شده ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              قفل شده ({lockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              دسته‌بندی
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  name={achievement.name_fa}
                  description={achievement.description}
                  icon={achievement.icon}
                  rarity={achievement.rarity as any}
                  unlocked={achievement.unlocked}
                  rewardCoins={achievement.reward_coins}
                  rewardXp={achievement.reward_xp}
                  unlockedAt={achievement.unlocked_at}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unlocked" className="space-y-6">
            {unlockedAchievements.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    هنوز هیچ جایزه‌ای باز نکرده‌اید. شروع کنید!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    name={achievement.name_fa}
                    description={achievement.description}
                    icon={achievement.icon}
                    rarity={achievement.rarity as any}
                    unlocked={achievement.unlocked}
                    rewardCoins={achievement.reward_coins}
                    rewardXp={achievement.reward_xp}
                    unlockedAt={achievement.unlocked_at}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  name={achievement.name_fa}
                  description={achievement.description}
                  icon={achievement.icon}
                  rarity={achievement.rarity as any}
                  unlocked={achievement.unlocked}
                  rewardCoins={achievement.reward_coins}
                  rewardXp={achievement.reward_xp}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {["study", "progress", "social"].map((category) => {
              const categoryAchievements = achievements.filter(
                (a) => a.category === category
              );
              const categoryName = {
                study: "مطالعه و آزمون",
                progress: "پیشرفت",
                social: "اجتماعی",
              }[category];

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-bold">{categoryName}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        name={achievement.name_fa}
                        description={achievement.description}
                        icon={achievement.icon}
                        rarity={achievement.rarity as any}
                        unlocked={achievement.unlocked}
                        rewardCoins={achievement.reward_coins}
                        rewardXp={achievement.reward_xp}
                        unlockedAt={achievement.unlocked_at}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="p-8 text-center space-y-4">
            <Brain className="w-16 h-16 mx-auto text-primary" />
            <h3 className="text-2xl font-bold">آماده برای کسب امتیاز بیشتر؟</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              با انجام آزمون‌ها، پرسیدن سوالات و استفاده از ابزارهای یادگیری، XP و جوایز بیشتری کسب کنید!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate("/exam")} size="lg" className="gap-2">
                <Target className="w-4 h-4" />
                شروع آزمون
              </Button>
              <Button onClick={() => navigate("/questions")} variant="outline" size="lg" className="gap-2">
                <BookOpen className="w-4 h-4" />
                پرسش سوال
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Progress;
