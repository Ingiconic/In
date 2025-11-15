import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

type AuthStep = "username" | "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<AuthStep>("username");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");

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

  const checkUserExists = async () => {
    if (!username.trim()) {
      toast({ title: "خطا", description: "لطفا نام کاربری خود را وارد کنید", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const email = `${username}@easydars.com`;
      
      // Try to sign in with dummy password to check if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "dummy_check_password_12345",
      });

      // If error says "Invalid login credentials" it means user exists
      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("invalid")) {
          setStep("login");
        } else {
          setStep("signup");
        }
      } else {
        setStep("login");
      }
    } catch (error: any) {
      toast({ title: "خطا", description: "مشکلی پیش آمد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({ title: "خطا", description: "لطفا رمز عبور را وارد کنید", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@easydars.com`,
        password,
      });

      if (error) throw error;
      toast({ title: "خوش آمدید! 🎉", description: "ورود موفقیت‌آمیز بود" });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message || "رمز عبور اشتباه است", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !lastName.trim() || !password.trim()) {
      toast({ title: "خطا", description: "لطفا تمام فیلدها را پر کنید", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: `${username}@easydars.com`,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${fullName} ${lastName}`,
            username: username,
          },
        },
      });

      if (error) throw error;
      toast({ title: "ثبت‌نام موفق! 🎊", description: "حساب شما ایجاد شد" });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message || "مشکلی پیش آمد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("username");
    setPassword("");
    setFullName("");
    setLastName("");
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4"
            >
              <img src={logo} alt="ایزی درس" className="w-20 h-20 mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gradient mb-2">ایزی درس</h1>
            <p className="text-muted-foreground">یادگیری هوشمند با هوش مصنوعی</p>
          </div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism-card p-8 rounded-2xl shadow-2xl border border-border/20"
          >
            <AnimatePresence mode="wait">
              {step === "username" && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-2">ورود / ثبت‌نام</h2>
                    <p className="text-sm text-muted-foreground">
                      نام کاربری خود را وارد کنید
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); checkUserExists(); }} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="نام کاربری"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 text-lg"
                        dir="ltr"
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg gradient-primary shadow-glow"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          در حال بررسی...
                        </>
                      ) : (
                        "ادامه"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="mb-4"
                    >
                      <ArrowRight className="w-4 h-4 ml-2" />
                      بازگشت
                    </Button>
                    <h2 className="text-2xl font-bold mb-2">ورود</h2>
                    <p className="text-sm text-muted-foreground">
                      خوش آمدید <span className="font-bold text-primary">{username}</span>
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="رمز عبور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-lg"
                        dir="ltr"
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg gradient-primary shadow-glow"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          در حال ورود...
                        </>
                      ) : (
                        "ورود"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="mb-4"
                    >
                      <ArrowRight className="w-4 h-4 ml-2" />
                      بازگشت
                    </Button>
                    <h2 className="text-2xl font-bold mb-2">ثبت‌نام</h2>
                    <p className="text-sm text-muted-foreground">
                      لطفا اطلاعات خود را وارد کنید
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="نام"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12"
                        dir="rtl"
                        disabled={loading}
                        autoFocus
                      />
                      <Input
                        type="text"
                        placeholder="نام خانوادگی"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12"
                        dir="rtl"
                        disabled={loading}
                      />
                    </div>

                    <Input
                      type="password"
                      placeholder="رمز عبور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12"
                      dir="ltr"
                      disabled={loading}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg gradient-primary shadow-glow"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          در حال ثبت‌نام...
                        </>
                      ) : (
                        "ثبت‌نام"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-muted-foreground">
              با ورود به ایزی درس، شما{" "}
              <a href="#" className="text-primary hover:underline">
                قوانین و مقررات
              </a>{" "}
              را می‌پذیرید
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
