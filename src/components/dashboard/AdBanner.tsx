import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import defaultBanner from "@/assets/default-banner.png";

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
}

const AdBanner = () => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveBanner();
  }, []);

  const loadActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBanner(data);
      }
    } catch (error) {
      console.error("Error loading banner:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (banner?.link_url) {
      if (banner.link_url.startsWith("http")) {
        window.open(banner.link_url, "_blank");
      } else {
        navigate(banner.link_url);
      }
    } else {
      // Default: go to contact page
      navigate("/contact");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-20 sm:h-28 bg-muted/50 rounded-xl animate-pulse hidden sm:block" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="cursor-pointer group hidden sm:block"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/40 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
        <img
          src={banner?.image_url || defaultBanner}
          alt="تبلیغات"
          className="w-full h-20 sm:h-28 object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        {!banner && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-lg font-bold mb-1">اینجا محل تبلیغات شماست</p>
              <p className="text-sm opacity-80">برای اطلاعات بیشتر کلیک کنید</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdBanner;
