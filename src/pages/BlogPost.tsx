import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("خطا در بارگذاری پست");
      navigate("/blog");
    } finally {
      setLoading(false);
    }
  };

  // Sanitize HTML content to prevent XSS attacks
  const getSanitizedContent = (content: string) => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت به وبلاگ
        </Button>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground mb-8">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(post.published_at), "dd MMMM yyyy")}
          </span>
        </div>

        {/* Content - Sanitized to prevent XSS */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: getSanitizedContent(post.content) }}
        />
      </div>
    </AppLayout>
  );
};

export default BlogPost;
