import { useState } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const VoiceAssistantWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <Button
        onClick={() => navigate("/voice-assistant")}
        className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-glow transition-all hover:scale-105"
      >
        <Mic className="w-8 h-8 text-white" />
      </Button>
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">دستیار صوتی ایزی‌درس</p>
        <p className="text-xs text-muted-foreground">با من صحبت کن!</p>
      </div>
    </div>
  );
};
