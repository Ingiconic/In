import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useAuthRequired = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAuthAndRedirect = async (callback?: () => void) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "نیاز به ثبت‌نام",
        description: "برای استفاده از این ابزار باید ثبت‌نام کنید",
        variant: "destructive",
      });
      navigate("/signup");
      return false;
    }
    
    if (callback) {
      callback();
    }
    return true;
  };

  const navigateWithAuth = async (path: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "نیاز به ثبت‌نام",
        description: "برای استفاده از این ابزار باید ثبت‌نام کنید",
        variant: "destructive",
      });
      navigate("/signup");
      return;
    }
    
    navigate(path);
  };

  return { checkAuthAndRedirect, navigateWithAuth };
};
