import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Bell, BellOff, Video, Users, Eye, ArrowRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoCard from "@/components/easytube/VideoCard";
import VideoUploadDialog from "@/components/easytube/VideoUploadDialog";

interface ChannelProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
}

interface ChannelStats {
  subscribers_count: number;
  videos_count: number;
  total_views: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  user_id: string;
  category_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  video_categories?: {
    name_fa: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name_fa: string;
  icon: string;
}

const EasyTubeChannel = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [channel, setChannel] = useState<ChannelProfile | null>(null);
  const [stats, setStats] = useState<ChannelStats>({ subscribers_count: 0, videos_count: 0, total_views: 0 });
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (channelId) {
      loadChannel();
    }
  }, [channelId]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      setIsOwner(session?.user?.id === channelId);

      // Load channel profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio")
        .eq("id", channelId)
        .single();

      if (error) throw error;
      setChannel(profileData);

      // Load channel stats
      const { data: statsData } = await supabase.rpc("get_channel_stats", { 
        channel_id_param: channelId 
      });
      if (statsData?.[0]) {
        setStats({
          subscribers_count: Number(statsData[0].subscribers_count) || 0,
          videos_count: Number(statsData[0].videos_count) || 0,
          total_views: Number(statsData[0].total_views) || 0,
        });
      }

      // Load channel videos
      const { data: videosData } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", channelId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      setVideos((videosData as VideoItem[]) || []);

      // Load categories
      const { data: catData } = await supabase
        .from("video_categories")
        .select("id, name_fa, icon");
      setCategories(catData || []);

      // Check subscription status
      if (session?.user?.id) {
        const { data: subData } = await supabase
          .from("channel_subscriptions")
          .select("id")
          .eq("subscriber_id", session.user.id)
          .eq("channel_id", channelId)
          .single();
        setIsSubscribed(!!subData);
      }

    } catch (error) {
      console.error("Error loading channel:", error);
      toast({
        title: "خطا",
        description: "کانال یافت نشد",
        variant: "destructive",
      });
      navigate("/easytube");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!userId) {
      toast({ title: "ابتدا وارد شوید", variant: "destructive" });
      return;
    }

    try {
      if (isSubscribed) {
        await supabase.from("channel_subscriptions")
          .delete()
          .eq("subscriber_id", userId)
          .eq("channel_id", channelId);
        setStats(prev => ({ ...prev, subscribers_count: prev.subscribers_count - 1 }));
      } else {
        await supabase.from("channel_subscriptions").insert({
          subscriber_id: userId,
          channel_id: channelId,
        });
        setStats(prev => ({ ...prev, subscribers_count: prev.subscribers_count + 1 }));
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error("Error toggling subscription:", error);
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-6 bg-muted rounded w-1/4" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!channel) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 max-w-6xl space-y-6 pb-24 lg:pb-6">
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

        {/* Channel Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/40 p-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
              <AvatarImage src={channel.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">
                {channel.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-2xl font-bold mb-2">{channel.full_name}</h1>
              <p className="text-muted-foreground text-sm mb-4">
                @{channel.username}
              </p>
              
              {channel.bio && (
                <p className="text-sm mb-4 max-w-xl">{channel.bio}</p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4">
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(stats.subscribers_count)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    دنبال‌کننده
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(stats.videos_count)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    ویدیو
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(stats.total_views)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    بازدید
                  </p>
                </div>
              </div>

              {isOwner ? (
                <Button 
                  onClick={() => setUploadOpen(true)}
                  className="gradient-primary gap-2"
                >
                  <Upload className="w-4 h-4" />
                  آپلود ویدیو
                </Button>
              ) : (
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
          </div>
        </motion.div>

        {/* Videos */}
        <div>
          <h2 className="font-bold text-lg mb-4">ویدیوها</h2>
          
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={index}
                  onVideoClick={() => navigate(`/easytube/watch/${video.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border/40">
              <Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">هنوز ویدیویی آپلود نشده</p>
              {isOwner && (
                <Button 
                  onClick={() => setUploadOpen(true)}
                  className="mt-4 gradient-primary"
                >
                  اولین ویدیو رو آپلود کن!
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload Dialog */}
        <VideoUploadDialog 
          open={uploadOpen} 
          onOpenChange={setUploadOpen}
          categories={categories}
          onSuccess={() => {
            loadChannel();
            toast({
              title: "ویدیو آپلود شد! 🎉",
              description: "ویدیوی شما با موفقیت منتشر شد",
            });
          }}
        />
      </div>
    </AppLayout>
  );
};

export default EasyTubeChannel;
