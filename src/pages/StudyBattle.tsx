import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, Trophy, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";

export default function StudyBattle() {
  const [battles, setBattles] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("study_battles")
        .select("*")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      setBattles(data || []);
    } catch (error) {
      console.error("Error loading battles:", error);
    }
  };

  const createBattle = async () => {
    if (!username.trim() || !subject.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً همه فیلدها را پر کنید!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find opponent by username
      const { data: opponent } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (!opponent) {
        toast({
          title: "خطا",
          description: "کاربر یافت نشد!",
          variant: "destructive",
        });
        return;
      }

      // Generate questions
      const { data: questions, error: aiError } = await supabase.functions.invoke("ai-battle-questions", {
        body: { subject, count: 5 },
      });

      if (aiError) throw aiError;

      // Create battle
      await supabase.from("study_battles").insert({
        player1_id: user.id,
        player2_id: opponent.id,
        subject,
        questions: questions.questions,
        status: "active",
      });

      toast({
        title: "نبرد ساخته شد! ⚔️",
        description: `دعوت به نبرد برای ${username} ارسال شد!`,
      });

      setUsername("");
      setSubject("");
      loadBattles();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          نبرد مطالعه ⚔️
        </h1>

        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Swords className="w-6 h-6 text-red-500" />
            ساخت نبرد جدید
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام کاربری حریف</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">موضوع</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ریاضی، فیزیک، ..."
                disabled={loading}
              />
            </div>

            <Button
              onClick={createBattle}
              disabled={loading}
              className="w-full"
            >
              {loading ? "در حال ساخت..." : "شروع نبرد! 🔥"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            نبردهای من
          </h2>

          {battles.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>هنوز نبردی نداری! یک نبرد جدید بساز و به رقابت بپرداز!</p>
            </Card>
          ) : (
            battles.map((battle) => (
              <Card key={battle.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Swords className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-bold">{battle.subject}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(battle.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {battle.player1_score} - {battle.player2_score}
                    </div>
                    <div className="text-xs text-muted-foreground">امتیاز</div>
                  </div>
                </div>

                {battle.status === "active" && (
                  <Button className="w-full" variant="outline">
                    ادامه نبرد
                  </Button>
                )}

                {battle.status === "completed" && battle.winner_id && (
                  <div className="text-center text-sm">
                    {battle.winner_id === (supabase.auth.getUser() as any).data?.user?.id 
                      ? "🏆 برنده شدی!" 
                      : "😔 باختی!"}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}