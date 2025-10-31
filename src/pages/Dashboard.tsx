import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  MessageSquare,
  Calendar,
  LogOut,
  FileText,
  HelpCircle,
  Sparkles,
  TrendingUp,
  BookCheck,
  Brain,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  const features = [
    {
      title: "خلاصه‌سازی مطالب",
      description: "جزوات و مطالب درسی خود را خلاصه کنید",
      icon: FileText,
      gradient: "gradient-primary",
      path: "/summarize",
      delay: "0s",
    },
    {
      title: "حل سوالات",
      description: "سوالات خود را از هوش مصنوعی بپرسید",
      icon: HelpCircle,
      gradient: "gradient-secondary",
      path: "/questions",
      delay: "0.05s",
    },
    {
      title: "مشاوره تحصیلی",
      description: "راهنمایی و مشاوره شخصی‌سازی شده",
      icon: MessageSquare,
      gradient: "gradient-accent",
      path: "/consultation",
      delay: "0.1s",
    },
    {
      title: "برنامه مطالعه",
      description: "برنامه‌ریزی هوشمند برای مطالعه",
      icon: Calendar,
      gradient: "gradient-primary",
      path: "/study-plan",
      delay: "0.15s",
    },
    {
      title: "جزوات درسی",
      description: "دسترسی به جزوات همه دروس",
      icon: BookOpen,
      gradient: "gradient-secondary",
      path: "/study-books",
      delay: "0.2s",
    },
    {
      title: "گام به گام",
      description: "پاسخ‌های تشریحی سوالات کتاب",
      icon: BookCheck,
      gradient: "gradient-accent",
      path: "/step-by-step",
      delay: "0.25s",
    },
    {
      title: "آزمون هوشمند",
      description: "ایجاد آزمون با هوش مصنوعی",
      icon: Brain,
      gradient: "gradient-primary",
      path: "/exam",
      delay: "0.3s",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="gradient-hero p-2 rounded-lg shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-center sm:text-right">
              <h1 className="text-xl font-bold text-gradient">پلتفرم یادگیری هوشمند</h1>
              <p className="text-sm text-muted-foreground">
                خوش آمدید، {profile?.full_name} 👋
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="sm" className="hover:shadow-glow">
            <LogOut className="ml-2 w-4 h-4" />
            خروج
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-hero text-white shadow-glow animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                  داشبورد من
                </h2>
                <p className="text-lg text-white/90">
                  ابزارهای هوشمند برای پیشرفت تحصیلی شما
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold">آماده یادگیری</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-glow hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-fade-in hover:scale-105"
              style={{ animationDelay: feature.delay }}
              onClick={() => navigate(feature.path)}
            >
              <div className="flex flex-col h-full">
                <div className={`${feature.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-neon group-hover:shadow-glow transition-all`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1 leading-relaxed">
                  {feature.description}
                </p>
                <Button variant="outline" size="sm" className="w-full group-hover:border-primary/50">
                  شروع کنید
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <Card className="p-6 shadow-glow border-primary/20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-4">
              <div className="gradient-primary p-3 rounded-lg shadow-neon">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">مطالب خلاصه شده</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-glow border-secondary/20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-4">
              <div className="gradient-secondary p-3 rounded-lg shadow-neon">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">سوالات پرسیده شده</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-glow border-accent/20 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-4">
              <div className="gradient-accent p-3 rounded-lg shadow-neon">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">برنامه‌های مطالعه</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;