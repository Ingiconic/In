import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const FocusMode = () => {
  const [duration, setDuration] = useState(25); // minutes
  const [subject, setSubject] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const lofiTracks = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  const startSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: user.id,
          duration: duration,
          subject: subject || null,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setIsActive(true);
      setIsPaused(false);
      setTimeLeft(duration * 60);

      toast({
        title: "جلسه تمرکز شروع شد! 🎯",
        description: `${duration} دقیقه تمرکز کامل`,
      });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const handleSessionComplete = async () => {
    try {
      if (sessionId) {
        await supabase
          .from("focus_sessions")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("id", sessionId);

        // Award XP for completing session
        await supabase.rpc("award_xp", {
          _user_id: (await supabase.auth.getUser()).data.user?.id,
          _xp_amount: duration * 2, // 2 XP per minute
          _reason: "focus_session",
        });

        toast({
          title: "عالی! جلسه تمرکز تمام شد 🎉",
          description: `${duration * 2} XP دریافت کردید`,
        });
      }

      setIsActive(false);
      setIsPaused(false);
      setSessionId(null);
      setTimeLeft(duration * 60);
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
            حالت تمرکز 🎯
          </h1>
          <p className="text-muted-foreground">
            با تایمر پومودورو تمرکز خود را افزایش دهید
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
                        {subject && (
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
                      setDuration(parseInt(value));
                      setTimeLeft(parseInt(value) * 60);
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
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">💡 تکنیک پومودورو</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 25 دقیقه تمرکز کامل</li>
                  <li>• 5 دقیقه استراحت کوتاه</li>
                  <li>• بعد از 4 پومودورو، 15-30 دقیقه استراحت</li>
                  <li>• در طول تمرکز، اعلان‌ها بلاک می‌شوند</li>
                  <li>• موزیک لوفای آرامش‌بخش</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">🎁 پاداش</h3>
                <p className="text-muted-foreground">
                  برای هر دقیقه تمرکز، <span className="font-bold text-primary">2 XP</span> دریافت
                  می‌کنید!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FocusMode;
