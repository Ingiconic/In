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
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "خلاصه‌سازی هوشمند",
      description: "جزوات درسی خود را با هوش مصنوعی خلاصه کنید",
      gradient: "gradient-primary",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "حل سوالات",
      description: "پاسخ دقیق و کامل سوالات درسی با توضیحات گام به گام",
      gradient: "gradient-secondary",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "مشاوره تحصیلی",
      description: "راهنمایی شخصی‌سازی شده برای پیشرفت تحصیلی",
      gradient: "gradient-accent",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "برنامه‌ریزی مطالعه",
      description: "برنامه‌های مطالعاتی هوشمند متناسب با نیاز شما",
      gradient: "gradient-primary",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="animate-float">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
              <div className="animate-float" style={{ animationDelay: "1s" }}>
                <Sparkles className="w-12 h-12 text-yellow-300" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              یادگیری هوشمند با
              <br />
              <span className="text-yellow-300">هوش مصنوعی</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              پلتفرم هوش مصنوعی که به دانش‌آموزان کمک می‌کند تا سریع‌تر و بهتر یاد بگیرند
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate("/auth")}
              >
                شروع رایگان
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate("/auth")}
              >
                ورود به حساب
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">ویژگی‌های پلتفرم</h2>
            <p className="text-xl text-muted-foreground">
              ابزارهای قدرتمند برای یادگیری بهتر
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">چرا ما را انتخاب کنید؟</h2>
              <p className="text-xl text-muted-foreground">
                مزایای استفاده از پلتفرم هوشمند یادگیری
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className="flex gap-4 p-6 rounded-xl bg-card hover:shadow-md transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="gradient-primary p-3 rounded-lg h-fit text-white">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              آماده‌اید شروع کنید؟
            </h2>
            <p className="text-xl text-white/90">
              همین الان به جمع دانش‌آموزان موفق بپیوندید
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90"
            >
              ثبت‌نام رایگان
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
