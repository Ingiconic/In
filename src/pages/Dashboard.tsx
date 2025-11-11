import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Users, FileText, CheckSquare, HelpCircle, Sparkles, Zap, Trophy, PenTool, Brain, TrendingUp } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  usePageView();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-2xl p-6 md:p-8 mb-8 border border-border/30">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            سلام! به <span className="text-gradient">ایزی درس</span> خوش اومدی 👋
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            آماده‌ای برای یادگیری جدید؟ بیا با هم شروع کنیم!
          </p>
        </div>

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
