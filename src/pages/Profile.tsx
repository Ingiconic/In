import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, User, Save } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

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
        title: "موفق! ✅",
        description: "اطلاعات پروفایل شما ذخیره شد",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-lg shadow-glow">
                <User className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">پروفایل من</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 shadow-glow">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {formData.full_name?.[0] || "؟"}
              </div>
              <p className="text-sm text-muted-foreground">
                امتیاز: {profile?.points || 0} | آزمون‌های انجام شده: {profile?.exams_taken || 0}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">نام و نام خانوادگی</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="نام خود را وارد کنید"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="username">نام کاربری</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="نام کاربری"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="birth_date">تاریخ تولد</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="grade">پایه تحصیلی</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  placeholder="مثلاً: 8، 9، 10"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="field">رشته</Label>
                <Input
                  id="field"
                  value={formData.field || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, field: e.target.value })
                  }
                  placeholder="مثلاً: تجربی، ریاضی، انسانی"
                  dir="rtl"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full shadow-glow"
              size="lg"
            >
              <Save className="w-4 h-4 ml-2" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
