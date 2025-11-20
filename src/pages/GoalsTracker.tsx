import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, CheckCircle2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GoalsTracker() {
  const [goals, setGoals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setGoals(data || []);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  };

  const createGoal = async () => {
    if (!title.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً عنوان هدف را وارد کنید!",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_goals").insert({
        user_id: user.id,
        title,
        description,
        target_date: targetDate || null,
        progress: 0,
      });

      toast({
        title: "هدف ساخته شد! 🎯",
        description: "اکنون می‌توانید پیشرفت خود را ردیابی کنید!",
      });

      setTitle("");
      setDescription("");
      setTargetDate("");
      setOpen(false);
      loadGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const updateProgress = async (goalId: string, newProgress: number) => {
    try {
      await supabase
        .from("user_goals")
        .update({ 
          progress: newProgress,
          completed: newProgress >= 100,
        })
        .eq("id", goalId);

      loadGoals();

      if (newProgress >= 100) {
        toast({
          title: "تبریک! 🎉",
          description: "هدفت را تکمیل کردی!",
        });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            اهداف من 🎯
          </h1>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                هدف جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ساخت هدف جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان هدف</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلا: قبولی در کنکور"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">توضیحات</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="جزئیات بیشتر..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاریخ هدف</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <Button onClick={createGoal} className="w-full">
                  ایجاد هدف
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>هنوز هدفی ساخته نشده! یک هدف جدید بساز و شروع کن!</p>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {goal.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Target className="w-6 h-6 text-primary" />
                      )}
                      <h3 className="text-xl font-bold">{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="text-muted-foreground mb-3">{goal.description}</p>
                    )}
                    {goal.target_date && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        تا {new Date(goal.target_date).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت</span>
                    <span className="font-bold">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-3" />
                  
                  {!goal.completed && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProgress(goal.id, Math.max(0, goal.progress - 10))}
                      >
                        -10%
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateProgress(goal.id, Math.min(100, goal.progress + 10))}
                        className="flex-1"
                      >
                        +10%
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateProgress(goal.id, 100)}
                        variant="outline"
                      >
                        تکمیل
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}