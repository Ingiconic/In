import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";
import AvatarSelector from "@/components/chat/AvatarSelector";
import { ProfileSkeleton } from "@/components/ui/skeleton-loaders";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || "");
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

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "خطا",
        description: "نام کاربری نمی‌تواند خالی باشد",
        variant: "destructive",
      });
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast({
        title: "خطا",
        description: "نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، اعداد و _ باشد",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "پروفایل با موفقیت ذخیره شد",
      });
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

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور فعلی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "خطا",
        description: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور جدید و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      // First verify old password by signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("کاربر یافت نشد");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        toast({
          title: "خطا",
          description: "رمز عبور فعلی اشتباه است",
          variant: "destructive",
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "موفق",
        description: "رمز عبور با موفقیت تغییر کرد",
      });

      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "خروج موفق",
        description: "با موفقیت از حساب خارج شدید",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6 max-w-md pb-24 lg:pb-6">
          <ProfileSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-md pb-24 lg:pb-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-card rounded-xl p-5 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">پروفایل</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              تنظیمات حساب کاربری
            </p>
          </div>
        </div>

        {/* Current Avatar Display */}
        <div className="flex justify-center mb-6">
          <Avatar className="w-24 h-24 gradient-primary text-white border-4 border-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                {username?.[0]?.toUpperCase() || "؟"}
              </div>
            )}
          </Avatar>
        </div>

        {/* Username & Avatar Section */}
        <Card className="p-5 bg-card border-border/40 mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            نام کاربری و آواتار
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری (انگلیسی)"
                dir="ltr"
                className="text-left mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                فقط حروف انگلیسی، اعداد و _ (۳ تا ۲۰ کاراکتر)
              </p>
            </div>

            <AvatarSelector 
              currentAvatar={avatarUrl}
              onSelect={(avatar) => setAvatarUrl(avatar)}
            />

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full gradient-primary touch-target"
            >
              <Save className="w-4 h-4 ml-2" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </Card>

        {/* Password Change Section */}
        <Card className="p-5 bg-card border-border/40 mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            تغییر رمز عبور
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="oldPassword">رمز عبور فعلی</Label>
              <div className="relative mt-1.5">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="رمز فعلی را وارد کنید"
                  dir="ltr"
                  className="text-left pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">رمز عبور جدید</Label>
              <div className="relative mt-1.5">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز جدید (حداقل ۸ کاراکتر)"
                  dir="ltr"
                  className="text-left pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">تکرار رمز عبور جدید</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز جدید"
                  dir="ltr"
                  className="text-left pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              variant="outline"
              className="w-full touch-target"
            >
              <Lock className="w-4 h-4 ml-2" />
              {changingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
            </Button>
          </div>
        </Card>

        {/* Logout Section */}
        <Card className="p-5 bg-card border-destructive/30">
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="destructive"
            className="w-full touch-target"
          >
            <LogOut className="w-4 h-4 ml-2" />
            {loggingOut ? "در حال خروج..." : "خروج از حساب"}
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
