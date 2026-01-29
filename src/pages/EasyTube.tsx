import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { usePageView } from "@/hooks/usePageView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Upload, Play, ThumbsUp, Eye, Clock, 
  Flame, TrendingUp, History, Bookmark, Home, Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoCard from "@/components/easytube/VideoCard";
import VideoUploadDialog from "@/components/easytube/VideoUploadDialog";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";

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
      
      // Load categories
      const { data: catData } = await supabase
        .from("video_categories")
        .select("*")
        .order("name_fa");
      
      if (catData) setCategories(catData);
      
      // Load videos with profiles
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
      
      // Sort based on tab
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
      
      // Load profiles and categories separately
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

  if (loading) {
    return (
      <PlatformLayout
        platformName="ایزی تیوب"
        platformIcon={<Video className="w-5 h-5 text-white" />}
        platformColor="bg-gradient-to-br from-red-500 to-rose-600"
      >
        <div className="container mx-auto px-4 py-4 max-w-6xl pb-6">
          <DashboardSkeleton />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout
      platformName="ایزی تیوب"
      platformIcon={<Video className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-red-500 to-rose-600"
    >
      <div className="container mx-auto px-4 py-4 max-w-6xl space-y-4 pb-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              ایزی تیوب 📺
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ویدیوهای آموزشی رو اینجا ببین و به اشتراک بذار
            </p>
          </div>
          
          <Button 
            onClick={handleUploadClick}
            className="gradient-primary gap-2"
          >
            <Upload className="w-4 h-4" />
            آپلود ویدیو
          </Button>
        </motion.div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی ویدیو..."
              className="pr-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            جستجو
          </Button>
        </form>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect(null)}
            className="whitespace-nowrap"
          >
            همه
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(cat.id)}
              className="whitespace-nowrap gap-1"
            >
              <span>{cat.icon}</span>
              {cat.name_fa}
            </Button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="home" className="gap-1 py-2 text-xs">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">خانه</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1 py-2 text-xs">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">ترند</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-1 py-2 text-xs">
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">محبوب</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1 py-2 text-xs">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">ذخیره‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 py-2 text-xs">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">تاریخچه</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">ویدیویی یافت نشد</p>
                {activeTab === "home" && (
                  <Button 
                    onClick={handleUploadClick} 
                    className="mt-4 gradient-primary"
                  >
                    اولین ویدیو رو آپلود کن!
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {videos.map((video, index) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      index={index}
                      onVideoClick={() => navigate(`/easytube/watch/${video.id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <VideoUploadDialog 
          open={uploadOpen} 
          onOpenChange={setUploadOpen}
          categories={categories}
          onSuccess={() => {
            loadVideos();
            toast({
              title: "ویدیو آپلود شد! 🎉",
              description: "ویدیوی شما با موفقیت منتشر شد",
            });
          }}
        />
      </div>
    </PlatformLayout>
  );
};

export default EasyTube;
