import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Timer, ArrowLeft, Play, Pause, RotateCcw, 
  Coffee, BookOpen, Brain, Zap, Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const FocusMode = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"work" | "break">("work");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const durations = [
    { minutes: 15, label: "۱۵ دقیقه", icon: Zap },
    { minutes: 25, label: "۲۵ دقیقه", icon: BookOpen },
    { minutes: 45, label: "۴۵ دقیقه", icon: Brain },
    { minutes: 60, label: "۱ ساعت", icon: Timer },
  ];

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    setIsRunning(false);
    
    if (mode === "work") {
      setSessionsCompleted(prev => prev + 1);
      
      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("focus_sessions").insert({
            user_id: user.id,
            duration: selectedDuration,
            completed: true,
          });
        }
      } catch (error) {
        console.error("Error saving session:", error);
      }

      toast({
        title: "🎉 آفرین!",
        description: `یک جلسه ${selectedDuration} دقیقه‌ای تمام شد!`,
      });
      
      // Switch to break
      setMode("break");
      setTimeLeft(5 * 60);
    } else {
      // Switch back to work
      setMode("work");
      setTimeLeft(selectedDuration * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    setMode("work");
  };

  const selectDuration = (minutes: number) => {
    if (!isRunning) {
      setSelectedDuration(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "work" 
    ? ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      mode === "work" 
        ? "bg-gradient-to-br from-background via-background to-primary/10" 
        : "bg-gradient-to-br from-background via-background to-green-500/10"
    }`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              mode === "work" ? "bg-primary" : "bg-green-500"
            }`}>
              {mode === "work" ? (
                <Brain className="w-5 h-5 text-white" />
              ) : (
                <Coffee className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {mode === "work" ? "حالت تمرکز" : "استراحت"}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-muted/50"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Sessions Counter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-muted-foreground text-sm mb-1">جلسات امروز</p>
          <div className="flex items-center justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < sessionsCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Timer Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-64 h-64 mx-auto mb-8"
        >
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                mode === "work" ? "text-primary" : "text-green-500"
              }`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold mb-2">{formatTime(timeLeft)}</span>
            <span className="text-muted-foreground text-sm">
              {mode === "work" ? "تمرکز کن!" : "استراحت کن!"}
            </span>
          </div>
        </motion.div>

        {/* Duration Selector */}
        {!isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2 mb-8"
          >
            {durations.map((d) => (
              <button
                key={d.minutes}
                onClick={() => selectDuration(d.minutes)}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  selectedDuration === d.minutes
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:border-primary/50"
                }`}
              >
                <d.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{d.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-14 h-14 rounded-full"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full text-white ${
              mode === "work" 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 mr-[-2px]" />
            )}
          </Button>
          
          <div className="w-14 h-14" />
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-4 rounded-2xl bg-muted/30 border border-border/50"
        >
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            نکته
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === "work" 
              ? "موبایلت رو کنار بذار و فقط روی درس تمرکز کن. هر ۲۵ دقیقه یه استراحت کوتاه داری!"
              : "از جات بلند شو، آب بخور و یه کم قدم بزن. استراحت به مغزت کمک می‌کنه بهتر یاد بگیری!"}
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default FocusMode;
