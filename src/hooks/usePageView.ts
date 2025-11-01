import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const usePageView = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("page_views").insert({
        user_id: user?.id || null,
        page_path: location.pathname,
      });
    };

    trackPageView();
  }, [location.pathname]);
};
