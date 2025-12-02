import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  Brain, Loader2, CheckCircle, XCircle, AlertCircle, Coins, 
  Clock, ChevronLeft, ChevronRight, BookOpen, Target, Sparkles,
  Trophy, TrendingUp, Zap, Play, Pause, RotateCcw, Eye, Send,
  FileText, CheckCheck, ArrowRight, Star, Award
} from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import ResourceSelector from "@/components/ResourceSelector";
import MathText from "@/components/MathText";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useCoinError } from "@/hooks/useCoinError";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

// Constants
const EXAM_DRAFT_KEY = 'exam_draft_v2';
const DEFAULT_TIME_PER_QUESTION = 120; // 2 minutes per question

// Difficulty mapping (Persian to English)
const difficultyMap: Record<string, string> = {
  'آسان': 'easy',
  'متوسط': 'medium',
  'سخت': 'hard'
};

// Type definitions
interface Question {
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  options?: string[];
  correct_answer?: string;
  evaluation_criteria?: string[];
  key_points?: string[];
  explanation?: string;
}

interface Exam {
  questions: Question[];
}

interface Evaluation {
  scores: Array<{ question: number; score: number; feedback: string }>;
  totalScore: number;
  percentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  topicsToReview: string[];
}

const ExamV2 = () => {
  const { toast } = useToast();
  const { handleCoinError } = useCoinError();
  usePageView();
  
  // Form state
  const [content, setContent] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("متوسط");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  
  // Exam state
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  
  // UI state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  const evaluationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(EXAM_DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.exam && parsed.answers) {
          setExam(parsed.exam);
          setAnswers(parsed.answers);
          setCurrentQuestionIndex(parsed.currentIndex || 0);
        } else if (parsed.content) {
          setContent(parsed.content);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
        localStorage.removeItem(EXAM_DRAFT_KEY);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    if (exam) {
      localStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify({
        exam,
        answers,
        currentIndex: currentQuestionIndex
      }));
    } else if (content) {
      localStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify({ content }));
    }
  }, [exam, answers, currentQuestionIndex, content]);

  // Timer logic
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            toast({
              title: "زمان تمام شد! ⏰",
              description: "آزمون به صورت خودکار ثبت می‌شود",
              variant: "destructive"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeRemaining]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim()).length;
  const totalQuestions = exam?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

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

      // Convert Persian difficulty to English
      const englishDifficulty = difficultyMap[difficulty] || 'medium';

      const { data, error } = await supabase.functions.invoke('ai-exam-generator-v2', {
        body: { 
          content: finalContent, 
          questionCount, 
          difficulty: englishDifficulty,
          questionTypes: {
            multipleChoice: Math.floor(questionCount * 0.5),
            fillBlank: Math.floor(questionCount * 0.3),
            essay: Math.floor(questionCount * 0.2)
          }
        }
      });

      if (error) throw error;

      setExam(data);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(data.questions.length * DEFAULT_TIME_PER_QUESTION);
      setExamStartTime(new Date());
      setTimerActive(true);
      
      // Clear content draft
      localStorage.removeItem(EXAM_DRAFT_KEY);
      
      toast({
        title: "آزمون آماده شد! 🎯",
        description: `${data.questions?.length || 0} سوال متنوع برای شما ایجاد شد`,
      });
    } catch (error: any) {
      console.error('Exam generation error:', error);
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
    setTimerActive(false);
    
    try {
      // Convert answers Record to Array for the edge function
      const answersArray = exam.questions.map((_, index) => answers[index] || '');

      const { data: evalData, error: evalError } = await supabase.functions.invoke('ai-evaluate-exam', {
        body: {
          questions: exam.questions,
          userAnswers: answersArray,
        }
      });

      if (evalError) throw evalError;

      setEvaluation(evalData);
      
      // Clear draft after successful submission
      localStorage.removeItem(EXAM_DRAFT_KEY);

      toast({
        title: "آزمون ارزیابی شد! 🎉",
        description: `نمره: ${evalData.totalScore}/100`,
      });

      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Exam evaluation error:', error);
      if (!handleCoinError(error, COIN_COSTS.EXAM_EVALUATE || 5)) {
        toast({
          title: "خطا",
          description: error.message || "مشکلی در ارزیابی پیش آمد",
          variant: "destructive",
        });
      }
    } finally {
      setEvaluating(false);
    }
  };

  const resetExam = () => {
    setExam(null);
    setAnswers({});
    setEvaluation(null);
    setCurrentQuestionIndex(0);
    setShowPreview(false);
    setTimerActive(false);
    setTimeRemaining(0);
    localStorage.removeItem(EXAM_DRAFT_KEY);
  };

  const currentQuestion = exam?.questions?.[currentQuestionIndex];

  // Question type badge colors
  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return { label: 'چند گزینه‌ای', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'fill_blank':
        return { label: 'جای خالی', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'essay':
        return { label: 'تشریحی', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      default:
        return { label: type, className: 'bg-muted text-muted-foreground' };
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    if (score >= 60) return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
    return 'from-red-500/20 to-rose-500/20 border-red-500/30';
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 py-8 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    آزمون‌ساز هوشمند
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base">
                    سوالات متنوع با ارزیابی هوشمند AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-primary/10 border-primary/20">
                  <Coins className="w-4 h-4 text-primary" />
                  <span>{COIN_COSTS.EXAM_GENERATE} سکه</span>
                </Badge>
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-green-500/10 border-green-500/20 text-green-400">
                  <Trophy className="w-4 h-4" />
                  <span>+XP</span>
                </Badge>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Create Exam */}
            {!exam && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: FileText, label: 'سوالات متنوع', value: '۳ نوع', color: 'text-blue-400' },
                    { icon: Target, label: 'ارزیابی دقیق', value: 'AI', color: 'text-green-400' },
                    { icon: Clock, label: 'تایمر هوشمند', value: 'فعال', color: 'text-amber-400' },
                    { icon: Award, label: 'کارنامه جامع', value: 'تحلیلی', color: 'text-purple-400' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="p-4 bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="font-bold">{stat.value}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Main Form */}
                <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                  <div className="space-y-6">
                    {/* Content Input */}
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-base font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        محتوای درسی
                      </Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="محتوای درسی، متن کتاب، یا محدوده امتحان را اینجا وارد کنید...

مثال:
- فصل ۳ ریاضی: معادلات درجه دوم
- درس تاریخ: انقلاب صنعتی
- زیست‌شناسی: سلول و ساختار آن"
                        className="min-h-[180px] bg-muted/30 border-border/50 focus:border-primary/50 transition-colors resize-none text-base"
                        dir="rtl"
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="count" className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          تعداد سوالات
                        </Label>
                        <div className="relative">
                          <Input
                            id="count"
                            type="number"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Math.min(30, Math.max(5, parseInt(e.target.value) || 5)))}
                            min="5"
                            max="30"
                            className="bg-muted/30 border-border/50 text-center text-lg font-bold"
                          />
                          <div className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                            سوال
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">حداقل ۵ و حداکثر ۳۰ سوال</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficulty" className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          سطح دشواری
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['آسان', 'متوسط', 'سخت'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setDifficulty(level)}
                              className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                                difficulty === level
                                  ? level === 'آسان' 
                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                    : level === 'متوسط'
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                    : 'border-red-500 bg-red-500/10 text-red-400'
                                  : 'border-border/50 hover:border-primary/30 bg-muted/30'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resource Selector */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        منبع (اختیاری)
                      </Label>
                      <div className="flex gap-3">
                        <ResourceSelector
                          onResourceSelect={setSelectedResource}
                          selectedResource={selectedResource}
                        />
                        {selectedResource && (
                          <Card className="flex-1 p-3 bg-primary/5 border-primary/20 flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{selectedResource.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedResource(null)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateExam}
                      disabled={loading || (!content.trim() && !selectedResource)}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin ml-3" />
                          در حال ساخت آزمون هوشمند...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 ml-3" />
                          شروع آزمون
                          <ArrowRight className="w-5 h-5 mr-3" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Taking Exam */}
            {exam && !evaluation && !showPreview && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Exam Header */}
                <Card className="p-4 bg-card/80 backdrop-blur border-border/50 sticky top-4 z-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Progress */}
                    <div className="flex-1 w-full md:w-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">پیشرفت آزمون</span>
                        <span className="text-sm font-bold">{answeredCount}/{totalQuestions}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
                      timeRemaining < 60 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                        : 'bg-muted/50 border-border/50'
                    }`}>
                      <Clock className="w-5 h-5" />
                      <span className="font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTimerActive(!timerActive)}
                        className="p-1"
                      >
                        {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        پیش‌نمایش
                      </Button>
                      <Button
                        onClick={submitExam}
                        disabled={evaluating}
                        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                      >
                        {evaluating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        ثبت نهایی
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Question Navigation Pills */}
                <div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/30 rounded-xl">
                  {exam.questions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${
                        currentQuestionIndex === index
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110'
                          : answers[index]?.trim()
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Current Question */}
                {currentQuestion && (
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                            {currentQuestionIndex + 1}
                          </div>
                          <Badge className={getQuestionTypeBadge(currentQuestion.type).className}>
                            {getQuestionTypeBadge(currentQuestion.type).label}
                          </Badge>
                        </div>
                        {answers[currentQuestionIndex]?.trim() && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                            <CheckCheck className="w-3 h-3" />
                            پاسخ داده شد
                          </Badge>
                        )}
                      </div>

                      {/* Question Text */}
                      <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                        <MathText content={currentQuestion.question} className="text-lg leading-relaxed" />
                      </div>

                      {/* Answer Section */}
                      {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, optIndex) => (
                            <motion.button
                              key={optIndex}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: option })}
                              className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                answers[currentQuestionIndex] === option
                                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                  : 'border-border/50 hover:border-primary/30 bg-muted/30'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                answers[currentQuestionIndex] === option
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {['الف', 'ب', 'ج', 'د'][optIndex]}
                              </div>
                              <span className="flex-1">{option}</span>
                              {answers[currentQuestionIndex] === option && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {currentQuestion.type === 'fill_blank' && (
                        <Input
                          value={answers[currentQuestionIndex] || ''}
                          onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                          placeholder="پاسخ خود را بنویسید..."
                          className="text-lg py-6 bg-muted/30 border-border/50"
                          dir="rtl"
                        />
                      )}

                      {currentQuestion.type === 'essay' && (
                        <div className="space-y-4">
                          <Textarea
                            value={answers[currentQuestionIndex] || ''}
                            onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                            placeholder="پاسخ تشریحی خود را با جزئیات کامل بنویسید..."
                            className="min-h-[200px] text-base bg-muted/30 border-border/50"
                            dir="rtl"
                          />
                          {currentQuestion.evaluation_criteria && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <p className="font-medium text-amber-400 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                معیارهای ارزیابی:
                              </p>
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {currentQuestion.evaluation_criteria.map((c, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="gap-2"
                        >
                          <ChevronRight className="w-4 h-4" />
                          سوال قبلی
                        </Button>
                        
                        <span className="text-muted-foreground">
                          {currentQuestionIndex + 1} از {totalQuestions}
                        </span>

                        <Button
                          onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === totalQuestions - 1}
                          className="gap-2"
                        >
                          سوال بعدی
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Preview Mode */}
            {exam && !evaluation && showPreview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      پیش‌نمایش پاسخ‌ها
                    </h2>
                    <Button variant="outline" onClick={() => setShowPreview(false)} className="gap-2">
                      <ChevronRight className="w-4 h-4" />
                      بازگشت
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {exam.questions.map((q, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-xl border ${
                          answers[index]?.trim() 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-muted-foreground">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm mb-2 line-clamp-2">{q.question}</p>
                            <p className={`text-sm font-medium ${answers[index]?.trim() ? 'text-green-400' : 'text-red-400'}`}>
                              {answers[index]?.trim() || 'بدون پاسخ'}
                            </p>
                          </div>
                          <button 
                            onClick={() => { setCurrentQuestionIndex(index); setShowPreview(false); }}
                            className="text-primary hover:underline text-sm"
                          >
                            ویرایش
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                      className="flex-1"
                    >
                      ادامه آزمون
                    </Button>
                    <Button
                      onClick={submitExam}
                      disabled={evaluating}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                    >
                      {evaluating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          در حال ارزیابی...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 ml-2" />
                          ثبت نهایی و دریافت کارنامه
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {evaluation && (
              <motion.div
                ref={evaluationRef}
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Score Hero */}
                <Card className={`p-8 bg-gradient-to-br ${getScoreBg(evaluation.percentage)} border overflow-hidden relative`}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
                  
                  <div className="relative text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.8 }}
                      className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-background/80 to-background/60 backdrop-blur mb-6 shadow-2xl"
                    >
                      <div>
                        <span className={`text-5xl font-black ${getScoreColor(evaluation.percentage)}`}>
                          {evaluation.percentage}
                        </span>
                        <span className="text-2xl text-muted-foreground">%</span>
                      </div>
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mb-2">
                      {evaluation.percentage >= 80 ? '🎉 عالی!' : evaluation.percentage >= 60 ? '👍 خوب!' : '💪 تلاش بیشتر'}
                    </h2>
                    <p className="text-muted-foreground">
                      نمره کل: {evaluation.totalScore}/100
                    </p>
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-card/80 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold">{answeredCount}</p>
                    <p className="text-xs text-muted-foreground">پاسخ داده شده</p>
                  </Card>
                  <Card className="p-4 bg-card/80 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{totalQuestions}</p>
                    <p className="text-xs text-muted-foreground">کل سوالات</p>
                  </Card>
                  <Card className="p-4 bg-card/80 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold">{evaluation.strengths?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">نقاط قوت</p>
                  </Card>
                  <Card className="p-4 bg-card/80 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
                      <Star className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold">{evaluation.recommendations?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">پیشنهاد بهبود</p>
                  </Card>
                </div>

                {/* Analysis Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card className="p-6 bg-card/80">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <h3 className="font-bold">نقاط قوت</h3>
                    </div>
                    <ul className="space-y-2">
                      {evaluation.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* Weaknesses */}
                  <Card className="p-6 bg-card/80">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="font-bold">نقاط قابل بهبود</h3>
                    </div>
                    <ul className="space-y-2">
                      {evaluation.weaknesses?.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-amber-400 mt-1">!</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card className="p-6 bg-card/80">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-bold">پیشنهادات هوشمند</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Topics to Review */}
                {evaluation.topicsToReview && evaluation.topicsToReview.length > 0 && (
                  <Card className="p-6 bg-card/80">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <h3 className="font-bold">موضوعات نیازمند مرور</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.topicsToReview.map((topic, i) => (
                        <Badge key={i} variant="destructive" className="px-3 py-1">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* New Exam Button */}
                <Button
                  onClick={resetExam}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 ml-3" />
                  آزمون جدید
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

export default ExamV2;