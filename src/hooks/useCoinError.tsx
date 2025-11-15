import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export const useCoinError = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const showInsufficientCoinsError = (requiredCoins: number) => {
    toast({
      title: "سکه کافی نیست",
      description: `برای این عملیات به ${requiredCoins} سکه نیاز دارید.`,
      variant: "destructive",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/coin-shop")}
          className="gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          خرید سکه
        </Button>
      ),
    });
  };

  const handleCoinError = (error: any, requiredCoins: number = 10) => {
    const errorMessage = error?.message || error?.error || "";
    
    // Check for insufficient coins errors
    if (
      errorMessage.includes("سکه کافی نیست") ||
      errorMessage.includes("سکه کافی") ||
      errorMessage.includes("نیاز دارید") ||
      error?.status === 402
    ) {
      showInsufficientCoinsError(requiredCoins);
      return true;
    }
    
    return false;
  };

  return { showInsufficientCoinsError, handleCoinError };
};
