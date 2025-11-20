import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Heart, Utensils, Gamepad2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PetSystem() {
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("cat");
  const queryClient = useQueryClient();

  const { data: pet } = useQuery({
    queryKey: ["user-pet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_pets")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const createPetMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_pets").insert({
        user_id: user.id,
        pet_type: petType,
        pet_name: petName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pet"] });
      toast.success("حیوان خانگی شما ایجاد شد!");
    },
  });

  const feedPetMutation = useMutation({
    mutationFn: async () => {
      if (!pet) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct coins and update pet
      const { data: profile } = await supabase.from("profiles").select("coins").eq("id", user.id).single();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ coins: (profile?.coins || 0) - 5 })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          pet_hunger: Math.min((pet.pet_hunger || 50) + 20, 100),
          pet_happiness: Math.min((pet.pet_happiness || 50) + 10, 100),
          last_fed_at: new Date().toISOString(),
        })
        .eq("id", pet.id);

      if (petError) throw petError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pet"] });
      toast.success("حیوان خانگی شما غذا خورد! 🍖");
    },
  });

  const playWithPetMutation = useMutation({
    mutationFn: async () => {
      if (!pet) return;

      const { error } = await supabase
        .from("user_pets")
        .update({
          pet_happiness: Math.min((pet.pet_happiness || 50) + 15, 100),
          pet_xp: (pet.pet_xp || 0) + 10,
          last_played_at: new Date().toISOString(),
        })
        .eq("id", pet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pet"] });
      toast.success("حیوان خانگی شما خوشحال شد! 🎉");
    },
  });

  const petEmojis: Record<string, string> = {
    cat: "🐱",
    dog: "🐶",
    dragon: "🐉",
    owl: "🦉",
  };

  if (!pet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ایجاد حیوان خانگی</CardTitle>
          <CardDescription>یک حیوان خانگی برای خود انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">نوع حیوان</label>
            <Select value={petType} onValueChange={setPetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cat">🐱 گربه</SelectItem>
                <SelectItem value="dog">🐶 سگ</SelectItem>
                <SelectItem value="dragon">🐉 اژدها</SelectItem>
                <SelectItem value="owl">🦉 جغد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">نام حیوان</label>
            <Input
              placeholder="نام حیوان خانگی خود را وارد کنید"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
            />
          </div>
          <Button
            onClick={() => createPetMutation.mutate()}
            disabled={!petName || createPetMutation.isPending}
            className="w-full"
          >
            ایجاد حیوان خانگی
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">{petEmojis[pet.pet_type]}</span>
          {pet.pet_name}
          <span className="text-sm text-muted-foreground">سطح {pet.pet_level}</span>
        </CardTitle>
        <CardDescription>حیوان خانگی شما</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>شادی</span>
            </div>
            <span>{pet.pet_happiness}%</span>
          </div>
          <Progress value={pet.pet_happiness} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-green-500" />
              <span>گرسنگی</span>
            </div>
            <span>{pet.pet_hunger}%</span>
          </div>
          <Progress value={pet.pet_hunger} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-blue-500" />
              <span>تجربه</span>
            </div>
            <span>{pet.pet_xp} XP</span>
          </div>
          <Progress value={(pet.pet_xp % 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => feedPetMutation.mutate()}
            disabled={feedPetMutation.isPending || (pet.pet_hunger || 0) >= 90}
            className="gap-2"
          >
            <Utensils className="w-4 h-4" />
            غذا (5 سکه)
          </Button>
          <Button
            onClick={() => playWithPetMutation.mutate()}
            disabled={playWithPetMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <Gamepad2 className="w-4 h-4" />
            بازی
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
