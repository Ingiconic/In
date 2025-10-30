import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, FileText, Loader2 } from "lucide-react";

const Summarize = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast({
        title: "خطا",
        description: "لطفا متنی وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-summarize", {
        body: { content, type: "summarize" },
      });

      if (error) throw error;

      setResult(data.result);
      toast({
        title: "موفق!",
        description: "متن با موفقیت خلاصه شد",
      });
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
            <ArrowRight className="ml-2 w-4 h-4" />
            بازگشت
          </Button>
          <h1 className="text-xl font-bold text-gradient">خلاصه‌سازی هوشمند</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6 shadow-glow border-primary/20 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="gradient-primary p-2 rounded-lg shadow-neon">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">متن خود را وارد کنید</h2>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="جزوات، مطالب درسی یا متن خود را اینجا بنویسید..."
              className="min-h-[300px] resize-none mb-4 bg-input border-border/50 focus:border-primary/50"
            />

            <Button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full shadow-glow"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 w-4 h-4" />
                  خلاصه کن
                </>
              )}
            </Button>
          </Card>

          {/* Result Section */}
          <Card className="p-6 shadow-glow border-secondary/20 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="gradient-secondary p-2 rounded-lg shadow-neon">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">نتیجه</h2>
            </div>

            <div className="min-h-[300px] p-4 bg-muted/30 rounded-lg border border-border/50">
              {result ? (
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{result}</p>
              ) : (
                <p className="text-muted-foreground text-center mt-32">
                  نتیجه اینجا نمایش داده می‌شود...
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Summarize;