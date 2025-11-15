import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast({ 
        title: "خطا", 
        description: "لطفا تمام فیلدها را پر کنید", 
        variant: "destructive" 
      });
      return;
    }

    if (password.length < 6) {
      toast({ 
        title: "خطا", 
        description: "رمز عبور باید حداقل ۶ کاراکتر باشد", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // Check if username already exists
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-username', {
        body: { username: username.toLowerCase().trim() }
      });

      if (checkError) {
        throw new Error("مشکلی در بررسی نام کاربری پیش آمد");
      }

      if (checkData?.exists) {
        throw new Error("این نام کاربری قبلاً ثبت شده است");
      }

      const { error } = await supabase.auth.signUp({
        email: `${username.toLowerCase().trim()}@easydars.com`,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("این حساب کاربری قبلاً ثبت شده است");
        }
        throw error;
      }

      toast({ 
        title: "موفق! 🎉", 
        description: "حساب شما با موفقیت ساخته شد" 
      });
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error.message || "مشکلی پیش آمد", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, hsl(248 73% 62% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, hsl(164 73% 60% / 0.15) 0%, transparent 50%)
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

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
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
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-3xl border border-border/50 shadow-2xl">
          {/* Logo */}
          <motion.div 
            className="flex flex-col items-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
              <img src={logo} alt="Easy Dars" className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">ثبت‌نام در ایزی درس</h1>
            <p className="text-muted-foreground text-center">
              به خانواده ایزی درس بپیوندید
            </p>
          </motion.div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                type="text"
                placeholder="نام کاربری"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-right h-12 bg-background/50"
                disabled={loading}
              />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                type="text"
                placeholder="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-right h-12 bg-background/50"
                disabled={loading}
              />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                type="password"
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right h-12 bg-background/50"
                disabled={loading}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                type="submit"
                className="w-full h-12 text-lg gradient-primary shadow-glow hover:shadow-glow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    در حال ثبت‌نام...
                  </>
                ) : (
                  <>
                    <ArrowRight className="ml-2 h-5 w-5" />
                    ثبت‌نام
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-muted-foreground">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <Link 
                to="/login" 
                className="text-primary hover:underline font-semibold"
              >
                وارد شوید
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
