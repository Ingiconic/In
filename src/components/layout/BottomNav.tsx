import { 
  LayoutDashboard,
  ShoppingBag, 
  HelpCircle, 
  FileText, 
  User,
  Newspaper,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard", gradient: "from-primary to-purple-500" },
    { icon: HelpCircle, label: t("nav.questions"), path: "/questions", gradient: "from-secondary to-cyan-500" },
    { icon: FileText, label: t("nav.summarize"), path: "/summarize", gradient: "from-accent to-pink-500" },
    { icon: ShoppingBag, label: "فروشگاه", path: "/coin-shop", gradient: "from-success to-emerald-500" },
    { icon: User, label: t("nav.profile"), path: "/profile", gradient: "from-primary to-secondary" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Glass Background with Blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-white/10" />
      
      {/* Active Indicator Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {navItems.map((item) => 
          isActive(item.path) ? (
            <div
              key={item.path}
              className="absolute bottom-0 h-1 transition-all duration-500 shadow-neon"
              style={{
                left: `${(navItems.findIndex(i => i.path === item.path) / navItems.length) * 100}%`,
                width: `${100 / navItems.length}%`,
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)'
              }}
            />
          ) : null
        )}
      </div>

      <div className="relative flex items-center justify-around px-2 py-3">
        {navItems.map((item, index) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-500 relative group ${
              isActive(item.path)
                ? "scale-110"
                : "scale-95 hover:scale-100"
            }`}
          >
            {/* Icon Container with Gradient Background when Active */}
            <div className={`relative transition-all duration-500 ${
              isActive(item.path) 
                ? "w-14 h-14 rounded-2xl gradient-primary shadow-glow flex items-center justify-center" 
                : "w-10 h-10"
            }`}>
              <item.icon className={`transition-all duration-500 ${
                isActive(item.path) 
                  ? "w-7 h-7 text-white drop-shadow-lg" 
                  : "w-6 h-6 text-muted-foreground group-hover:text-foreground"
              }`} />
              
              {/* Notification Dot (can be dynamic) */}
              {item.path === "/questions" && !isActive(item.path) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full shadow-neon animate-pulse" />
              )}
            </div>

            {/* Label - Show only when active */}
            <span className={`text-xs font-bold transition-all duration-500 ${
              isActive(item.path)
                ? "opacity-100 text-primary"
                : "opacity-0 text-muted-foreground"
            }`}>
              {item.label}
            </span>

            {/* Hover Effect */}
            {!isActive(item.path) && (
              <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
