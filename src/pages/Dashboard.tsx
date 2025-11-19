import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag, Users, FileText, CheckSquare, HelpCircle, Trophy, PenTool, Brain, BookOpen, Lightbulb, CreditCard, Coins, MessageSquare, Calendar, Award, Flame, Target } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useLanguage } from "@/contexts/LanguageContext";
import { GamificationWidget } from "@/components/gamification/GamificationWidget";

const Dashboard = () => {
  const navigate = useNavigate();
  usePageView();
  const { t } = useLanguage();
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
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        {/* Welcome Hero - Compact */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-xl p-3 md:p-4 mb-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {t("dashboard.welcome")} {profile?.full_name || t("common.user")}! 👋
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-center">
                <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/30">
                  <Coins className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-sm font-bold text-yellow-500 mt-0.5">{profile?.coins || 0}</p>
              </div>
              <div className="text-center hidden sm:block">
                <div className="gradient-primary p-2 rounded-lg">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-primary mt-0.5">{stats.totalPoints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-5">
          {/* AI Tools Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">{t("dashboard.aiTools")}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Card 
                className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
                onClick={() => navigate("/questions")}
              >
                <CardHeader className="p-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="gradient-primary p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-sm font-bold">{t("nav.questions")}</CardTitle>
                    <CardDescription className="text-xs opacity-80">{COIN_COSTS.QUESTION_ANSWER} {t("header.coins")}</CardDescription>
                  </div>
                </CardHeader>
              </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/summarize")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="gradient-secondary p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">{t("nav.summarize")}</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.SUMMARIZE} {t("header.coins")}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/exam")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="gradient-accent p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">{t("nav.exam")}</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.EXAM_GENERATE} {t("header.coins")}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-primary/10"
                  onClick={() => navigate("/consultation")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="gradient-primary p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">مشاور هوشمند</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.CONSULTATION} سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Study Tools */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold">ابزارهای مطالعاتی</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Gamification Widget - Full Width on Mobile */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <GamificationWidget />
                </div>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group"
                  onClick={() => navigate("/mindmap-ai")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-secondary p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <PenTool className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">{t("nav.mindMap")}</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.MINDMAP_GENERATE} {t("header.coins")}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group"
                  onClick={() => navigate("/flashcards")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="gradient-accent p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">{t("nav.flashcards")}</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.FLASHCARD_GENERATE} {t("header.coins")}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Focus Mode */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => navigate("/focus")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">حالت تمرکز</CardTitle>
                      <CardDescription className="text-xs">پومودورو</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Forum */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10"
                  onClick={() => navigate("/forum")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">انجمن بحث</CardTitle>
                      <CardDescription className="text-xs">پرسش و پاسخ</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Leaderboard */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                  onClick={() => navigate("/leaderboard")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">جدول امتیازات</CardTitle>
                      <CardDescription className="text-xs">مقایسه با دیگران</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Study Calendar */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10"
                  onClick={() => navigate("/calendar")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">تقویم مطالعاتی</CardTitle>
                      <CardDescription className="text-xs">برنامه‌ریزی</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Shop */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => navigate("/shop")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">فروشگاه</CardTitle>
                      <CardDescription className="text-xs">خرید با سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                {/* Theme Settings */}
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-pink-500/10"
                  onClick={() => navigate("/theme")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">تنظیمات ظاهری</CardTitle>
                      <CardDescription className="text-xs">شخصی‌سازی</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group"
                  onClick={() => navigate("/coin-shop")}
                >
                  <CardHeader className="p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Coins className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold">{t("nav.coinShop")}</CardTitle>
                      <CardDescription className="text-xs">{t("dashboard.purchaseCoins")}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
