import { useState } from "react";
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
import { Upload, Video, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name_fa: string; icon: string }[];
  onSuccess: () => void;
}

const VideoUploadDialog = ({ open, onOpenChange, categories, onSuccess }: VideoUploadDialogProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      toast({
        title: "خطا",
        description: "عنوان ویدیو را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!videoFile) {
      toast({
        title: "خطا",
        description: "فایل ویدیو را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفا وارد شوید");

      // Upload video
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${user.id}/${Date.now()}.${videoExt}`;
      
      setUploadProgress(20);
      
      const { error: videoError } = await supabase.storage
        .from("easytube-videos")
        .upload(videoPath, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) throw videoError;
      
      setUploadProgress(60);

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from("easytube-videos")
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
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
      
      setUploadProgress(80);

      // Create video record
      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category_id: categoryId || null,
        is_public: true,
      });

      if (dbError) throw dbError;
      
      setUploadProgress(100);

      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview(null);
      setThumbnailPreview(null);
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "خطا در آپلود",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
                    className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Video className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    کلیک کنید یا فایل را بکشید
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
                    className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Image className="w-6 h-6 text-muted-foreground mb-1" />
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
            <Label htmlFor="title">عنوان ویدیو</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان ویدیو را وارد کنید..."
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
              placeholder="توضیحات ویدیو..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label>دسته‌بندی</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="انتخاب دسته‌بندی" />
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

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                در حال آپلود... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Submit */}
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !videoFile || !title.trim()}
            className="w-full gradient-primary"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                در حال آپلود...
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
