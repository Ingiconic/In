import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, PenSquare, BookOpen, Calendar, 
  Flame, Clock, FileText, Heart, Trash2,
  Tag, Loader2, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import BlogWriteDialog from "@/components/easyblog/BlogWriteDialog";
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

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
];

const getDefaultImage = (id: string) => DEFAULT_IMAGES[id.charCodeAt(0) % DEFAULT_IMAGES.length];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  content_html: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  user_id: string;
  status: string;
  author_name: string | null;
  likes_count: number;
  is_featured: boolean;
  tags: string[] | null;
  category: string | null;
  word_count: number | null;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const ModernBlogCard = ({ post, onPostClick, featured = false }: { post: BlogPost; onPostClick: () => void; featured?: boolean }) => {
  const timeAgo = formatDistanceToNow(new Date(post.published_at || post.created_at), { addSuffix: true, locale: faIR });
  const authorName = post.author_name || post.profiles?.full_name || "نویسنده";
  const readTime = Math.max(1, Math.ceil((post.word_count || post.content?.split(/\s+/).length || 0) / 200));
  const image = post.featured_image || getDefaultImage(post.id);

  if (featured) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={onPostClick} className="group cursor-pointer col-span-full lg:col-span-2">
        <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <div className="flex gap-2 mb-3">
              {post.is_featured && <Badge className="bg-amber-500/90 text-white">⭐ پرطرفدار</Badge>}
              {post.category && <Badge className="bg-teal-500/90 text-white">{post.category}</Badge>}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 line-clamp-2 group-hover:text-teal-200 transition-colors">{post.title}</h2>
            {post.excerpt && <p className="text-white/80 text-sm lg:text-base line-clamp-2 mb-4 max-w-2xl">{post.excerpt}</p>}
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border-2 border-white/20">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="bg-teal-500 text-white text-xs">{authorName[0]}</AvatarFallback>
                </Avatar>
                <span>{authorName}</span>
              </div>
              <span>•</span><span>{timeAgo}</span><span>•</span><span>{readTime} دقیقه</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={onPostClick} className="group cursor-pointer">
      <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors duration-300 h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          {post.is_featured && (
            <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white text-xs">⭐ پرطرفدار</Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
            {post.tags?.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
          </div>
          <h3 className="font-bold text-base line-clamp-2 mb-2 group-hover:text-teal-500 transition-colors">{post.title}</h3>
          {post.excerpt && <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{post.excerpt}</p>}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback className="bg-teal-500/10 text-teal-500 text-xs">{authorName[0]}</AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <p className="font-medium">{authorName}</p>
                <p className="text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 text-xs"><Heart className="w-3.5 h-3.5" /><span>{post.likes_count || 0}</span></div>
              <div className="flex items-center gap-1 text-xs"><Clock className="w-3.5 h-3.5" /><span>{readTime} دقیقه</span></div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // SEO meta tags for listing page
    document.title = "ایزی بلاگ | مقالات آموزشی دانش‌آموزان - ایزی درس";
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "ایزی بلاگ - پلتفرم نوشتن و خواندن مقالات آموزشی توسط دانش‌آموزان. مقالات درسی، تکنولوژی، مشاوره و بیشتر.");
    setMeta("keywords", "مقاله آموزشی, بلاگ دانش آموزی, ایزی درس, مقاله درسی, یادگیری");
    setMeta("og:title", "ایزی بلاگ | مقالات آموزشی دانش‌آموزان", true);
    setMeta("og:description", "مقالات آموزشی نوشته شده توسط دانش‌آموزان برای دانش‌آموزان", true);
    setMeta("og:url", "https://easydars.ir/easyblog", true);
    setMeta("og:type", "website", true);

    loadData();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
    setUserId(session?.user?.id || null);
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPosts(), loadMyPosts()]);
    setLoading(false);
  };

  const loadPosts = async (search?: string) => {
    let query = supabase.from("user_blogs").select("*").eq("status", "approved");
    if (search) query = query.ilike("title", `%${search}%`);
    query = query.order("published_at", { ascending: false }).limit(50);
    const { data } = await query;
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds);
      const pm = new Map<string, any>();
      profiles?.forEach(p => pm.set(p.id, p));
      setPosts(data.map(p => ({ ...p, profiles: pm.get(p.user_id) })));
    } else {
      setPosts([]);
    }
  };

  const loadMyPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { data } = await supabase.from("user_blogs").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    setMyPosts(data || []);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadPosts(searchQuery); };

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      toast({ title: "نیاز به ورود", description: "برای نوشتن مقاله ابتدا وارد شوید", variant: "destructive" });
      navigate("/login");
      return;
    }
    setWriteOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    setDeletingId(postId);
    try {
      const { error } = await supabase.from("user_blogs").delete().eq("id", postId);
      if (error) throw error;
      toast({ title: "مقاله حذف شد 🗑️" });
      loadMyPosts();
    } catch {
      toast({ title: "خطا در حذف", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">در انتظار تایید</Badge>;
      case "approved": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">تایید شده</Badge>;
      case "rejected": return <Badge variant="destructive">رد شده</Badge>;
      default: return null;
    }
  };

  const tabs = [
    { id: "latest", label: "جدیدترین", icon: Clock },
    { id: "trending", label: "پرطرفدار", icon: Flame },
    { id: "my-posts", label: "مقالات من", icon: FileText },
  ];

  const displayPosts = activeTab === "my-posts" ? myPosts : 
    activeTab === "trending" ? [...posts].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).filter(p => p.is_featured || (p.likes_count || 0) > 0) : posts;

  const featuredPost = activeTab !== "my-posts" ? (posts.find(p => p.is_featured) || displayPosts[0]) : null;
  const regularPosts = activeTab !== "my-posts" ? displayPosts.filter(p => p.id !== featuredPost?.id) : [];

  return (
    <PlatformLayout platformName="ایزی بلاگ" platformIcon={<BookOpen className="w-5 h-5 text-white" />} platformColor="bg-gradient-to-br from-teal-500 to-cyan-600">
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="py-6 text-center">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">ایزی بلاگ</h1>
              <p className="text-muted-foreground">مقالات آموزشی از دانش‌آموزان برای دانش‌آموزان</p>
            </div>
            <div className="pb-4 flex flex-col sm:flex-row items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full sm:max-w-md">
                <div className="relative flex-1">
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجوی مقاله..." className="pr-10 h-10 rounded-full border-border/60 bg-muted/30" />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </form>
              <Button onClick={handleWriteClick} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white gap-2 rounded-full px-6">
                <PenSquare className="w-4 h-4" />نوشتن مقاله
              </Button>
            </div>
            <ScrollArea className="w-full pb-3">
              <div className="flex gap-2 px-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap rounded-lg gap-1.5 ${activeTab === tab.id ? 'bg-teal-500 hover:bg-teal-600 text-white' : ''}`}>
                      <Icon className="w-4 h-4" />{tab.label}
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-teal-500/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-teal-500/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{activeTab === "my-posts" ? "هنوز مقاله‌ای ننوشتی" : "هنوز مقاله‌ای منتشر نشده"}</h3>
              <Button onClick={handleWriteClick} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white gap-2 mt-4">
                <PenSquare className="w-4 h-4" />نوشتن مقاله
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {activeTab === "my-posts" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {myPosts.map((post) => (
                      <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group cursor-pointer">
                        <Card className="overflow-hidden border hover:shadow-lg transition-all duration-300">
                          <div className="relative aspect-[16/10] overflow-hidden" onClick={() => navigate(`/easyblog/post/${post.id}`)}>
                            <img src={post.featured_image || getDefaultImage(post.id)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              {getStatusBadge(post.status)}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />حذف مقاله</AlertDialogTitle>
                                    <AlertDialogDescription>آیا مطمئنی؟ این عمل قابل بازگشت نیست.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePost(post.id)} disabled={deletingId === post.id} className="bg-destructive">
                                      {deletingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <h3 onClick={() => navigate(`/easyblog/post/${post.id}`)} className="font-bold text-base line-clamp-2 group-hover:text-teal-500 transition-colors">{post.title}</h3>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {activeTab !== "my-posts" && (
                <>
                  {featuredPost && <ModernBlogCard post={featuredPost} onPostClick={() => navigate(`/easyblog/post/${featuredPost.id}`)} featured />}
                  {regularPosts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {regularPosts.map((post) => (
                          <ModernBlogCard key={post.id} post={post} onPostClick={() => navigate(`/easyblog/post/${post.id}`)} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <BlogWriteDialog
          open={writeOpen}
          onOpenChange={setWriteOpen}
          onSuccess={() => {
            loadMyPosts();
            toast({ title: "مقاله ارسال شد! ✍️", description: "پس از تایید ادمین منتشر خواهد شد" });
          }}
        />
      </div>
    </PlatformLayout>
  );
};

export default EasyBlog;
