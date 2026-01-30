import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  Users, 
  Award, 
  Shield, 
  Rocket, 
  CheckCircle2, 
  TrendingUp,
  GraduationCap,
  BookOpen,
  Brain,
  Clock,
  Star,
  Building2,
  Medal,
  HeartHandshake,
  Lightbulb,
  Globe
} from "lucide-react";
import logo from "@/assets/logo.png";

const About = () => {
  const navigate = useNavigate();

  const stats = [
    { number: "۵۰۰+", label: "هزار کاربر", icon: Users },
    { number: "۱M+", label: "آزمون تولید شده", icon: BookOpen },
  ];

  const teamMembers = [
    {
      name: "مهدی رنجبر",
      role: "موسس و مدیر ارشد اجرایی (CEO)",
      description: "بنیان‌گذار ایزی درس با تجربه در حوزه فناوری آموزشی و توسعه پلتفرم‌های یادگیری هوشمند",
      icon: Building2,
    },
    {
      name: "تیم توسعه",
      role: "واحد فنی و مهندسی",
      description: "متشکل از متخصصان هوش مصنوعی، توسعه‌دهندگان و مهندسان نرم‌افزار",
      icon: Brain,
    },
    {
      name: "تیم محتوا",
      role: "واحد تولید محتوای آموزشی",
      description: "گروهی از معلمان و متخصصان حوزه‌های مختلف علمی برای تضمین کیفیت محتوا",
      icon: GraduationCap,
    },
    {
      name: "تیم پشتیبانی",
      role: "واحد ارتباط با کاربران",
      description: "تیم پاسخگویی و راهنمایی کاربران",
      icon: HeartHandshake,
    },
  ];

  const features = [
    {
      title: "خلاصه‌ساز هوشمند",
      description: "استخراج خودکار نکات کلیدی از هر متن با استفاده از پیشرفته‌ترین مدل‌های پردازش زبان طبیعی. صرفه‌جویی در زمان و افزایش بازده مطالعه.",
      icon: Lightbulb,
    },
    {
      title: "تولید آزمون هوشمند",
      description: "ایجاد آزمون‌های استاندارد با سطوح مختلف سختی، تحلیل عملکرد و گزارش‌های دقیق پیشرفت. بیش از یک میلیون آزمون موفق.",
      icon: Target,
    },
    {
      title: "فلش‌کارت پیشرفته",
      description: "سیستم مرور فاصله‌دار (Spaced Repetition) بر پایه الگوریتم‌های علمی برای حافظه بلندمدت و یادگیری مؤثر.",
      icon: BookOpen,
    },
    {
      title: "نقشه ذهنی هوشمند",
      description: "تبدیل خودکار مطالب به نقشه‌های ذهنی تعاملی برای درک بهتر روابط مفاهیم و سازمان‌دهی اطلاعات.",
      icon: Brain,
    },
    {
      title: "برنامه‌ریز مطالعاتی",
      description: "ایجاد برنامه شخصی‌سازی‌شده بر اساس اهداف، زمان موجود و سبک یادگیری شما با قابلیت یادآوری هوشمند.",
      icon: Clock,
    },
    {
      title: "دستیار هوش مصنوعی",
      description: "پاسخگویی ۲۴/۷ به سوالات درسی، توضیح مفاهیم پیچیده و راهنمایی در حل مسائل با هوش مصنوعی پیشرفته.",
      icon: Sparkles,
    },
  ];

  // Achievements removed - only showing real stats

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow transition-all p-2"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 md:gap-3">
              <img src={logo} alt="ایزی درس" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                درباره ایزی درس
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-16 animate-fade-in">
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative">
              <img 
                src={logo} 
                alt="ایزی درس" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain filter drop-shadow-2xl" 
              />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10"></div>
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            ایزی درس
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            پلتفرم آموزش هوشمند ایران | از سال ۱۴۰۳ در خدمت یادگیری
          </p>
          
          {/* Trust Badge */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 text-xs md:text-sm text-muted-foreground">
            <span className="flex items-center gap-1 bg-card/50 px-3 py-1.5 rounded-full border border-border/30">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              امن و مطمئن
            </span>
            <span className="flex items-center gap-1 bg-card/50 px-3 py-1.5 rounded-full border border-border/30">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              مورد اعتماد هزاران کاربر
            </span>
            <span className="flex items-center gap-1 bg-card/50 px-3 py-1.5 rounded-full border border-border/30">
              <Globe className="w-3.5 h-3.5 text-primary" />
              فعال در سراسر کشور
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-16 max-w-md mx-auto">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="p-6 md:p-8 text-center border-2 border-border/30 hover:border-primary/50 transition-all bg-gradient-to-br from-card to-primary/5"
            >
              <stat.icon className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-3" />
              <p className="text-3xl md:text-5xl font-black text-primary">{stat.number}</p>
              <p className="text-sm md:text-base text-muted-foreground mt-2">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Main Story - Desktop Card, Mobile Accordion */}
        <div className="hidden md:block mb-12">
          <Card className="p-8 md:p-12 border-2 hover:border-primary/50 transition-all shadow-xl bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  داستان ایزی درس
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  <strong className="text-foreground">ایزی درس</strong> در سال ۱۴۰۳ با یک هدف بزرگ متولد شد: 
                  دموکراتیزه کردن دسترسی به آموزش باکیفیت. تیم ایزی درس با تلاش شبانه‌روزی 
                  در حال خدمت‌رسانی به <strong className="text-primary">دانش‌آموزان و دانشجویان</strong> در 
                  سراسر ایران است.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              ما معتقدیم که هر دانش‌آموز، فارغ از موقعیت جغرافیایی یا امکانات مالی، حق دسترسی به بهترین 
              ابزارهای یادگیری را دارد. این باور، موتور محرک تمام تلاش‌های ماست و 
              <strong className="text-secondary"> تیم ایزی درس</strong> هر روز با این انگیزه به کار خود ادامه می‌دهد.
            </p>
          </Card>
        </div>

        {/* Mobile Accordion Version */}
        <div className="md:hidden mb-8">
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="story" className="border-2 rounded-xl border-border/30 bg-card/50 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-base">داستان ایزی درس</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground leading-relaxed text-sm">
                <strong className="text-foreground">ایزی درس</strong> در سال ۱۴۰۳ با هدف دموکراتیزه کردن 
                دسترسی به آموزش باکیفیت متولد شد. تیم ایزی درس در حال خدمت‌رسانی به 
                <strong className="text-primary"> دانش‌آموزان و دانشجویان</strong> سراسر ایران است.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Features Section */}
        <div className="mb-10 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            امکانات و ابزارها
          </h3>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-primary/5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold">{feature.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden">
            <Accordion type="single" collapsible className="space-y-3">
              {features.map((feature, index) => (
                <AccordionItem 
                  key={index} 
                  value={`feature-${index}`}
                  className="border-2 rounded-xl border-border/30 bg-card/50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-sm">{feature.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-10 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            تیم ایزی درس
          </h3>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {teamMembers.map((member, index) => (
              <Card 
                key={index}
                className={`p-6 border-2 transition-all hover:shadow-xl ${
                  index === 0 
                    ? 'md:col-span-2 hover:border-primary/50 bg-gradient-to-br from-primary/10 via-card to-secondary/10' 
                    : 'hover:border-secondary/50 bg-gradient-to-br from-card to-card/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    index === 0 
                      ? 'bg-gradient-to-br from-primary to-secondary' 
                      : 'bg-gradient-to-br from-secondary to-secondary/80'
                  }`}>
                    <member.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-1">{member.name}</h4>
                    <p className={`text-sm font-medium mb-2 ${index === 0 ? 'text-primary' : 'text-secondary'}`}>
                      {member.role}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden">
            <Accordion type="single" collapsible className="space-y-3">
              {teamMembers.map((member, index) => (
                <AccordionItem 
                  key={index} 
                  value={`team-${index}`}
                  className={`border-2 rounded-xl px-4 ${
                    index === 0 
                      ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-card' 
                      : 'border-border/30 bg-card/50'
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        index === 0 
                          ? 'bg-gradient-to-br from-primary to-secondary' 
                          : 'bg-gradient-to-br from-secondary to-secondary/80'
                      }`}>
                        <member.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm block">{member.name}</span>
                        <span className={`text-xs ${index === 0 ? 'text-primary' : 'text-secondary'}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground leading-relaxed text-sm">
                    {member.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Quality & Security - Desktop Cards */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">تعهد به کیفیت</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              تیم ایزی درس استانداردهای سختگیرانه‌ای برای تضمین کیفیت محتوای 
              آموزشی تعریف کرده است. هر محتوا قبل از انتشار توسط کارشناسان حوزه بررسی می‌شود.
            </p>
          </Card>

          <Card className="p-8 border-2 hover:border-secondary/50 transition-all hover:shadow-xl bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">امنیت و حریم خصوصی</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              تمام داده‌های کاربران با بالاترین استانداردهای 
              امنیتی محافظت می‌شوند و هرگز با شخص ثالثی به اشتراک گذاشته نمی‌شوند.
            </p>
          </Card>
        </div>

        {/* Mobile Accordion for Quality & Security */}
        <div className="md:hidden mb-8">
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="quality" className="border-2 rounded-xl border-border/30 bg-card/50 px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">تعهد به کیفیت</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground leading-relaxed text-sm">
                تیم ایزی درس استانداردهای سختگیرانه‌ای برای تضمین کیفیت 
                تعریف کرده است.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security" className="border-2 rounded-xl border-border/30 bg-card/50 px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-secondary/80">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">امنیت و حریم خصوصی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground leading-relaxed text-sm">
                تمام داده‌ها با بالاترین استانداردهای امنیتی محافظت 
                می‌شوند.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Vision Card */}
        <Card className="p-6 md:p-12 border-2 hover:border-primary/50 transition-all shadow-xl mb-10 md:mb-16 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
          <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary shadow-lg">
              <Rocket className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                چشم‌انداز آینده
              </h3>
              <p className="text-muted-foreground text-sm md:text-lg leading-relaxed">
                تیم ایزی درس با برنامه‌ریزی بلندمدت، در حال توسعه نسل جدید ابزارهای آموزشی است. 
                هدف ما تبدیل شدن به <strong className="text-primary">برترین پلتفرم آموزش هوشمند</strong> در 
                منطقه و ایجاد فرصت‌های برابر یادگیری برای همه است.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1 text-sm md:text-base">گسترش بین‌المللی</h4>
                <p className="text-xs md:text-sm text-muted-foreground">ارائه خدمات به فارسی‌زبانان سراسر جهان</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1 text-sm md:text-base">اپلیکیشن موبایل</h4>
                <p className="text-xs md:text-sm text-muted-foreground">یادگیری در هر زمان و مکان</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-secondary/20">
              <TrendingUp className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1 text-sm md:text-base">همکاری با وزارت آموزش</h4>
                <p className="text-xs md:text-sm text-muted-foreground">ادغام با سیستم آموزش رسمی</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-secondary/20">
              <TrendingUp className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1 text-sm md:text-base">هوش مصنوعی پیشرفته‌تر</h4>
                <p className="text-xs md:text-sm text-muted-foreground">شخصی‌سازی کامل مسیر یادگیری</p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center animate-fade-in">
          <Card className="p-6 md:p-10 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="inline-flex p-3 md:p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-4 md:mb-6">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              همین امروز شروع کنید
            </h3>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              به جمع کاربران ایزی درس بپیوندید و 
              تجربه‌ای متفاوت از یادگیری را تجربه کنید.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto"
            >
              <span className="ml-2">شروع یادگیری رایگان</span>
              <Sparkles className="w-5 h-5" />
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
