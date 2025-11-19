import { 
  LayoutDashboard,
  ShoppingBag, 
  HelpCircle, 
  BookText, 
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard" },
    { icon: HelpCircle, label: t("nav.questions"), path: "/questions" },
    { icon: BookText, label: "بلاگ", path: "/blog" },
    { icon: ShoppingBag, label: "فروشگاه", path: "/coin-shop" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Simplified Glass Background */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/20">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[64px] ${
                  active
                    ? "text-primary"
                    : "text-foreground/70 active:scale-95"
                }`}
                aria-label={item.label}
              >
                <div className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                  <item.icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-xs font-semibold leading-tight">
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

