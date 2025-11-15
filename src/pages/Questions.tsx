import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Send, Brain, Loader2, Image, Coins, ShoppingCart } from "lucide-react";
import ResourceSelector from "@/components/ResourceSelector";
import { logger } from "@/lib/logger";
import AppLayout from "@/components/layout/AppLayout";
import MathText from "@/components/MathText";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useCoinError } from "@/hooks/useCoinError";
import { getUserCoins } from "@/lib/coinHelpers";
import { useNavigate } from "react-router-dom";

const Questions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { handleCoinError } = useCoinError();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(0);

  useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const coins = await getUserCoins();
    setUserCoins(coins);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() && !imageFile && !selectedResource) {
      toast({
        title: "خطا",
        description: "لطفا سوال خود را بنویسید، تصویر آپلود کنید یا منبعی انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    if (userCoins < COIN_COSTS.QUESTION_ANSWER) {
      toast({
        title: "سکه کافی نیست",
        description: `برای این عملیات به ${COIN_COSTS.QUESTION_ANSWER} سکه نیاز دارید.`,
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/coin-shop")}
            className="gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            خرید سکه
          </Button>
        ),
      });
      return;
    }

    let finalQuestion = question;
    if (selectedResource) {
      finalQuestion = `بر اساس منبع "${selectedResource.title}"، ${question}`;
    }

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      if (imageFile) {
        const { data, error } = await supabase.functions.invoke('ai-image-analysis', {
          body: { image: imagePreview, prompt: finalQuestion || 'لطفا این تصویر را تحلیل کن.' }
        });
        if (error) throw error;
        const aiMessage = { role: "assistant", content: data.result };
        setMessages((prev) => [...prev, aiMessage]);
        setImageFile(null);
        setImagePreview("");
      } else {
        const { data, error } = await supabase.functions.invoke("ai-answer", {
          body: { question: finalQuestion },
        });
        if (error) throw error;
        const aiMessage = { role: "assistant", content: data.answer };
        setMessages((prev) => [...prev, aiMessage]);
      }
      // Refresh coins after successful operation
      await loadUserCoins();
    } catch (error: any) {
      if (!handleCoinError(error, COIN_COSTS.QUESTION_ANSWER)) {
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

  const hasInsufficientCoins = userCoins < COIN_COSTS.QUESTION_ANSWER;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  پرسش درسی با AI
                  <span className="text-sm font-normal text-primary flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {COIN_COSTS.QUESTION_ANSWER} سکه
                  </span>
                </h1>
              </div>
              <Badge variant={hasInsufficientCoins ? "destructive" : "secondary"} className="gap-1">
                <Coins className="w-4 h-4" />
                {userCoins} سکه
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              سوال بپرسید، تصویر آپلود کنید یا از منابع استفاده کنید
            </p>
            {hasInsufficientCoins && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription className="flex items-center justify-between">
                  <span>سکه کافی نیست! برای استفاده از این ابزار به {COIN_COSTS.QUESTION_ANSWER} سکه نیاز دارید.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/coin-shop")}
                    className="gap-2 mr-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    خرید سکه
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {selectedResource && (
              <Card className="mt-3 p-2 bg-primary/5 border-primary/20">
                <p className="text-xs"><span className="font-bold">منبع:</span> {selectedResource.title}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, idx) => (
            <Card
              key={idx}
              className={`p-4 ${
                msg.role === "user"
                  ? "gradient-primary text-white mr-auto max-w-[80%]"
                  : "glassmorphism-card ml-auto max-w-[80%]"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MathText content={msg.content} className="text-sm" />
              )}
            </Card>
          ))}
          {loading && (
            <Card className="p-4 glassmorphism-card ml-auto max-w-[80%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <p className="text-sm">در حال پردازش...</p>
              </div>
            </Card>
          )}
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <Card className="p-4 mb-4 glassmorphism-card">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg mx-auto" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 left-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
              >
                حذف
              </Button>
            </div>
          </Card>
        )}

        {/* Input Area */}
        <Card className="p-4 glassmorphism-card border-primary/10">
          <div className="flex gap-2">
            <ResourceSelector
              onResourceSelect={setSelectedResource}
              selectedResource={selectedResource}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button variant="outline" size="icon" asChild>
                <span>
                  <Image className="w-5 h-5" />
                </span>
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleAsk()}
              placeholder="سوال خود را بنویسید..."
              className="flex-1"
              dir="rtl"
              disabled={loading}
            />
            <Button
              onClick={handleAsk}
              disabled={loading || (!question.trim() && !imageFile && !selectedResource) || hasInsufficientCoins}
              className="gradient-primary shadow-glow"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Questions;
