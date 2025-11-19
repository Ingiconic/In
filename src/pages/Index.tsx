import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, BookOpen, Target, Sparkles, MessageSquare, CheckCircle, 
  TrendingUp, Users, Award, Zap, GraduationCap, ArrowRight,
  Lightbulb, Rocket, Star, Calendar, BarChart3, Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageView } from "@/hooks/usePageView";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const navigate = useNavigate();
  usePageView();
  const { scrollYProgress } = useScroll();
  const containerRef = useRef(null);
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  
  return (
    <div className="min-h-screen bg-background overflow-hidden" ref={containerRef}>
      {/* Animated Background Mesh - Simplified for mobile */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-40 hidden md:block"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, hsl(248 73% 62% / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, hsl(164 73% 60% / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, hsl(340 100% 60% / 0.1) 0%, transparent 50%)
            `
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating Particles - Desktop only */}
        <div className="hidden lg:block">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `hsl(${248 + Math.random() * 100} 73% 62%)`,
                boxShadow: `0 0 ${Math.random() * 20 + 10}px hsl(${248 + Math.random() * 100} 73% 62% / 0.8)`
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-gradient">Easy Dars</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/login")}
                className="hover:bg-primary/10 transition-all text-xs md:text-sm"
              >
                ورود
              </Button>
              <Button 
                size="sm"
                className="gradient-primary shadow-glow hover:shadow-neon transition-all text-xs md:text-sm px-3 md:px-4" 
                onClick={() => navigate("/signup")}
              >
                شروع رایگان
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Epic */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div 
          className="container relative mx-auto px-4 z-10"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/30 backdrop-blur-xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">پلتفرم یادگیری هوشمند با AI</span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-7xl font-black leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="block mb-2 md:mb-4">هوش مصنوعی</span>
              <motion.span 
                className="block text-gradient"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                معلم شخصی تو
              </motion.span>
              <span className="block mt-2 md:mt-4 text-2xl md:text-4xl lg:text-6xl">
                برای یادگیری بهتر
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              با قدرت هوش مصنوعی، درس‌هاتو سریع‌تر یاد بگیر، سوالاتت رو بپرس،
              و پیشرفت واقعی رو تجربه کن. ۱۰۰٪ رایگان، ۱۰۰٪ هوشمند
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px hsl(248 73% 62% / 0.6)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="gradient-primary hover:opacity-90 shadow-glow text-lg px-10 py-7 rounded-2xl font-bold group"
                  onClick={() => navigate("/signup")}
                >
                  شروع یادگیری الان
                  <motion.div
                    className="mr-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-10 py-7 rounded-2xl font-bold border-2 border-primary/30 hover:bg-primary/10 backdrop-blur-xl"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  بیشتر بدانید
                  <Lightbulb className="w-6 h-6 mr-2" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex items-center justify-center gap-8 pt-12 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              {[
                { icon: CheckCircle, text: "۱۰۰٪ رایگان" },
                { icon: Zap, text: "بدون نیاز به کارت" },
                { icon: Star, text: "۱۰K+ کاربر فعال" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  <item.icon className="w-5 h-5 text-secondary" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-32 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-20">
              <motion.h2 
                className="text-4xl md:text-6xl font-black mb-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                ابزارهای قدرتمند
                <span className="text-gradient block mt-2">برای یادگیری هوشمند</span>
              </motion.h2>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                همه چیزی که برای موفقیت تحصیلی نیاز داری، در یک جا
              </motion.p>
            </div>
          </AnimatedSection>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Large Feature 1 */}
            <FeatureCard
              className="md:col-span-2 md:row-span-2"
              icon={Brain}
              title="خلاصه‌سازی هوشمند دروس"
              description="متن‌های طولانی رو در چند ثانیه به نکات کلیدی تبدیل کن. AI ما مهم‌ترین قسمت‌ها رو برات پیدا می‌کنه"
              gradient="gradient-primary"
              delay={0}
            >
              <div className="mt-6 space-y-3">
                {["📝 خلاصه‌سازی سریع", "🎯 استخراج نکات کلیدی", "💡 مثال‌های کاربردی"].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-background/40 rounded-xl backdrop-blur-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <span className="text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </FeatureCard>

            {/* Small Feature 1 */}
            <FeatureCard
              icon={Target}
              title="حل تمرین"
              description="سوالاتت رو بپرس، توضیح کامل بگیر"
              gradient="gradient-secondary"
              delay={0.1}
            />

            {/* Small Feature 2 */}
            <FeatureCard
              icon={Calendar}
              title="برنامه‌ریزی"
              description="برنامه مطالعه شخصی‌سازی شده"
              gradient="gradient-accent"
              delay={0.2}
            />

            {/* Large Feature 2 */}
            <FeatureCard
              className="md:col-span-2"
              icon={Rocket}
              title="آزمون‌ساز هوشمند"
              description="با AI آزمون شخصی‌سازی شده بساز و خودت رو امتحان کن"
              gradient="gradient-secondary"
              delay={0.3}
            >
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: "🎯", text: "آزمون تستی" },
                  { icon: "✍️", text: "آزمون تشریحی" },
                  { icon: "⚡", text: "تصحیح خودکار" },
                  { icon: "📊", text: "تحلیل عملکرد" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="p-4 bg-background/40 rounded-xl backdrop-blur-sm text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.1)" }}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-xs font-medium">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </FeatureCard>

            {/* Small Feature 3 */}
            <FeatureCard
              icon={Trophy}
              title="گیمیفیکیشن"
              description="با سکه و مدال انگیزه‌ات رو حفظ کن"
              gradient="gradient-primary"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Stats Section - Animated */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { value: "10K+", label: "دانش‌آموز فعال", icon: Users },
              { value: "50K+", label: "سوال پاسخ داده شده", icon: MessageSquare },
              { value: "98%", label: "رضایت کاربران", icon: Star },
              { value: "24/7", label: "پشتیبانی AI", icon: Zap },
            ].map((stat, i) => (
              <AnimatedStatCard key={i} {...stat} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl md:text-5xl font-black mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                چرا دانش‌آموزان عاشق
                <span className="text-gradient block mt-2">Easy Dars هستند؟</span>
              </motion.h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "واقعاً کمکم کرد تو ریاضی پیشرفت کنم. الان نمراتم خیلی بهتر شده!",
                name: "سارا احمدی",
                role: "دانش‌آموز دوازدهم"
              },
              {
                quote: "خلاصه‌سازی AI فوق‌العادس! دیگه نمی‌ترسم از درس‌های طولانی",
                name: "علی محمدی",
                role: "دانش‌آموز یازدهم"
              },
              {
                quote: "بهترین برنامه برای یادگیری! هم سرگرم‌کننده‌ست هم مفیده",
                name: "مهسا رضایی",
                role: "دانش‌آموز دهم"
              },
            ].map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} delay={i * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Epic */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        
        <div className="container relative mx-auto px-4 text-center z-10">
          <AnimatedSection>
            <motion.div
              className="max-w-4xl mx-auto space-y-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                className="inline-block"
              >
                <GraduationCap className="w-20 h-20 text-primary mx-auto mb-6" />
              </motion.div>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                آماده‌ای تحول ایجاد کنی؟
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                بیش از ۱۰ هزار دانش‌آموز الان دارن با Easy Dars یاد می‌گیرن.
                <span className="text-gradient font-bold block mt-2">نوبت توئه!</span>
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pt-8"
              >
                <Button 
                  size="lg" 
                  className="gradient-primary hover:opacity-90 shadow-neon text-xl px-16 py-8 rounded-2xl font-black group"
                  onClick={() => navigate("/signup")}
                >
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    شروع رایگان همین الان
                  </motion.span>
                  <Sparkles className="w-6 h-6 mr-3" />
                </Button>
              </motion.div>

              <p className="text-sm text-muted-foreground">
                ✨ بدون نیاز به کارت بانکی • همیشه رایگان
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Blog/News Section */}
      <section className="relative py-24 bg-muted/5">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <motion.div className="text-center mb-16">
              <motion.div
                className="inline-block mb-4"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black text-gradient mb-4">
                آخرین اخبار و مقالات
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                جدیدترین مطالب آموزشی و اخبار
              </p>
            </motion.div>

            <BlogPosts />
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-border/30 bg-muted/10 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">Easy Dars</span>
            </motion.div>
            
            <div className="text-center md:text-right space-y-2">
              <p className="text-sm text-muted-foreground">
                © 2025 Easy Dars. تمامی حقوق محفوظ است.
              </p>
              <p className="text-xs text-muted-foreground">
                ساخته شده با <span className="text-red-500">❤️</span> برای دانش‌آموزان ایرانی
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Reusable Animated Components
const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
};

const FeatureCard = ({ 
  className = "", 
  icon: Icon, 
  title, 
  description, 
  gradient, 
  delay = 0,
  children 
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <Card 
        className={`p-8 h-full glassmorphism-card hover-lift group cursor-pointer ${className}`}
      >
        <div className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-all duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        {children}
      </Card>
    </motion.div>
  );
};

const AnimatedStatCard = ({ value, label, icon: Icon, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      className="text-center space-y-3"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      <motion.div 
        className="text-5xl md:text-6xl font-black text-gradient"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: delay + 0.2 }}
      >
        {value}
      </motion.div>
      <p className="text-sm md:text-base text-muted-foreground font-medium">{label}</p>
    </motion.div>
  );
};

const TestimonialCard = ({ quote, name, role, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <Card className="p-8 glassmorphism-card hover-lift h-full">
        <div className="flex items-start gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
          ))}
        </div>
        <p className="text-lg mb-6 leading-relaxed">&quot;{quote}&quot;</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Blog Posts Component
const BlogPosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setPosts(data);
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card p-6 animate-pulse">
            <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="glass-card p-12 text-center">
        <p className="text-muted-foreground">هنوز مقاله‌ای منتشر نشده است</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="glass-card hover-lift overflow-hidden h-full">
            {post.featured_image && (
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString('fa-IR')}
                </span>
                <Button variant="ghost" size="sm" className="text-primary">
                  بیشتر بخوانید
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default Index;
