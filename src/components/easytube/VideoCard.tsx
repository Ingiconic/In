import { motion } from "framer-motion";
import { Play, ThumbsUp, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string;
    views_count: number;
    likes_count: number;
    created_at: string;
    profiles?: {
      full_name: string;
      username: string;
      avatar_url: string;
    };
    video_categories?: {
      name_fa: string;
      icon: string;
    };
  };
  index: number;
  onVideoClick: () => void;
}

const VideoCard = ({ video, index, onVideoClick }: VideoCardProps) => {
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(video.created_at), {
    addSuffix: true,
    locale: faIR,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onVideoClick}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Play className="w-12 h-12 text-primary/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>

          {/* Category badge */}
          {video.video_categories && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs flex items-center gap-1">
              <span>{video.video_categories.icon}</span>
              {video.video_categories.name_fa}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            {video.profiles?.avatar_url ? (
              <img 
                src={video.profiles.avatar_url} 
                alt={video.profiles.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {video.profiles?.full_name?.[0] || "?"}
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">
              {video.profiles?.full_name || video.profiles?.username || "کاربر"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViews(video.views_count)}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {formatViews(video.likes_count)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
