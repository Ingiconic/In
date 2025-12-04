import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, BookOpen, HelpCircle, FileText, CheckSquare, ClipboardList, 
  BookCheck, NotebookPen, Sparkles, Box, Gamepad2, Flame, Swords, 
  Heart, Trophy, User, Music, Palette, Calendar, Target, 
  BarChart3, MessageSquare, Users, ChevronLeft, Zap, Star
} from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  // Tool card component - Mobile optimized
  const ToolCard = ({ 
    icon: Icon, 
    title, 
    description, 
    onClick, 
    gradient,
    delay = 0
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative bg-card/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className={`${gradient} p-2.5 sm:p-3 rounded-xl shadow-lg group-hover:scale-105 transition-transform flex-shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
            )}
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );

  // Quick action button for hero section
  const QuickAction = ({ icon: Icon, label, onClick, gradient }: any) => (
    <button
      onClick={onClick}
      className={`${gradient} flex flex-col items-center gap-1.5 p-3 rounded-xl text-white hover:opacity-90 transition-all active:scale-95 min-w-[72px]`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-5xl space-y-4 sm:space-y-6 pb-24 lg:pb-6">
        
        {/* Welcome Hero - Compact for mobile */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
        >
          <div className="absolute inset-0 gradient-hero opacity-20" />
          <div className="relative bg-card/40 backdrop-blur-xl border border-border/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">
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
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial bg-background/60 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-border/30 text-center min-w-[70px]">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold text-base sm:text-lg">{stats.totalPoints}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">امتیاز</p>
                  </div>
                  <div className="flex-1 sm:flex-initial bg-background/60 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-border/30 text-center min-w-[70px]">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold text-base sm:text-lg">{stats.streakDays}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">روز</p>
                  </div>
                  <div className="flex-1 sm:flex-initial bg-background/60 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-border/30 text-center min-w-[70px]">
                    <div className="flex items-center justify-center gap-1 text-secondary">
                      <Star className="w-4 h-4" />
                      <span className="font-bold text-base sm:text-lg">{stats.examsCount}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">آزمون</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/signup")}
                  className="gradient-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
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
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/60 backdrop-blur-sm rounded-xl border border-border/20">
            <TabsTrigger 
              value="ai" 
              className="gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden xs:inline">هوش مصنوعی</span>
              <span className="xs:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="study" 
              className="gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-lg transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xs:inline">مطالعه</span>
              <span className="xs:hidden">درس</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gamification" 
              className="gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden xs:inline">بازی</span>
              <span className="xs:hidden">گیم</span>
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Users className="w-4 h-4" />
              <span>اجتماعی</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                delay={0.05}
              />
              <ToolCard
                icon={CheckSquare}
                title="آزمون‌ساز AI"
                description="آزمون شخصی‌سازی شده"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/exam")}
                delay={0.1}
              />
              <ToolCard
                icon={Brain}
                title="مشاور هوشمند"
                description="راهنمایی تحصیلی"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/consultation")}
                delay={0.15}
              />
              <ToolCard
                icon={ClipboardList}
                title="حل کاربرگ"
                description="عکس بگیر، جواب ببین"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/worksheet-solver")}
                delay={0.2}
              />
              <ToolCard
                icon={BookCheck}
                title="حل تکالیف"
                description="راهنمای گام به گام"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/homework-helper")}
                delay={0.25}
              />
              <ToolCard
                icon={Sparkles}
                title="دوست هوشمند"
                description="چت با AI دوستانه"
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                onClick={() => handleToolClick("/ai-buddy")}
                delay={0.3}
              />
              <ToolCard
                icon={Zap}
                title="همراه مطالعه"
                description="تحلیل سبک یادگیری"
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                onClick={() => handleToolClick("/study-companion")}
                delay={0.35}
              />
            </div>
          </TabsContent>

          {/* Study Tools Tab */}
          <TabsContent value="study" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                delay={0.05}
              />
              <ToolCard
                icon={Calendar}
                title="تقویم درسی"
                description="برنامه‌ریزی هوشمند"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/study-calendar")}
                delay={0.1}
              />
              <ToolCard
                icon={Target}
                title="اهداف من"
                description="پیگیری پیشرفت"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/goals-tracker")}
                delay={0.15}
              />
              <ToolCard
                icon={BarChart3}
                title="گزارش پیشرفت"
                description="نمودار عملکرد"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/progress")}
                delay={0.2}
              />
              <ToolCard
                icon={BookOpen}
                title="منابع درسی"
                description="کتاب‌ها و جزوات"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/resources")}
                delay={0.25}
              />
              <ToolCard
                icon={Brain}
                title="نقشه ذهنی"
                description="سازماندهی ایده‌ها"
                gradient="bg-gradient-to-br from-violet-500 to-purple-500"
                onClick={() => handleToolClick("/mindmap-ai")}
                delay={0.3}
              />
              <ToolCard
                icon={CheckSquare}
                title="فلش‌کارت"
                description="مرور سریع مطالب"
                gradient="bg-gradient-to-br from-emerald-500 to-green-500"
                onClick={() => handleToolClick("/flashcards")}
                delay={0.35}
              />
            </div>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                delay={0.05}
              />
              <ToolCard
                icon={Heart}
                title="دیوار انگیزشی"
                description="جملات الهام‌بخش"
                gradient="bg-gradient-to-br from-pink-500 to-rose-500"
                onClick={() => handleToolClick("/motivation-wall")}
                delay={0.1}
              />
              <ToolCard
                icon={Trophy}
                title="ماموریت روزانه"
                description="جوایز ویژه"
                gradient="bg-gradient-to-br from-yellow-500 to-amber-500"
                onClick={() => handleToolClick("/daily-quests")}
                delay={0.15}
              />
              <ToolCard
                icon={User}
                title="آواتار من"
                description="شخصی‌سازی کاراکتر"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
                onClick={() => handleToolClick("/avatar-customizer")}
                delay={0.2}
              />
              <ToolCard
                icon={Trophy}
                title="رتبه‌بندی"
                description="مقایسه با بقیه"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/leaderboard")}
                delay={0.25}
              />
              <ToolCard
                icon={Palette}
                title="تنظیمات تم"
                description="شخصی‌سازی ظاهر"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/theme-settings")}
                delay={0.3}
              />
              <ToolCard
                icon={Music}
                title="موسیقی مطالعه"
                description="پلی‌لیست تمرکز"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/music-player")}
                delay={0.35}
              />
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <ToolCard
                icon={MessageSquare}
                title="انجمن گفتگو"
                description="بحث و گفتگوی درسی"
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                onClick={() => handleToolClick("/forum")}
                delay={0}
              />
              <ToolCard
                icon={Users}
                title="پروفایل من"
                description="مشاهده و ویرایش"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
                onClick={() => handleToolClick("/profile")}
                delay={0.05}
              />
              <ToolCard
                icon={Trophy}
                title="تابلوی امتیازات"
                description="رده‌بندی کاربران"
                gradient="bg-gradient-to-br from-amber-500 to-yellow-500"
                onClick={() => handleToolClick("/leaderboard")}
                delay={0.1}
              />
              <ToolCard
                icon={Users}
                title="دعوت از دوستان"
                description="کسب امتیاز بیشتر"
                gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
                onClick={() => handleToolClick("/referral")}
                delay={0.15}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
