import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, PenSquare, BookOpen, Calendar, ArrowLeft, 
  Flame, Clock, User, TrendingUp, Eye, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import BlogWriteDialog from "@/components/easyblog/BlogWriteDialog";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  user_id: string;
  status: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const EasyBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("latest");
  const [writeOpen, setWriteOpen] = useState(false);
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
      await loadPosts();
      await loadMyPosts();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (search?: string) => {
    let query = supabase
      .from("user_blogs")
      .select("*")
      .eq("status", "approved");

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    query = query.order("published_at", { ascending: false }).limit(50);

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map<string, any>();
      profiles?.forEach(p => profilesMap.set(p.id, p));

      const enrichedPosts = data.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id),
      }));

      setPosts(enrichedPosts);
    } else {
      setPosts([]);
    }
  };

  const loadMyPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { data } = await supabase
      .from("user_blogs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setMyPosts(data || []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(searchQuery);
  };

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      toast({
        title: "نیاز به ورود",
        description: "برای نوشتن مقاله ابتدا وارد شوید",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setWriteOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: faIR,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">در انتظار تایید</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500">تایید شده</Badge>;
      case "rejected":
        return <Badge variant="destructive">رد شده</Badge>;
      default:
        return null;
    }
  };

  const BlogCard = ({ post, showStatus = false }: { post: BlogPost; showStatus?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full cursor-pointer"
        onClick={() => navigate(`/easyblog/post/${post.id}`)}>
        {post.featured_image && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            {showStatus && getStatusBadge(post.status)}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.published_at || post.created_at)}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
          )}
          {post.profiles && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{post.profiles.full_name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <PlatformLayout
      platformName="ایزی بلاگ"
      platformIcon={<BookOpen className="w-5 h-5 text-white" />}
      platformColor="bg-gradient-to-br from-teal-500 to-cyan-600"
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
              ایزی بلاگ 📝
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              مقالات آموزشی بنویس و با دیگران به اشتراک بذار
            </p>
          </div>
          
          <Button 
            onClick={handleWriteClick}
            className="gradient-secondary gap-2"
          >
            <PenSquare className="w-4 h-4" />
            نوشتن مقاله
          </Button>
        </motion.div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی مقاله..."
              className="pr-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            جستجو
          </Button>
        </form>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="latest" className="gap-1 py-2 text-xs">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">جدیدترین</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1 py-2 text-xs">
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">پرطرفدار</span>
            </TabsTrigger>
            <TabsTrigger value="my-posts" className="gap-1 py-2 text-xs">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">مقالات من</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-12 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">هنوز مقاله‌ای منتشر نشده</p>
                <Button onClick={handleWriteClick} className="mt-4 gradient-secondary">
                  اولین مقاله رو بنویس!
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-4">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <Flame className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">هنوز مقاله‌ای منتشر نشده</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.slice().reverse().map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-posts" className="mt-4">
            {!isLoggedIn ? (
              <div className="text-center py-16">
                <User className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">برای دیدن مقالاتت وارد شو</p>
                <Button onClick={() => navigate("/login")}>ورود</Button>
              </div>
            ) : myPosts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">هنوز مقاله‌ای ننوشتی</p>
                <Button onClick={handleWriteClick} className="mt-4 gradient-secondary">
                  اولین مقاله رو بنویس!
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPosts.map((post) => (
                  <BlogCard key={post.id} post={post} showStatus />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Write Dialog */}
        <BlogWriteDialog
          open={writeOpen}
          onOpenChange={setWriteOpen}
          onSuccess={() => {
            loadMyPosts();
            toast({
              title: "مقاله ارسال شد! ✍️",
              description: "مقاله شما پس از تایید ادمین منتشر خواهد شد",
            });
          }}
        />
      </div>
    </PlatformLayout>
  );
};

export default EasyBlog;
