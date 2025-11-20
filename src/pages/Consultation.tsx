import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowRight, MessageSquare, Sparkles, Loader2, User, Coins } from "lucide-react";
import { logger } from "@/lib/logger";
import MathText from "@/components/MathText";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useCoinError } from "@/hooks/useCoinError";
import { getUserCoins } from "@/lib/coinHelpers";

const Consultation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleCoinError } = useCoinError();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [userCoins, setUserCoins] = useState<number>(0);

  useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const coins = await getUserCoins();
    setUserCoins(coins);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "خطا",
        description: "لطفا پیام خود را بنویسید",
        variant: "destructive",
      });
      return;
    }

    if (userCoins < COIN_COSTS.CONSULTATION) {
      toast({
        title: "سکه کافی نیست",
        description: `برای این عملیات به ${COIN_COSTS.CONSULTATION} سکه نیاز دارید.`,
        variant: "destructive",
      });
      return;
    }

    const userMsg = { role: "user", content: message };
    setConversation((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-consultation", {
        body: { message },
      });

      if (error) throw error;

      const aiMsg = { role: "assistant", content: data.advice };
      setConversation((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      if (!handleCoinError(error, COIN_COSTS.CONSULTATION)) {
        toast({
          title: "خطا",
          description: error.message || "مشکلی پیش آمد",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
            <ArrowRight className="ml-2 w-4 h-4" />
            بازگشت
          </Button>
          <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
            مشاوره تحصیلی
            <span className="text-sm font-normal text-primary flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {COIN_COSTS.CONSULTATION} سکه
            </span>
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col">
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {conversation.length === 0 ? (
            <Card className="p-12 text-center shadow-glow border-accent/20 animate-fade-in">
              <div className="gradient-accent p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-neon animate-pulse-glow">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gradient">مشاور شخصی شما</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                سوالات خود درباره برنامه‌ریزی، روش مطالعه، مدیریت زمان و پیشرفت تحصیلی بپرسید
              </p>
            </Card>
          ) : (
            conversation.map((msg, idx) => (
              <Card
                key={idx}
                className={`p-4 animate-fade-in ${
                  msg.role === "user"
                    ? "bg-primary/10 border-primary/30 mr-12"
                    : "bg-accent/10 border-accent/30 ml-12"
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  {msg.role === "assistant" && (
                    <div className="gradient-accent p-2 rounded-lg shadow-neon">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {msg.role === "user" ? (
                    <p className="flex-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MathText content={msg.content} className="flex-1 leading-relaxed" />
                  )}
                  {msg.role === "user" && (
                    <div className="gradient-primary p-2 rounded-lg shadow-neon">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
          {loading && (
            <Card className="p-4 bg-accent/10 border-accent/30 ml-12 animate-fade-in">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <p className="text-muted-foreground">در حال آماده‌سازی مشاوره...</p>
              </div>
            </Card>
          )}
        </div>

        <Card className="p-4 shadow-glow border-accent/20">
          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثلاً: چطور می‌تونم برای امتحانات بهتر برنامه‌ریزی کنم؟"
              className="min-h-[100px] resize-none bg-input border-border/50"
              dir="rtl"
            />
            <Button onClick={handleSend} disabled={loading} size="lg" className="w-full shadow-glow">
              {loading ? (
                <>
                  <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 w-4 h-4" />
                  ارسال
                </>
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Consultation;