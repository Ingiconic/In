import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ForumCategory {
  id: string;
  name: string;
  name_fa: string;
  description: string | null;
  icon: string | null;
  topics_count?: number;
}

const Forum = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("name_fa");

      if (error) throw error;

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from("forum_topics")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id);

          return {
            ...category,
            topics_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">انجمن بحث و گفتگو</h1>
          <p className="text-muted-foreground">
            در دسته‌بندی مورد نظر خود شرکت کنید و با دانشجویان دیگر بحث کنید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50"
              onClick={() => navigate(`/forum/${category.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {category.icon && (
                    <div className="text-4xl">{category.icon}</div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.name_fa}
                    </CardTitle>
                  </div>
                </div>
                {category.description && (
                  <CardDescription className="line-clamp-2">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{category.topics_count} موضوع</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              هنوز دسته‌بندی ایجاد نشده است
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Forum;
