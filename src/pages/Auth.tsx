import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [grade, setGrade] = useState("");
  const [field, setField] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "خطا", description: "نام کاربری و رمز عبور را وارد کنید", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: `${username}@easydars.com`,
          password,
        });

        if (error) throw error;
        toast({ title: "خوش آمدید! 🎉", description: "ورود موفقیت‌آمیز بود" });
      } else {
        if (!fullName.trim() || !birthDate || !grade.trim() || !field.trim()) {
          toast({ title: "خطا", description: "لطفا تمام فیلدها را پر کنید", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: `${username}@easydars.com`,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              birth_date: birthDate,
              grade,
              field,
            },
          },
        });

        if (error) throw error;
        toast({ title: "ثبت‌نام موفق! 🎊", description: "حساب شما ایجاد شد" });
      }
    } catch (error: any) {
      toast({ title: "خطا", description: error.message || "مشکلی پیش آمد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-50, 50, -50],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <img src={logo} alt="EasyDars" className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              EasyDars
            </h1>
            <p className="text-muted-foreground text-sm">
              یادگیری هوشمند با قدرت هوش مصنوعی
            </p>
          </motion.div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="backdrop-blur-xl bg-card/50 border border-border/50 rounded-3xl shadow-2xl p-8"
          >
            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-2xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isLogin
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ورود
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                  !isLogin
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ثبت‌نام
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <Input
                        type="text"
                        placeholder="نام کاربری"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="رمز عبور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <Input
                        type="text"
                        placeholder="نام کاربری"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="رمز عبور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="نام و نام خانوادگی"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        placeholder="تاریخ تولد"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="پایه تحصیلی"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                      <Input
                        type="text"
                        placeholder="رشته"
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl text-base"
                        dir="rtl"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <User className="w-5 h-5" />
                    {isLogin ? "ورود به سیستم" : "ثبت‌نام"}
                  </span>
                )}
              </Button>
            </form>

            {/* Footer Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-muted-foreground mt-6"
            >
              {isLogin ? "حساب کاربری ندارید؟" : "قبلاً ثبت‌نام کرده‌اید؟"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "ثبت‌نام کنید" : "وارد شوید"}
              </button>
            </motion.p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            {[
              { icon: "🤖", text: "هوش مصنوعی" },
              { icon: "📚", text: "آموزش هوشمند" },
              { icon: "🎯", text: "پیشرفت سریع" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                className="backdrop-blur-xl bg-card/30 border border-border/30 rounded-2xl p-4 text-center hover:border-primary/50 transition-all duration-300"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <p className="text-xs text-muted-foreground">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
