import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, FileText, ArrowRight, BookOpen, CheckSquare, HelpCircle, Sparkles, LogOut, User, Trophy, Star, Zap, Target, Clock, Brain, TrendingUp, BookMarked, PenTool, Info, Award, TrendingDown } from "lucide-react";
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

  const userLevel = profile?.points ? Math.floor(profile.points / 100) + 1 : 1;
  const progressInLevel = profile?.points ? (profile.points % 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glassmorphism border-b border-border/30 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="gradient-primary p-2 md:p-3 rounded-xl md:rounded-2xl shadow-glow animate-pulse-glow">
                <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gradient animate-neon-pulse">ایزی درس</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">پلتفرم یادگیری هوشمند</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="hidden lg:flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/30 shadow-glow">
                <Trophy className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-bold text-gradient">سطح {userLevel}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-card/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-border/30 shadow-glow">
                <Star className="w-3.5 h-3.5 md:w-5 md:h-5 text-secondary animate-pulse" />
                <span className="font-bold text-xs md:text-base">{profile?.points || 0}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/about")}
                className="hover:shadow-glow hover-lift p-1.5 md:p-2.5"
                title="درباره ما"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/progress")}
                className="hover:shadow-glow hover-lift p-1.5 md:p-2.5"
                title="پیشرفت"
              >
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="hover:shadow-glow hover-lift p-1.5 md:p-2.5"
                title="پروفایل"
              >
                <User className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:shadow-glow hover-lift text-destructive p-1.5 md:p-2.5"
                title="خروج"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-6 py-4 md:py-8 max-w-7xl">
        {/* Welcome Section - Larger and More Attractive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          {/* Main Welcome Card */}
          <Card className="lg:col-span-2 glassmorphism-card border-primary/20 shadow-glow animate-fade-in overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-500" />
            
            <CardHeader className="relative p-5 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="gradient-primary p-3 md:p-4 rounded-xl md:rounded-2xl shadow-neon animate-pulse-glow">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-4xl text-gradient animate-neon-pulse mb-1">
                      سلام {profile?.full_name} 👋
                    </CardTitle>
                    <CardDescription className="text-sm md:text-lg">
                      امروز آماده‌ای برای یادگیری جدید؟
                    </CardDescription>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="flex items-center gap-3 bg-primary/10 px-4 py-3 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover-lift">
                  <div className="gradient-primary p-2 rounded-lg shadow-neon">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">آزمون‌های تکمیل شده</p>
                    <p className="text-xl md:text-2xl font-bold">{profile?.exams_taken || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-secondary/10 px-4 py-3 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-all hover-lift">
                  <div className="gradient-secondary p-2 rounded-lg shadow-neon">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">سطح فعلی</p>
                    <p className="text-xl md:text-2xl font-bold">سطح {userLevel}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 md:mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground">پیشرفت تا سطح بعدی</span>
                  <span className="text-xs md:text-sm font-bold text-gradient">{progressInLevel}%</span>
                </div>
                <div className="h-2 md:h-3 bg-card/50 rounded-full overflow-hidden border border-border/30">
                  <div 
                    className="h-full gradient-primary transition-all duration-1000 shadow-glow"
                    style={{ width: `${progressInLevel}%` }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Stats Card */}
          <Card className="glassmorphism-card border-primary/20 shadow-glow animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="p-5 md:p-6">
              <CardTitle className="text-lg md:text-xl mb-4 text-gradient flex items-center gap-2">
                <Award className="w-5 h-5" />
                آمار سریع
              </CardTitle>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30 hover-lift">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    <span className="text-sm">امتیاز کل</span>
                  </div>
                  <span className="font-bold text-gradient">{profile?.points || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30 hover-lift">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-sm">سطح</span>
                  </div>
                  <span className="font-bold">{userLevel}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30 hover-lift">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-accent" />
                    <span className="text-sm">آزمون‌ها</span>
                  </div>
                  <span className="font-bold">{profile?.exams_taken || 0}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Feature Cards Grid */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gradient flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            ابزارهای یادگیری
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/chat")}
              style={{ animationDelay: '0.3s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">پیام‌رسان</CardTitle>
                </div>
                <CardDescription className="text-sm">چت با دوستان و عضویت در کانال‌ها</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/chat-friends")}
              style={{ animationDelay: '0.35s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">دوستان</CardTitle>
                </div>
                <CardDescription className="text-sm">مدیریت دوستان و ارتباطات</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/questions")}
              style={{ animationDelay: '0.4s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">پرسش درسی</CardTitle>
                </div>
                <CardDescription className="text-sm">پاسخ به سوالات با هوش مصنوعی</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/summarize")}
              style={{ animationDelay: '0.45s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">خلاصه‌سازی</CardTitle>
                </div>
                <CardDescription className="text-sm">خلاصه مطالب درسی با AI</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/exam")}
              style={{ animationDelay: '0.5s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">آزمون ساز</CardTitle>
                </div>
                <CardDescription className="text-sm">ایجاد آزمون با هوش مصنوعی</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/step-by-step")}
              style={{ animationDelay: '0.55s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <PenTool className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">حل تمرین</CardTitle>
                </div>
                <CardDescription className="text-sm">حل گام به گام تمرینات</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/progress")}
              style={{ animationDelay: '0.6s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">پیشرفت من</CardTitle>
                </div>
                <CardDescription className="text-sm">آمار و نمودار پیشرفت</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="glassmorphism-card hover:shadow-glow hover-lift cursor-pointer group animate-scale-in border-primary/20"
              onClick={() => navigate("/consultation")}
              style={{ animationDelay: '0.65s' }}
            >
              <CardHeader className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon group-hover:shadow-glow group-hover:scale-110 transition-all">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-all">مشاور هوشمند</CardTitle>
                </div>
                <CardDescription className="text-sm">مشاوره تحصیلی هوشمند</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* About Section */}
        <Card className="glassmorphism-card border-primary/20 shadow-glow animate-fade-in mt-8 md:mt-12" style={{ animationDelay: '0.7s' }}>
          <CardHeader className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="gradient-primary p-3 rounded-xl shadow-neon">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl text-gradient">درباره ایزی درس</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base leading-relaxed">
                  ایزی درس با هدف تسهیل یادگیری و افزایش کارایی مطالعه دانش‌آموزان ایرانی ساخته شده است. 
                  این پلتفرم با استفاده از هوش مصنوعی پیشرفته، تجربه‌ای نوین از یادگیری را برای شما فراهم می‌کند 
                  و با ارائه ابزارهای هوشمند، مسیر موفقیت تحصیلی شما را هموار می‌سازد.
                </CardDescription>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-border/30">
                <h3 className="font-bold text-lg md:text-xl mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  تیم مدیریت
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="gradient-primary p-2 rounded-lg shadow-neon">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">مهدی رنجبر</p>
                      <p className="text-sm text-muted-foreground">مدیر و توسعه‌دهنده</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="gradient-secondary p-2 rounded-lg shadow-neon">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ایمیل تماس:</p>
                      <a 
                        href="mailto:Ing59659@gmail.com" 
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        Ing59659@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
