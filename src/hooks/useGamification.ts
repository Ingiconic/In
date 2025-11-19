import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Achievement {
  id: string;
  name: string;
  name_fa: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  reward_coins: number;
  reward_xp: number;
  unlocked: boolean;
  unlocked_at?: string;
}

interface Level {
  level: number;
  name: string;
  name_fa: string;
  xp_required: number;
  reward_coins: number;
  color: string;
}

interface UserStats {
  level: number;
  xp: number;
  streak_days: number;
  achievements_count: number;
}

export const useGamification = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [nextLevel, setNextLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("level, xp, streak_days")
        .eq("id", user.id)
        .single();

      // Load user achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      const unlockedIds = new Set(
        userAchievements?.map((a) => a.achievement_id) || []
      );

      // Load all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      const achievementsWithStatus = allAchievements?.map((achievement) => {
        const userAch = userAchievements?.find(
          (ua) => ua.achievement_id === achievement.id
        );
        return {
          ...achievement,
          unlocked: unlockedIds.has(achievement.id),
          unlocked_at: userAch?.unlocked_at,
        };
      }) || [];

      setAchievements(achievementsWithStatus);

      // Load levels
      const { data: levelsData } = await supabase
        .from("levels")
        .select("*")
        .order("level", { ascending: true });

      setLevels(levelsData || []);

      // Set current and next level
      const current = levelsData?.find((l) => l.level === profile?.level);
      const next = levelsData?.find((l) => l.level === (profile?.level || 1) + 1);
      
      setCurrentLevel(current || null);
      setNextLevel(next || null);

      // Set user stats
      if (profile) {
        setUserStats({
          level: profile.level || 1,
          xp: profile.xp || 0,
          streak_days: profile.streak_days || 0,
          achievements_count: unlockedIds.size,
        });
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc("check_achievements", {
        _user_id: user.id,
      }) as { data: any; error: any };

      if (error) throw error;

      if (data && typeof data === 'object' && 'new_achievements' in data && 
          Array.isArray(data.new_achievements) && data.new_achievements.length > 0) {
        // Reload achievements
        await loadGamificationData();
        return data.new_achievements;
      }

      return [];
    } catch (error) {
      console.error("Error checking achievements:", error);
      return [];
    }
  };

  useEffect(() => {
    loadGamificationData();
  }, []);

  return {
    achievements,
    levels,
    userStats,
    currentLevel,
    nextLevel,
    loading,
    checkForNewAchievements,
    reload: loadGamificationData,
  };
};
