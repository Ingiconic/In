import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementUnlockToastProps {
  achievement: {
    name: string;
    icon: string;
    rarity: string;
    rewardCoins?: number;
    rewardXp?: number;
  };
  onClose: () => void;
  show: boolean;
}

const rarityColors = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-amber-600",
};

export const AchievementUnlockToast = ({
  achievement,
  onClose,
  show,
}: AchievementUnlockToastProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="relative bg-gradient-to-br from-background to-background/80 backdrop-blur-lg border-2 border-primary/50 rounded-xl shadow-2xl shadow-primary/20 p-6 overflow-hidden">
            {/* Background glow */}
            <div
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${
                rarityColors[achievement.rarity as keyof typeof rarityColors]
              }`}
            />

            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    left: `${Math.random() * 100}%`,
                    top: "-10px",
                  }}
                  animate={{
                    y: [0, 400],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, 360],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    delay: Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-0 left-0"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
              <div className="text-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-6xl mb-2"
                >
                  {achievement.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-primary mb-1">
                  جایزه جدید! 🎉
                </h3>
                <p className="text-lg font-semibold">{achievement.name}</p>
              </div>

              {/* Rewards */}
              <div className="flex justify-center gap-4 mt-4">
                {achievement.rewardCoins && achievement.rewardCoins > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/30"
                  >
                    <span className="text-2xl">🪙</span>
                    <span className="font-bold text-amber-500">
                      +{achievement.rewardCoins}
                    </span>
                  </motion.div>
                )}
                {achievement.rewardXp && achievement.rewardXp > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30"
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="font-bold text-blue-500">
                      +{achievement.rewardXp} XP
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
