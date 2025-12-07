import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, BookOpen, HelpCircle, FileText, CheckSquare, ClipboardList, 
  BookCheck, NotebookPen, Sparkles, Box, Gamepad2, Flame, Swords, 
  Heart, Trophy, User, Music, Calendar, Target, 
  BarChart3, Users, ChevronLeft, Zap, Star
} from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import AdBanner from "@/components/dashboard/AdBanner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    totalPoints: 0,
    examsCount: 0,
    streakDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      const { count: examsCount } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      setStats({
        totalPoints: profileData?.points || 0,
        examsCount: examsCount || 0,
        streakDays: profileData?.streak_days || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (path: string) => {
    if (!isLoggedIn) {
      toast({
        title: "نیاز به ثبت‌نام",
        description: "برای استفاده از این ابزار باید ثبت‌نام کنید",
        variant: "destructive",
      });
      navigate("/signup");
      return;
    }
    navigate(path);
  };

  // Tool card component - Clean & Mobile optimized
  const ToolCard = ({ 
    icon: Icon, 
    title, 
    description, 
    onClick, 
    gradient,
    delay = 0
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      onClick={onClick}
      className="group cursor-pointer touch-target"
    >
      <div className="relative bg-card rounded-2xl p-4 border border-border/40 hover:border-primary/50 transition-all duration-200 hover:shadow-md active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className={`${gradient} p-3 rounded-xl shadow-sm flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
            )}
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );

  // Quick action button - Touch friendly
  const QuickAction = ({ icon: Icon, label, onClick, gradient }: any) => (
    <button
      onClick={onClick}
      className={`${gradient} flex flex-col items-center gap-1.5 p-3 rounded-xl text-white active:scale-95 transition-transform min-w-[72px] touch-target`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-4 max-w-5xl pb-24 lg:pb-6">
          <DashboardSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 max-w-5xl space-y-5 pb-24 lg:pb-6">
        
        {/* Welcome Hero - Clean design */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/40 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold mb-1">
                {isLoggedIn ? (
                  <>سلام {profile?.full_name?.split(' ')[0] || profile?.username || "دوست عزیز"}! 👋</>
                ) : (
                  <>به ایزی‌درس خوش آمدید! 🎓</>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isLoggedIn ? "امروز چی می‌خوای یاد بگیری؟" : "یادگیری هوشمند با هوش مصنوعی"}
              </p>
            </div>
            
            {isLoggedIn ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial bg-muted/50 p-3 rounded-xl text-center min-w-[70px]">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold text-base">{stats.totalPoints}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">امتیاز</p>
                </div>
                <div className="flex-1 sm:flex-initial bg-muted/50 p-3 rounded-xl text-center min-w-[70px]">
                  <div className="flex items-center justify-center gap-1 text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span className="font-bold text-base">{stats.streakDays}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">روز</p>
                </div>
                <div className="flex-1 sm:flex-initial bg-muted/50 p-3 rounded-xl text-center min-w-[70px]">
                  <div className="flex items-center justify-center gap-1 text-secondary">
                    <Star className="w-4 h-4" />
                    <span className="font-bold text-base">{stats.examsCount}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">آزمون</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/signup")}
                className="gradient-primary text-white px-5 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform w-full sm:w-auto touch-target"
              >
                ثبت‌نام رایگان
              </button>
            )}
          </div>

          {/* Quick Actions - Mobile only */}
          {isLoggedIn && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1 sm:hidden scrollbar-hide">
              <QuickAction icon={HelpCircle} label="پرسش" onClick={() => handleToolClick("/questions")} gradient="gradient-primary" />
              <QuickAction icon={CheckSquare} label="آزمون" onClick={() => handleToolClick("/exam")} gradient="gradient-secondary" />
              <QuickAction icon={FileText} label="خلاصه" onClick={() => handleToolClick("/summarize")} gradient="gradient-accent" />
              <QuickAction icon={Box} label="یادگیری 3D" onClick={() => handleToolClick("/ar-learning")} gradient="bg-gradient-to-br from-cyan-500 to-blue-600" />
              <QuickAction icon={Brain} label="مشاور" onClick={() => handleToolClick("/consultation")} gradient="bg-gradient-to-br from-purple-500 to-pink-500" />
            </div>
          )}
        </motion.div>

        {/* Ad Banner */}
        <AdBanner />

        {/* Main Tabs - Better touch targets */}
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="ai" 
              className="gap-1.5 py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden xs:inline">هوش مصنوعی</span>
              <span className="xs:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="study" 
              className="gap-1.5 py-3 text-xs sm:text-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-lg font-medium"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xs:inline">مطالعه</span>
              <span className="xs:hidden">درس</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gamification" 
              className="gap-1.5 py-3 text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg font-medium"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden xs:inline">بازی</span>
              <span className="xs:hidden">گیم</span>
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="gap-1.5 py-3 text-xs sm:text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg font-medium"
            >
              <Users className="w-4 h-4" />
              <span>اجتماعی</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ToolCard
                icon={HelpCircle}
                title="پرسش درسی"
                description="سوالت رو بپرس، جواب بگیر"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/questions")}
                delay={0}
              />
              <ToolCard
                icon={FileText}
                title="خلاصه‌ساز هوشمند"
                description="متن بده، خلاصه بگیر"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/summarize")}
                delay={0.03}
              />
              <ToolCard
                icon={CheckSquare}
                title="آزمون‌ساز AI"
                description="آزمون شخصی‌سازی شده"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/exam")}
                delay={0.06}
              />
              <ToolCard
                icon={Brain}
                title="مشاور هوشمند"
                description="راهنمایی تحصیلی"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/consultation")}
                delay={0.09}
              />
              <ToolCard
                icon={ClipboardList}
                title="حل کاربرگ"
                description="عکس بگیر، جواب ببین"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/worksheet-solver")}
                delay={0.12}
              />
              <ToolCard
                icon={BookCheck}
                title="حل تکالیف"
                description="راهنمای گام به گام"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/homework-helper")}
                delay={0.15}
              />
              <ToolCard
                icon={Sparkles}
                title="دوست هوشمند"
                description="چت با AI دوستانه"
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                onClick={() => handleToolClick("/ai-buddy")}
                delay={0.18}
              />
              <ToolCard
                icon={Zap}
                title="همراه مطالعه"
                description="تحلیل سبک یادگیری"
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                onClick={() => handleToolClick("/study-companion")}
                delay={0.21}
              />
            </div>
          </TabsContent>

          {/* Study Tools Tab */}
          <TabsContent value="study" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ToolCard
                icon={NotebookPen}
                title="یادداشت‌ها"
                description="LaTeX + PDF پشتیبانی"
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                onClick={() => handleToolClick("/notes")}
                delay={0}
              />
              <ToolCard
                icon={Box}
                title="یادگیری 3D"
                description="مدل‌های تعاملی واقعی"
                gradient="bg-gradient-to-br from-cyan-500 to-teal-500"
                onClick={() => handleToolClick("/ar-learning")}
                delay={0.03}
              />
              <ToolCard
                icon={Calendar}
                title="تقویم درسی"
                description="برنامه‌ریزی هوشمند"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/study-calendar")}
                delay={0.06}
              />
              <ToolCard
                icon={Target}
                title="اهداف من"
                description="پیگیری پیشرفت"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/goals-tracker")}
                delay={0.09}
              />
              <ToolCard
                icon={BarChart3}
                title="گزارش پیشرفت"
                description="نمودار عملکرد"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/progress")}
                delay={0.12}
              />
              <ToolCard
                icon={BookOpen}
                title="منابع درسی"
                description="کتاب‌ها و جزوات"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/resources")}
                delay={0.15}
              />
              <ToolCard
                icon={Brain}
                title="نقشه ذهنی"
                description="سازماندهی ایده‌ها"
                gradient="bg-gradient-to-br from-violet-500 to-purple-500"
                onClick={() => handleToolClick("/mindmap-ai")}
                delay={0.18}
              />
              <ToolCard
                icon={CheckSquare}
                title="فلش‌کارت"
                description="مرور سریع مطالب"
                gradient="bg-gradient-to-br from-emerald-500 to-green-500"
                onClick={() => handleToolClick("/flashcards")}
                delay={0.21}
              />
            </div>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ToolCard
                icon={Flame}
                title="استریک مطالعه"
                description="ردیابی روزهای متوالی"
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
                onClick={() => handleToolClick("/study-streak")}
                delay={0}
              />
              <ToolCard
                icon={Swords}
                title="نبرد مطالعه"
                description="رقابت آنلاین"
                gradient="bg-gradient-to-br from-red-500 to-rose-500"
                onClick={() => handleToolClick("/study-battle")}
                delay={0.03}
              />
              <ToolCard
                icon={Heart}
                title="دیوار انگیزشی"
                description="جملات الهام‌بخش"
                gradient="bg-gradient-to-br from-pink-500 to-rose-500"
                onClick={() => handleToolClick("/motivation-wall")}
                delay={0.06}
              />
              <ToolCard
                icon={Trophy}
                title="ماموریت روزانه"
                description="جوایز ویژه"
                gradient="bg-gradient-to-br from-yellow-500 to-amber-500"
                onClick={() => handleToolClick("/daily-quests")}
                delay={0.09}
              />
              <ToolCard
                icon={User}
                title="حیوان خانگی"
                description="پرورش با مطالعه"
                gradient="bg-gradient-to-br from-lime-500 to-green-500"
                onClick={() => handleToolClick("/pet")}
                delay={0.12}
              />
              <ToolCard
                icon={Trophy}
                title="جدول امتیازات"
                description="رقابت با دوستان"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/leaderboard")}
                delay={0.15}
              />
              <ToolCard
                icon={Music}
                title="موزیک مطالعه"
                description="تمرکز با موسیقی"
                gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
                onClick={() => handleToolClick("/music-player")}
                delay={0.18}
              />
              <ToolCard
                icon={Zap}
                title="پومودورو"
                description="تایمر تمرکز"
                gradient="bg-gradient-to-br from-rose-500 to-pink-500"
                onClick={() => handleToolClick("/pomodoro")}
                delay={0.21}
              />
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ToolCard
                icon={Users}
                title="انجمن"
                description="گفتگو با دانش‌آموزان"
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                onClick={() => handleToolClick("/forum")}
                delay={0}
              />
              <ToolCard
                icon={BookOpen}
                title="بلاگ"
                description="مقالات آموزشی"
                gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                onClick={() => handleToolClick("/blog")}
                delay={0.03}
              />
              <ToolCard
                icon={User}
                title="معرفی به دوستان"
                description="جوایز دعوت"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
                onClick={() => handleToolClick("/referral")}
                delay={0.06}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
