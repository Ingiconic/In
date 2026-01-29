import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, User, BookOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const EasyBlogPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("user_blogs")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", data.user_id)
        .single();

      setPost({
        ...data,
        profiles: profile,
      });
    } catch (error) {
      console.error("Error loading post:", error);
      toast({
        title: "خطا",
        description: "مقاله یافت نشد",
        variant: "destructive",
      });
      navigate("/easyblog");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "d MMMM yyyy", { locale: faIR });
  };

  if (loading) {
    return (
      <PlatformLayout
        platformName="ایزی بلاگ"
        platformIcon={<BookOpen className="w-5 h-5 text-white" />}
        platformColor="bg-gradient-to-br from-teal-500 to-cyan-600"
      >
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </PlatformLayout>
    );
  }

  if (!post) return null;

  return (
    <PlatformLayout
      platformName="ایزی بلاگ"
      platformIcon={<BookOpen className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-teal-500 to-cyan-600"
      backPath="/easyblog"
      backLabel="برگشت به ایزی بلاگ"
    >
      <article className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Featured Image */}
          {post.featured_image && (
            <div className="rounded-2xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border/40">
            {post.profiles && (
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>{post.profiles.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{post.profiles.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at || post.created_at)}
            </div>

            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 mr-auto">
              <Share2 className="w-4 h-4" />
              اشتراک‌گذاری
            </Button>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground">
              {post.content}
            </div>
          </div>

          {/* Back */}
          <div className="pt-8 border-t border-border/40">
            <Button 
              variant="outline" 
              onClick={() => navigate("/easyblog")}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              برگشت به لیست مقالات
            </Button>
          </div>
        </motion.div>
      </article>
    </PlatformLayout>
  );
};

export default EasyBlogPost;
