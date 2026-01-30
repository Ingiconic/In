import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { 
  ArrowRight, Calendar, BookOpen, Share2, 
  Heart, MessageCircle, Send, Loader2, Trash2 
} from "lucide-react";
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
  author_name: string | null;
  likes_count: number;
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

  useEffect(() => {
    checkAuth();
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

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
      setLikesCount(data.likes_count || 0);

      // Check if user liked this post
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: likeData } = await supabase
          .from("blog_likes")
          .select("id")
          .eq("blog_id", postId)
          .eq("user_id", session.user.id)
          .single();
        
        setLiked(!!likeData);
      }
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

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("blog_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Load profiles for comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map();
        profiles?.forEach(p => profilesMap.set(p.id, p));

        const enrichedComments = data.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id),
        }));

        setComments(enrichedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleLike = async () => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای لایک کردن ابتدا وارد شوید",
        variant: "destructive",
      });
      return;
    }

    setLiking(true);
    try {
      const { data: result, error } = await supabase.rpc("toggle_blog_like", {
        blog_id_param: postId,
      });

      if (error) throw error;

      setLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای نظر دادن ابتدا وارد شوید",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const { error } = await supabase.from("blog_comments").insert({
        blog_id: postId,
        user_id: userId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      loadComments();
      toast({ title: "نظر شما ثبت شد ✍️" });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "خطا",
        description: "مشکلی در ثبت نظر پیش آمد",
        variant: "destructive",
      });
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      loadComments();
      toast({ title: "نظر حذف شد" });
    } catch (error) {
      console.error("Error deleting comment:", error);
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

  const getAuthorName = () => {
    if (post?.author_name) return post.author_name;
    if (post?.profiles?.full_name) return post.profiles.full_name;
    return "ناشناس";
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
                  <AvatarFallback>{getAuthorName()[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{getAuthorName()}</p>
                  <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at || post.created_at)}
            </div>

            <div className="flex items-center gap-3 mr-auto">
              <Button 
                variant={liked ? "default" : "outline"} 
                size="sm" 
                onClick={handleLike}
                disabled={liking}
                className={`gap-2 ${liked ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                اشتراک
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground">
              {post.content}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-8 border-t border-border/40 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              نظرات ({comments.length})
            </h3>

            {/* Comment Input */}
            <div className="flex gap-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={userId ? "نظر خود را بنویسید..." : "برای نظر دادن وارد شوید"}
                disabled={!userId}
                rows={3}
                className="flex-1"
              />
              <Button
                onClick={handleComment}
                disabled={commenting || !newComment.trim() || !userId}
                className="gap-2"
              >
                {commenting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.profiles?.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-sm">
                            {comment.profiles?.full_name || "ناشناس"}
                          </span>
                          <span className="text-xs text-muted-foreground mx-2">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        {userId === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>هنوز نظری ثبت نشده</p>
                  <p className="text-sm">اولین نظر رو بنویس!</p>
                </div>
              )}
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