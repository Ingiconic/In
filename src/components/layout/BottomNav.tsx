import { 
  LayoutDashboard,
  Trophy, 
  HelpCircle, 
  BookText, 
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "خانه", path: "/dashboard" },
    { icon: HelpCircle, label: "پرسش", path: "/questions" },
    { icon: BookText, label: "بلاگ", path: "/blog" },
    { icon: Trophy, label: "رتبه", path: "/leaderboard" },
    { icon: User, label: "پروفایل", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/30 shadow-lg">
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground active:scale-95 active:bg-muted/50"
                }`}
                aria-label={item.label}
              >
                <item.icon 
                  className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
