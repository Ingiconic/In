import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, Plus, Trash2, CheckCircle, Sparkles, Brain, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  subjects: string[];
}

const StudyPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Form fields
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadPlans();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setStudentName(data.full_name || "");
        setGrade(data.grade || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIPlan = async () => {
    if (!subjects || !startDate || !endDate) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای ضروری را پر کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      const { data, error } = await supabase.functions.invoke('ai-study-planner', {
        body: {
          subjects: subjects.split(',').map(s => s.trim()),
          startDate,
          endDate,
          grade: grade || profile?.grade,
          studentName: studentName || profile?.full_name || "دانش‌آموز",
        }
      });

      if (error) throw error;

      if (!data || !data.studyPlan) {
        throw new Error("برنامه مطالعاتی دریافت نشد");
      }

      // Save the AI-generated plan
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("study_plans").insert({
        user_id: user.id,
        title: `برنامه مطالعه ${subjects.split(',')[0]} (هوش مصنوعی)`,
        description: data.studyPlan,
        start_date: startDate,
        end_date: endDate,
        subjects: subjects.split(',').map(s => s.trim()),
      });

      if (insertError) throw insertError;

      toast({
        title: "موفق! ✨",
        description: "برنامه مطالعاتی با هوش مصنوعی ایجاد شد",
      });

      setSubjects("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
      loadPlans();
    } catch (error: any) {
      console.error("Error generating AI plan:", error);
      toast({
        title: "خطا",
        description: error.message || "مشکلی در تولید برنامه پیش آمد",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("study_plans").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "حذف شد",
        description: "برنامه مطالعه حذف شد",
      });
      loadPlans();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="glassmorphism border-b border-border/30 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm" className="hover:shadow-glow p-2">
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="gradient-primary p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-glow animate-pulse-glow">
              <Brain className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gradient animate-neon-pulse">برنامه‌ریزی هوشمند</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-1 text-gradient">برنامه‌های من</h2>
            <p className="text-xs md:text-sm text-muted-foreground">هوش مصنوعی برنامه شخصی برای تو می‌سازد</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="hero"
            size="lg"
            className="shadow-glow text-sm md:text-base"
          >
            <Sparkles className="ml-2 w-4 h-4" />
            ساخت با هوش مصنوعی
          </Button>
        </div>

        {showForm && (
          <Card className="p-4 md:p-6 mb-6 md:mb-8 shadow-glow border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="gradient-primary p-2 rounded-lg shadow-neon animate-pulse-glow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gradient">تولید برنامه با هوش مصنوعی</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm md:text-base">نام شما</Label>
                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    className="bg-input border-border/50 text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm md:text-base">پایه تحصیلی</Label>
                  <Input
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="مثلاً: دوازدهم"
                    className="bg-input border-border/50 text-sm md:text-base h-9 md:h-10"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm md:text-base">دروس (با کاما جدا کنید)</Label>
                <Input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="ریاضی, فیزیک, شیمی"
                  className="bg-input border-border/50 text-sm md:text-base h-9 md:h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm md:text-base">تاریخ شروع</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-input border-border/50 text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm md:text-base">تاریخ پایان</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-input border-border/50 text-sm md:text-base h-9 md:h-10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={generateAIPlan} 
                  disabled={generating}
                  variant="hero"
                  className="shadow-glow text-sm md:text-base"
                >
                  {generating ? (
                    <>
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Sparkles className="ml-2 w-4 h-4" />
                      ساخت برنامه
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-sm md:text-base">
                  لغو
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : plans.length === 0 ? (
          <Card className="p-8 md:p-12 text-center shadow-glow border-primary/20 animate-fade-in">
            <div className="gradient-primary p-4 rounded-full w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 shadow-neon">
              <Calendar className="w-8 h-8 md:w-12 md:h-12 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2">هنوز برنامه‌ای ندارید</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              از هوش مصنوعی بخواهید برنامه مطالعاتی برای شما بسازد
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {plans.map((plan, idx) => (
              <Card
                key={plan.id}
                className="p-4 md:p-6 shadow-glow border-primary/20 hover:border-primary/40 transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="gradient-primary p-2 rounded-lg shadow-neon flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-xl font-bold mb-1 truncate">{plan.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span>
                          {new Date(plan.start_date).toLocaleDateString("fa-IR")} -{" "}
                          {new Date(plan.end_date).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="text-destructive hover:text-destructive/80 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {plan.description && (
                  <div className="bg-card/50 p-3 md:p-4 rounded-lg border border-border/30">
                    <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                )}

                {plan.subjects && plan.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                    {plan.subjects.map((subject, i) => (
                      <span
                        key={i}
                        className="bg-primary/10 text-primary px-2 md:px-3 py-1 rounded-full text-xs md:text-sm border border-primary/20"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyPlan;
