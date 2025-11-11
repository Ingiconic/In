import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Coins, Users, Loader2 } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

const AdminPanel = () => {
  usePageView();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [coinAdjustments, setCoinAdjustments] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          title: "دسترسی غیرمجاز",
          description: "شما دسترسی به پنل ادمین ندارید",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadUsers();
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, coins, points, exams_taken, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
    }
  };

  const adjustCoins = async (userId: string, username: string) => {
    const amount = coinAdjustments[userId] || 0;
    if (amount === 0) {
      toast({
        title: "خطا",
        description: "مقدار سکه را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setProcessing(userId);
    try {
      const { error } = await supabase.rpc("admin_adjust_user_coins", {
        target_user_id: userId,
        coin_amount: amount,
        adjustment_reason: `Admin adjustment by admin`,
      });

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${amount > 0 ? amount : Math.abs(amount)} سکه ${amount > 0 ? "به" : "از"} ${username} ${amount > 0 ? "اضافه" : "کم"} شد`,
      });

      setCoinAdjustments({ ...coinAdjustments, [userId]: 0 });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">پنل مدیریت</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              مدیریت کاربران و سکه‌ها
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glassmorphism-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-3 rounded-xl shadow-glow">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">کاربر</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-glow">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.reduce((sum, u) => sum + (u.coins || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">کل سکه‌ها</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="gradient-secondary p-3 rounded-xl shadow-glow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.reduce((sum, u) => sum + (u.exams_taken || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">کل آزمون‌ها</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glassmorphism-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              لیست کاربران
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold">{user.full_name}</p>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>سکه: {user.coins || 0}</span>
                      <span>امتیاز: {user.points || 0}</span>
                      <span>آزمون: {user.exams_taken || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="مقدار"
                      value={coinAdjustments[user.id] || ""}
                      onChange={(e) =>
                        setCoinAdjustments({
                          ...coinAdjustments,
                          [user.id]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <Button
                      size="sm"
                      onClick={() => adjustCoins(user.id, user.username)}
                      disabled={processing === user.id}
                      className="gradient-primary"
                    >
                      {processing === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Coins className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;
