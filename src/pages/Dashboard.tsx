import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, BookOpen, HelpCircle, FileText, CheckSquare, ClipboardList, 
  BookCheck, NotebookPen, Sparkles, Box, Gamepad2, Flame, Swords, 
  Heart, Trophy, User, Music, Palette, Calendar, Target, 
  BarChart3, MessageSquare, Users
} from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    totalPoints: 0,
    examsCount: 0,
    messagesCount: 0,
    friendsCount: 0,
    studyPlansCount: 0,
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

      const { count: messagesCount } = await supabase
        .from("group_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      const { count: friendsCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      const { count: studyPlansCount } = await supabase
        .from("study_plans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      setStats({
        totalPoints: profileData?.points || 0,
        examsCount: examsCount || 0,
        messagesCount: messagesCount || 0,
        friendsCount: friendsCount || 0,
        studyPlansCount: studyPlansCount || 0,
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

  // Tool card component
  const ToolCard = ({ 
    icon: Icon, 
    title, 
    description, 
    onClick, 
    gradient 
  }: any) => (
    <Card 
      className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-border/20"
      onClick={onClick}
    >
      <CardHeader className="p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`${gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl space-y-6">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-4 md:p-6 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">
                {isLoggedIn ? `خوش آمدید ${profile?.full_name || profile?.username || "کاربر"}! 👋` : "به ایزی‌درس خوش آمدید! 👋"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoggedIn ? "آماده برای یادگیری امروز؟" : "برای استفاده از ابزارها ثبت‌نام کنید"}
              </p>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="bg-card/80 backdrop-blur-sm p-3 rounded-xl border border-border/30 min-w-[80px] text-center">
                  <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-primary">{stats.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">امتیاز</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/signup")}
                className="gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                ثبت‌نام رایگان
              </button>
            )}
          </div>
        </div>


        {/* Main Tabs */}
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/50 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="ai" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">هوش مصنوعی</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="gap-2 py-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-lg">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">مطالعه</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg">
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">گیم</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2 py-3 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">اجتماعی</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <ToolCard
                icon={HelpCircle}
                title="پرسش درسی"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/questions")}
              />
              <ToolCard
                icon={FileText}
                title="خلاصه‌ساز"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/summarize")}
              />
              <ToolCard
                icon={CheckSquare}
                title="آزمون‌ساز"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/exam")}
              />
              <ToolCard
                icon={Brain}
                title="مشاور هوشمند"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/consultation")}
              />
              <ToolCard
                icon={ClipboardList}
                title="حل کاربرگ"
                description="عکس بگیر جواب ببین"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/worksheet-solver")}
              />
              <ToolCard
                icon={BookCheck}
                title="حل تکالیف"
                description="راهنمای کامل"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/homework-helper")}
              />
              <ToolCard
                icon={Brain}
                title="دوست هوشمند"
                description="چت با AI"
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => handleToolClick("/ai-buddy")}
              />
              <ToolCard
                icon={Sparkles}
                title="همراه هوشمند"
                description="تحلیل سبک یادگیری"
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => handleToolClick("/study-companion")}
              />
            </div>
          </TabsContent>

          {/* Study Tools Tab */}
          <TabsContent value="study" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <ToolCard
                icon={NotebookPen}
                title="یادداشت‌ها"
                description="LaTeX + PDF"
                gradient="bg-gradient-to-r from-blue-500 to-green-500"
                onClick={() => handleToolClick("/notes")}
              />
              <ToolCard
                icon={Box}
                title="یادگیری 3D"
                description="مدل‌های تعاملی"
                gradient="bg-gradient-to-r from-cyan-500 to-orange-500"
                onClick={() => handleToolClick("/ar-learning")}
              />
              <ToolCard
                icon={Calendar}
                title="تقویم درسی"
                description="برنامه‌ریزی هوشمند"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/study-calendar")}
              />
              <ToolCard
                icon={Target}
                title="اهداف"
                description="پیگیری پیشرفت"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/goals-tracker")}
              />
              <ToolCard
                icon={BarChart3}
                title="پیشرفت"
                description="نمودار عملکرد"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/progress")}
              />
              <ToolCard
                icon={BookOpen}
                title="منابع درسی"
                description="کتاب‌ها و جزوات"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/resources")}
              />
              <ToolCard
                icon={Brain}
                title="نقشه ذهنی"
                description="سازماندهی ایده‌ها"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/mindmap-ai")}
              />
              <ToolCard
                icon={CheckSquare}
                title="فلش‌کارت"
                description="مرور سریع"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/flashcards")}
              />
            </div>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <ToolCard
                icon={Flame}
                title="استریک مطالعه"
                description="ردیابی روزهای مطالعه"
                gradient="bg-gradient-to-r from-orange-500 to-red-500"
                onClick={() => handleToolClick("/study-streak")}
              />
              <ToolCard
                icon={Swords}
                title="نبرد مطالعه"
                description="رقابت با دوستان"
                gradient="bg-gradient-to-r from-red-500 to-orange-500"
                onClick={() => handleToolClick("/study-battle")}
              />
              <ToolCard
                icon={Heart}
                title="دیوار انگیزشی"
                description="جملات الهام‌بخش"
                gradient="bg-gradient-to-r from-pink-500 to-purple-500"
                onClick={() => handleToolClick("/motivation-wall")}
              />
              <ToolCard
                icon={Trophy}
                title="ماموریت‌های روزانه"
                description="جوایز روزانه"
                gradient="bg-gradient-to-r from-yellow-500 to-red-500"
                onClick={() => handleToolClick("/daily-quests")}
              />
              <ToolCard
                icon={User}
                title="آواتار"
                description="شخصی‌سازی آواتار"
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => handleToolClick("/avatar-customizer")}
              />
              <ToolCard
                icon={Trophy}
                title="جایزه‌ها"
                description="دستاوردهای من"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/leaderboard")}
              />
              <ToolCard
                icon={Palette}
                title="تم‌ها"
                description="شخصی‌سازی ظاهر"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/theme-settings")}
              />
              <ToolCard
                icon={Music}
                title="موسیقی"
                description="پلی‌لیست مطالعه"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/music-player")}
              />
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <ToolCard
                icon={MessageSquare}
                title="گروه‌های درسی"
                description="چت گروهی"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/forum")}
              />
              <ToolCard
                icon={Users}
                title="دوستان"
                description="لیست دوستان"
                gradient="gradient-secondary"
                onClick={() => handleToolClick("/profile")}
              />
              <ToolCard
                icon={Trophy}
                title="تابلوی امتیازات"
                description="رده‌بندی کاربران"
                gradient="gradient-accent"
                onClick={() => handleToolClick("/leaderboard")}
              />
              <ToolCard
                icon={Users}
                title="معرفی دوستان"
                description="دعوت از دوستان"
                gradient="gradient-primary"
                onClick={() => handleToolClick("/referral")}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
