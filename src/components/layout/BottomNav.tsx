import { 
  LayoutDashboard,
  ShoppingBag, 
  HelpCircle, 
  FileText, 
  User,
  Newspaper,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "خانه", path: "/dashboard" },
    { icon: ShoppingBag, label: "فروشگاه", path: "/coin-shop" },
    { icon: Newspaper, label: "وبلاگ", path: "/blog" },
    { icon: HelpCircle, label: "پرسش", path: "/questions" },
    { icon: User, label: "پروفایل", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              isActive(item.path)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? "scale-110" : ""}`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
