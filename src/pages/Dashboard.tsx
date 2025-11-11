import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, FileText, CheckSquare, HelpCircle, Sparkles, Zap, Trophy, PenTool, Brain, TrendingUp, Award, Target, BookOpen, Calendar } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  usePageView();
  const [profile, setProfile] = useState<any>(null);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Load exams count
      const { count: examsCount } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load messages count
      const { count: messagesCount } = await supabase
        .from("group_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load friends count
      const { count: friendsCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load study plans count
      const { count: studyPlansCount } = await supabase
        .from("study_plans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-2xl p-6 md:p-8 mb-8 border border-border/30">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            سلام {profile?.full_name || "کاربر"}! به <span className="text-gradient">ایزی درس</span> خوش اومدی 👋
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            آماده‌ای برای یادگیری جدید؟ بیا با هم شروع کنیم!
          </p>
        </div>

        {/* Stats Overview */}
        {!loading && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              آمار پیشرفت شما
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="gradient-primary p-3 rounded-xl shadow-glow mb-2">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
                    <p className="text-xs text-muted-foreground mt-1">امتیاز کل</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="gradient-secondary p-3 rounded-xl shadow-glow mb-2">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-secondary">{stats.examsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">آزمون انجام شده</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-glow mb-2">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{stats.messagesCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">پیام ارسالی</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-glow mb-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{stats.friendsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">دوست</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-glow mb-2">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-purple-500">{stats.studyPlansCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">برنامه مطالعاتی</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            ابزارهای یادگیری
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/chat")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">پیام‌رسان</CardTitle>
                </div>
                <CardDescription className="text-sm">چت با دوستان و عضویت در کانال‌ها</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/chat-friends")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">دوستان</CardTitle>
                </div>
                <CardDescription className="text-sm">مدیریت دوستان و ارتباطات</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/questions")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">پرسش درسی</CardTitle>
                </div>
                <CardDescription className="text-sm">پاسخ به سوالات با هوش مصنوعی</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/summarize")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">خلاصه‌سازی</CardTitle>
                </div>
                <CardDescription className="text-sm">خلاصه مطالب درسی با AI</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/exam")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">آزمون ساز</CardTitle>
                </div>
                <CardDescription className="text-sm">ایجاد آزمون با هوش مصنوعی</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/step-by-step")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <PenTool className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">حل تمرین</CardTitle>
                </div>
                <CardDescription className="text-sm">حل گام به گام تمرینات</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/progress")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">پیشرفت من</CardTitle>
                </div>
                <CardDescription className="text-sm">آمار و نمودار پیشرفت</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
              onClick={() => navigate("/consultation")}
            >
              <CardHeader className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="gradient-primary p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-colors">مشاور هوشمند</CardTitle>
                </div>
                <CardDescription className="text-sm">مشاوره تحصیلی هوشمند</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* About Section */}
        <Card className="glassmorphism-card border-primary/10">
          <CardHeader className="p-6">
            <CardTitle className="text-xl mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              درباره ایزی درس
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              ایزی درس با هدف تسهیل یادگیری و افزایش کارایی مطالعه دانش‌آموزان ایرانی ساخته شده است. 
              این پلتفرم با استفاده از هوش مصنوعی پیشرفته، تجربه‌ای نوین از یادگیری را برای شما فراهم می‌کند.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
