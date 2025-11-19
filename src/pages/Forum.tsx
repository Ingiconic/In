import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ThumbsUp, Eye, Plus, Pin, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  name_fa: string;
  description: string;
  icon: string;
}

interface Topic {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  views_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

const Forum = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTopic, setNewTopic] = useState({
    category_id: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      const { data: categoriesData } = await supabase
        .from("forum_categories")
        .select("*")
        .order("name_fa");

      setCategories(categoriesData || []);

      // Load topics with author info
      let query = supabase
        .from("forum_topics")
        .select(`
          *,
          profiles!forum_topics_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data: topicsData } = await query;

      const formattedTopics = topicsData?.map((topic: any) => ({
        ...topic,
        author: topic.profiles,
      })) || [];

      setTopics(formattedTopics);
    } catch (error) {
      console.error("Error loading forum data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    try {
      if (!newTopic.category_id || !newTopic.title || !newTopic.content) {
        toast({
          title: "خطا",
          description: "لطفا تمام فیلدها را پر کنید",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("forum_topics").insert({
        user_id: user.id,
        category_id: newTopic.category_id,
        title: newTopic.title,
        content: newTopic.content,
      });

      if (error) throw error;

      toast({ title: "موفق", description: "موضوع با موفقیت ایجاد شد" });
      setDialogOpen(false);
      setNewTopic({ category_id: "", title: "", content: "" });
      loadData();
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const handleTopicClick = async (topicId: string) => {
    // Increment view count
    await supabase.rpc("increment_topic_views", { topic_id_param: topicId });
    navigate(`/forum/${topicId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-48" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              انجمن و بحث گروهی 💬
            </h1>
            <p className="text-muted-foreground mt-2">
              سوالات خود را بپرسید و به دیگران کمک کنید
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                موضوع جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ایجاد موضوع جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Select
                    value={newTopic.category_id}
                    onValueChange={(value) =>
                      setNewTopic({ ...newTopic, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name_fa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="عنوان موضوع"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                />
                <Textarea
                  placeholder="متن سوال یا بحث خود را بنویسید..."
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  rows={8}
                />
                <Button onClick={handleCreateTopic} className="w-full">
                  ایجاد موضوع
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-bold mb-4">دسته‌بندی‌ها</h3>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedCategory("all")}
                >
                  🌐 همه موضوعات
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon} {cat.name_fa}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topics List */}
          <div className="lg:col-span-3 space-y-4">
            {topics.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    هنوز موضوعی در این دسته ثبت نشده. اولین نفر باشید!
                  </p>
                </CardContent>
              </Card>
            ) : (
              topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={topic.author?.avatar_url} />
                        <AvatarFallback>
                          {topic.author?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {topic.is_pinned && (
                              <Pin className="w-4 h-4 text-primary" />
                            )}
                            {topic.is_locked && (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                            <h3 className="font-bold text-lg hover:text-primary transition-colors">
                              {topic.title}
                            </h3>
                          </div>
                          <Badge variant="outline">
                            {categories.find((c) => c.id === topic.category_id)?.icon}{" "}
                            {categories.find((c) => c.id === topic.category_id)?.name_fa}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {topic.content}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{topic.author?.full_name}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(topic.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {topic.views_count}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {topic.replies_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Forum;
