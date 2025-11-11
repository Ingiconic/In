import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Brain, Loader2, FileText } from "lucide-react";
import { ExamQuestion } from "@/lib/types";
import { logger } from "@/lib/logger";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";

const Exam = () => {
  const { toast } = useToast();
  usePageView();
  const [content, setContent] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("متوسط");
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const generateExam = async () => {
    if (!content.trim()) {
      toast({
        title: "خطا",
        description: "لطفا محتوا را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-exam-generator', {
        body: { content, questionCount, difficulty }
      });

      if (error) throw error;

      setExam(data);
      toast({
        title: "آزمون آماده شد! 🎯",
        description: `${data.questions.length} سوال برای شما ایجاد شد`,
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی در ایجاد آزمون پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (!exam) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('لطفا ابتدا وارد شوید');

      const { data, error } = await supabase.functions.invoke('submit-exam', {
        body: {
          examQuestions: exam.questions,
          userAnswers: answers,
          examTitle: `آزمون ${new Date().toLocaleDateString("fa-IR")}`,
        },
      });

      if (error) throw error;

      const { score: percentageScore, pointsAwarded } = data;

      setShowResults(true);
      toast({
        title: "آزمون ثبت شد! 🎉",
        description: `نمره: ${percentageScore} | امتیاز: ${pointsAwarded}`,
      });
    } catch (error) {
      logger.error("Failed to submit exam", error);
      const message = error instanceof Error ? error.message : "لطفا دوباره تلاش کنید";
      toast({
        title: "خطا",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">آزمون ساز هوشمند</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              آزمون شخصی‌سازی شده با هوش مصنوعی
            </p>
          </div>
        </div>

        {!exam ? (
          <Card className="p-6 glassmorphism-card border-primary/10">
            <div className="space-y-6">
              <div>
                <Label htmlFor="content">محتوای درسی</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="محتوای درسی یا محدوده امتحان را وارد کنید..."
                  className="min-h-[200px]"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="count">تعداد سوالات</Label>
                  <Input
                    id="count"
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    min="5"
                    max="30"
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">سطح دشواری</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="آسان">آسان</option>
                    <option value="متوسط">متوسط</option>
                    <option value="سخت">سخت</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={generateExam}
                disabled={loading}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    در حال ایجاد آزمون...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 ml-2" />
                    ایجاد آزمون
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 glassmorphism-card border-primary/10">
              <h2 className="text-xl font-bold mb-2">
                {showResults ? "نتایج آزمون" : "آزمون شما"}
              </h2>
              <p className="text-sm text-muted-foreground">
                تعداد سوالات: {exam.questions.length}
              </p>
            </Card>

            {exam.questions.map((question: ExamQuestion, index: number) => (
              <Card key={index} className="p-6 glassmorphism-card border-primary/10">
                <h3 className="font-bold mb-4">
                  سوال {index + 1}: {question.question}
                </h3>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options.map((option: string, optIndex: number) => (
                      <button
                        key={optIndex}
                        onClick={() => !showResults && setAnswers({ ...answers, [index]: option })}
                        disabled={showResults}
                        className={`w-full text-right p-3 rounded-lg border transition-all ${
                          showResults
                            ? option === (question.correct_answer?.toString() ?? question.correctAnswer.toString())
                              ? 'border-green-500 bg-green-500/10'
                              : answers[index] === option
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border'
                            : answers[index] === option
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {showResults && question.explanation && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">توضیحات:</p>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </Card>
            ))}

            {!showResults && (
              <Button
                onClick={submitExam}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                ثبت و مشاهده نتایج
              </Button>
            )}

            {showResults && (
              <Button
                onClick={() => {
                  setExam(null);
                  setAnswers({});
                  setShowResults(false);
                }}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                ایجاد آزمون جدید
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Exam;
