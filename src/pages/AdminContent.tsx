import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, FileText, Check, X, Eye, Clock, 
  CheckCircle2, XCircle, Trash2, Star, Sparkles, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface PendingVideo {
  id: string; title: string; description: string; video_url: string;
  thumbnail_url: string; status: string; created_at: string; user_id: string;
  profiles?: { full_name: string; username: string };
}

interface PendingBlog {
  id: string; title: string; excerpt: string; content: string; content_html: string | null;
  featured_image: string; status: string; created_at: string; user_id: string;
  is_featured: boolean; seo_keywords: string[] | null; seo_description: string | null;
  tags: string[] | null; category: string | null;
  profiles?: { full_name: string; username: string };
}

const AdminContent = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<PendingVideo[]>([]);
  const [blogs, setBlogs] = useState<PendingBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("blogs");
  const [previewVideo, setPreviewVideo] = useState<PendingVideo | null>(null);
  const [previewBlog, setPreviewBlog] = useState<PendingBlog | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data: videosData } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      if (videosData) {
        const userIds = [...new Set(videosData.map(v => v.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, username").in("id", userIds);
        const pm = new Map<string, any>();
        profiles?.forEach(p => pm.set(p.id, p));
        setVideos(videosData.map(v => ({ ...v, profiles: pm.get(v.user_id) })));
      }

      const { data: blogsData } = await supabase.from("user_blogs").select("*").order("created_at", { ascending: false });
      if (blogsData) {
        const userIds = [...new Set(blogsData.map(b => b.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, username").in("id", userIds);
        const pm = new Map<string, any>();
        profiles?.forEach(p => pm.set(p.id, p));
        setBlogs(blogsData.map(b => ({ ...b, profiles: pm.get(b.user_id) })));
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleVideoAction = async (videoId: string, action: "approved" | "rejected") => {
    const updateData: any = { status: action };
    if (action === "approved") updateData.is_public = true;
    const { error } = await supabase.from("videos").update(updateData).eq("id", videoId);
    if (!error) { toast({ title: action === "approved" ? "ویدیو تایید شد ✅" : "ویدیو رد شد ❌" }); setPreviewVideo(null); loadContent(); }
  };

  const handleBlogAction = async (blogId: string, action: "approved" | "rejected") => {
    const updateData: any = { status: action };
    if (action === "approved") updateData.published_at = new Date().toISOString();
    if (action === "rejected" && rejectReason) updateData.rejection_reason = rejectReason;
    const { error } = await supabase.from("user_blogs").update(updateData).eq("id", blogId);
    if (!error) { toast({ title: action === "approved" ? "مقاله تایید شد ✅" : "مقاله رد شد ❌" }); setPreviewBlog(null); setRejectReason(""); loadContent(); }
  };

  const handleToggleFeatured = async (blogId: string, currentFeatured: boolean) => {
    const { error } = await supabase.from("user_blogs").update({ is_featured: !currentFeatured }).eq("id", blogId);
    if (!error) { toast({ title: !currentFeatured ? "مقاله پرطرفدار شد ⭐" : "مقاله از پرطرفدار خارج شد" }); loadContent(); }
  };

  const handleDeleteBlog = async (blogId: string) => {
    const { error } = await supabase.from("user_blogs").delete().eq("id", blogId);
    if (!error) { toast({ title: "مقاله حذف شد 🗑️" }); setPreviewBlog(null); loadContent(); }
  };

  const handleAISeoKeywords = async (blog: PendingBlog) => {
    setAiLoading(blog.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Login required");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-blog-enhance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ title: blog.title, content: blog.content_html || blog.content, action: "extract_keywords" }),
        }
      );
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (data.seo_keywords) {
        await supabase.from("user_blogs").update({ seo_keywords: data.seo_keywords, seo_description: data.seo_description }).eq("id", blog.id);
        toast({ title: "کلمات کلیدی SEO استخراج شد ✨" });
        loadContent();
      }
    } catch (error) {
      toast({ title: "خطا", variant: "destructive" });
    } finally { setAiLoading(null); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 gap-1"><Clock className="w-3 h-3" />در انتظار</Badge>;
      case "approved": return <Badge variant="secondary" className="bg-green-500/10 text-green-500 gap-1"><CheckCircle2 className="w-3 h-3" />تایید شده</Badge>;
      case "rejected": return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />رد شده</Badge>;
      default: return null;
    }
  };

  const formatDate = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: faIR });
  const pendingVideos = videos.filter(v => v.status === "pending");
  const pendingBlogs = blogs.filter(b => b.status === "pending");

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">مدیریت محتوا</h1>
            <p className="text-muted-foreground text-sm mt-1">بررسی و تایید ویدیوها و مقالات کاربران</p>
          </div>
          <div className="flex gap-2">
            {pendingVideos.length > 0 && <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">{pendingVideos.length} ویدیو</Badge>}
            {pendingBlogs.length > 0 && <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">{pendingBlogs.length} مقاله</Badge>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blogs" className="gap-2"><FileText className="w-4 h-4" />مقالات ({blogs.length})</TabsTrigger>
            <TabsTrigger value="videos" className="gap-2"><Video className="w-4 h-4" />ویدیوها ({videos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="blogs" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse"><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader><CardContent><div className="h-16 bg-muted rounded" /></CardContent></Card>)}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16"><FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">مقاله‌ای وجود ندارد</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map(blog => (
                  <Card key={blog.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-2">
                          {getStatusBadge(blog.status)}
                          {blog.is_featured && <Badge className="bg-amber-500/10 text-amber-500 gap-1"><Star className="w-3 h-3" />پرطرفدار</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(blog.created_at)}</span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{blog.title}</CardTitle>
                      <CardDescription className="flex items-center justify-between">
                        <span>@{blog.profiles?.username}</span>
                        {blog.category && <Badge variant="outline" className="text-xs">{blog.category}</Badge>}
                      </CardDescription>
                      {blog.seo_keywords && blog.seo_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {blog.seo_keywords.map(k => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPreviewBlog(blog)} className="gap-1"><Eye className="w-4 h-4" />مشاهده</Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleFeatured(blog.id, blog.is_featured)} className={`gap-1 ${blog.is_featured ? 'text-amber-500' : ''}`}>
                          <Star className="w-4 h-4" />{blog.is_featured ? "حذف از پرطرفدار" : "پرطرفدار"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAISeoKeywords(blog)} disabled={aiLoading === blog.id} className="gap-1 text-primary">
                          {aiLoading === blog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}SEO
                        </Button>
                        {blog.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleBlogAction(blog.id, "approved")} className="bg-green-600 hover:bg-green-700 gap-1"><Check className="w-4 h-4" />تایید</Button>
                            <Button variant="destructive" size="sm" onClick={() => { setPreviewBlog(blog); setRejectReason(""); }} className="gap-1"><X className="w-4 h-4" />رد</Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBlog(blog.id)} className="gap-1 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse"><div className="h-40 bg-muted" /><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader></Card>)}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16"><Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">ویدیویی وجود ندارد</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map(video => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="relative h-40">
                      <img src={video.thumbnail_url || "/placeholder.svg"} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">{getStatusBadge(video.status)}</div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{video.title}</CardTitle>
                      <CardDescription className="flex items-center justify-between">
                        <span>@{video.profiles?.username}</span><span>{formatDate(video.created_at)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPreviewVideo(video)} className="flex-1 gap-1"><Eye className="w-4 h-4" />مشاهده</Button>
                      {video.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleVideoAction(video.id, "approved")} className="bg-green-600 hover:bg-green-700 gap-1"><Check className="w-4 h-4" />تایید</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleVideoAction(video.id, "rejected")} className="gap-1"><X className="w-4 h-4" />رد</Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Video Preview */}
        <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewVideo?.title}</DialogTitle>
              <DialogDescription>@{previewVideo?.profiles?.username} • {previewVideo && formatDate(previewVideo.created_at)}</DialogDescription>
            </DialogHeader>
            {previewVideo && (
              <div className="space-y-4">
                <video src={previewVideo.video_url} controls className="w-full rounded-lg" poster={previewVideo.thumbnail_url} />
                <p className="text-sm whitespace-pre-wrap">{previewVideo.description}</p>
                {previewVideo.status === "pending" && (
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button onClick={() => handleVideoAction(previewVideo.id, "approved")} className="bg-green-600 hover:bg-green-700 gap-2"><Check className="w-4 h-4" />تایید</Button>
                    <Button variant="destructive" onClick={() => handleVideoAction(previewVideo.id, "rejected")} className="gap-2"><X className="w-4 h-4" />رد</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Blog Preview */}
        <Dialog open={!!previewBlog} onOpenChange={() => { setPreviewBlog(null); setRejectReason(""); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewBlog?.title}</DialogTitle>
              <DialogDescription>@{previewBlog?.profiles?.username} • {previewBlog && formatDate(previewBlog.created_at)}</DialogDescription>
            </DialogHeader>
            {previewBlog && (
              <div className="space-y-4">
                {previewBlog.featured_image && <img src={previewBlog.featured_image} alt={previewBlog.title} className="w-full h-48 object-cover rounded-lg" />}
                <div className="prose dark:prose-invert max-w-none">
                  {previewBlog.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: previewBlog.content_html }} />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">{previewBlog.content}</div>
                  )}
                </div>
                {previewBlog.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <Textarea placeholder="دلیل رد (اختیاری)..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => handleBlogAction(previewBlog.id, "approved")} className="bg-green-600 hover:bg-green-700 gap-2"><Check className="w-4 h-4" />تایید</Button>
                      <Button variant="destructive" onClick={() => handleBlogAction(previewBlog.id, "rejected")} className="gap-2"><X className="w-4 h-4" />رد</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AdminContent;
