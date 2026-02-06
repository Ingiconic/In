import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, Calendar, BookOpen, Share2, 
  Heart, MessageCircle, Send, Loader2, Trash2, Clock, Tag,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  content_html: string | null;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  user_id: string;
  author_name: string | null;
  likes_count: number;
  tags: string[] | null;
  category: string | null;
  seo_keywords: string[] | null;
  seo_description: string | null;
  word_count: number | null;
  status: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  blog_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

// Default images for posts without featured image
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
];

const getDefaultImage = (id: string) => {
  const index = id.charCodeAt(0) % DEFAULT_IMAGES.length;
  return DEFAULT_IMAGES[index];
};

const EasyBlogPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  // SEO: Update document meta tags
  useEffect(() => {
    if (!post) return;
    const authorName = post.author_name || post.profiles?.full_name || "ایزی درس";
    const description = post.seo_description || post.excerpt || post.content.substring(0, 160);
    const image = post.featured_image || getDefaultImage(post.id);

    document.title = `${post.title} | ایزی بلاگ - ایزی درس`;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("keywords", (post.seo_keywords || post.tags || []).join(", "));
    setMeta("author", authorName);
    setMeta("og:title", post.title, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", `https://easydars.ir/easyblog/post/${post.id}`, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setMeta("article:published_time", post.published_at || post.created_at, true);
    setMeta("article:author", authorName, true);
    if (post.tags) setMeta("article:tag", post.tags.join(", "), true);

    // JSON-LD
    let ld = document.querySelector('script[data-blog-ld]');
    if (!ld) { ld = document.createElement("script"); ld.setAttribute("type", "application/ld+json"); ld.setAttribute("data-blog-ld", "true"); document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      image,
      author: { "@type": "Person", name: authorName },
      datePublished: post.published_at || post.created_at,
      publisher: { "@type": "Organization", name: "ایزی درس", url: "https://easydars.ir" },
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://easydars.ir/easyblog/post/${post.id}` },
      wordCount: post.word_count || undefined,
      keywords: (post.seo_keywords || post.tags || []).join(", "),
    });

    return () => {
      document.title = "ایزی بلاگ | ایزی درس";
      ld?.remove();
    };
  }, [post]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("user_blogs").select("*").eq("id", postId).single();
      if (error) throw error;

      const { data: profile } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", data.user_id).single();
      setPost({ ...data, profiles: profile });
      setLikesCount(data.likes_count || 0);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: likeData } = await supabase.from("blog_likes").select("id").eq("blog_id", postId).eq("user_id", session.user.id).single();
        setLiked(!!likeData);
      }
    } catch (error) {
      console.error("Error loading post:", error);
      toast({ title: "خطا", description: "مقاله یافت نشد", variant: "destructive" });
      navigate("/easyblog");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data } = await supabase.from("blog_comments").select("*").eq("blog_id", postId).order("created_at", { ascending: true });
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds);
        const profilesMap = new Map();
        profiles?.forEach(p => profilesMap.set(p.id, p));
        setComments(data.map(c => ({ ...c, profiles: profilesMap.get(c.user_id) })));
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleLike = async () => {
    if (!userId) { toast({ title: "نیاز به ورود", variant: "destructive" }); return; }
    setLiking(true);
    try {
      const { data: result, error } = await supabase.rpc("toggle_blog_like", { blog_id_param: postId });
      if (error) throw error;
      setLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
    } catch (error) { console.error(error); } finally { setLiking(false); }
  };

  const handleComment = async () => {
    if (!userId) { toast({ title: "نیاز به ورود", variant: "destructive" }); return; }
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const { error } = await supabase.from("blog_comments").insert({ blog_id: postId, user_id: userId, content: newComment.trim() });
      if (error) throw error;
      setNewComment("");
      loadComments();
      toast({ title: "نظر ثبت شد ✍️" });
    } catch (error) {
      toast({ title: "خطا", variant: "destructive" });
    } finally { setCommenting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);
    if (!error) { loadComments(); toast({ title: "نظر حذف شد" }); }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("user_blogs").delete().eq("id", postId);
      if (error) throw error;
      toast({ title: "مقاله حذف شد 🗑️" });
      navigate("/easyblog");
    } catch (error) {
      toast({ title: "خطا در حذف", variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const handleShare = async () => {
    const url = `https://easydars.ir/easyblog/post/${post?.id}`;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
  };

  const formatDate = (d: string | null) => d ? format(new Date(d), "d MMMM yyyy", { locale: faIR }) : "";
  const getAuthorName = () => post?.author_name || post?.profiles?.full_name || "ناشناس";
  const readTime = Math.max(1, Math.ceil((post?.word_count || post?.content?.split(/\s+/).length || 0) / 200));
  const postImage = post?.featured_image || (post?.id ? getDefaultImage(post.id) : "");

  if (loading) {
    return (
      <PlatformLayout platformName="ایزی بلاگ" platformIcon={<BookOpen className="w-5 h-5 text-white" />} platformColor="bg-gradient-to-br from-teal-500 to-cyan-600">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded w-3/4" />
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
      <article className="container mx-auto px-4 py-6 max-w-4xl" itemScope itemType="https://schema.org/BlogPosting">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Featured Image */}
          <div className="rounded-2xl overflow-hidden">
            <img
              src={postImage}
              alt={post.title}
              className="w-full h-64 sm:h-96 object-cover"
              itemProp="image"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight" itemProp="headline">
            {post.title}
          </h1>

          {/* Tags & Category */}
          {((post.tags && post.tags.length > 0) || post.category) && (
            <div className="flex flex-wrap gap-2">
              {post.category && <Badge className="bg-primary/10 text-primary border-primary/20">{post.category}</Badge>}
              {post.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="gap-1">
                  <Tag className="w-3 h-3" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border/40">
            {post.profiles && (
              <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Person">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>{getAuthorName()[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm" itemProp="name">{getAuthorName()}</p>
                  <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <time itemProp="datePublished" dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {readTime} دقیقه مطالعه
            </div>

            <div className="flex items-center gap-3 mr-auto">
              <Button variant={liked ? "default" : "outline"} size="sm" onClick={handleLike} disabled={liking}
                className={`gap-2 ${liked ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''}`}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
              </Button>
              {userId === post.user_id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        حذف مقاله
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        آیا مطمئنی می‌خوای این مقاله رو حذف کنی؟ این عمل قابل بازگشت نیست.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePost} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Content - render HTML if available */}
          <div className="prose prose-lg dark:prose-invert max-w-none" itemProp="articleBody">
            {post.content_html ? (
              <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                {post.content}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <section className="pt-8 border-t border-border/40 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              نظرات ({comments.length})
            </h3>
            <div className="flex gap-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={userId ? "نظر خود را بنویسید..." : "برای نظر دادن وارد شوید"}
                disabled={!userId}
                rows={3}
                className="flex-1"
              />
              <Button onClick={handleComment} disabled={commenting || !newComment.trim() || !userId} className="gap-2">
                {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{comment.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-sm">{comment.profiles?.full_name || "ناشناس"}</span>
                          <span className="text-xs text-muted-foreground mx-2">{formatDate(comment.created_at)}</span>
                        </div>
                        {userId === comment.user_id && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)} className="text-destructive h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>هنوز نظری ثبت نشده</p>
                </div>
              )}
            </div>
          </section>

          <div className="pt-8 border-t border-border/40">
            <Button variant="outline" onClick={() => navigate("/easyblog")} className="gap-2">
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
