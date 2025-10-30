import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Send, Brain, Loader2, MessageCircle } from "lucide-react";

const Questions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast({
        title: "خطا",
        description: "لطفا سوال خود را بنویسید",
        variant: "destructive",
      });
      return;
    }

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-answer", {
        body: { question },
      });

      if (error) throw error;

      const aiMessage = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, aiMessage]);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
            <ArrowRight className="ml-2 w-4 h-4" />
            بازگشت
          </Button>
          <h1 className="text-xl font-bold text-gradient">حل سوالات</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col">
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <Card className="p-12 text-center shadow-glow border-primary/20 animate-fade-in">
              <div className="gradient-primary p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-neon animate-pulse-glow">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gradient">سوال خود را بپرسید</h2>
              <p className="text-muted-foreground">
                هوش مصنوعی ما آماده پاسخگویی به سوالات درسی شماست
              </p>
            </Card>
          ) : (
            messages.map((msg, idx) => (
              <Card
                key={idx}
                className={`p-4 animate-fade-in ${
                  msg.role === "user"
                    ? "bg-primary/10 border-primary/30 mr-12"
                    : "bg-secondary/10 border-secondary/30 ml-12"
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  {msg.role === "assistant" && (
                    <div className="gradient-secondary p-2 rounded-lg shadow-neon">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className="flex-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "user" && (
                    <div className="gradient-primary p-2 rounded-lg shadow-neon">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
          {loading && (
            <Card className="p-4 bg-secondary/10 border-secondary/30 ml-12 animate-fade-in">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                <p className="text-muted-foreground">در حال فکر کردن...</p>
              </div>
            </Card>
          )}
        </div>

        <Card className="p-4 shadow-glow border-primary/20">
          <div className="flex gap-3">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleAsk()}
              placeholder="سوال خود را بنویسید..."
              className="flex-1 bg-input border-border/50"
              disabled={loading}
            />
            <Button onClick={handleAsk} disabled={loading} size="lg" className="shadow-glow">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Questions;