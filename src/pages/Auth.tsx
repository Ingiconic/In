import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { BookOpen, GraduationCap, Sparkles, Mail, Lock, User, Calendar, Award } from "lucide-react";
import { usernameSchema } from "@/lib/validation";

export default function ImprovedAuth() {
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
      const validatedUsername = usernameSchema.parse(username);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: `${validatedUsername}@easydars.local`,
          password: password,
        });

        if (error) {
          if (error.message.includes("Invalid") || error.message.includes("not found")) {
            toast({
              title: "خطا در ورود",
              description: "نام کاربری یا رمز عبور اشتباه است",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "ورود موفق",
          description: "خوش آمدید!",
        });
      } else {
        if (!fullName || !birthDate || !grade) {
          toast({
            title: "خطا",
            description: "لطفاً تمام فیلدهای ضروری را پر کنید",
            variant: "destructive",
          });
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: `${validatedUsername}@easydars.local`,
          password: password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: validatedUsername,
              full_name: fullName,
              grade: grade,
              field: field || null,
              birth_date: birthDate,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "خطا",
              description: "این نام کاربری قبلاً ثبت شده است",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "ثبت‌نام موفق",
          description: "به ایزی درس خوش آمدید! 🎉",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمده است",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-lg p-8 backdrop-blur-sm bg-background/95 shadow-2xl border-primary/20 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <GraduationCap className="w-16 h-16 text-primary" />
              <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            ایزی درس
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "به پلتفرم هوشمند یادگیری خوش آمدید" : "ثبت‌نام در پلتفرم هوشمند یادگیری"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              نام کاربری
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="text-left transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              رمز عبور
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  نام و نام خانوادگی
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  تاریخ تولد
                </label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    پایه تحصیلی
                  </label>
                  <Input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="مثلاً: دهم"
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    رشته (اختیاری)
                  </label>
                  <Input
                    type="text"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    placeholder="مثلاً: ریاضی"
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isLogin ? "در حال ورود..." : "در حال ثبت‌نام..."}
              </div>
            ) : (
              <span>{isLogin ? "ورود به حساب" : "ثبت‌نام"}</span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUsername("");
              setPassword("");
              setFullName("");
              setGrade("");
              setField("");
              setBirthDate("");
            }}
            className="text-sm text-primary hover:underline transition-all duration-300 font-medium"
          >
            {isLogin ? "حساب کاربری ندارید? ثبت‌نام کنید" : "قبلاً ثبت‌نام کرده‌اید? وارد شوید"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-center text-xs text-muted-foreground">
            🎓 با ثبت‌نام، ۱۰۰۰ سکه رایگان دریافت می‌کنید
          </p>
        </div>
      </Card>
    </div>
  );
}
