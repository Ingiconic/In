import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Clock, Coffee, TrendingUp, Target, Volume2, VolumeX, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function PomodoroTimer() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const intervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const lofiTracks = [
    "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    "https://cdn.pixabay.com/audio/2022/03/10/audio_4deabfa9b8.mp3",
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

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

  const startSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (mode === "work") {
        const { data, error } = await supabase
          .from("pomodoro_sessions")
          .insert({
            user_id: user.id,
            duration: duration,
            subject: subject || null,
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(data.id);
      }

      setIsActive(true);
      setIsPaused(false);
      setTimeLeft(duration * 60);

      toast({
        title: mode === "work" ? "جلسه تمرکز شروع شد! 🎯" : "استراحت شروع شد ☕",
        description: `${duration} دقیقه ${mode === "work" ? "تمرکز کامل" : "استراحت"}`,
      });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const handleTimerComplete = async () => {
    try {
      if (mode === "work" && sessionId) {
        await supabase
          .from("pomodoro_sessions")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("id", sessionId);

        const { data: { user } } = await supabase.auth.getUser();
        
        // Award coins and XP per minute
        const xpPerMinute = 5;
        const coinsPerSession = 10;
        
        await supabase.rpc("deduct_user_coins", {
          _amount: -coinsPerSession,
          _reason: "pomodoro_completed",
        });

        await supabase.rpc("award_xp", {
          _user_id: user?.id,
          _xp_amount: duration * xpPerMinute,
          _reason: "focus_session",
        });

        loadSessions();

        toast({
          title: "عالی! جلسه تمرکز تمام شد 🎉",
          description: `10 سکه و ${duration * 2} XP دریافت کردید`,
        });

        setMode("break");
        setTimeLeft(5 * 60);
      } else {
        toast({
          title: "استراحت تمام شد! ☕",
          description: "آماده برای یک دور دیگر؟",
        });
        setMode("work");
        setTimeLeft(duration * 60);
      }

      setIsActive(false);
      setIsPaused(false);
      setSessionId(null);
      if (musicPlaying) toggleMusic();
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
    if (musicPlaying) toggleMusic();
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setMusicPlaying(!musicPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto p-4 md:p-6">
        <audio ref={audioRef} src={lofiTracks[0]} loop />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
            تایمر پومودورو 🍅
          </h1>
          <p className="text-muted-foreground">
            با تکنیک پومودورو تمرکز خود را افزایش دهید
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timer Display */}
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.05, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-8"
                >
                  {/* Mode Badge */}
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

                  {/* Circular Progress */}
                  <div className="relative w-64 h-64 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-secondary/30"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 120}`}
                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                        className="text-primary transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
                        {subject && mode === "work" && (
                          <p className="text-sm text-muted-foreground mt-2">{subject}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    {!isActive ? (
                      <Button
                        onClick={startSession}
                        size="lg"
                        className="gap-2 px-8"
                        disabled={!duration}
                      >
                        <Play className="w-5 h-5" />
                        شروع
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={togglePause}
                          size="lg"
                          variant="outline"
                          className="gap-2"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5" />
                              ادامه
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5" />
                              توقف
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={resetTimer}
                          size="lg"
                          variant="destructive"
                          className="gap-2"
                        >
                          <RotateCcw className="w-5 h-5" />
                          ریست
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={toggleMusic}
                      size="lg"
                      variant="outline"
                      className="gap-2"
                    >
                      {musicPlaying ? (
                        <>
                          <Volume2 className="w-5 h-5" />
                          موزیک فعال
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-5 h-5" />
                          موزیک
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Volume Control */}
                  {musicPlaying && (
                    <div className="flex items-center gap-3 px-8">
                      <Music className="w-5 h-5" />
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-center">{volume[0]}%</span>
                    </div>
                  )}

                  <Progress value={progress} className="h-2" />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    مدت زمان (دقیقه)
                  </Label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => {
                      const newDuration = parseInt(value);
                      setDuration(newDuration);
                      if (!isActive) {
                        setTimeLeft(newDuration * 60);
                      }
                    }}
                    disabled={isActive}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 دقیقه</SelectItem>
                      <SelectItem value="25">25 دقیقه (پومودورو)</SelectItem>
                      <SelectItem value="30">30 دقیقه</SelectItem>
                      <SelectItem value="45">45 دقیقه</SelectItem>
                      <SelectItem value="60">60 دقیقه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === "work" && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4" />
                      موضوع مطالعه (اختیاری)
                    </Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: فیزیک - فصل 2"
                      disabled={isActive}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">💡 تکنیک پومودورو</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 25 دقیقه تمرکز کامل</li>
                  <li>• 5 دقیقه استراحت کوتاه</li>
                  <li>• بعد از 4 پومودورو، 15-30 دقیقه استراحت</li>
                  <li>• موزیک لوفای آرامش‌بخش</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">🎁 پاداش</h3>
                <p className="text-muted-foreground text-sm">
                  برای هر جلسه تمرکز تکمیل شده: <span className="font-bold text-primary">10 سکه</span> + <span className="font-bold text-primary">{duration * 5} XP</span> (5 XP به ازای هر دقیقه)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sessions */}
        <Card className="mt-6">
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}