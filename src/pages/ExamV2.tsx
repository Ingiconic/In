import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Brain, Loader2, CheckCircle, XCircle, AlertCircle, Coins } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import ResourceSelector from "@/components/ResourceSelector";
import MathText from "@/components/MathText";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useCoinError } from "@/hooks/useCoinError";

const ExamV2 = () => {
  const { toast } = useToast();
  const { handleCoinError } = useCoinError();
  usePageView();
  const [content, setContent] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("متوسط");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluation, setEvaluation] = useState<any>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  const generateExam = async () => {
    if (!content.trim() && !selectedResource) {
      toast({
        title: "خطا",
        description: "لطفا محتوا را وارد کنید یا منبعی انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let finalContent = content;
      
      if (selectedResource) {
        finalContent = `بر اساس منبع "${selectedResource.title}"، ${content || "آزمونی جامع بساز"}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-exam-generator-v2', {
        body: { 
          content: finalContent, 
          questionCount, 
          difficulty,
          questionTypes: {
            multipleChoice: Math.floor(questionCount * 0.5),
            fillBlank: Math.floor(questionCount * 0.3),
            essay: Math.floor(questionCount * 0.2)
          }
        }
      });

      if (error) throw error;

      setExam(data);
      toast({
        title: "آزمون آماده شد! 🎯",
        description: `${data.questions?.length || 0} سوال متنوع برای شما ایجاد شد`,
      });
    } catch (error: any) {
      if (!handleCoinError(error, COIN_COSTS.EXAM_GENERATE)) {
        toast({
          title: "خطا",
          description: error.message || "مشکلی در ایجاد آزمون پیش آمد",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (!exam) return;

    setEvaluating(true);
    try {
      // Get AI evaluation
      const { data: evalData, error: evalError } = await supabase.functions.invoke('ai-evaluate-exam', {
        body: {
          questions: exam.questions,
          userAnswers: answers,
        }
      });

      if (evalError) throw evalError;

      setEvaluation(evalData);

      // Award coins (50 for completing exam)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ coins: (profileData?.coins || 0) + 50 })
          .eq('id', user.id);

        await supabase
          .from('coin_transactions')
          .insert({
            user_id: user.id,
            amount: 50,
            reason: 'exam_completion'
          });
      }

      toast({
        title: "آزمون ارزیابی شد! 🎉",
        description: `نمره: ${evalData.totalScore}/100 - +50 سکه`,
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    آزمون ساز هوشمند V2
                    <span className="text-sm font-normal text-primary flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {COIN_COSTS.EXAM_GENERATE} سکه
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    سوالات متنوع با ارزیابی هوشمند - محتوا یا منبع را انتخاب کنید
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Coins className="w-4 h-4" />
                +50 سکه
              </Badge>
            </div>
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

              {selectedResource && (
                <Card className="p-3 bg-primary/5 border-primary/20">
                  <p className="text-sm">
                    <span className="font-bold">منبع انتخاب شده:</span> {selectedResource.title}
                  </p>
                </Card>
              )}

              <div className="flex gap-2">
                <ResourceSelector
                  onResourceSelect={setSelectedResource}
                  selectedResource={selectedResource}
                />
                <Button
                  onClick={generateExam}
                  disabled={loading || (!content.trim() && !selectedResource)}
                  className="flex-1 gradient-primary shadow-glow"
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
            </div>
          </Card>
        ) : !evaluation ? (
          <div className="space-y-6">
            <Card className="p-6 glassmorphism-card border-primary/10">
              <h2 className="text-xl font-bold mb-2">آزمون شما</h2>
              <p className="text-sm text-muted-foreground">
                تعداد سوالات: {exam.questions?.length || 0}
              </p>
            </Card>

            {exam.questions?.map((question: any, index: number) => (
              <Card key={index} className="p-6 glassmorphism-card border-primary/10">
                <div className="flex items-start gap-2 mb-4">
                  <Badge variant="outline">
                    {question.type === 'multiple_choice' && 'چند گزینه‌ای'}
                    {question.type === 'fill_blank' && 'جای خالی'}
                    {question.type === 'essay' && 'تشریحی'}
                  </Badge>
                  <div className="flex-1">
                    <h3 className="font-bold">سوال {index + 1}:</h3>
                    <MathText content={question.question} className="mt-1" />
                  </div>
                </div>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options.map((option: string, optIndex: number) => (
                      <button
                        key={optIndex}
                        onClick={() => setAnswers({ ...answers, [index]: option })}
                        className={`w-full text-right p-3 rounded-lg border transition-all ${
                          answers[index] === option
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'fill_blank' && (
                  <Input
                    value={answers[index] || ''}
                    onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                    placeholder="پاسخ خود را بنویسید..."
                    dir="rtl"
                  />
                )}

                {question.type === 'essay' && (
                  <div className="space-y-3">
                    <Textarea
                      value={answers[index] || ''}
                      onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                      placeholder="پاسخ تشریحی خود را بنویسید..."
                      className="min-h-[150px]"
                      dir="rtl"
                    />
                    {question.evaluation_criteria && (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">معیارهای ارزیابی:</p>
                        <ul className="list-disc list-inside">
                          {question.evaluation_criteria.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}

            <Button
              onClick={submitExam}
              disabled={evaluating}
              className="w-full gradient-primary shadow-glow"
              size="lg"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  در حال ارزیابی...
                </>
              ) : (
                'ثبت و دریافت کارنامه'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Card */}
            <Card className="p-6 glassmorphism-card border-primary/10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                  <span className="text-3xl font-bold text-white">{evaluation.percentage}%</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">کارنامه آزمون</h2>
                <p className="text-muted-foreground">نمره کل: {evaluation.totalScore}/100</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-bold">نقاط قوت</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold">نقاط ضعف</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500">!</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 glassmorphism-card border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="font-bold">پیشنهادات برای بهبود</h3>
              </div>
              <ul className="space-y-2">
                {evaluation.recommendations?.map((r: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Topics to Review */}
            {evaluation.topicsToReview && Array.isArray(evaluation.topicsToReview) && evaluation.topicsToReview.length > 0 && (
              <Card className="p-6 glassmorphism-card border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold">موضوعات نیازمند مرور</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.topicsToReview.map((topic: string, i: number) => (
                    <Badge key={i} variant="destructive">{topic}</Badge>
                  ))}
                </div>
              </Card>
            )}

            <Button
              onClick={() => {
                setExam(null);
                setAnswers({});
                setEvaluation(null);
              }}
              className="w-full gradient-primary shadow-glow"
              size="lg"
            >
              ایجاد آزمون جدید
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ExamV2;
