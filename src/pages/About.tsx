import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Heart, Lightbulb, Target, Users, Zap, Code } from "lucide-react";
import logo from "@/assets/logo.png";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="ایزی درس" className="w-10 h-10 object-contain" />
              <h1 className="text-xl font-bold text-gradient">درباره ما</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <Card className="p-8 md:p-12 mb-8 gradient-primary text-white shadow-glow animate-fade-in">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="ایزی درس" className="w-20 h-20 md:w-24 md:h-24 object-contain animate-float" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">ایزی درس</h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              پلتفرم هوشمند یادگیری با هوش مصنوعی که راه را برای آینده تحصیلی روشن‌تر هموار می‌کند
            </p>
          </div>
        </Card>

        {/* Story Section */}
        <Card className="p-6 md:p-8 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="gradient-primary p-3 rounded-lg shadow-neon">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-gradient">داستان ما</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                این پروژه توسط <strong className="text-foreground">مهدی رنجبر</strong> استارت شده است. با تجربه چالش‌های یادگیری و درک نیاز دانش‌آموزان به ابزارهای هوشمند، تصمیم گرفتیم پلتفرمی بسازیم که یادگیری را آسان‌تر، سریع‌تر و لذت‌بخش‌تر کند.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ایزی درس با استفاده از جدیدترین تکنولوژی‌های هوش مصنوعی، به دانش‌آموزان کمک می‌کند تا با سرعت بیشتری یاد بگیرند و به اهداف تحصیلی خود برسند.
              </p>
            </div>
          </div>
        </Card>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 hover:shadow-glow hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="gradient-secondary p-2 rounded-lg shadow-neon">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gradient">ماموریت ما</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              ما می‌خواهیم یادگیری را برای همه دسترس‌پذیر، کارآمد و لذت‌بخش کنیم. با قدرت هوش مصنوعی، به هر دانش‌آموزی امکان دسترسی به یک معلم شخصی ۲۴ ساعته را می‌دهیم.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-glow hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="gradient-accent p-2 rounded-lg shadow-neon">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gradient">چشم‌انداز ما</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              ایجاد بزرگترین جامعه یادگیری هوشمند در ایران و کمک به میلیون‌ها دانش‌آموز برای رسیدن به بهترین نسخه از خودشان در مسیر تحصیلی.
            </p>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6 md:p-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold mb-6 text-gradient text-center">چرا ایزی درس؟</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                title: "هوش مصنوعی پیشرفته",
                description: "استفاده از جدیدترین مدل‌های AI برای پاسخگویی دقیق",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "یادگیری اجتماعی",
                description: "امکان تعامل و یادگیری گروهی با دوستان",
              },
              {
                icon: <Target className="w-5 h-5" />,
                title: "برنامه‌ریزی هوشمند",
                description: "ایجاد برنامه مطالعاتی شخصی‌سازی شده",
              },
              {
                icon: <Heart className="w-5 h-5" />,
                title: "رابط کاربری زیبا",
                description: "طراحی مدرن و کاربرپسند برای تجربه بهتر",
              },
              {
                icon: <Code className="w-5 h-5" />,
                title: "تکنولوژی روز",
                description: "استفاده از آخرین استانداردهای وب",
              },
              {
                icon: <Lightbulb className="w-5 h-5" />,
                title: "یادگیری سریع",
                description: "خلاصه‌سازی هوشمند برای مطالعه موثرتر",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all group"
              >
                <div className="gradient-primary p-2 rounded-lg h-fit text-white shadow-neon group-hover:shadow-glow transition-all">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-bold mb-1 group-hover:text-gradient transition-all">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-8 mt-8 text-center gradient-hero text-white shadow-glow animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">همراه ما باشید</h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            با پیوستن به ایزی درس، بخشی از انقلاب یادگیری هوشمند شوید
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="bg-white text-primary hover:bg-white/90 shadow-neon"
          >
            بازگشت به داشبورد
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default About;
