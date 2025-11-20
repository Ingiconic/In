import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";

export default function StudyStreak() {
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("study_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!data) {
        // Create initial streak
        const { data: newStreak } = await supabase
          .from("study_streaks")
          .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
          .select()
          .single();
        setStreak(newStreak);
      } else {
        setStreak(data);
      }
    } catch (error) {
      console.error("Error loading streak:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const lastStudyDate = streak?.last_study_date;
      
      if (lastStudyDate === today) {
        toast({
          title: "قبلاً امروز درس خوانده‌اید!",
          description: "استریک شما قبلاً برای امروز به‌روز شده است.",
        });
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastStudyDate === yesterdayStr) {
        newStreak = (streak?.current_streak || 0) + 1;
      }

      const longestStreak = Math.max(newStreak, streak?.longest_streak || 0);

      const { data, error } = await supabase
        .from("study_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_study_date: today,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setStreak(data);
      
      toast({
        title: `🔥 استریک ${newStreak} روزه!`,
        description: "عالیه! به همین روال ادامه بده!",
      });
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">در حال بارگذاری...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          استریک مطالعه 🔥
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 text-center">
            <Flame className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {streak?.current_streak || 0}
            </div>
            <div className="text-muted-foreground">استریک فعلی (روز)</div>
          </Card>

          <Card className="p-6 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <div className="text-5xl font-bold text-yellow-600 mb-2">
              {streak?.longest_streak || 0}
            </div>
            <div className="text-muted-foreground">بهترین استریک (روز)</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">آخرین مطالعه</h2>
          </div>
          <p className="text-2xl">
            {streak?.last_study_date 
              ? new Date(streak.last_study_date).toLocaleDateString('fa-IR')
              : "هنوز مطالعه نکرده‌اید"}
          </p>
        </Card>

        <button
          onClick={updateStreak}
          className="w-full gradient-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-6 h-6" />
          ثبت مطالعه امروز
        </button>

        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <p className="text-sm text-center">
            💡 <strong>نکته:</strong> هر روز که درس بخوانید، استریکتان افزایش می‌یابد. اگر یک روز را از دست بدهید، از صفر شروع می‌شود!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}