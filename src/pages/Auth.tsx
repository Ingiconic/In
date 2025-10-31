import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { usernameSchema } from "@/lib/validation";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [field, setField] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate username
      const validatedUsername = usernameSchema.parse(username);

      if (isLogin) {
        // Try login directly without revealing username existence
        const { error } = await supabase.auth.signInWithPassword({
          email: `${validatedUsername}@temp.local`,
          password,
        });

        if (error) {
          // Generic error message - don't reveal if username exists
          throw new Error('نام کاربری یا رمز عبور اشتباه است');
        }

        toast({
          title: "خوش آمدید! 🎉",
          description: "با موفقیت وارد شدید",
        });
      } else {
        // Validate required fields
        if (parseInt(grade) >= 9 && !field) {
          throw new Error('لطفا رشته تحصیلی را انتخاب کنید');
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: `${validatedUsername}@temp.local`,
          password,
          options: {
            data: {
              full_name: fullName,
              username: validatedUsername,
              grade: grade,
              field: parseInt(grade) >= 9 ? field : null,
              birth_date: birthDate,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: "ثبت‌نام موفق! 🎊",
          description: "حساب کاربری شما ایجاد شد",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      <Card className="w-full max-w-md p-8 space-y-6 animate-fade-in shadow-glow border-primary/30 relative z-10 backdrop-blur-sm bg-card/95">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="gradient-primary p-3 rounded-xl shadow-neon animate-pulse-glow">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div className="gradient-secondary p-2 rounded-lg shadow-neon animate-float">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="gradient-accent p-2 rounded-lg shadow-neon animate-float" style={{ animationDelay: "1s" }}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gradient animate-neon-pulse">
            {isLogin ? "ورود به حساب" : "ثبت‌نام"}
          </h1>
          <p className="text-muted-foreground text-lg">
            پلتفرم هوش مصنوعی یادگیری
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">نام و نام خانوادگی</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام خود را وارد کنید"
                  required={!isLogin}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">تاریخ تولد</label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required={!isLogin}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">مقطع تحصیلی</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required={!isLogin}
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">انتخاب کنید</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      پایه {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {parseInt(grade) >= 9 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">رشته تحصیلی</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    required={parseInt(grade) >= 9}
                    className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="math">ریاضی</option>
                    <option value="science">تجربی</option>
                    <option value="humanities">انسانی</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">نام کاربری</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              required
              className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">رمز عبور</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              required
              minLength={6}
              className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <Button
            type="submit"
            className="w-full shadow-glow hover:shadow-neon"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                در حال پردازش...
              </span>
            ) : (
              isLogin ? "ورود" : "ثبت‌نام"
            )}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:text-primary/80 hover:underline transition-all"
          >
            {isLogin ? "حساب کاربری ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
          </button>
          <p className="text-xs text-muted-foreground">
            Made by مهدی رنجبر
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;