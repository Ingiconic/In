import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Send, Image, FileText, Sparkles, Eye, 
  Tag, Calendar, Save, X, Monitor, Smartphone
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface BlogWriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "ریاضی", "فیزیک", "شیمی", "زیست", "ادبیات", "زبان انگلیسی",
  "تاریخ", "جغرافیا", "فلسفه", "کامپیوتر", "هنر", "عمومی", "مشاوره",
  "تکنولوژی", "علوم", "روانشناسی"
];

const BlogWriteDialog = ({ open, onOpenChange, onSuccess }: BlogWriteDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [activeTab, setActiveTab] = useState("write");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!open || !title) return;
    const timer = setInterval(() => {
      saveDraft();
    }, 30000);
    return () => clearInterval(timer);
  }, [open, title, contentHtml]);

  // Load draft on open
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem("easyblog_draft");
      if (draft) {
        try {
          const d = JSON.parse(draft);
          if (d.title) setTitle(d.title);
          if (d.contentHtml) setContentHtml(d.contentHtml);
          if (d.excerpt) setExcerpt(d.excerpt);
          if (d.featuredImage) setFeaturedImage(d.featuredImage);
          if (d.tags) setTags(d.tags);
          if (d.category) setCategory(d.category);
          if (d.authorName) setAuthorName(d.authorName);
        } catch {}
      }
    }
  }, [open]);

  const saveDraft = useCallback(() => {
    if (!title && !contentHtml) return;
    localStorage.setItem("easyblog_draft", JSON.stringify({
      title, contentHtml, excerpt, featuredImage, tags, category, authorName,
      savedAt: new Date().toISOString(),
    }));
  }, [title, contentHtml, excerpt, featuredImage, tags, category, authorName]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100) + "-" + Date.now();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAIEnhance = async () => {
    if (!contentHtml || contentHtml.length < 50) {
      toast({ title: "متن کافی نیست", description: "حداقل ۵۰ کاراکتر بنویسید", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("لطفا وارد شوید");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-blog-enhance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title,
            content: contentHtml,
            action: "enhance",
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: "تعداد درخواست زیاد", description: "لطفا کمی صبر کنید", variant: "destructive" });
          return;
        }
        throw new Error("خطا در ارتباط");
      }

      const data = await response.json();
      if (data.enhanced_content) {
        setContentHtml(data.enhanced_content);
        toast({ title: "مقاله با AI بهبود یافت! ✨" });
      }
      if (data.suggested_tags && data.suggested_tags.length > 0) {
        setTags(prev => [...new Set([...prev, ...data.suggested_tags])].slice(0, 10));
      }
      if (data.suggested_excerpt) {
        setExcerpt(data.suggested_excerpt);
      }
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.length < 5) newErrors.title = "عنوان باید حداقل ۵ کاراکتر باشد";
    if (!contentHtml || contentHtml.replace(/<[^>]*>/g, "").trim().length < 50)
      newErrors.content = "محتوا باید حداقل ۵۰ کاراکتر باشد";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "ابتدا وارد شوید", variant: "destructive" });
        return;
      }

      const plainText = contentHtml.replace(/<[^>]*>/g, "").trim();
      const wordCount = plainText.split(/\s+/).filter(Boolean).length;
      const slug = generateSlug(title);

      const insertData: any = {
        user_id: session.user.id,
        title: title.trim(),
        slug,
        content: plainText,
        content_html: contentHtml,
        excerpt: excerpt.trim() || plainText.substring(0, 200),
        featured_image: featuredImage.trim() || null,
        author_name: authorName.trim() || null,
        tags,
        category: category || null,
        word_count: wordCount,
        status: scheduledAt ? "scheduled" : "pending",
        scheduled_at: scheduledAt || null,
      };

      const { error } = await supabase.from("user_blogs").insert(insertData);
      if (error) throw error;

      // Clear draft
      localStorage.removeItem("easyblog_draft");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAuthorName("");
    setContentHtml("");
    setExcerpt("");
    setFeaturedImage("");
    setTags([]);
    setTagInput("");
    setCategory("");
    setScheduledAt("");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            نوشتن مقاله جدید
          </DialogTitle>
          <DialogDescription>
            مقاله خود را با ویرایشگر حرفه‌ای بنویسید. ذخیره خودکار هر ۳۰ ثانیه.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="write" className="gap-1.5">
                <FileText className="w-4 h-4" />
                نوشتن
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Tag className="w-4 h-4" />
                تنظیمات
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="w-4 h-4" />
                پیش‌نمایش
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <TabsContent value="write" className="mt-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان مقاله *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="یک عنوان جذاب..."
                  className={cn("text-lg font-bold", errors.title && "border-destructive")}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>محتوای مقاله *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIEnhance}
                    disabled={aiLoading}
                    className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    بهبود با AI
                  </Button>
                </div>
                <RichTextEditor
                  content={contentHtml}
                  onChange={setContentHtml}
                />
                {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-5">
              {/* Author Name */}
              <div className="space-y-2">
                <Label>نام نویسنده (اختیاری)</Label>
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="نام شما..." />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label>خلاصه (اختیاری)</Label>
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="خلاصه کوتاه..." />
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Image className="w-4 h-4" />تصویر شاخص</Label>
                <Input
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
                {featuredImage && (
                  <img src={featuredImage} alt="Preview" className="w-full h-40 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <Badge
                      key={cat}
                      variant={category === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCategory(category === cat ? "" : cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>تگ‌ها (حداکثر ۱۰)</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="تگ جدید..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>افزودن</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" />زمان‌بندی انتشار (اختیاری)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  dir="ltr"
                />
                {scheduledAt && <p className="text-xs text-muted-foreground">مقاله در زمان مشخص شده برای تایید ارسال می‌شود</p>}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="flex justify-center gap-2 mb-4">
                <Button variant={previewMode === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("desktop")} className="gap-1.5">
                  <Monitor className="w-4 h-4" /> دسکتاپ
                </Button>
                <Button variant={previewMode === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("mobile")} className="gap-1.5">
                  <Smartphone className="w-4 h-4" /> موبایل
                </Button>
              </div>
              <div className={cn(
                "mx-auto border border-border rounded-xl p-6 bg-background overflow-y-auto max-h-[60vh]",
                previewMode === "mobile" ? "max-w-sm" : "max-w-3xl"
              )}>
                {featuredImage && (
                  <img src={featuredImage} alt={title} className="w-full h-48 object-cover rounded-xl mb-4" />
                )}
                <h1 className="text-2xl font-bold mb-3">{title || "عنوان مقاله"}</h1>
                {excerpt && <p className="text-muted-foreground mb-4">{excerpt}</p>}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {category && <Badge>{category}</Badge>}
                  {tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: contentHtml || "<p>محتوای مقاله اینجا نمایش داده می‌شود...</p>" }}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center gap-2 justify-between border-t border-border px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={saveDraft} className="gap-1.5 text-muted-foreground">
            <Save className="w-4 h-4" /> ذخیره پیش‌نویس
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 gradient-primary text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {scheduledAt ? "زمان‌بندی" : "ارسال برای تایید"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default BlogWriteDialog;
