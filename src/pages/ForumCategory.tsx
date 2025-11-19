import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, MessageSquare, Eye, Plus, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  views_count: number;
  replies_count: number;
  author_name?: string;
}

interface ForumCategory {
  id: string;
  name_fa: string;
  description: string | null;
  icon: string | null;
}

const ForumCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategoryData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('forum-topics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_topics',
          filter: `category_id=eq.${categoryId}`
        },
        () => {
          loadTopics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  const loadCategoryData = async () => {
    try {
      // Load category
      const { data: categoryData, error: categoryError } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      await loadTopics();
    } catch (error) {
      console.error("Error loading category:", error);
      toast.error("خطا در بارگذاری دسته‌بندی");
      navigate("/forum");
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const { data: topicsData, error } = await supabase
        .from("forum_topics")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get author names separately
      const topicsWithAuthors = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", topic.user_id)
            .single();

          return {
            ...topic,
            author_name: profile?.full_name || "کاربر",
          };
        })
      );

      setTopics(topicsWithAuthors);
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast.error("لطفا عنوان و محتوا را وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("لطفا ابتدا وارد شوید");
        return;
      }

      const { error } = await supabase
        .from("forum_topics")
        .insert({
          category_id: categoryId,
          user_id: user.id,
          title: newTopicTitle,
          content: newTopicContent,
        });

      if (error) throw error;

      toast.success("موضوع با موفقیت ایجاد شد");
      setDialogOpen(false);
      setNewTopicTitle("");
      setNewTopicContent("");
      loadTopics();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("خطا در ایجاد موضوع");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/forum/topic/${topicId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!category) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/forum")}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به انجمن
          </Button>

          <div className="flex items-center gap-3 mb-2">
            {category.icon && <div className="text-5xl">{category.icon}</div>}
            <div>
              <h1 className="text-4xl font-bold">{category.name_fa}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Create Topic Button */}
        <div className="mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                ایجاد موضوع جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>ایجاد موضوع جدید</DialogTitle>
                <DialogDescription>
                  سوال یا موضوع خود را برای بحث مطرح کنید
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="عنوان موضوع"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="محتوای موضوع..."
                    value={newTopicContent}
                    onChange={(e) => setNewTopicContent(e.target.value)}
                    rows={6}
                    disabled={submitting}
                  />
                </div>
                <Button
                  onClick={handleCreateTopic}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    "در حال ارسال..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      ارسال موضوع
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleTopicClick(topic.id)}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {topic.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {topic.content}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{topic.replies_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{topic.views_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {topic.author_name}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(topic.created_at), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {topics.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                هنوز موضوعی ایجاد نشده است
              </p>
              <p className="text-sm text-muted-foreground">
                اولین نفری باشید که موضوعی برای بحث مطرح می‌کند!
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ForumCategory;
