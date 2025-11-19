import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Flame, Award } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

export const GamificationWidget = () => {
  const navigate = useNavigate();
  const { userStats, currentLevel, nextLevel, achievements, loading } = useGamification();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!userStats || !currentLevel || !nextLevel) return null;

  const progress = (userStats.xp / nextLevel.xp_required) * 100;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            پیشرفت شما
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/progress")}
            className="text-primary hover:text-primary/80"
          >
            مشاهده همه
          </Button>
        </div>

        {/* Level Badge */}
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30"
            style={{ borderColor: currentLevel.color }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: currentLevel.color }}>
                {userStats.level}
              </div>
              <div className="text-xs text-muted-foreground">سطح</div>
            </div>
          </motion.div>

          <div className="flex-1">
            <h4 className="font-bold text-lg mb-1" style={{ color: currentLevel.color }}>
              {currentLevel.name_fa}
            </h4>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{userStats.xp.toLocaleString("fa-IR")} XP</span>
                <span>{nextLevel.xp_required.toLocaleString("fa-IR")} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">{unlockedCount}</div>
            <div className="text-xs text-muted-foreground">جایزه</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Star className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{userStats.xp.toLocaleString("fa-IR")}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold">{userStats.streak_days}</div>
            <div className="text-xs text-muted-foreground">روز</div>
          </div>
        </div>

        {/* Recent Achievement Preview */}
        {unlockedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">آخرین جایزه شما</p>
                <p className="text-xs text-muted-foreground">
                  {achievements.find((a) => a.unlocked)?.name_fa}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
