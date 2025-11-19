import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag, Users, FileText, CheckSquare, HelpCircle, Trophy, PenTool, Brain, BookOpen, Lightbulb, CreditCard, Coins, MessageSquare } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { COIN_COSTS } from "@/lib/coinCosts";
import { useLanguage } from "@/contexts/LanguageContext";

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
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-secondary" />
                <h3 className="text-xl font-bold">ابزارهای مطالعه</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/mind-map")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="gradient-secondary p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">نقشه ذهنی</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.MINDMAP_GENERATE} سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/flashcards")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="gradient-accent p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">فلش کارت</CardTitle>
                      <CardDescription className="text-xs">{COIN_COSTS.FLASHCARD_GENERATE} سکه</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/resources")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">منابع</CardTitle>
                      <CardDescription className="text-xs">رایگان</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group border-secondary/10"
                  onClick={() => navigate("/coin-shop")}
                >
                  <CardHeader className="p-4 md:p-5">
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-2xl shadow-glow group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold">فروشگاه سکه</CardTitle>
                      <CardDescription className="text-xs">خرید سکه</CardDescription>
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
