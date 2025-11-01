import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, Plus, Trash2, CheckCircle } from "lucide-react";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

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

  const handleCreate = async () => {
    if (!title || !startDate || !endDate) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای ضروری را پر کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("study_plans").insert({
        user_id: user.id,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        subjects: [],
      });

      if (error) throw error;

      toast({
        title: "موفق!",
        description: "برنامه مطالعه ایجاد شد",
      });

      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
      loadPlans();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
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
              <Calendar className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gradient animate-neon-pulse">برنامه مطالعه هوشمند</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">برنامه‌های مطالعاتی من</h2>
            <p className="text-muted-foreground">مدیریت و برنامه‌ریزی مطالعه</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="hero"
            size="lg"
            className="shadow-glow"
          >
            <Plus className="ml-2 w-4 h-4" />
            برنامه جدید
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8 shadow-glow border-primary/20 animate-fade-in">
            <h3 className="text-xl font-bold mb-4">ایجاد برنامه مطالعه</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">عنوان برنامه</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: آماده‌سازی امتحان نهایی"
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">توضیحات</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="جزئیات برنامه..."
                  className="bg-input border-border/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">تاریخ شروع</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاریخ پایان</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-input border-border/50"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreate} className="shadow-glow">
                  <CheckCircle className="ml-2 w-4 h-4" />
                  ایجاد برنامه
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
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
          <Card className="p-12 text-center shadow-glow border-primary/20 animate-fade-in">
            <div className="gradient-primary p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-neon">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">هنوز برنامه‌ای ندارید</h3>
            <p className="text-muted-foreground mb-4">
              اولین برنامه مطالعه خود را ایجاد کنید
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, idx) => (
              <Card
                key={plan.id}
                className="p-6 shadow-glow border-primary/20 hover:border-primary/40 transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="gradient-primary p-2 rounded-lg shadow-neon">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {plan.description && (
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(plan.start_date).toLocaleDateString("fa-IR")} -{" "}
                      {new Date(plan.end_date).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyPlan;