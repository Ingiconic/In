import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Trophy, Users, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const subjects = [
  "ریاضی",
  "فیزیک",
  "شیمی",
  "زیست شناسی",
  "ادبیات فارسی",
  "عربی",
  "زبان انگلیسی",
  "تاریخ",
  "جغرافیا"
];

export default function StudyBattleQueue() {
  const [inQueue, setInQueue] = useState(false);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkQueue();
    
    // Subscribe to queue changes
    const channel = supabase
      .channel('battle-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_battle_queue',
        },
        () => {
          checkQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is in queue
      const { data: userQueue } = await supabase
        .from('study_battle_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .single();

      if (userQueue) {
        setInQueue(true);
        setSubject(userQueue.subject);
      }

      // Get total queue size
      const { count } = await supabase
        .from('study_battle_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');

      setQueueSize(count || 0);
    } catch (error) {
      console.error('Error checking queue:', error);
    }
  };

  const joinQueue = async () => {
    if (!subject) {
      toast({
        title: "خطا",
        description: "لطفاً موضوع را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Add to queue
      const { error: insertError } = await supabase
        .from('study_battle_queue')
        .insert({
          user_id: user.id,
          subject,
          status: 'waiting'
        });

      if (insertError) throw insertError;

      setInQueue(true);
      toast({
        title: "در صف!",
        description: "در حال جستجوی حریف...",
      });

      // Try to find a match
      tryMatch();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const tryMatch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find someone else waiting for the same subject
      const { data: opponent } = await supabase
        .from('study_battle_queue')
        .select('*')
        .eq('subject', subject)
        .eq('status', 'waiting')
        .neq('user_id', user.id)
        .limit(1)
        .single();

      if (opponent) {
        // Create battle
        const { data: questionsData } = await supabase.functions.invoke('ai-battle-questions', {
          body: { subject, count: 5 }
        });

        const { data: battle, error: battleError } = await supabase
          .from('study_battles')
          .insert({
            player1_id: user.id,
            player2_id: opponent.user_id,
            subject,
            questions: questionsData.questions,
            status: 'active'
          })
          .select()
          .single();

        if (battleError) throw battleError;

        // Remove both from queue
        await supabase
          .from('study_battle_queue')
          .delete()
          .in('id', [opponent.id]);

        await supabase
          .from('study_battle_queue')
          .delete()
          .eq('user_id', user.id);

        // Navigate to battle
        navigate(`/study-battle/${battle.id}`);
        
        toast({
          title: "نبرد شروع شد! ⚔️",
          description: "حریف پیدا شد!",
        });
      }
    } catch (error) {
      console.error('Error matching:', error);
    }
  };

  const leaveQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('study_battle_queue')
        .delete()
        .eq('user_id', user.id);

      setInQueue(false);
      toast({
        title: "خروج از صف",
        description: "از صف خارج شدید",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          نبرد مطالعه ⚔️
        </h1>

        <Card className="p-8">
          {!inQueue ? (
            <div className="space-y-6">
              <div className="text-center">
                <Swords className="w-20 h-20 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">آماده نبرد؟</h2>
                <p className="text-muted-foreground">
                  موضوع را انتخاب کن و منتظر حریف باش!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">موضوع نبرد</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب موضوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{queueSize} نفر در صف</span>
              </div>

              <Button
                onClick={joinQueue}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    در حال پیوستن...
                  </>
                ) : (
                  <>
                    <Swords className="w-5 h-5 ml-2" />
                    پیوستن به صف نبرد
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <Loader2 className="w-20 h-20 mx-auto animate-spin text-primary" />
              <div>
                <h2 className="text-2xl font-bold mb-2">در صف نبرد</h2>
                <p className="text-muted-foreground mb-1">
                  موضوع: <span className="font-bold">{subject}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  در حال جستجوی حریف...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{queueSize} نفر در صف</span>
              </div>

              <Button
                onClick={leaveQueue}
                variant="outline"
                className="w-full"
              >
                خروج از صف
              </Button>
            </div>
          )}
        </Card>

        <div className="mt-6">
          <Button
            onClick={() => navigate('/study-battle')}
            variant="outline"
            className="w-full"
          >
            مشاهده نبردهای من
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}