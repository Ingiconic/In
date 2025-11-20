import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Camera, Award, Target, Trophy, Star, Coins } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { logger } from "@/lib/logger";
import AppLayout from "@/components/layout/AppLayout";
import AvatarSelector from "@/components/chat/AvatarSelector";

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
    bio: "",
    avatar_url: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
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
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطا",
        description: "فقط فایل‌های تصویری مجاز هستند",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطا",
        description: "حجم تصویر نباید بیشتر از 5 مگابایت باشد",
        variant: "destructive"
      });
      return;
    }

    setAvatarFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = formData.avatar_url;

      // Upload avatar if a new file is selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(`avatars/${fileName}`, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`avatars/${fileName}`);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          username: formData.username,
          birth_date: formData.birth_date || null,
          grade: formData.grade || null,
          field: formData.field || null,
          bio: formData.bio || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setAvatarFile(null);
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

        {/* Avatar Section */}
        <Card className="p-6 glassmorphism-card border-primary/10 mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32 gradient-primary text-white">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                    {formData.full_name?.[0] || "؟"}
                  </div>
                )}
              </Avatar>
              <Button
                size="sm"
                className="absolute bottom-0 right-0 rounded-full gradient-primary shadow-glow"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl">{formData.full_name || "نام کاربر"}</h3>
              <p className="text-sm text-muted-foreground">@{formData.username || "username"}</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/30">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold">سطح {Math.floor((profile?.points || 0) / 100) + 1}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/30">
                  <Star className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-bold">{profile?.points || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold">{profile?.coins || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 glassmorphism-card border-primary/10">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            اطلاعات شخصی
          </h3>
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

            <div>
              <Label htmlFor="bio">بیوگرافی</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="در مورد خودتان بنویسید..."
                dir="rtl"
                rows={3}
              />
            </div>

            <AvatarSelector 
              currentAvatar={formData.avatar_url}
              onSelect={(avatar) => setFormData({ ...formData, avatar_url: avatar })}
            />

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

        {/* Stats Cards */}
        {profile && (
          <>
            <Card className="p-6 glassmorphism-card border-primary/10 mt-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                آمار یادگیری
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">امتیاز کل</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">{profile.points || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-xl border border-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-secondary" />
                    <p className="text-xs text-muted-foreground">آزمون‌ها</p>
                  </div>
                  <p className="text-3xl font-bold text-secondary">{profile.exams_taken || 0}</p>
                </div>
              </div>
            </Card>

            {formData.bio && (
              <Card className="p-6 glassmorphism-card border-primary/10 mt-6">
                <h3 className="font-bold text-lg mb-3">بیوگرافی</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">
                  {formData.bio}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
