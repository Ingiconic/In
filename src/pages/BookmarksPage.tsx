import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bookmark, ArrowLeft, Trash2, ExternalLink, Search,
  BookOpen, Video, FileText, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  type: "video" | "blog" | "resource" | "other";
  created_at: string;
}

const BookmarksPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get saved videos
      const { data: savedVideos } = await supabase
        .from("saved_videos")
        .select(`
          id,
          created_at,
          video:videos(id, title)
        `)
        .eq("user_id", user.id);

      const videoBookmarks: BookmarkItem[] = (savedVideos || []).map((sv: any) => ({
        id: sv.id,
        title: sv.video?.title || "ویدیو",
        url: `/easytube/watch/${sv.video?.id}`,
        type: "video" as const,
        created_at: sv.created_at,
      }));

      setBookmarks(videoBookmarks);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (id: string, type: string) => {
    try {
      if (type === "video") {
        await supabase.from("saved_videos").delete().eq("id", id);
      }
      
      setBookmarks(prev => prev.filter(b => b.id !== id));
      toast({ title: "حذف شد" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "blog": return BookOpen;
      case "resource": return FileText;
      default: return Bookmark;
    }
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">نشان‌شده‌ها</h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نشان‌شده‌ها..."
            className="pr-10"
          />
        </div>

        {/* Bookmarks List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز چیزی نشان نکردید</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((bookmark, i) => {
              const Icon = getIcon(bookmark.type);
              
              return (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(bookmark.url)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBookmark(bookmark.id, bookmark.type)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookmarksPage;
