import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { logger } from "@/lib/logger";
import AppLayout from "@/components/layout/AppLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    birth_date: "",
    grade: "",
    field: "",
  });

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
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        birth_date: data.birth_date || "",
        grade: data.grade || "",
        field: data.field || "",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          username: formData.username,
          birth_date: formData.birth_date || null,
          grade: formData.grade || null,
          field: formData.field || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "پروفایل با موفقیت بروزرسانی شد",
      });
      loadProfile();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <User className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">پروفایل کاربری</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              اطلاعات خود را ویرایش کنید
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <Card className="p-6 glassmorphism-card border-primary/10">
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">نام و نام خانوادگی</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="birth_date">تاریخ تولد</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="grade">پایه تحصیلی</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="مثلاً: دهم"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="field">رشته تحصیلی</Label>
              <Input
                id="field"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                placeholder="مثلاً: ریاضی"
                dir="rtl"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full gradient-primary shadow-glow"
              size="lg"
            >
              <Save className="w-5 h-5 ml-2" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </Card>

        {/* Stats Card */}
        {profile && (
          <Card className="p-6 glassmorphism-card border-primary/10 mt-6">
            <h3 className="font-bold text-lg mb-4">آمار کاربری</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">امتیاز کل</p>
                <p className="text-2xl font-bold text-primary">{profile.points || 0}</p>
              </div>
              <div className="bg-secondary/10 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">آزمون‌های انجام شده</p>
                <p className="text-2xl font-bold text-secondary">{profile.exams_taken || 0}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
