import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Video, Image, Loader2, Settings2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name_fa: string; icon: string }[];
  onSuccess: () => void;
}

const qualityOptions = [
  { value: "original", label: "اصلی (بدون تغییر)", desc: "کیفیت اصلی" },
  { value: "1080p", label: "1080p HD", desc: "کیفیت بالا" },
  { value: "720p", label: "720p", desc: "کیفیت متوسط" },
  { value: "480p", label: "480p", desc: "حجم کم" },
];

const visibilityOptions = [
  { value: "public", label: "عمومی", icon: "🌍" },
  { value: "private", label: "خصوصی", icon: "🔒" },
  { value: "unlisted", label: "لیست نشده", icon: "🔗" },
];

const VideoUploadDialog = ({ open, onOpenChange, categories, onSuccess }: VideoUploadDialogProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState("original");
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setQuality("original");
    setVisibility("public");
    setTags("");
    setUploadProgress(0);
    setUploadStage("");
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 100MB limit
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم ویدیو نباید بیشتر از 100 مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      
      // Auto-generate title from filename
      if (!title) {
        const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(autoTitle);
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم تصویر نباید بیشتر از 5 مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast({ title: "خطا", description: "عنوان ویدیو را وارد کنید", variant: "destructive" });
      return;
    }

    if (!videoFile) {
      toast({ title: "خطا", description: "فایل ویدیو را انتخاب کنید", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      setUploadStage("آماده‌سازی...");
      setUploadProgress(5);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفا وارد شوید");

      // Upload video with chunked progress simulation
      setUploadStage("آپلود ویدیو...");
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${user.id}/${Date.now()}.${videoExt}`;
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 2, 55));
      }, 200);
      
      const { error: videoError } = await supabase.storage
        .from("easytube-videos")
        .upload(videoPath, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      
      if (videoError) throw videoError;
      
      setUploadProgress(60);
      setUploadStage("دریافت لینک ویدیو...");

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from("easytube-videos")
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        setUploadStage("آپلود تصویر بندانگشتی...");
        setUploadProgress(70);
        
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbPath = `${user.id}/${Date.now()}_thumb.${thumbExt}`;
        
        const { error: thumbError } = await supabase.storage
          .from("easytube-thumbnails")
          .upload(thumbPath, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (thumbError) throw thumbError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("easytube-thumbnails")
          .getPublicUrl(thumbPath);
        
        thumbnailUrl = publicUrl;
      }
      
      setUploadProgress(85);
      setUploadStage("ثبت اطلاعات...");

      // Parse tags
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);

      // Create video record
      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category_id: categoryId || null,
        is_public: visibility === "public",
        status: "pending",
        quality: quality,
        tags: tagsArray.length > 0 ? tagsArray : null,
      });

      if (dbError) throw dbError;
      
      setUploadProgress(100);
      setUploadStage("تکمیل شد!");

      toast({
        title: "✅ ویدیو آپلود شد",
        description: "ویدیو شما پس از تأیید منتشر خواهد شد",
      });

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onSuccess();
      }, 500);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "خطا در آپلود",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            آپلود ویدیو جدید
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Upload */}
          <div>
            <Label>فایل ویدیو (حداکثر 100MB)</Label>
            <div className="mt-2">
              {videoPreview ? (
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video 
                    src={videoPreview} 
                    className="w-full aspect-video object-contain"
                    controls
                  />
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-destructive text-white hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Video className="w-7 h-7 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">
                    انتخاب ویدیو
                  </span>
                  <span className="text-xs text-muted-foreground/60 mt-1">
                    MP4, MOV, AVI
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <Label>تصویر بندانگشتی (اختیاری)</Label>
            <div className="mt-2">
              {thumbnailPreview ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                  <button
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-destructive text-white hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Image className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    انتخاب تصویر
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">عنوان ویدیو *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان جذاب برای ویدیو..."
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="درباره ویدیو بنویسید..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Category & Visibility Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>دسته‌بندی</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name_fa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>نمایش</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-4 h-4" />
            تنظیمات پیشرفته
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              {/* Quality */}
              <div>
                <Label>کیفیت خروجی</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">({opt.desc})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tags */}
              <div>
                <Label>برچسب‌ها</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="آموزش, ریاضی, کنکور (با کاما جدا کنید)"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{uploadStage}</span>
                <span className="font-bold text-primary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Submit */}
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !videoFile || !title.trim()}
            className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white font-bold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                {uploadStage}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                انتشار ویدیو
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadDialog;
