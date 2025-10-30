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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-hero p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">پلتفرم یادگیری هوشمند</h1>
              <p className="text-sm text-muted-foreground">
                خوش آمدید، {profile?.full_name}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="sm">
            <LogOut className="ml-2 w-4 h-4" />
            خروج
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">داشبورد من</h2>
          <p className="text-muted-foreground">
            ابزارهای هوشمند برای پیشرفت تحصیلی شما
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* خلاصه‌سازی مطالب */}
          <Card
            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.1s" }}
            onClick={() => navigate("/summarize")}
          >
            <div className="flex items-start gap-4">
              <div className="gradient-primary p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">خلاصه‌سازی مطالب</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  جزوات و مطالب درسی خود را خلاصه کنید
                </p>
                <Button variant="outline" size="sm">
                  شروع کنید
                </Button>
              </div>
            </div>
          </Card>

          {/* حل سوالات */}
          <Card
            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => navigate("/questions")}
          >
            <div className="flex items-start gap-4">
              <div className="gradient-secondary p-3 rounded-lg">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">حل سوالات</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  سوالات خود را از هوش مصنوعی بپرسید
                </p>
                <Button variant="outline" size="sm">
                  شروع کنید
                </Button>
              </div>
            </div>
          </Card>

          {/* مشاوره تحصیلی */}
          <Card
            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.3s" }}
            onClick={() => navigate("/consultation")}
          >
            <div className="flex items-start gap-4">
              <div className="gradient-accent p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">مشاوره تحصیلی</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  راهنمایی و مشاوره شخصی‌سازی شده
                </p>
                <Button variant="outline" size="sm">
                  شروع کنید
                </Button>
              </div>
            </div>
          </Card>

          {/* برنامه‌ریزی مطالعه */}
          <Card
            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.4s" }}
            onClick={() => navigate("/study-plan")}
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">برنامه مطالعه</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  برنامه‌ریزی هوشمند برای مطالعه
                </p>
                <Button variant="outline" size="sm">
                  شروع کنید
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;