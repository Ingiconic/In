import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Zap, Shield, Wifi, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "سریع و روان",
      description: "دسترسی فوری بدون نیاز به باز کردن مرورگر"
    },
    {
      icon: Wifi,
      title: "آفلاین کار می‌کنه",
      description: "حتی بدون اینترنت هم می‌تونی استفاده کنی"
    },
    {
      icon: Shield,
      title: "امن و مطمئن",
      description: "اطلاعاتت کاملاً محافظت شده و رمزگذاری میشه"
    },
    {
      icon: Smartphone,
      title: "مثل اپلیکیشن واقعی",
      description: "یه آیکون روی صفحه اصلی گوشیت میاد"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, hsl(260 85% 65% / 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, hsl(180 90% 55% / 0.2) 0%, transparent 50%)
            `
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت
          </Button>

          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="w-32 h-32 mx-auto mb-6 rounded-3xl gradient-hero flex items-center justify-center shadow-neon animate-float">
                <Download className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 glow-text">
                Easy Dars رو نصب کن
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                دسترسی سریع‌تر، تجربه بهتر! اپلیکیشن رو مستقیم روی گوشیت نصب کن
              </p>
            </motion.div>

            {/* Install Button */}
            {!isInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-12"
              >
                <Card className="glassmorphism-card">
                  <CardContent className="p-8 text-center">
                    {deferredPrompt ? (
                      <>
                        <h2 className="text-2xl font-bold mb-4">آماده نصبه!</h2>
                        <p className="text-muted-foreground mb-6">
                          با یک کلیک، Easy Dars رو روی گوشیت نصب کن
                        </p>
                        <Button
                          variant="hero"
                          size="xl"
                          onClick={handleInstallClick}
                          className="w-full md:w-auto shimmer"
                        >
                          <Download className="w-5 h-5 ml-2" />
                          نصب کن الان
                        </Button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold mb-4">راهنمای نصب</h2>
                        <div className="text-right space-y-4 max-w-md mx-auto">
                          <div className="glassmorphism p-4 rounded-2xl">
                            <h3 className="font-bold mb-2">📱 آیفون:</h3>
                            <p className="text-sm text-muted-foreground">
                              دکمه Share → Add to Home Screen
                            </p>
                          </div>
                          <div className="glassmorphism p-4 rounded-2xl">
                            <h3 className="font-bold mb-2">🤖 اندروید:</h3>
                            <p className="text-sm text-muted-foreground">
                              منوی مرورگر → Install App یا Add to Home Screen
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isInstalled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <Card className="glassmorphism-card border-success/50">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">نصب شد! 🎉</h2>
                    <p className="text-muted-foreground mb-6">
                      Easy Dars روی گوشیت نصب شده. حالا می‌تونی ازش استفاده کنی
                    </p>
                    <Button
                      variant="hero"
                      onClick={() => navigate('/dashboard')}
                    >
                      برو به داشبورد
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-center"
            >
              <Card className="glassmorphism-card">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    چرا باید نصب کنی؟
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    با نصب Easy Dars، تجربه یادگیری بهتری خواهی داشت. 
                    دسترسی سریع‌تر، مصرف اینترنت کمتر و کارایی بیشتر!
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                  >
                    فعلاً از نسخه وب استفاده می‌کنم
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;
