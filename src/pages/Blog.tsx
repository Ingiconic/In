import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  slug: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, excerpt, featured_image, published_at, slug")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">وبلاگ و اخبار</h1>
          <p className="text-muted-foreground">جدیدترین مقالات و اخبار آموزشی</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">هنوز پستی منتشر نشده است</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                {post.featured_image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-foreground">{post.title}</CardTitle>
                  {post.published_at && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.published_at)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                  )}
                  <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                    مشاهده پست
                    <ArrowLeft className="mr-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Blog;