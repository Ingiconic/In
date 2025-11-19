import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed or prompt was dismissed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      localStorage.getItem('installPromptDismissed') === 'true'
    ) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      navigate('/install');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const handleLearnMore = () => {
    navigate('/install');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[100] lg:left-auto lg:right-6 lg:max-w-md"
        >
          <Card className="glassmorphism-card border-primary/30 shadow-neon">
            <div className="p-6">
              <button
                onClick={handleDismiss}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 mb-4 mt-2">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">نصب Easy Dars</h3>
                  <p className="text-sm text-muted-foreground">
                    برای دسترسی سریع‌تر و تجربه بهتر، اپ رو نصب کن
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1"
                >
                  نصب کن
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLearnMore}
                >
                  بیشتر بدون
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
