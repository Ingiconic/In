import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { usePageView } from "@/hooks/usePageView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Upload, Play, ThumbsUp, Eye, Clock, 
  Flame, TrendingUp, History, Bookmark, Home, Video,
  Bell, Menu, User, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoUploadDialog from "@/components/easytube/VideoUploadDialog";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Video {
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
  duration?: number;
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
  name: string;
  name_fa: string;
  icon: string;
}

// YouTube-style Video Card Component
const YouTubeVideoCard = ({ video, onVideoClick }: { video: Video; onVideoClick: () => void }) => {
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)} میلیون`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)} هزار`;
    return count.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(video.created_at), {
    addSuffix: true,
    locale: faIR,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onVideoClick}
      className="group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-rose-500/20">
            <Play className="w-12 h-12 text-red-500/50" />
          </div>
        )}
        
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3">
        {/* Channel Avatar */}
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={video.profiles?.avatar_url} />
          <AvatarFallback className="bg-red-500/10 text-red-500 text-sm font-bold">
            {video.profiles?.full_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-red-500 transition-colors leading-snug">
            {video.title}
          </h3>
          
          <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {video.profiles?.full_name || video.profiles?.username || "کاربر"}
          </p>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span>{formatViews(video.views_count)} بازدید</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EasyTube = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
    setUserId(session?.user?.id || null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: catData } = await supabase
        .from("video_categories")
        .select("*")
        .order("name_fa");
      
      if (catData) setCategories(catData);
      await loadVideos();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (category?: string, search?: string, tab?: string) => {
    try {
      let query = supabase
        .from("videos")
        .select("*")
        .eq("is_public", true);
      
      if (category) {
        query = query.eq("category_id", category);
      }
      
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }
      
      const currentTab = tab || activeTab;
      if (currentTab === "trending") {
        query = query.order("views_count", { ascending: false });
      } else if (currentTab === "popular") {
        query = query.order("likes_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }
      
      query = query.limit(50);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const categoryIds = [...new Set(data.map(v => v.category_id).filter(Boolean))];
        
        const [profilesRes, categoriesRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds),
          categoryIds.length > 0 
            ? supabase.from("video_categories").select("id, name_fa, icon").in("id", categoryIds)
            : Promise.resolve({ data: [] })
        ]);
        
        const profilesMap = new Map<string, any>();
        profilesRes.data?.forEach(p => profilesMap.set(p.id, p));
        const categoriesMap = new Map<string, any>();
        (categoriesRes.data as any[] || []).forEach((c: any) => categoriesMap.set(c.id, c));
        
        const enrichedVideos = data.map(video => ({
          ...video,
          profiles: profilesMap.get(video.user_id),
          video_categories: video.category_id ? categoriesMap.get(video.category_id) : undefined,
        }));
        
        setVideos(enrichedVideos as any);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVideos(selectedCategory || undefined, searchQuery);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    loadVideos(categoryId || undefined, searchQuery);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "saved" || tab === "history") {
      loadUserContent(tab);
    } else {
      loadVideos(selectedCategory || undefined, searchQuery, tab);
    }
  };

  const loadUserContent = async (type: string) => {
    if (!userId) {
      setVideos([]);
      return;
    }

    try {
      if (type === "saved") {
        const { data: savedData } = await supabase
          .from("saved_videos")
          .select("video_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (savedData && savedData.length > 0) {
          const videoIds = savedData.map(s => s.video_id);
          const { data: videosData } = await supabase
            .from("videos")
            .select("*")
            .in("id", videoIds);
          
          setVideos(videosData as any || []);
        } else {
          setVideos([]);
        }
      } else if (type === "history") {
        const { data: historyData } = await supabase
          .from("watch_history")
          .select("video_id")
          .eq("user_id", userId)
          .order("watched_at", { ascending: false })
          .limit(50);
        
        if (historyData && historyData.length > 0) {
          const videoIds = historyData.map(h => h.video_id);
          const { data: videosData } = await supabase
            .from("videos")
            .select("*")
            .in("id", videoIds);
          
          setVideos(videosData as any || []);
        } else {
          setVideos([]);
        }
      }
    } catch (error) {
      console.error("Error loading user content:", error);
    }
  };

  const handleUploadClick = () => {
    if (!isLoggedIn) {
      toast({
        title: "نیاز به ورود",
        description: "برای آپلود ویدیو ابتدا وارد شوید",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setUploadOpen(true);
  };

  // Tab items
  const tabs = [
    { id: "home", label: "خانه", icon: Home },
    { id: "trending", label: "داغ‌ترین", icon: TrendingUp },
    { id: "popular", label: "محبوب", icon: Flame },
    { id: "saved", label: "ذخیره‌شده", icon: Bookmark },
    { id: "history", label: "تاریخچه", icon: History },
  ];

  if (loading) {
    return (
      <PlatformLayout
        platformName="ایزی تیوب"
        platformIcon={<Video className="w-5 h-5 text-white" />}
        platformColor="bg-gradient-to-br from-red-600 to-rose-600"
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <DashboardSkeleton />
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout
      platformName="ایزی تیوب"
      platformIcon={<Video className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-red-600 to-rose-600"
    >
      <div className="min-h-screen bg-background">
        {/* YouTube-style Header */}
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Search Bar */}
            <div className="py-3 flex items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در ایزی تیوب..."
                    className="pr-10 h-10 rounded-full border-border/60 bg-muted/30 focus:bg-background"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button type="submit" size="icon" className="rounded-full h-10 w-10 bg-muted hover:bg-muted/80">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
              
              <Button 
                onClick={handleUploadClick}
                className="bg-red-600 hover:bg-red-700 text-white gap-2 rounded-full px-4"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">آپلود</span>
              </Button>
            </div>

            {/* Category Pills */}
            <ScrollArea className="w-full pb-3">
              <div className="flex gap-2 px-1">
                <Button
                  variant={selectedCategory === null ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleCategorySelect(null)}
                  className={`whitespace-nowrap rounded-lg ${selectedCategory === null ? 'bg-foreground text-background' : 'bg-muted/60'}`}
                >
                  همه
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`whitespace-nowrap rounded-lg gap-1.5 ${selectedCategory === cat.id ? 'bg-foreground text-background' : 'bg-muted/60'}`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name_fa}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <div className="flex gap-6">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-36 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
                
                <div className="border-t border-border/40 my-3" />
                
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-2">درباره ایزی تیوب</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    پلتفرم اشتراک‌گذاری ویدیوهای آموزشی ایزی درس
                  </p>
                </div>
              </div>
            </aside>

            {/* Video Grid */}
            <main className="flex-1 min-w-0">
              {/* Mobile Tabs */}
              <div className="lg:hidden mb-4">
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Button
                          key={tab.id}
                          variant={activeTab === tab.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleTabChange(tab.id)}
                          className={`whitespace-nowrap gap-1.5 rounded-lg ${activeTab === tab.id ? 'bg-foreground text-background' : ''}`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </Button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Play className="w-10 h-10 text-red-500/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">ویدیویی یافت نشد</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === "home" 
                      ? "اولین نفری باش که ویدیو آپلود می‌کنه!" 
                      : "ویدیویی در این بخش وجود نداره"}
                  </p>
                  {activeTab === "home" && (
                    <Button 
                      onClick={handleUploadClick} 
                      className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      آپلود ویدیو
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  <AnimatePresence>
                    {videos.map((video) => (
                      <YouTubeVideoCard 
                        key={video.id} 
                        video={video} 
                        onVideoClick={() => navigate(`/easytube/watch/${video.id}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Upload Dialog */}
        <VideoUploadDialog 
          open={uploadOpen} 
          onOpenChange={setUploadOpen}
          categories={categories}
          onSuccess={() => {
            loadVideos();
            toast({
              title: "ویدیو آپلود شد! 🎉",
              description: "ویدیوی شما پس از تایید ادمین منتشر خواهد شد",
            });
          }}
        />
      </div>
    </PlatformLayout>
  );
};

export default EasyTube;
