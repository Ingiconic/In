import { Button } from "@/components/ui/button";
import { 
  Sparkles,
  Star,
  Trophy,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";

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
  LogOut,
  User,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  profile: any;
}

const Header = ({ profile }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userLevel = profile?.points ? Math.floor(profile.points / 100) + 1 : 1;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "موفق",
        description: "با موفقیت خارج شدید",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطایی رخ داد",
        variant: "destructive",
      });
    }
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
    { icon: MessageSquare, label: "پیام‌رسان", path: "/messenger" },
    { icon: HelpCircle, label: "پرسش درسی", path: "/questions" },
    { icon: FileText, label: "خلاصه‌ساز", path: "/summarize" },
    { icon: CheckSquare, label: "آزمون", path: "/exam" },
    { icon: PenTool, label: "حل گام به گام", path: "/step-by-step" },
    { icon: Brain, label: "مشاوره", path: "/consultation" },
    { icon: TrendingUp, label: "پیشرفت", path: "/progress" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo - Hidden on Desktop (shown in sidebar) */}
        <div className="flex items-center gap-3 lg:hidden">
          <img src="/logo.png" alt="ایزی‌درس" className="w-10 h-10" />
          <span className="text-lg font-bold text-gradient">ایزی‌درس</span>
        </div>

        {/* Desktop: Stats */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-3">
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/30">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">سطح {userLevel}</span>
          </div>
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/30">
            <Star className="w-5 h-5 text-secondary" />
            <span className="font-bold text-sm">{profile?.points || 0}</span>
          </div>
        </div>

        {/* Mobile: Stats + Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30">
            <Star className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold">{profile?.points || 0}</span>
          </div>
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="ایزی‌درس" className="w-10 h-10" />
                    <span className="text-lg font-bold text-gradient">ایزی‌درس</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User Profile */}
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

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all ${
                          isActive(item.path)
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Button>
                    ))}
                  </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-border/30 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/about");
                      setMobileMenuOpen(false);
                    }}
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
