import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
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
  Trophy,
  Coins,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  profile: any;
}

const Sidebar = ({ profile }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const userLevel = profile?.points ? Math.floor(profile.points / 100) + 1 : 1;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t("common.success"),
        description: t("nav.logout"),
      });
      navigate("/");
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard", coins: 0 },
    { icon: FileText, label: t("dashboard.resources"), path: "/resources", coins: 0 },
    { icon: HelpCircle, label: t("nav.questions"), path: "/questions", coins: 2 },
    { icon: FileText, label: t("nav.summarize"), path: "/summarize", coins: 2 },
    { icon: CheckSquare, label: t("nav.exam"), path: "/exam-v2", coins: 5 },
    { icon: PenTool, label: t("dashboard.flashcards"), path: "/flashcards", coins: 3 },
    { icon: Brain, label: "نقشه ذهنی", path: "/mind-map", coins: 4 },
    { icon: Lightbulb, label: t("dashboard.studyPlan"), path: "/study-plan", coins: 3 },
    { icon: TrendingUp, label: t("nav.progress"), path: "/progress", coins: 0 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col border-l border-border/30 bg-background/95 backdrop-blur-xl">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 p-6 border-b border-border/30">
        <img src="/logo.png" alt={t("app.name")} className="w-12 h-12" />
        <div>
          <h2 className="text-xl font-bold text-gradient">{t("app.name")}</h2>
          <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
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
              <span className="text-xs font-bold">{t("header.level")} {userLevel}</span>
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

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={`w-full justify-between gap-3 h-11 px-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-glow"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.coins > 0 && (
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-500">{item.coins}</span>
                </div>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border/30 space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/coin-shop")}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-yellow-500/10 hover:text-yellow-500"
        >
          <Coins className="w-5 h-5" />
          <span className="text-sm">فروشگاه سکه</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-muted/50"
        >
          <User className="w-5 h-5" />
          <span className="text-sm">{t("nav.profile")}</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/about")}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-muted/50"
        >
          <Info className="w-5 h-5" />
          <span className="text-sm">{t("nav.about")}</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">{t("nav.logout")}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
