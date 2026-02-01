import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Quote, ArrowLeft, Heart, Share2, RefreshCw, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const quotes = [
  { text: "موفقیت نتیجه تلاش روزانه است، نه شانس یک‌باره", author: "ناشناس" },
  { text: "هر روز یک قدم کوچک، بهتر از هیچ قدمی نیست", author: "ناشناس" },
  { text: "یادگیری هرگز ذهن را خسته نمی‌کند", author: "لئوناردو داوینچی" },
  { text: "آینده متعلق به کسانی است که امروز برایش آماده می‌شوند", author: "مالکوم ایکس" },
  { text: "تنها محدودیت‌های ما همان‌هایی هستند که خودمان می‌سازیم", author: "ناپلئون هیل" },
  { text: "علم بال پرواز است، بی‌علمی چاه سقوط", author: "حضرت علی (ع)" },
  { text: "هر کسی می‌تواند تاریخ‌سازی کند، اما فقط انسان‌های بزرگ می‌توانند آن را بنویسند", author: "اسکار وایلد" },
  { text: "امروز سخت تلاش کن تا فردا راحت زندگی کنی", author: "ناشناس" },
  { text: "شکست آغاز موفقیت است", author: "ناشناس" },
  { text: "کسی که از شکست نمی‌ترسد، شکست نخواهد خورد", author: "نلسون ماندلا" },
];

const DailyQuote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Get random quote on load
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  }, []);

  const getNewQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
    setLiked(false);
  };

  const shareQuote = async () => {
    const text = `"${currentQuote.text}" - ${currentQuote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "کپی شد!" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/20 to-background">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Quote className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">جمله روز</h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          key={currentQuote.text}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-8">
            <Quote className="w-12 h-12 mx-auto text-primary/50 mb-4" />
            <p className="text-2xl sm:text-3xl font-bold leading-relaxed mb-6">
              {currentQuote.text}
            </p>
            <p className="text-muted-foreground">— {currentQuote.author}</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLiked(!liked)}
              className={`rounded-full w-12 h-12 ${liked ? "text-red-500 border-red-500" : ""}`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </Button>
            
            <Button
              onClick={getNewQuote}
              className="rounded-full px-6 h-12 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              جمله جدید
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={shareQuote}
              className="rounded-full w-12 h-12"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
            <Sparkles className="w-3 h-3" />
            هر روز با یک جمله انگیزشی شروع کن!
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default DailyQuote;
