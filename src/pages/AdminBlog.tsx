import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Loader2, Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { blogPostSchema } from "@/lib/blogValidation";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  published: boolean;
  created_at: string;
  published_at: string | null;
}

const AdminBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin");
        return;
      }

      // Verify user has admin role
      const { data: hasAdmin, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error || !hasAdmin) {
        toast({
          title: "دسترسی غیرمجاز",
          description: "شما دسترسی به این بخش ندارید",
          variant: "destructive"
        });
        navigate("/admin");
        return;
      }

      await loadPosts();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSavePost = async () => {
    setUploading(true);
    try {
      // Validate input data
      const slug = generateSlug(title);
      const validationResult = blogPostSchema.safeParse({
        title,
        slug,
        content,
        excerpt: excerpt || "",
        featured_image: imageFile ? "temp" : (editingPost?.featured_image || "")
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "خطای اعتبارسنجی",
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }

      let imageUrl = editingPost?.featured_image || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const postData = {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 150),
        featured_image: imageUrl,
        published,
        published_at: published ? new Date().toISOString() : null
      };

      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast({ title: "موفق", description: "پست به‌روزرسانی شد" });
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([postData]);

        if (error) throw error;
        toast({ title: "موفق", description: "پست ایجاد شد" });
      }

      resetForm();
      setIsDialogOpen(false);
      await loadPosts();
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

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt);
    setPublished(post.published);
    setImagePreview(post.featured_image);
    setIsDialogOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پست را حذف کنید؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "موفق", description: "پست حذف شد" });
      await loadPosts();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive"
      });
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ 
          published: !post.published,
          published_at: !post.published ? new Date().toISOString() : null
        })
        .eq("id", post.id);

      if (error) throw error;
      await loadPosts();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setTitle("");
    setContent("");
    setExcerpt("");
    setPublished(false);
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gradient">مدیریت بلاگ</h1>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gradient-primary">
                  <Plus className="ml-2 h-4 w-4" />
                  پست جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? "ویرایش پست" : "پست جدید"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>عنوان</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="عنوان پست..."
                      className="text-right"
                    />
                  </div>

                  <div>
                    <Label>خلاصه (اختیاری)</Label>
                    <Textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="خلاصه‌ای کوتاه از محتوا..."
                      className="text-right min-h-20"
                    />
                  </div>

                  <div>
                    <Label>محتوا</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="محتوای کامل پست..."
                      className="text-right min-h-40"
                    />
                  </div>

                  <div>
                    <Label>تصویر شاخص</Label>
                    <div className="mt-2">
                      {imagePreview && (
                        <div className="mb-4">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg"
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
                        حداکثر 5 مگابایت
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="published"
                      checked={published}
                      onCheckedChange={setPublished}
                    />
                    <Label htmlFor="published">انتشار</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePost}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال ذخیره...
                        </>
                      ) : (
                        "ذخیره"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Posts List */}
        <div className="grid gap-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 glass-card border-primary/20">
                <div className="flex gap-4">
                  {post.featured_image && (
                    <img 
                      src={post.featured_image} 
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublished(post)}
                        >
                          {post.published ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        post.published 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {post.published ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          
          {posts.length === 0 && (
            <Card className="p-12 text-center glass-card border-primary/20">
              <p className="text-muted-foreground">
                هنوز پستی ایجاد نشده است
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;
