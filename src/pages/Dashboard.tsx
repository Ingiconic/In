import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, FileText, CheckSquare, HelpCircle, Sparkles, Trophy, PenTool, Brain, TrendingUp, Award, Target, BookOpen, Calendar, Lightbulb, CreditCard, Coins } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

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
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-6 md:p-8 mb-6 border border-primary/20 shadow-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-2">
                سلام {profile?.full_name || "کاربر"}! 👋
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                به <span className="text-gradient font-bold">ایزی درس</span> خوش اومدی - همه ابزارهای یادگیری در یک جا!
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/30 mb-1">
                  <Coins className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-500">{profile?.coins || 0}</p>
                <p className="text-xs text-muted-foreground">سکه</p>
              </div>
              <div className="text-center">
                <div className="gradient-primary p-3 rounded-xl shadow-glow mb-1">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">امتیاز</p>
              </div>
              <div className="text-center">
                <div className="gradient-secondary p-3 rounded-xl shadow-glow mb-1">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-secondary">{stats.examsCount}</p>
                <p className="text-xs text-muted-foreground">آزمون</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Unified Interface */}
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tools">
              <Sparkles className="w-4 h-4 ml-1" />
              ابزارها
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 ml-1" />
              آمار
            </TabsTrigger>
          </TabsList>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            {/* AI Tools Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">ابزارهای هوش مصنوعی</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/questions")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-primary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">پرسش درسی</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">2 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/summarize")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-primary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">خلاصه‌سازی</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">2 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/exam")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-primary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">آزمون ساز</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">5 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/consultation")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-primary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">مشاور هوشمند</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">رایگان</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Study Tools */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-secondary" />
                <h3 className="text-xl font-bold">ابزارهای مطالعه</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/mind-map")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-secondary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">نقشه ذهنی</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">4 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/flashcards")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-secondary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">فلش کارت</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">3 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/resources")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-secondary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">منابع</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">رایگان</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/study-plan")}
                >
                  <CardHeader className="p-3 md:p-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-secondary p-2 md:p-2.5 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <CardTitle className="text-xs md:text-base group-hover:text-gradient transition-colors">برنامه مطالعاتی</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs">3 سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
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
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-glow mb-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-purple-500">{stats.friendsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">دوست</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism-card border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-glow mb-2">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-orange-500">{stats.studyPlansCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">برنامه مطالعاتی</p>
                  </div>
                </CardContent>
              </Card>

              {/* Coins Display */}
              <Card className="glassmorphism-card border-yellow-500/20 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-glow mb-2">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{profile?.coins || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">سکه</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab - REMOVED */}
          <TabsContent value="recent">
            <Card className="glassmorphism-card">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  فعالیت‌های اخیر به زودی...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* About Section */}
        <Card className="glassmorphism-card border-primary/10 mt-6">
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
