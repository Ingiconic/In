import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, FileText, ArrowRight, BookOpen, CheckSquare, HelpCircle, Sparkles, LogOut, User, Trophy, Star, Zap, Target, Clock, Brain, TrendingUp, BookMarked, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageView } from "@/hooks/usePageView";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "خروج موفق",
        description: "با موفقیت از حساب خود خارج شدید",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در خروج پیش آمد",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glassmorphism border-b border-border/30 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="gradient-primary p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-glow animate-pulse-glow">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-gradient animate-neon-pulse">ایزی درس</h1>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 md:gap-2 bg-card/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-border/30 shadow-glow">
                <Trophy className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary animate-pulse" />
                <span className="font-bold text-gradient text-xs md:text-base">سطح {profile?.points ? Math.floor(profile.points / 100) + 1 : 1}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-card/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-border/30 shadow-glow">
                <Star className="w-3.5 h-3.5 md:w-5 md:h-5 text-secondary animate-pulse" />
                <span className="font-bold text-xs md:text-base">{profile?.points || 0}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="hover:shadow-glow hover-lift p-1.5 md:p-2"
              >
                <User className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:shadow-glow hover-lift text-destructive p-1.5 md:p-2"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Welcome Card */}
        <Card className="mb-4 md:mb-8 glassmorphism-card border-primary/20 shadow-glow animate-fade-in overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardHeader className="relative p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon animate-pulse-glow">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-2xl text-gradient animate-neon-pulse">
                  سلام {profile?.full_name} 👋
                </CardTitle>
                <CardDescription className="text-xs md:text-base">
                  آماده برای یادگیری امروز؟
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 mt-3 md:mt-4">
              <div className="flex items-center gap-1.5 md:gap-2 bg-primary/10 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-primary/20 w-full sm:w-auto">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                <span className="font-bold text-xs md:text-base">امتحان‌ها: {profile?.exams_taken || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-secondary/10 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-secondary/20 w-full sm:w-auto">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-secondary flex-shrink-0" />
                <span className="font-bold text-xs md:text-base">پیشرفت: {profile?.points ? Math.floor((profile.points % 100)) : 0}%</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* AI Planning Section - Floating Card */}
        <Card className="mb-4 md:mb-6 glassmorphism-card border-secondary/30 shadow-glow animate-fade-in bg-gradient-to-br from-secondary/5 to-transparent">
          <CardHeader className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="gradient-primary p-1.5 md:p-2 rounded-lg shadow-neon animate-pulse-glow">
                  <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <CardTitle className="text-sm md:text-base text-gradient">برنامه‌ریزی هوشمند</CardTitle>
              </div>
              <Button
                size="sm"
                variant="hero"
                onClick={() => navigate("/study-plan")}
                className="text-xs md:text-sm shadow-glow hover-lift"
              >
                ایجاد برنامه
              </Button>
            </div>
            <CardDescription className="text-xs md:text-sm mt-2">
              هوش مصنوعی برنامه مطالعاتی شخصی‌سازی شده برای شما می‌سازد
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/chat")}
            style={{ animationDelay: '0.1s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">پیام‌رسان</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">چت با دوستان و کانال‌ها</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/chat-friends")}
            style={{ animationDelay: '0.2s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">دوستان</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">مدیریت دوستان</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/questions")}
            style={{ animationDelay: '0.3s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">سوال و جواب</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">پرسش از هوش مصنوعی</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/summarize")}
            style={{ animationDelay: '0.4s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">خلاصه‌سازی</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">خلاصه مطالب درسی</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/exam")}
            style={{ animationDelay: '0.5s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">آزمون ساز</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">ایجاد آزمون با هوش مصنوعی</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/step-by-step")}
            style={{ animationDelay: '0.6s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <PenTool className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">حل تمرین</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">حل گام به گام</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/study-books")}
            style={{ animationDelay: '0.7s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <BookMarked className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">جزوات درسی</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">مطالعه منظم</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
            onClick={() => navigate("/consultation")}
            style={{ animationDelay: '0.8s' }}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="gradient-primary p-2 md:p-3 rounded-lg md:rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                  <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-xl group-hover:text-gradient transition-all">مشاور هوشمند</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">مشاوره تحصیلی</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
