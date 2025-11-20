import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Coins, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DailyQuests() {
  const queryClient = useQueryClient();

  const { data: quests } = useQuery({
    queryKey: ["daily-quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-quests-progress"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("user_daily_quests")
        .select("*")
        .eq("quest_date", today);
      if (error) throw error;
      return data;
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (questId: string) => {
      const quest = quests?.find((q) => q.id === questId);
      if (!quest) throw new Error("Quest not found");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update quest as claimed
      const { error: updateError } = await supabase
        .from("user_daily_quests")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("quest_id", questId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Award coins and XP
      const { data: profile } = await supabase.from("profiles").select("coins, xp").eq("id", user.id).single();
      const { error: coinsError } = await supabase
        .from("profiles")
        .update({
          coins: (profile?.coins || 0) + (quest.reward_coins || 0),
          xp: (profile?.xp || 0) + (quest.reward_xp || 0),
        })
        .eq("id", user.id);

      if (coinsError) throw coinsError;

      return { coins: quest.reward_coins, xp: quest.reward_xp };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-quests-progress"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`جایزه دریافت شد! +${data.coins} سکه و +${data.xp} XP`);
    },
  });

  const getQuestProgress = (questId: string) => {
    return userProgress?.find((p) => p.quest_id === questId);
  };

  const difficultyColors: Record<string, string> = {
    easy: "from-green-500 to-emerald-500",
    medium: "from-yellow-500 to-orange-500",
    hard: "from-red-500 to-pink-500",
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
            ماموریت‌های روزانه
          </h1>
          <p className="text-muted-foreground mt-2">
            ماموریت‌ها را تکمیل کن و جوایز دریافت کن!
          </p>
        </div>

        <div className="grid gap-4">
          {quests?.map((quest) => {
            const progress = getQuestProgress(quest.id);
            const isCompleted = progress?.completed || false;
            const currentProgress = progress?.progress || 0;
            const percentage = Math.min((currentProgress / (quest.requirement_value || 1)) * 100, 100);
            const canClaim = percentage >= 100 && !isCompleted;

            return (
              <Card key={quest.id} className={isCompleted ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{quest.icon}</span>
                        <CardTitle className="text-lg">{quest.title_fa}</CardTitle>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <CardDescription>{quest.description}</CardDescription>
                    </div>
                    <Badge
                      className={`bg-gradient-to-r ${difficultyColors[quest.difficulty || "easy"]} text-white`}
                    >
                      {quest.difficulty === "easy" ? "آسان" : quest.difficulty === "medium" ? "متوسط" : "سخت"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>پیشرفت: {currentProgress}/{quest.requirement_value}</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>{quest.reward_xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>{quest.reward_coins} سکه</span>
                      </div>
                    </div>

                    {canClaim && (
                      <Button
                        onClick={() => claimRewardMutation.mutate(quest.id)}
                        disabled={claimRewardMutation.isPending}
                        className="gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        دریافت جایزه
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
