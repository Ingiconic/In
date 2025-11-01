import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const usePageView = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      // Paths to exclude from tracking for privacy
      const excludedPaths = [
        '/profile',
        '/admin',
        '/auth',
      ];
      
      // Don't track excluded paths
      if (excludedPaths.some(path => location.pathname.startsWith(path))) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Only track authenticated users
      if (!user) return;
      
      await supabase.from("page_views").insert({
        user_id: user.id,
        page_path: location.pathname,
      });
    };

    trackPageView();
  }, [location.pathname]);
};
