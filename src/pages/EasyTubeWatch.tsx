import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { 
  ThumbsUp, Eye, Share2, Bookmark, BookmarkCheck, 
  Bell, BellOff, Send, MessageCircle, ChevronDown,
  ChevronUp, ArrowRight, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import VideoCard from "@/components/easytube/VideoCard";

interface VideoDetails {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  category_id: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  video_categories?: {
    name_fa: string;
    icon: string;
  };
}

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

const EasyTubeWatch = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<VideoDetails[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      loadVideo();
      checkAuth();
    }
  }, [videoId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
    setUserId(session?.user?.id || null);
  };

  const loadVideo = async () => {
    try {
      setLoading(true);
      
      // Load video details
      const { data: videoData, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();

      if (error) throw error;
      
      // Load profile and category separately
      const [profileRes, categoryRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url").eq("id", videoData.user_id).single(),
        videoData.category_id 
          ? supabase.from("video_categories").select("name_fa, icon").eq("id", videoData.category_id).single()
          : Promise.resolve({ data: null })
      ]);
      
      const enrichedVideo = {
        ...videoData,
        profiles: profileRes.data,
        video_categories: categoryRes.data,
      };
      
      setVideo(enrichedVideo as VideoDetails);

      // Increment views
      await supabase.rpc("increment_video_views", { video_id_param: videoId });

      // Load comments
      await loadComments();

      // Load related videos
      const { data: related } = await supabase
        .from("videos")
        .select("*")
        .eq("is_public", true)
        .neq("id", videoId)
        .eq("category_id", videoData.category_id)
        .limit(10);

      setRelatedVideos((related as VideoDetails[]) || []);

      // Check user interactions
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await checkUserInteractions(videoData.user_id, session.user.id);
      }

      // Add to watch history
      if (session?.user?.id) {
        await supabase.from("watch_history").upsert({
          user_id: session.user.id,
          video_id: videoId,
          watched_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,video_id",
        });
      }

      // Get subscribers count
      const { data: stats } = await supabase.rpc("get_channel_stats", { 
        channel_id_param: videoData.user_id 
      });
      if (stats?.[0]) {
        setSubscribersCount(Number(stats[0].subscribers_count) || 0);
      }

    } catch (error) {
      console.error("Error loading video:", error);
      toast({
        title: "خطا",
        description: "ویدیو یافت نشد",
        variant: "destructive",
      });
      navigate("/easytube");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (data) {
      // Load profiles for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);
      
      const profilesMap = new Map<string, any>();
      profiles?.forEach(p => profilesMap.set(p.id, p));

      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from("video_comments")
            .select("*")
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });
          
          // Get profiles for replies
          const replyUserIds = replies?.map(r => r.user_id) || [];
          if (replyUserIds.length > 0) {
            const { data: replyProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .in("id", replyUserIds);
            replyProfiles?.forEach(p => profilesMap.set(p.id, p));
          }
          
          const enrichedReplies = replies?.map(r => ({
            ...r,
            profiles: profilesMap.get(r.user_id),
          })) || [];
          
          return { 
            ...comment, 
            profiles: profilesMap.get(comment.user_id),
            replies: enrichedReplies 
          };
        })
      );
      setComments(commentsWithReplies as Comment[]);
    }
  };

  const checkUserInteractions = async (channelId: string, currentUserId: string) => {
    // Check if liked
    const { data: likeData } = await supabase
      .from("video_likes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("video_id", videoId)
      .single();
    setIsLiked(!!likeData);

    // Check if saved
    const { data: savedData } = await supabase
      .from("saved_videos")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("video_id", videoId)
      .single();
    setIsSaved(!!savedData);

    // Check if subscribed
    const { data: subData } = await supabase
      .from("channel_subscriptions")
      .select("id")
      .eq("subscriber_id", currentUserId)
      .eq("channel_id", channelId)
      .single();
    setIsSubscribed(!!subData);
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    try {
      const { data: liked } = await supabase.rpc("toggle_video_like", { 
        video_id_param: videoId 
      });
      setIsLiked(liked);
      setVideo(prev => prev ? { 
        ...prev, 
        likes_count: prev.likes_count + (liked ? 1 : -1) 
      } : null);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn || !userId) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase.from("saved_videos")
          .delete()
          .eq("user_id", userId)
          .eq("video_id", videoId);
      } else {
        await supabase.from("saved_videos").insert({
          user_id: userId,
          video_id: videoId,
        });
      }
      setIsSaved(!isSaved);
      toast({ title: isSaved ? "از ذخیره‌ها حذف شد" : "ذخیره شد" });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn || !userId || !video) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    try {
      if (isSubscribed) {
        await supabase.from("channel_subscriptions")
          .delete()
          .eq("subscriber_id", userId)
          .eq("channel_id", video.user_id);
        setSubscribersCount(prev => prev - 1);
      } else {
        await supabase.from("channel_subscriptions").insert({
          subscriber_id: userId,
          channel_id: video.user_id,
        });
        setSubscribersCount(prev => prev + 1);
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  const handleComment = async () => {
    if (!isLoggedIn || !userId) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    if (!newComment.trim()) return;

    try {
      await supabase.from("video_comments").insert({
        user_id: userId,
        video_id: videoId,
        content: newComment.trim(),
      });
      setNewComment("");
      await loadComments();
      toast({ title: "نظر شما ثبت شد" });
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!isLoggedIn || !userId) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    if (!replyContent.trim()) return;

    try {
      await supabase.from("video_comments").insert({
        user_id: userId,
        video_id: videoId,
        parent_id: parentId,
        content: replyContent.trim(),
      });
      setReplyTo(null);
      setReplyContent("");
      await loadComments();
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: video?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="aspect-video bg-muted rounded-xl mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!video) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 max-w-7xl pb-24 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/easytube")}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              برگشت به ایزی تیوب
            </Button>

            {/* Video Player */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden bg-black"
            >
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            </motion.div>

            {/* Title & Stats */}
            <div>
              <h1 className="text-xl font-bold mb-2">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(video.views_count)} بازدید
                </span>
                <span>
                  {formatDistanceToNow(new Date(video.created_at), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </span>
                {video.video_categories && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {video.video_categories.icon} {video.video_categories.name_fa}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {formatNumber(video.likes_count)}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                اشتراک
              </Button>
              
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
                className="gap-2"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                {isSaved ? "ذخیره شد" : "ذخیره"}
              </Button>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/40">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/easytube/channel/${video.user_id}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={video.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {video.profiles?.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{video.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(subscribersCount)} دنبال‌کننده
                  </p>
                </div>
              </div>
              
              {video.user_id !== userId && (
                <Button
                  variant={isSubscribed ? "secondary" : "default"}
                  onClick={handleSubscribe}
                  className="gap-2"
                >
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      دنبال شده
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      دنبال کردن
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="p-4 rounded-xl bg-card border border-border/40">
                <div 
                  className={`text-sm ${!showDescription ? "line-clamp-3" : ""}`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {video.description}
                </div>
                {video.description.length > 200 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDescription(!showDescription)}
                    className="mt-2 gap-1"
                  >
                    {showDescription ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        بستن
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        بیشتر
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                نظرات ({comments.length})
              </h3>

              {/* New Comment */}
              {isLoggedIn && (
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="نظر خود را بنویسید..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleComment} size="icon" className="h-auto">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.profiles?.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.profiles?.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: faIR,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likes_count > 0 && comment.likes_count}
                          </button>
                          <button 
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            پاسخ
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyTo === comment.id && isLoggedIn && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="پاسخ..."
                              className="flex-1"
                            />
                            <Button size="sm" onClick={() => handleReply(comment.id)}>
                              ارسال
                            </Button>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 mr-4 space-y-3 border-r-2 border-border pr-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {reply.profiles?.full_name?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs">
                                      {reply.profiles?.full_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), {
                                        addSuffix: true,
                                        locale: faIR,
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs mt-1">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    هنوز نظری ثبت نشده. اولین نفر باش!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h3 className="font-bold">ویدیوهای مرتبط</h3>
            {relatedVideos.length > 0 ? (
              <div className="space-y-3">
                {relatedVideos.map((vid, index) => (
                  <VideoCard
                    key={vid.id}
                    video={vid}
                    index={index}
                    onVideoClick={() => navigate(`/easytube/watch/${vid.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                ویدیوی مرتبطی یافت نشد
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EasyTubeWatch;
