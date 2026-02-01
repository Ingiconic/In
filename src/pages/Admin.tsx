import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, Eye, Coins, TrendingUp, Calendar, Shield,
  Plus, Minus, Search, ArrowLeft, Loader2, LogOut, BookOpen,
  Megaphone, MessageSquare, FileText, FolderOpen
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { AdminRoute } from "@/components/auth/AdminRoute";

interface PageView {
  page_path: string;
  count: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  coins: number;
  points: number;
  exams_taken: number;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [todayViews, setTodayViews] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPageViews(),
      loadUsers()
    ]);
  };

  const loadPageViews = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("page_views")
        .select("page_path, viewed_at")
        .gte("viewed_at", today.toISOString());

      if (error) {
        console.error("Error loading page views:", error);
        return;
      }

      // Count views per page
      const viewCounts: { [key: string]: number } = {};
      let totalToday = 0;

      data?.forEach((view) => {
        viewCounts[view.page_path] = (viewCounts[view.page_path] || 0) + 1;
        totalToday++;
      });

      const viewsArray = Object.entries(viewCounts).map(([path, count]) => ({
        page_path: path,
        count
      }));

      viewsArray.sort((a, b) => b.count - a.count);

      setPageViews(viewsArray);
      setTodayViews(totalToday);
    } catch (error) {
      console.error("Error loading page views:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading users:", error);
        return;
      }
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "خروج موفق",
      description: "شما از پنل مدیریت خارج شدید"
    });
    navigate("/admin");
  };

  const adjustUserCoins = async (userId: string, amount: number) => {
    if (!amount || amount === 0) {
      toast({
        title: "خطا",
        description: "لطفا مقدار معتبری وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setAdjusting(true);
    try {
      // Use the secure RPC function for adjusting coins
      const { error } = await supabase.rpc('admin_adjust_user_coins', {
        target_user_id: userId,
        coin_amount: amount,
        adjustment_reason: amount > 0 ? 'تراکنش ادمین - افزودن سکه' : 'تراکنش ادمین - کسر سکه'
      });

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${Math.abs(amount)} سکه ${amount > 0 ? "اضافه" : "کم"} شد`
      });

      setCoinAmount("");
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive"
      });
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                بازگشت به داشبورد
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/content")}
              >
                <FileText className="ml-2 h-4 w-4" />
                تایید محتوا
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/blog")}
              >
                <BookOpen className="ml-2 h-4 w-4" />
                مدیریت بلاگ
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/ads")}
              >
                <Megaphone className="ml-2 h-4 w-4" />
                مدیریت تبلیغات
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/tickets")}
              >
                <MessageSquare className="ml-2 h-4 w-4" />
                مدیریت تیکت‌ها
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/handouts")}
              >
                <FolderOpen className="ml-2 h-4 w-4" />
                مدیریت جزوات
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="ml-2 h-4 w-4" />
                خروج از پنل
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">پنل مدیریت</h1>
              <p className="text-muted-foreground">مدیریت کاربران و آمار سایت</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">بازدید امروز</p>
                  <p className="text-3xl font-bold text-gradient">{todayViews}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">کل کاربران</p>
                  <p className="text-3xl font-bold text-gradient">{users.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">صفحات پربازدید</p>
                  <p className="text-3xl font-bold text-gradient">{pageViews.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">امروز</p>
                  <p className="text-lg font-bold text-gradient">
                    {format(new Date(), "yyyy/MM/dd")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Page Views Table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-primary/20 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                بازدید صفحات امروز
              </h2>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">صفحه</TableHead>
                      <TableHead className="text-right">تعداد بازدید</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageViews.map((view, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{view.page_path}</TableCell>
                        <TableCell>{view.count}</TableCell>
                      </TableRow>
                    ))}
                    {pageViews.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          هنوز بازدیدی ثبت نشده است
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>

          {/* Users Management */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card border-primary/20 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                مدیریت کاربران
              </h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="جستجوی کاربر..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </div>

              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام کاربری</TableHead>
                      <TableHead className="text-right">سکه</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-primary" />
                            <span className="font-bold">{user.coins}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {selectedUser === user.id ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="مقدار"
                                value={coinAmount}
                                onChange={(e) => setCoinAmount(e.target.value)}
                                className="w-20 h-8"
                                disabled={adjusting}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustUserCoins(user.id, parseInt(coinAmount))}
                                disabled={adjusting}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => adjustUserCoins(user.id, -parseInt(coinAmount))}
                                disabled={adjusting}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(null);
                                  setCoinAmount("");
                                }}
                                disabled={adjusting}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user.id)}
                            >
                              <Coins className="w-3 h-3 ml-1" />
                              تغییر سکه
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
    </AdminRoute>
  );
};

export default Admin;
