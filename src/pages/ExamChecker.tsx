import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileQuestion, ArrowLeft, Upload, Loader2, CheckCircle,
  XCircle, HelpCircle, Sparkles, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Question {
  number: number;
  text: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

const ExamChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Question[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeExam = async () => {
    if (!image) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-image-analysis", {
        body: {
          image,
          prompt: `این تصویر یک برگه امتحان است. سوالات و پاسخ‌های داده شده را تحلیل کن.
          برای هر سوال مشخص کن:
          1. شماره سوال
          2. متن سوال
          3. پاسخ کاربر
          4. پاسخ صحیح
          5. آیا درست است یا غلط
          6. توضیح کوتاه
          
          فرمت JSON برگردان:
          {"questions": [...], "totalScore": 85}`,
        },
      });

      if (error) throw error;

      // Parse response
      const jsonMatch = data.analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResults(parsed.questions || []);
        setScore(parsed.totalScore);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطا در تحلیل",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResults([]);
    setScore(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">تصحیح آزمون</h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {!image ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">عکس برگه آزمونت رو آپلود کن</h2>
              <p className="text-muted-foreground text-sm">
                هوش مصنوعی پاسخ‌هات رو بررسی می‌کنه
              </p>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-border rounded-2xl p-12 hover:border-primary/50 transition-colors cursor-pointer">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">کلیک کنید یا عکس بکشید</p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl overflow-hidden border border-border">
              <img src={image} alt="Exam" className="w-full" />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                تصویر دیگر
              </Button>
              <Button onClick={analyzeExam} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    بررسی کن
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score */}
            {score !== null && (
              <div className={`p-6 rounded-2xl text-center ${
                score >= 80 ? "bg-green-500/20" : score >= 50 ? "bg-yellow-500/20" : "bg-red-500/20"
              }`}>
                <p className="text-4xl font-bold mb-1">{score}%</p>
                <p className="text-sm text-muted-foreground">نمره کل</p>
              </div>
            )}

            {/* Results */}
            <div className="space-y-3">
              {results.map((q, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    q.isCorrect ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">سوال {q.number}</p>
                      <p className="text-xs text-muted-foreground mb-2">{q.text}</p>
                      {!q.isCorrect && (
                        <p className="text-xs">
                          <span className="text-red-500">پاسخ شما: {q.userAnswer}</span>
                          {" • "}
                          <span className="text-green-500">پاسخ صحیح: {q.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              آزمون جدید
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ExamChecker;
