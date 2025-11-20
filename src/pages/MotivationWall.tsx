import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const motivationalQuotes = [
  "تنها راه انجام کار عالی این است که کاری را که دوستش دارید انجام دهید.",
  "موفقیت نهایی نیست، شکست کشنده نیست: این شجاعت ادامه دادن است که اهمیت دارد.",
  "باور داشته باش که می‌تونی و نصف راه رو رفتی!",
  "هر روز فرصتی تازه برای یادگیری چیز جدید است.",
  "درس خواندن سرمایه‌گذاری در آینده‌ی خودت است.",
];

export default function MotivationWall() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"quote" | "goal">("quote");
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("motivation_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const addItem = async () => {
    if (!content.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً محتوا را وارد کنید!",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("motivation_items").insert({
        user_id: user.id,
        content,
        item_type: type,
      });

      toast({
        title: "اضافه شد! ✨",
        description: "انگیزه‌ات به دیوار اضافه شد!",
      });

      setContent("");
      setOpen(false);
      loadItems();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await supabase.from("motivation_items").delete().eq("id", id);
      loadItems();
      toast({
        title: "حذف شد",
        description: "آیتم از دیوار حذف شد.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const addRandomQuote = async () => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("motivation_items").insert({
        user_id: user.id,
        content: randomQuote,
        item_type: "quote",
      });

      loadItems();
      toast({
        title: "جمله الهام‌بخش اضافه شد! 💫",
      });
    } catch (error) {
      console.error("Error adding quote:", error);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            دیوار انگیزشی 💖
          </h1>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={addRandomQuote}>
              <Heart className="w-4 h-4 mr-2" />
              جمله تصادفی
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>افزودن به دیوار انگیزشی</DialogTitle>
                </DialogHeader>
                <Tabs value={type} onValueChange={(v) => setType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quote">جمله انگیزشی</TabsTrigger>
                    <TabsTrigger value="goal">هدف</TabsTrigger>
                  </TabsList>
                  <TabsContent value="quote" className="space-y-4">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="جمله الهام‌بخش خود را بنویسید..."
                      rows={4}
                    />
                  </TabsContent>
                  <TabsContent value="goal" className="space-y-4">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="هدف خود را بنویسید..."
                      rows={4}
                    />
                  </TabsContent>
                </Tabs>
                <Button onClick={addItem} className="w-full">
                  افزودن به دیوار
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-20 h-20 mx-auto mb-4 text-pink-500 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">دیوار انگیزشی خالی است!</h3>
            <p className="text-muted-foreground mb-6">
              جملات الهام‌بخش، اهداف و تصاویر انگیزشی خود را اضافه کنید!
            </p>
            <Button onClick={addRandomQuote}>
              شروع با یک جمله تصادفی
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-6 relative group hover:shadow-lg transition-shadow"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-lg ${
                    item.item_type === "quote" 
                      ? "bg-pink-100 dark:bg-pink-900/20" 
                      : "bg-purple-100 dark:bg-purple-900/20"
                  }`}>
                    {item.item_type === "quote" ? (
                      <Heart className="w-6 h-6 text-pink-500" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed">{item.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}