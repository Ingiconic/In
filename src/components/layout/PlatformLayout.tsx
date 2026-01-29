import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";

interface PlatformLayoutProps {
  children: ReactNode;
  platformName: string;
  platformIcon: ReactNode;
  platformColor: string;
  backPath?: string;
  backLabel?: string;
}

const PlatformLayout = ({ 
  children, 
  platformName, 
  platformIcon,
  platformColor,
  backPath = "/dashboard",
  backLabel = "برگشت به ایزی درس"
}: PlatformLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(backPath)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
              <Home className="w-4 h-4 sm:hidden" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`${platformColor} p-1.5 rounded-lg`}>
              {platformIcon}
            </div>
            <span className="font-bold text-lg">{platformName}</span>
          </div>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  );
};

export default PlatformLayout;
