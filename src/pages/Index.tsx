import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  FileText,
  GraduationCap,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "خلاصه‌سازی هوشمند",
      description: "جزوات درسی خود را با هوش مصنوعی خلاصه کنید",
      gradient: "gradient-primary",
      delay: "0s",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "حل سوالات",
      description: "پاسخ دقیق و کامل سوالات درسی با توضیحات گام به گام",
      gradient: "gradient-secondary",
      delay: "0.1s",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "مشاوره تحصیلی",
      description: "راهنمایی شخصی‌سازی شده برای پیشرفت تحصیلی",
      gradient: "gradient-accent",
      delay: "0.2s",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "برنامه‌ریزی مطالعه",
      description: "برنامه‌های مطالعاتی هوشمند متناسب با نیاز شما",
      gradient: "gradient-primary",
      delay: "0.3s",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="animate-float">
                <GraduationCap className="w-20 h-20 text-white drop-shadow-glow" />
              </div>
              <div className="animate-float" style={{ animationDelay: "1s" }}>
                <Sparkles className="w-16 h-16 text-yellow-300 drop-shadow-glow" />
              </div>
              <div className="animate-float" style={{ animationDelay: "2s" }}>
                <Zap className="w-14 h-14 text-cyan-300 drop-shadow-glow" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight">
              یادگیری هوشمند با
              <br />
              <span className="animate-neon-pulse inline-block">هوش مصنوعی</span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              پلتفرم هوش مصنوعی که به دانش‌آموزان کمک می‌کند تا سریع‌تر و بهتر یاد بگیرند 🚀
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate("/auth")}
                className="shadow-glow hover:shadow-neon transform hover:scale-105 transition-all"
              >
                <Sparkles className="ml-2 w-5 h-5" />
                شروع رایگان
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => navigate("/auth")}
              >
                ورود به حساب
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>رایگان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>بدون نیاز به کارت</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>هوش مصنوعی پیشرفته</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">ویژگی‌های پلتفرم</h2>
            <p className="text-xl text-muted-foreground">
              ابزارهای قدرتمند برای یادگیری بهتر
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-glow hover:border-primary/50 transition-all duration-300 animate-fade-in group cursor-pointer hover:scale-105"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-white shadow-neon group-hover:shadow-glow transition-all`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">چرا ما را انتخاب کنید؟</h2>
              <p className="text-xl text-muted-foreground">
                مزایای استفاده از پلتفرم هوشمند یادگیری
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <TrendingUp className="w-6 h-6" />,
                  title: "افزایش عملکرد تحصیلی",
                  description: "با استفاده از روش‌های علمی و هوش مصنوعی",
                },
                {
                  icon: <CheckCircle className="w-6 h-6" />,
                  title: "یادگیری شخصی‌سازی شده",
                  description: "متناسب با سطح و نیاز هر دانش‌آموز",
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "پاسخ‌های فوری و دقیق",
                  description: "دریافت پاسخ سوالات در لحظه",
                },
                {
                  icon: <BookOpen className="w-6 h-6" />,
                  title: "کاهش زمان مطالعه",
                  description: "با خلاصه‌سازی هوشمند مطالب",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-xl bg-card hover:shadow-glow border border-border/50 hover:border-primary/50 transition-all duration-300 animate-slide-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="gradient-primary p-3 rounded-lg h-fit text-white shadow-neon group-hover:shadow-glow transition-all">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-gradient transition-all">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              آماده‌اید شروع کنید؟
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
              همین الان به جمع دانش‌آموزان موفق بپیوندید و تجربه یادگیری متفاوت را حس کنید
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 shadow-glow hover:shadow-neon transform hover:scale-110 transition-all"
            >
              <GraduationCap className="ml-2 w-6 h-6" />
              ثبت‌نام رایگان
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;