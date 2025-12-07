import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Loader2, ImageIcon, Link, Trash2, Upload
} from "lucide-react";
import { motion } from "framer-motion";
import { AdminRoute } from "@/components/auth/AdminRoute";

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  created_at: string;
}

const AdminAds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      // Use admin role to fetch all banners
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم عکس نباید بیشتر از 5 مگابایت باشد",
          variant: "destructive"
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleUploadBanner = async () => {
    if (!imageFile || !linkUrl) {
      toast({
        title: "خطا",
        description: "لطفا تصویر و لینک را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(imageFile);

      const { error } = await supabase
        .from("banners")
        .insert([{
          image_url: imageUrl,
          link_url: linkUrl,
          is_active: true
        }]);

      if (error) throw error;

      toast({ title: "موفق", description: "بنر با موفقیت آپلود شد" });
      setImageFile(null);
      setImagePreview(null);
      setLinkUrl("");
      await loadBanners();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleBannerActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);

      if (error) throw error;
      await loadBanners();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این بنر را حذف کنید؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "موفق", description: "بنر حذف شد" });
      await loadBanners();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به پنل
            </Button>
            
            <h1 className="text-3xl font-bold text-gradient">مدیریت تبلیغات</h1>
            <p className="text-muted-foreground mt-2">
              آپلود و مدیریت بنر تبلیغاتی داشبورد
            </p>
          </motion.div>

          {/* Upload New Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 glass-card border-primary/20 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                آپلود بنر جدید
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>تصویر بنر</Label>
                  <div className="mt-2">
                    {imagePreview && (
                      <div className="mb-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-right"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      سایز پیشنهادی: 1024×320 پیکسل - حداکثر 5 مگابایت
                    </p>
                  </div>
                </div>

                <div>
                  <Label>لینک مقصد</Label>
                  <Input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com یا /contact"
                    className="text-right mt-2"
                    dir="ltr"
                  />
                </div>

                <Button
                  onClick={handleUploadBanner}
                  disabled={uploading || !imageFile || !linkUrl}
                  className="w-full gradient-primary"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      آپلود بنر
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Existing Banners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              بنرهای موجود
            </h2>

            <div className="space-y-4">
              {banners.map((banner) => (
                <Card key={banner.id} className="p-4 glass-card border-primary/20">
                  <div className="flex flex-col md:flex-row gap-4">
                    <img 
                      src={banner.image_url} 
                      alt="Banner"
                      className="w-full md:w-48 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate" dir="ltr">
                          {banner.link_url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          banner.is_active 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-orange-500/20 text-orange-500'
                        }`}>
                          {banner.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => toggleBannerActive(banner)}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBanner(banner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {banners.length === 0 && !loading && (
                <Card className="p-8 text-center glass-card border-primary/20">
                  <p className="text-muted-foreground">
                    هنوز بنری آپلود نشده است
                  </p>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminAds;
