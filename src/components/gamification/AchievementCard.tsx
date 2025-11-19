import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  rewardCoins?: number;
  rewardXp?: number;
  unlockedAt?: string;
}

const rarityColors = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-amber-600",
};

const rarityGlow = {
  common: "shadow-gray-500/50",
  rare: "shadow-blue-500/50",
  epic: "shadow-purple-500/50",
  legendary: "shadow-amber-500/50",
};

export const AchievementCard = ({
  name,
  description,
  icon,
  rarity,
  unlocked,
  rewardCoins,
  rewardXp,
  unlockedAt,
}: AchievementCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: unlocked ? 1.05 : 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative p-6 rounded-xl border-2 backdrop-blur-sm transition-all",
        unlocked
          ? "bg-gradient-to-br from-background/80 to-background/60 border-primary/30 cursor-pointer"
          : "bg-background/40 border-border/30 opacity-60 grayscale"
      )}
    >
      {/* Rarity glow effect */}
      {unlocked && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl opacity-20 blur-xl",
            `bg-gradient-to-br ${rarityColors[rarity]}`
          )}
        />
      )}

      <div className="relative z-10">
        {/* Icon and Rarity Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "text-6xl mb-2 transition-transform",
              unlocked ? "animate-bounce-slow" : ""
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              `bg-gradient-to-r ${rarityColors[rarity]} text-white`,
              unlocked && `shadow-lg ${rarityGlow[rarity]}`
            )}
          >
            {rarity === "common" && "عادی"}
            {rarity === "rare" && "نادر"}
            {rarity === "epic" && "حماسی"}
            {rarity === "legendary" && "افسانه‌ای"}
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-xl font-bold mb-2",
            unlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {/* Rewards */}
        {(rewardCoins || rewardXp) && (
          <div className="flex gap-3 text-sm">
            {rewardCoins > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <span>🪙</span>
                <span className="font-bold">+{rewardCoins}</span>
              </div>
            )}
            {rewardXp > 0 && (
              <div className="flex items-center gap-1 text-blue-500">
                <span>⚡</span>
                <span className="font-bold">+{rewardXp} XP</span>
              </div>
            )}
          </div>
        )}

        {/* Unlocked indicator */}
        {unlocked && unlockedAt && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              باز شد در:{" "}
              {new Date(unlockedAt).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl opacity-30">🔒</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
