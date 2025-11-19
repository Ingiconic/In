import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Sparkles, Zap, Palette, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ShopItem {
  id: string;
  name: string;
  name_fa: string;
  description: string;
  item_type: string;
  price_coins: number;
  icon: string;
  rarity: string;
  is_available: boolean;
  owned?: boolean;
}

const rarityColors = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-amber-600",
};

const ShopPage = () => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user coins
      const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", user.id)
        .single();

      setUserCoins(profile?.coins || 0);

      // Load shop items
      const { data: shopItems } = await supabase
        .from("shop_items")
        .select("*")
        .eq("is_available", true)
        .order("price_coins", { ascending: true });

      // Load user purchases
      const { data: purchases } = await supabase
        .from("user_purchases")
        .select("item_id")
        .eq("user_id", user.id);

      const purchasedIds = new Set(purchases?.map((p) => p.item_id) || []);

      const itemsWithOwnership = shopItems?.map((item) => ({
        ...item,
        owned: purchasedIds.has(item.id),
      })) || [];

      setItems(itemsWithOwnership);
    } catch (error) {
      console.error("Error loading shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    try {
      if (item.owned) {
        toast({ title: "توجه", description: "شما این آیتم را قبلاً خریداری کرده‌اید" });
        return;
      }

      if (userCoins < item.price_coins) {
        toast({
          title: "سکه کافی نیست",
          description: `برای خرید این آیتم به ${item.price_coins} سکه نیاز دارید`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.rpc("purchase_shop_item", {
        _item_id: item.id,
      });

      if (error) throw error;

      toast({
        title: "خرید موفق! 🎉",
        description: `${item.name_fa} با موفقیت خریداری شد`,
      });

      loadShopData();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const ItemCard = ({ item }: { item: ShopItem }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`overflow-hidden border-2 ${
          item.owned ? "border-green-500/50 bg-green-500/10" : "border-border/30"
        }`}
      >
        <div
          className={`h-2 bg-gradient-to-r ${
            rarityColors[item.rarity as keyof typeof rarityColors]
          }`}
        />
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-lg">{item.name_fa}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-amber-500">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-lg">{item.price_coins.toLocaleString("fa-IR")}</span>
            </div>
            <Button
              onClick={() => handlePurchase(item)}
              disabled={item.owned}
              className="gap-2"
            >
              {item.owned ? (
                <>
                  <Check className="w-4 h-4" />
                  دارید
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  خرید
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const themeItems = items.filter((i) => i.item_type === "theme");
  const boostItems = items.filter((i) => i.item_type === "boost");
  const powerUpItems = items.filter((i) => i.item_type === "power_up");
  const avatarItems = items.filter((i) => i.item_type === "avatar");

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              فروشگاه 🛍️
            </h1>
            <p className="text-muted-foreground mt-2">
              آیتم‌های ویژه را با سکه‌های خود خریداری کنید
            </p>
          </div>
          <Card className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🪙</div>
                <div>
                  <p className="text-sm text-muted-foreground">سکه‌های شما</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {userCoins.toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">همه ({items.length})</TabsTrigger>
            <TabsTrigger value="themes">
              <Palette className="w-4 h-4 ml-2" />
              پوسته‌ها ({themeItems.length})
            </TabsTrigger>
            <TabsTrigger value="boosts">
              <Zap className="w-4 h-4 ml-2" />
              تقویت‌ها ({boostItems.length})
            </TabsTrigger>
            <TabsTrigger value="powers">
              <Sparkles className="w-4 h-4 ml-2" />
              قدرت‌ها ({powerUpItems.length})
            </TabsTrigger>
            <TabsTrigger value="avatars">
              <User className="w-4 h-4 ml-2" />
              آواتارها ({avatarItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="themes">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themeItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="boosts">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {boostItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="powers">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {powerUpItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="avatars">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {avatarItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ShopPage;
