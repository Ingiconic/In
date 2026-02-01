import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shuffle, ArrowLeft, Check, X, Sparkles, Trophy,
  RotateCcw, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

const QuickQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const suggestedTopics = [
    "ریاضی پایه دهم",
    "فیزیک کنکور",
    "زبان انگلیسی",
    "شیمی آلی",
    "زیست شناسی",
    "ادبیات فارسی",
  ];

  const generateQuiz = async (selectedTopic: string) => {
    setLoading(true);
    setTopic(selectedTopic);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-answer", {
        body: {
          question: `5 سوال تستی چهار گزینه‌ای از موضوع "${selectedTopic}" بساز. فرمت JSON:
          [{"question": "سوال", "options": ["گزینه 1", "گزینه 2", "گزینه 3", "گزینه 4"], "correct": 0, "explanation": "توضیح"}]
          فقط JSON برگردان.`,
          subject: selectedTopic,
        },
      });

      if (error) throw error;

      // Parse the response
      const jsonMatch = data.answer.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQuestions(parsed);
        setCurrentIndex(0);
        setScore(0);
        setQuizComplete(false);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "خطا",
        description: "مشکلی در ساخت کوییز پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === questions[currentIndex].correct) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizComplete(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizComplete(false);
    setTopic("");
  };

  // Topic Selection
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Shuffle className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg">کوییز سریع</h1>
            </div>

            <div className="w-20" />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">موضوعت رو انتخاب کن!</h2>
            <p className="text-muted-foreground text-sm">
              ۵ سوال سریع برات می‌سازم 🚀
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {suggestedTopics.map((t, i) => (
              <motion.button
                key={t}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => generateQuiz(t)}
                disabled={loading}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-sm font-medium"
              >
                {t}
              </motion.button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground">در حال ساخت کوییز...</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Quiz Complete
  if (quizComplete) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl border border-border/50 p-8 text-center max-w-sm w-full"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            percentage >= 80 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
          }`}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {percentage >= 80 ? "عالی بود! 🎉" : percentage >= 50 ? "خوب بود! 👍" : "بیشتر تلاش کن! 💪"}
          </h2>
          
          <p className="text-4xl font-bold text-primary mb-2">
            {score} از {questions.length}
          </p>
          
          <p className="text-muted-foreground mb-6">
            {percentage}% جواب‌های درست
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetQuiz}
              className="flex-1"
            >
              موضوع جدید
            </Button>
            <Button
              onClick={() => generateQuiz(topic)}
              className="flex-1"
            >
              دوباره تلاش
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz Questions
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={resetQuiz} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1 text-primary font-bold">
            <Zap className="w-4 h-4" />
            {score}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            {/* Question */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const isCorrect = i === currentQuestion.correct;
                const isSelected = selectedAnswer === i;
                
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl text-right transition-all flex items-center justify-between ${
                      showResult
                        ? isCorrect
                          ? "bg-green-500 text-white border-green-500"
                          : isSelected
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-card border-border"
                        : "bg-card border border-border hover:border-primary/50"
                    }`}
                  >
                    <span>{option}</span>
                    {showResult && isCorrect && (
                      <Check className="w-5 h-5" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <X className="w-5 h-5" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <p className="text-sm">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuickQuiz;
