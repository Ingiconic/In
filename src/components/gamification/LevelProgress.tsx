import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LevelProgressProps {
  currentLevel: number;
  currentXp: number;
  nextLevelXp: number;
  levelName: string;
  levelColor?: string;
}

export const LevelProgress = ({
  currentLevel,
  currentXp,
  nextLevelXp,
  levelName,
  levelColor = "#3b82f6",
}: LevelProgressProps) => {
  const progress = (currentXp / nextLevelXp) * 100;
  const xpNeeded = nextLevelXp - currentXp;

  return (
    <div className="relative">
      {/* Level Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="flex flex-col items-center mb-6"
      >
        <div
          className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5",
            "border-4 border-primary/30 shadow-lg shadow-primary/20"
          )}
          style={{
            borderColor: levelColor,
            boxShadow: `0 0 30px ${levelColor}40`,
          }}
        >
          {/* Rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${levelColor}00, ${levelColor}60, ${levelColor}00)`,
            }}
          />

          {/* Level number */}
          <div className="relative z-10 text-center">
            <div
              className="text-5xl font-bold mb-1"
              style={{ color: levelColor }}
            >
              {currentLevel}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              سطح
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold mt-4 text-center" style={{ color: levelColor }}>
          {levelName}
        </h3>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">پیشرفت تا سطح بعد</span>
          <span className="font-bold text-primary">
            {currentXp.toLocaleString("fa-IR")} / {nextLevelXp.toLocaleString("fa-IR")} XP
          </span>
        </div>

        <div className="relative">
          <Progress value={progress} className="h-4 bg-secondary/30" />
          
          {/* XP particles animation */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 w-2 h-2 rounded-full bg-primary/60"
              initial={{ x: `${i * 20}%`, y: "-50%", opacity: 0 }}
              animate={{
                x: `${(i * 20) + 100}%`,
                y: ["-50%", "-150%", "-50%"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {xpNeeded.toLocaleString("fa-IR")} XP تا سطح بعدی
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 rounded-lg bg-secondary/20 border border-border/30">
          <div className="text-2xl font-bold text-primary">
            {currentXp.toLocaleString("fa-IR")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            XP کل
          </div>
        </div>

        <div className="text-center p-4 rounded-lg bg-secondary/20 border border-border/30">
          <div className="text-2xl font-bold text-amber-500">
            {currentLevel}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            سطح
          </div>
        </div>

        <div className="text-center p-4 rounded-lg bg-secondary/20 border border-border/30">
          <div className="text-2xl font-bold text-green-500">
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            پیشرفت
          </div>
        </div>
      </div>
    </div>
  );
};
