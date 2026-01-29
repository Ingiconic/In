import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Image, FileText } from "lucide-react";
import { z } from "zod";

interface BlogWriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const blogSchema = z.object({
  title: z.string().min(5, "عنوان باید حداقل ۵ کاراکتر باشد").max(200, "عنوان حداکثر ۲۰۰ کاراکتر است"),
  content: z.string().min(100, "محتوا باید حداقل ۱۰۰ کاراکتر باشد").max(50000, "محتوا حداکثر ۵۰۰۰۰ کاراکتر است"),
  excerpt: z.string().max(300, "خلاصه حداکثر ۳۰۰ کاراکتر است").optional(),
  featured_image: z.string().url("آدرس تصویر معتبر نیست").optional().or(z.literal("")),
});

const BlogWriteDialog = ({ open, onOpenChange, onSuccess }: BlogWriteDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100) + "-" + Date.now();
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      
      const validation = blogSchema.safeParse({
        title,
        content,
        excerpt: excerpt || undefined,
        featured_image: featuredImage || undefined,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "ابتدا وارد شوید", variant: "destructive" });
        return;
      }

      const slug = generateSlug(title);

      const { error } = await supabase.from("user_blogs").insert({
        user_id: session.user.id,
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        featured_image: featuredImage.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      // Reset form
      setTitle("");
      setContent("");
      setExcerpt("");
      setFeaturedImage("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating blog:", error);
      toast({
        title: "خطا در ارسال مقاله",
        description: error.message || "لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            نوشتن مقاله جدید
          </DialogTitle>
          <DialogDescription>
            مقاله خود را بنویسید. پس از بررسی توسط ادمین منتشر خواهد شد.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان مقاله *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="یک عنوان جذاب برای مقاله..."
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">خلاصه (اختیاری)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="یک خلاصه کوتاه از مقاله..."
              rows={2}
              className={errors.excerpt ? "border-destructive" : ""}
            />
            {errors.excerpt && (
              <p className="text-xs text-destructive">{errors.excerpt}</p>
            )}
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label htmlFor="featured_image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              لینک تصویر شاخص (اختیاری)
            </Label>
            <Input
              id="featured_image"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
              className={errors.featured_image ? "border-destructive" : ""}
            />
            {errors.featured_image && (
              <p className="text-xs text-destructive">{errors.featured_image}</p>
            )}
            {featuredImage && (
              <img 
                src={featuredImage} 
                alt="Preview" 
                className="w-full h-40 object-cover rounded-lg"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">محتوای مقاله *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="متن کامل مقاله خود را اینجا بنویسید..."
              rows={12}
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content}</p>
            )}
            <p className="text-xs text-muted-foreground text-left">
              {content.length} / 50000 کاراکتر
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="gradient-secondary gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            ارسال برای تایید
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogWriteDialog;
