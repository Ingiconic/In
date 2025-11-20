import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Target, Users, Award, Shield, Rocket, CheckCircle2, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.png";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="ایزی درس" className="w-10 h-10 object-contain" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                درباره Easy Dars
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src={logo} 
                alt="Easy Dars" 
                className="w-32 h-32 object-contain animate-float filter drop-shadow-2xl" 
              />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10"></div>
            </div>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Easy Dars
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            پلتفرم یادگیری هوشمند، مسیری نوین برای آموزش کارآمد و شخصی‌سازی‌شده
          </p>
        </div>

        {/* Main Content Cards */}
        <div className="space-y-8">
          {/* Vision & Mission Card */}
          <Card className="p-8 md:p-12 border-2 hover:border-primary/50 transition-all shadow-xl hover:shadow-2xl animate-fade-in bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  آغاز یک مسیر نوین
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  پلتفرم <strong className="text-foreground">Easy Dars</strong> به ابتکار و مدیریت{" "}
                  <strong className="text-primary">مهدی رنجبر</strong> راه‌اندازی شده است. این پروژه با هدف 
                  ارائهٔ تجربه‌ای نوین، کارآمد و هوشمند در حوزهٔ آموزش، به‌ویژه برای دانش‌آموزان و دانشجویانی 
                  که به دنبال روش‌های مؤثرتر برای یادگیری و مرور هستند، تأسیس گردید.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              هرچند پروژه در مرحلهٔ آغازین و با هدایت یک فرد شکل گرفته است، «تیم یادگیری هوشمند» 
              به‌عنوان نمادی از نظم و ساختار فنی و محتوایی که پشت سرویس قرار دارد معرفی شده تا نشان دهد 
              توسعهٔ پلتفرم ماهیتی حرفه‌ای و هدف‌مند دارد.
            </p>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-xl animate-fade-in bg-gradient-to-br from-card to-primary/5" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gradient">ابزارهای هوشمند</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>خلاصه‌ساز هوشمند برای استخراج نکات کلیدی</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>تولید خودکار آزمون‌ها برای سنجش یادگیری</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>ساخت فلش‌کارت برای مرور سریع مطالب</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>نقشهٔ ذهنی برای سازمان‌دهی مفاهیم</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>برنامه‌ریز مطالعاتی برای مدیریت زمان</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-2 hover:border-secondary/50 transition-all hover:shadow-xl animate-fade-in bg-gradient-to-br from-card to-secondary/5" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gradient">رویکرد ما</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ویژگی متمایز <strong className="text-foreground">Easy Dars</strong> در ترکیب ساده‌سازی تجربهٔ 
                کاربری و بهره‌گیری از تکنیک‌های نوین برای شخصی‌سازی محتوای آموزشی است.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                فناوری نباید جای معلم را بگیرد بلکه باید <strong className="text-primary">ابزار معلم</strong> و{" "}
                <strong className="text-secondary">همراه دانش‌آموز</strong> باشد.
              </p>
            </Card>
          </div>

          {/* Quality & Security */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-xl animate-fade-in bg-gradient-to-br from-card to-card/50" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gradient">تعهد به کیفیت</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">
                ما به کیفیت محتوای تولیدشده اهمیت زیادی می‌دهیم و فرآیندهای کنترل کیفیت و بازخوردگیری 
                در دستور کار قرار دارند.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                خروجی‌ها قابل‌اطمینان و همراستا با منابع آموزشی رسمی طراحی می‌شوند تا دانش‌آموزان 
                بتوانند با اطمینان از آن‌ها استفاده کنند.
              </p>
            </Card>

            <Card className="p-8 border-2 hover:border-secondary/50 transition-all hover:shadow-xl animate-fade-in bg-gradient-to-br from-card to-card/50" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gradient">امنیت و حریم خصوصی</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">
                حفاظت از اطلاعات کاربران یکی از پایه‌های اعتماد است. در مسیر توسعهٔ پلتفرم، 
                شفاف‌سازی سیاست‌های حفاظت از داده‌ها در اولویت قرار دارد.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                کاربران از حقوق خود دربارهٔ داده‌ها آگاه خواهند شد و شیوه‌های ایمن ذخیره‌سازی 
                و مدیریت اطلاعات به‌کار گرفته می‌شود.
              </p>
            </Card>
          </div>

          {/* Vision Card */}
          <Card className="p-8 md:p-12 border-2 hover:border-primary/50 transition-all shadow-xl hover:shadow-2xl animate-fade-in bg-gradient-to-br from-primary/10 via-card to-secondary/10" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  چشم‌انداز آینده
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  چشم‌انداز Easy Dars گسترش مداوم خدمات و افزایش عمق فنی و محتوایی پلتفرم است. 
                  هدف نهایی ما تبدیل شدن به یک <strong className="text-primary">همراه قابل‌اعتماد</strong> برای 
                  مسیر یادگیری کاربران است.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">بهبود مدل‌های هوشمند</h4>
                  <p className="text-sm text-muted-foreground">افزایش دقت و کارایی هوش مصنوعی</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">اپلیکیشن موبایل</h4>
                  <p className="text-sm text-muted-foreground">دسترسی آسان در هر زمان و مکان</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-secondary/20">
                <TrendingUp className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">همکاری با مدرسین</h4>
                  <p className="text-sm text-muted-foreground">ایجاد شبکه‌ای از تولیدکنندگان محتوا</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-secondary/20">
                <TrendingUp className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">ابزارهای پیشرفته</h4>
                  <p className="text-sm text-muted-foreground">امکانات بیشتر برای پیگیری پیشرفت</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Commitment Card */}
          <Card className="p-8 md:p-10 text-center border-2 border-primary/30 shadow-xl animate-fade-in bg-gradient-to-br from-primary/5 to-secondary/5" style={{ animationDelay: "0.6s" }}>
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              تعهد ما
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              همواره در مسیر ارتقای <strong className="text-primary">کیفیت</strong>،{" "}
              <strong className="text-secondary">شفافیت</strong> و{" "}
              <strong className="text-primary">تجربهٔ کاربری</strong> حرکت می‌کنیم تا 
              بهترین خدمات آموزشی را به شما ارائه دهیم.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: "0.7s" }}>
          <Button 
            size="lg" 
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all text-lg px-8 py-6 h-auto"
          >
            <span className="ml-2">شروع یادگیری</span>
            <Sparkles className="w-5 h-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default About;
