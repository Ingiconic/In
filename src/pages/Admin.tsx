import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pageViews, setPageViews] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalViews: 0, todayViews: 0 });

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

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roles) {
        setIsAdmin(true);
        loadAdminData();
      } else {
        toast({
          title: "دسترسی غیرمجاز",
          description: "شما دسترسی به پنل ادمین ندارید",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    // Load all users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, points, exams_taken, created_at")
      .order("created_at", { ascending: false });

    setUsers(profiles || []);

    // Load page views
    const { data: views } = await supabase
      .from("page_views")
      .select("*, profiles(full_name, username)")
      .order("viewed_at", { ascending: false })
      .limit(100);

    setPageViews(views || []);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayViews = views?.filter(v => new Date(v.viewed_at) >= today).length || 0;

    setStats({
      totalUsers: profiles?.length || 0,
      totalViews: views?.length || 0,
      todayViews,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">پنل مدیریت</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="gradient-primary p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل کاربران</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="gradient-secondary p-3 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل بازدیدها</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="gradient-primary p-3 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بازدید امروز</p>
                <p className="text-2xl font-bold">{stats.todayViews}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users List */}
        <Card className="p-6 shadow-glow mb-8">
          <h2 className="text-lg font-bold mb-4">لیست کاربران</h2>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm">امتیاز: {user.points}</p>
                      <p className="text-sm text-muted-foreground">
                        آزمون‌ها: {user.exams_taken}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Page Views */}
        <Card className="p-6 shadow-glow">
          <h2 className="text-lg font-bold mb-4">بازدیدهای اخیر</h2>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {pageViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {view.profiles?.full_name || "کاربر ناشناس"}
                    </p>
                    <p className="text-sm text-muted-foreground">{view.page_path}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(view.viewed_at).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
