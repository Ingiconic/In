import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User } from "lucide-react";
import { toast } from "sonner";

const avatarOptions = {
  hair: [
    { value: "short", label: "کوتاه" },
    { value: "long", label: "بلند" },
    { value: "curly", label: "فر" },
    { value: "straight", label: "صاف" },
    { value: "none", label: "بدون مو" }
  ],
  face: [
    { value: "happy", label: "خوشحال" },
    { value: "neutral", label: "خنثی" },
    { value: "cool", label: "باحال" },
    { value: "serious", label: "جدی" }
  ],
  eyes: [
    { value: "normal", label: "عادی" },
    { value: "big", label: "بزرگ" },
    { value: "small", label: "کوچک" },
    { value: "closed", label: "بسته" }
  ],
  clothes: [
    { value: "casual", label: "معمولی" },
    { value: "formal", label: "رسمی" },
    { value: "sporty", label: "ورزشی" },
    { value: "hoodie", label: "هودی" }
  ],
  accessories: [
    { value: "none", label: "هیچ" },
    { value: "glasses", label: "عینک" },
    { value: "hat", label: "کلاه" },
    { value: "earrings", label: "گوشواره" }
  ],
};

export default function AvatarCustomizer() {
  const [selectedParts, setSelectedParts] = useState({
    hair: "short",
    face: "happy",
    eyes: "normal",
    clothes: "casual",
    accessories: "none",
  });
  const queryClient = useQueryClient();

  const { data: userAvatar } = useQuery({
    queryKey: ["user-avatar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_avatars")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_avatars")
        .upsert({
          user_id: user.id,
          avatar_parts: selectedParts,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-avatar"] });
      toast.success("آواتار ذخیره شد");
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            سفارشی‌سازی آواتار
          </h1>
          <p className="text-muted-foreground mt-2">
            آواتار خود را شخصی‌سازی کنید
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>پیش‌نمایش آواتار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <User className="w-32 h-32 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>مو: {selectedParts.hair}</div>
                    <div>صورت: {selectedParts.face}</div>
                    <div>چشم: {selectedParts.eyes}</div>
                    <div>لباس: {selectedParts.clothes}</div>
                    <div>اکسسوری: {selectedParts.accessories}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>انتخاب قسمت‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hair" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hair">مو</TabsTrigger>
                  <TabsTrigger value="face">صورت</TabsTrigger>
                  <TabsTrigger value="eyes">چشم</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="clothes">لباس</TabsTrigger>
                  <TabsTrigger value="accessories">اکسسوری</TabsTrigger>
                </TabsList>

                {Object.entries(avatarOptions).map(([category, options]) => (
                  <TabsContent key={category} value={category} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {options.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedParts[category as keyof typeof selectedParts] === option.value ? "default" : "outline"}
                          onClick={() => setSelectedParts({ ...selectedParts, [category]: option.value })}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full mt-6 gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره آواتار
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
