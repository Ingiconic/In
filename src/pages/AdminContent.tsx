import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, FileText, Check, X, Eye, Clock, 
  CheckCircle2, XCircle, AlertCircle, Play
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface PendingVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface PendingBlog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<PendingVideo[]>([]);
  const [blogs, setBlogs] = useState<PendingBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [previewVideo, setPreviewVideo] = useState<PendingVideo | null>(null);
  const [previewBlog, setPreviewBlog] = useState<PendingBlog | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Load pending videos
      const { data: videosData } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (videosData) {
        const userIds = [...new Set(videosData.map(v => v.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);

        const profilesMap = new Map<string, any>();
        profiles?.forEach(p => profilesMap.set(p.id, p));

        setVideos(videosData.map(v => ({
          ...v,
          profiles: profilesMap.get(v.user_id),
        })));
      }

      // Load pending blogs
      const { data: blogsData } = await supabase
        .from("user_blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (blogsData) {
        const userIds = [...new Set(blogsData.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);

        const profilesMap = new Map<string, any>();
        profiles?.forEach(p => profilesMap.set(p.id, p));

        setBlogs(blogsData.map(b => ({
          ...b,
          profiles: profilesMap.get(b.user_id),
        })));
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAction = async (videoId: string, action: "approved" | "rejected") => {
    try {
      const updateData: any = { status: action };
      if (action === "approved") {
        updateData.is_public = true;
      }

      const { error } = await supabase
        .from("videos")
        .update(updateData)
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "ویدیو تایید شد ✅" : "ویدیو رد شد ❌",
      });
      
      setPreviewVideo(null);
      loadContent();
    } catch (error: any) {
      console.error("Error updating video:", error);
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const handleBlogAction = async (blogId: string, action: "approved" | "rejected") => {
    try {
      const updateData: any = { status: action };
      if (action === "approved") {
        updateData.published_at = new Date().toISOString();
      }
      if (action === "rejected" && rejectReason) {
        updateData.rejection_reason = rejectReason;
      }

      const { error } = await supabase
        .from("user_blogs")
        .update(updateData)
        .eq("id", blogId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "مقاله تایید شد ✅" : "مقاله رد شد ❌",
      });
      
      setPreviewBlog(null);
      setRejectReason("");
      loadContent();
    } catch (error: any) {
      console.error("Error updating blog:", error);
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 gap-1"><Clock className="w-3 h-3" />در انتظار</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 gap-1"><CheckCircle2 className="w-3 h-3" />تایید شده</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />رد شده</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => 
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: faIR });

  const pendingVideos = videos.filter(v => v.status === "pending");
  const pendingBlogs = blogs.filter(b => b.status === "pending");

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">مدیریت محتوا</h1>
            <p className="text-muted-foreground text-sm mt-1">
              بررسی و تایید ویدیوها و مقالات کاربران
            </p>
          </div>
          
          <div className="flex gap-2">
            {pendingVideos.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                {pendingVideos.length} ویدیو در انتظار
              </Badge>
            )}
            {pendingBlogs.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                {pendingBlogs.length} مقاله در انتظار
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              ویدیوها ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="blogs" className="gap-2">
              <FileText className="w-4 h-4" />
              مقالات ({blogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted" />
                    <CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader>
                  </Card>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">ویدیویی وجود ندارد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map(video => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="relative h-40">
                      <img 
                        src={video.thumbnail_url || "/placeholder.svg"} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(video.status)}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{video.title}</CardTitle>
                      <CardDescription className="flex items-center justify-between">
                        <span>@{video.profiles?.username}</span>
                        <span>{formatDate(video.created_at)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPreviewVideo(video)}
                        className="flex-1 gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        مشاهده
                      </Button>
                      {video.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleVideoAction(video.id, "approved")}
                            className="bg-green-600 hover:bg-green-700 gap-1"
                          >
                            <Check className="w-4 h-4" />
                            تایید
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleVideoAction(video.id, "rejected")}
                            className="gap-1"
                          >
                            <X className="w-4 h-4" />
                            رد
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader>
                    <CardContent><div className="h-16 bg-muted rounded" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">مقاله‌ای وجود ندارد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map(blog => (
                  <Card key={blog.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(blog.status)}
                        <span className="text-xs text-muted-foreground">{formatDate(blog.created_at)}</span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{blog.title}</CardTitle>
                      <CardDescription>@{blog.profiles?.username}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {blog.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{blog.excerpt}</p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPreviewBlog(blog)}
                          className="flex-1 gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          مشاهده
                        </Button>
                        {blog.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleBlogAction(blog.id, "approved")}
                              className="bg-green-600 hover:bg-green-700 gap-1"
                            >
                              <Check className="w-4 h-4" />
                              تایید
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setPreviewBlog(blog)}
                              className="gap-1"
                            >
                              <X className="w-4 h-4" />
                              رد
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Video Preview Dialog */}
        <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewVideo?.title}</DialogTitle>
              <DialogDescription>
                توسط @{previewVideo?.profiles?.username} • {previewVideo && formatDate(previewVideo.created_at)}
              </DialogDescription>
            </DialogHeader>
            
            {previewVideo && (
              <div className="space-y-4">
                <video 
                  src={previewVideo.video_url} 
                  controls 
                  className="w-full rounded-lg"
                  poster={previewVideo.thumbnail_url}
                />
                <p className="text-sm whitespace-pre-wrap">{previewVideo.description}</p>
                
                {previewVideo.status === "pending" && (
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button 
                      onClick={() => handleVideoAction(previewVideo.id, "approved")}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Check className="w-4 h-4" />
                      تایید ویدیو
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleVideoAction(previewVideo.id, "rejected")}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      رد ویدیو
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Blog Preview Dialog */}
        <Dialog open={!!previewBlog} onOpenChange={() => { setPreviewBlog(null); setRejectReason(""); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewBlog?.title}</DialogTitle>
              <DialogDescription>
                توسط @{previewBlog?.profiles?.username} • {previewBlog && formatDate(previewBlog.created_at)}
              </DialogDescription>
            </DialogHeader>
            
            {previewBlog && (
              <div className="space-y-4">
                {previewBlog.featured_image && (
                  <img 
                    src={previewBlog.featured_image} 
                    alt={previewBlog.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{previewBlog.content}</div>
                </div>
                
                {previewBlog.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <Textarea
                      placeholder="دلیل رد (اختیاری)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button 
                        onClick={() => handleBlogAction(previewBlog.id, "approved")}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        تایید مقاله
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleBlogAction(previewBlog.id, "rejected")}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        رد مقاله
                      </Button>
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
