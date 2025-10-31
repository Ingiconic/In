import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Brain, FileText, Loader2 } from "lucide-react";

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    let score = 0;
    exam.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correct_answer) {
        score++;
      }
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('لطفا ابتدا وارد شوید');

      const percentageScore = Math.round((score / exam.questions.length) * 100);
      
      // Calculate points: 10 base points + correct answers + bonus for high scores
      let pointsAwarded = 10 + score;
      if (percentageScore >= 100) {
        pointsAwarded += 10; // Perfect score bonus
      } else if (percentageScore >= 80) {
        pointsAwarded += 5; // High score bonus
      }

      // Save exam
      await supabase.from('exams').insert({
        user_id: user.id,
        title: `آزمون ${new Date().toLocaleDateString('fa-IR')}`,
        questions: exam.questions,
        answers: answers,
        score: percentageScore,
        points_awarded: pointsAwarded,
        completed_at: new Date().toISOString(),
      });

      // Update user points and exam count
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, exams_taken')
        .eq('id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({
          points: (profile?.points || 0) + pointsAwarded,
          exams_taken: (profile?.exams_taken || 0) + 1,
        })
        .eq('id', user.id);

      setShowResults(true);
      toast({
        title: "آزمون ثبت شد! 🎉",
        description: `نمره: ${percentageScore} | امتیاز کسب شده: ${pointsAwarded}`,
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-accent p-2 rounded-lg shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">آزمون هوشمند</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!exam ? (
          <Card className="p-8 shadow-glow border-primary/20 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-gradient">ایجاد آزمون جدید</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">محتوای درسی</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="محتوای درسی یا محدوده امتحان را وارد کنید..."
                  className="min-h-[200px] bg-input border-border/50 focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">تعداد سوالات</label>
                  <Input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    min="5"
                    max="30"
                    className="bg-input border-border/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">سطح دشواری</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="w-full shadow-glow hover:shadow-neon"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ایجاد آزمون...
                  </>
                ) : (
                  <>
                    <Brain className="ml-2 h-4 w-4" />
                    ایجاد آزمون با هوش مصنوعی
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 shadow-glow border-primary/20 animate-fade-in">
              <h2 className="text-2xl font-bold text-gradient mb-4">
                {showResults ? "نتایج آزمون" : "آزمون شما"}
              </h2>
              <p className="text-muted-foreground">
                تعداد سوالات: {exam.questions.length}
              </p>
            </Card>

            {exam.questions.map((question: any, index: number) => (
              <Card
                key={index}
                className="p-6 shadow-glow hover:border-primary/50 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2">
                    سوال {index + 1}: {question.question}
                  </h3>
                </div>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options.map((option: string, optIndex: number) => (
                      <button
                        key={optIndex}
                        onClick={() => !showResults && setAnswers({ ...answers, [index]: option })}
                        disabled={showResults}
                        className={`w-full text-right p-3 rounded-lg border transition-all ${
                          showResults
                            ? option === question.correct_answer
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
                className="w-full shadow-glow hover:shadow-neon"
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
                className="w-full shadow-glow hover:shadow-neon"
                size="lg"
              >
                ایجاد آزمون جدید
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Exam;