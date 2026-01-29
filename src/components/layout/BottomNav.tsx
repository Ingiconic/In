import { 
  LayoutDashboard,
  Trophy, 
  HelpCircle, 
  Play, 
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "خانه", path: "/dashboard" },
    { icon: HelpCircle, label: "پرسش", path: "/questions" },
    { icon: Play, label: "ایزی تیوب", path: "/easytube" },
    { icon: Trophy, label: "رتبه", path: "/leaderboard" },
    { icon: User, label: "پروفایل", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="bg-background border-t border-border/50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all min-w-[60px] touch-target ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                }`}
                aria-label={item.label}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${active ? "bg-primary/10" : ""}`}>
                  <item.icon 
                    className="w-5 h-5" 
                    strokeWidth={active ? 2.5 : 2} 
                  />
                </div>
                <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>
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
