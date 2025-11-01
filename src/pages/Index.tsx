import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, BookOpen, Target, Sparkles, MessageSquare, CheckCircle, TrendingUp, Users, Award, Zap, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageView } from "@/hooks/usePageView";

const Index = () => {
  const navigate = useNavigate();
  usePageView();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">Easy Dars</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                ورود
              </Button>
              <Button
                size="sm"
                className="gradient-primary shadow-glow"
                onClick={() => navigate("/auth")}
              >
                ثبت‌نام رایگان
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:32px_32px]"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        
        <div className="container relative mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">پلتفرم یادگیری هوشمند</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                هوش مصنوعی، معلم شخصی تو برای{" "}
                <span className="text-gradient">یادگیری بهتر</span>
                <span className="inline-block animate-bounce-slow ml-2">📚🤖</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                با Easy Dars، درساتو سریع‌تر یاد بگیر، سوالاتت رو بپرس و پیشرفتت رو ببین. 
                هوش مصنوعی همیشه کنارته!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gradient-primary hover:opacity-90 shadow-glow text-lg px-8"
                  onClick={() => navigate("/auth")}
                >
                  شروع یادگیری
                  <Sparkles className="w-5 h-5 mr-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 hover-lift border-2"
                  onClick={() => navigate("/dashboard")}
                >
                  مشاهده دمو
                  <Brain className="w-5 h-5 mr-2" />
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">رایگان برای همیشه</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">بدون نیاز به کارت</span>
                </div>
              </div>
            </div>

            {/* Right Demo Chat */}
            <div className="relative animate-scale-in hidden md:block">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-500"></div>
              <Card className="relative glassmorphism-card rounded-3xl p-8 border-2 border-primary/20 shadow-glow">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">دانش‌آموز:</p>
                      <p className="text-sm text-muted-foreground">مشتق e^x چیه؟</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Easy Dars AI:</p>
                      <p className="text-sm">مشتق e^x برابر خودش یعنی e^x است! این یکی از ویژگی‌های خاص این تابع نمایی هست.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              چرا <span className="text-gradient">Easy Dars</span>؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ابزارهای هوشمند برای یادگیری بهتر و سریع‌تر
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover-lift glassmorphism-card border-primary/10 animate-scale-in group">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">💬 خلاصه‌سازی دروس با AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                متن‌های طولانی رو در چند ثانیه خلاصه کن و نکات کلیدی رو یاد بگیر
              </p>
            </Card>

            <Card className="p-8 hover-lift glassmorphism-card border-secondary/10 animate-scale-in delay-100 group">
              <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">🧮 حل تمرین‌ها و سوالات</h3>
              <p className="text-muted-foreground leading-relaxed">
                سوالاتت رو بپرس و توضیح کامل با مثال دریافت کن
              </p>
            </Card>

            <Card className="p-8 hover-lift glassmorphism-card border-primary/10 animate-scale-in delay-200 group">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">🕒 برنامه‌ریزی هوشمند</h3>
              <p className="text-muted-foreground leading-relaxed">
                برنامه مطالعه شخصی‌سازی شده بر اساس اهداف و عملکردت
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2 animate-fade-in">
              <div className="text-5xl font-bold text-gradient">10K+</div>
              <p className="text-muted-foreground">دانش‌آموز فعال</p>
            </div>
            <div className="space-y-2 animate-fade-in delay-100">
              <div className="text-5xl font-bold text-gradient">50K+</div>
              <p className="text-muted-foreground">سوال پاسخ داده شده</p>
            </div>
            <div className="space-y-2 animate-fade-in delay-200">
              <div className="text-5xl font-bold text-gradient">98%</div>
              <p className="text-muted-foreground">رضایت کاربران</p>
            </div>
            <div className="space-y-2 animate-fade-in delay-300">
              <div className="text-5xl font-bold text-gradient">24/7</div>
              <p className="text-muted-foreground">پشتیبانی AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              یادگیری <span className="text-gradient">سرگرم‌کننده</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              با سیستم امتیازدهی و مدال‌ها انگیزه خودت رو حفظ کن
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center hover-lift">
              <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">سیستم امتیاز</h3>
              <p className="text-sm text-muted-foreground">با هر فعالیت امتیاز کسب کن و سطحت رو بالا ببر</p>
            </Card>

            <Card className="p-6 text-center hover-lift">
              <div className="w-16 h-16 rounded-full gradient-secondary mx-auto mb-4 flex items-center justify-center shadow-glow">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">پیشرفت روزانه</h3>
              <p className="text-sm text-muted-foreground">نمودارهای پیشرفت و آمار دقیق از عملکردت</p>
            </Card>

            <Card className="p-6 text-center hover-lift">
              <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">رقابت با دوستان</h3>
              <p className="text-sm text-muted-foreground">در جدول امتیازات با دوستانت رقابت کن</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">ثبت‌نام در ۳۰ ثانیه</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold">
              آماده‌ای یادگیری رو شروع کنی؟
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              همین حالا ثبت‌نام کن و از قدرت هوش مصنوعی برای یادگیری بهتر استفاده کن
            </p>
            <Button 
              size="lg" 
              className="gradient-primary hover:opacity-90 shadow-glow text-lg px-12 py-6"
              onClick={() => navigate("/auth")}
            >
              شروع رایگان
              <GraduationCap className="w-6 h-6 mr-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Easy Dars</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025 Easy Dars. تمامی حقوق محفوظ است.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ساخته شده با ❤️ برای دانش‌آموزان ایرانی
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
