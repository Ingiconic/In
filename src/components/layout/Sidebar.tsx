import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Users, 
  HelpCircle, 
  FileText, 
  CheckSquare, 
  PenTool, 
  TrendingUp, 
  Brain,
  LayoutDashboard,
  Sparkles,
  LogOut,
  User,
  Info,
  Star,
  Trophy
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  profile: any;
}

const Sidebar = ({ profile }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userLevel = profile?.points ? Math.floor(profile.points / 100) + 1 : 1;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "خروج موفق",
        description: "با موفقیت از حساب خود خارج شدید",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در خروج پیش آمد",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
    { icon: MessageSquare, label: "پیام‌رسان", path: "/chat" },
    { icon: Users, label: "دوستان", path: "/chat-friends" },
    { icon: HelpCircle, label: "پرسش درسی", path: "/questions" },
    { icon: FileText, label: "خلاصه‌سازی", path: "/summarize" },
    { icon: CheckSquare, label: "آزمون ساز", path: "/exam" },
    { icon: PenTool, label: "حل تمرین", path: "/step-by-step" },
    { icon: Brain, label: "مشاور هوشمند", path: "/consultation" },
    { icon: TrendingUp, label: "پیشرفت من", path: "/progress" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col border-l border-border/30 bg-background/95 backdrop-blur-xl">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 p-6 border-b border-border/30">
        <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gradient">ایزی درس</h2>
          <p className="text-xs text-muted-foreground">یادگیری هوشمند</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b border-border/30">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/30">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold">سطح {userLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/30">
              <Star className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold">{profile?.points || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={`w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-glow"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border/30 space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-muted/50"
        >
          <User className="w-5 h-5" />
          <span className="text-sm">پروفایل</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/about")}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-muted/50"
        >
          <Info className="w-5 h-5" />
          <span className="text-sm">درباره ما</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">خروج</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
