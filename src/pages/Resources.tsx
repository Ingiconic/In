import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  content?: string;
  created_at: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadResources();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title || !file) {
      toast({
        title: "خطا",
        description: "لطفاً عنوان و فایل را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("کاربر یافت نشد");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resources")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("resources")
        .insert({
          user_id: user.id,
          title,
          description,
          file_url: publicUrl,
          file_type: file.type,
        });

      if (insertError) throw insertError;

      toast({
        title: "موفق",
        description: "منبع با موفقیت آپلود شد",
      });

      setTitle("");
      setDescription("");
      setFile(null);
      loadResources();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "منبع حذف شد",
      });
      loadResources();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">منابع من</h1>
          <p className="text-muted-foreground">
            منابع درسی خود را آپلود کنید و از آن‌ها در ابزارهای هوش مصنوعی استفاده کنید
          </p>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">افزودن منبع جدید</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="نام منبع را وارد کنید..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">توضیحات (اختیاری)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات مختصر درباره این منبع..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">فایل</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.ogg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                فرمت‌های پشتیبانی شده: PDF, Word, Text, MP3, WAV, M4A
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="ml-2 animate-spin" />
                  در حال آپلود...
                </>
              ) : (
                <>
                  <Upload className="ml-2" />
                  آپلود منبع
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-10 h-10 text-primary" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(resource.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <h3 className="font-bold text-lg mb-2">{resource.title}</h3>
              {resource.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {resource.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(resource.created_at).toLocaleDateString("fa-IR")}
              </p>
            </Card>
          ))}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              هنوز منبعی اضافه نکرده‌اید. اولین منبع خود را آپلود کنید!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
