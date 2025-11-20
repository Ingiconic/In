import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Clock, Coffee, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const intervalRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(10);

      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (mode === "work") {
      // Save completed session
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("pomodoro_sessions").insert({
            user_id: user.id,
            duration: 25,
            subject,
            completed: true,
            break_duration: 5,
          });
          
          // Award coins
          await supabase.rpc("deduct_user_coins", {
            _amount: -10, // Award 10 coins
            _reason: "pomodoro_completed",
          });

          loadSessions();
        }
      } catch (error) {
        console.error("Error saving session:", error);
      }

      toast({
        title: "تمرکز تکمیل شد! 🎉",
        description: "10 سکه دریافت کردید! حالا استراحت کنید!",
      });
      
      setMode("break");
      setTimeLeft(5 * 60); // 5 minute break
    } else {
      toast({
        title: "استراحت تمام شد! ☕",
        description: "آماده برای یک دور دیگر؟",
      });
      
      setMode("work");
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = mode === "work" ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          تایمر پومودورو 🍅
        </h1>

        <Card className="p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-4">
              {mode === "work" ? (
                <>
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-bold">زمان تمرکز</span>
                </>
              ) : (
                <>
                  <Coffee className="w-5 h-5 text-green-500" />
                  <span className="font-bold">استراحت</span>
                </>
              )}
            </div>
            
            <div className="text-8xl font-bold mb-6 font-mono">
              {formatTime(timeLeft)}
            </div>

            <Progress value={progress} className="h-3 mb-6" />

            {mode === "work" && (
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="روی چه موضوعی کار می‌کنی؟"
                className="mb-6 text-center text-lg"
                disabled={isRunning}
              />
            )}

            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="w-32"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    توقف
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    شروع
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                ریست
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            جلسات اخیر
          </h2>
          
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              هنوز جلسه‌ای تکمیل نشده! شروع کنید!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-bold">{session.subject || "بدون عنوان"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.started_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{session.duration} دقیقه</p>
                    {session.completed && (
                      <p className="text-sm text-green-500">✓ تکمیل شده</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <p className="text-sm text-center">
            <strong>تکنیک پومودورو:</strong> 25 دقیقه تمرکز + 5 دقیقه استراحت. برای هر جلسه تکمیل شده 10 سکه دریافت می‌کنید!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}