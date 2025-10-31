import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trophy, Target, BookOpen, Award, TrendingUp, Star, Zap } from "lucide-react";

const Progress = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  const pointsToNextLevel = Math.ceil(((profile?.points || 0) / 100 + 1)) * 100;
  const progressPercentage = ((profile?.points || 0) % 100);

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
              <div className="gradient-primary p-2 rounded-lg shadow-glow">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">پیشرفت تحصیلی</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Points Card */}
        <Card className="p-8 gradient-hero text-white shadow-glow animate-fade-in mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-12 h-12 animate-pulse" />
                <div>
                  <h2 className="text-3xl font-bold">{profile?.points || 0} امتیاز</h2>
                  <p className="text-white/80">مجموع امتیازات شما</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{profile?.exams_taken || 0}</div>
                <p className="text-white/80 text-sm">آزمون داده شده</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>پیشرفت تا سطح بعد</span>
                <span>{pointsToNextLevel - (profile?.points || 0)} امتیاز مانده</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* How to Earn Points */}
        <Card className="p-6 shadow-glow animate-fade-in mb-6" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">چگونه امتیاز کسب کنیم؟</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-all">
              <div className="gradient-primary p-2 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">شرکت در آزمون‌ها</h4>
                <p className="text-sm text-muted-foreground">
                  با هر آزمون 10 امتیاز کسب کنید. هر پاسخ صحیح 1 امتیاز اضافی!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-secondary/5 rounded-lg hover:bg-secondary/10 transition-all">
              <div className="gradient-secondary p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">نمره بالا در آزمون‌ها</h4>
                <p className="text-sm text-muted-foreground">
                  نمره 80٪ به بالا: 5 امتیاز جایزه اضافی
                  <br />
                  نمره 100٪: 10 امتیاز جایزه اضافی
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-accent/5 rounded-lg hover:bg-accent/10 transition-all">
              <div className="gradient-accent p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">مطالعه منظم</h4>
                <p className="text-sm text-muted-foreground">
                  به زودی: امتیاز برای مطالعه روزانه و تکمیل برنامه مطالعه
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6 shadow-glow animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">دستاوردها</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "اولین آزمون", desc: "اولین آزمون را بده", achieved: (profile?.exams_taken || 0) >= 1 },
              { title: "5 آزمون", desc: "5 آزمون بده", achieved: (profile?.exams_taken || 0) >= 5 },
              { title: "100 امتیاز", desc: "100 امتیاز کسب کن", achieved: (profile?.points || 0) >= 100 },
              { title: "500 امتیاز", desc: "500 امتیاز کسب کن", achieved: (profile?.points || 0) >= 500 },
            ].map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg text-center transition-all ${
                  achievement.achieved
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 opacity-50"
                }`}
              >
                <Trophy className={`w-8 h-8 mx-auto mb-2 ${
                  achievement.achieved ? "text-primary" : "text-muted-foreground"
                }`} />
                <p className="font-bold text-sm mb-1">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button
            onClick={() => navigate("/exam")}
            size="lg"
            className="shadow-glow hover:shadow-neon"
          >
            <Target className="ml-2 w-5 h-5" />
            شروع آزمون جدید
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Progress;
