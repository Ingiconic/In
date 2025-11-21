import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";
import avatar7 from "@/assets/avatars/avatar-7.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import avatar9 from "@/assets/avatars/avatar-9.png";
import avatar10 from "@/assets/avatars/avatar-10.png";

const avatars = [
  avatar1, avatar2, avatar3, avatar4, avatar5,
  avatar6, avatar7, avatar8, avatar9, avatar10
];

interface AvatarSelectorProps {
  currentAvatar?: string;
  onSelect?: (avatar: string) => void;
}

const AvatarSelector = ({ currentAvatar, onSelect }: AvatarSelectorProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedAvatar(currentAvatar || "");
  }, [currentAvatar]);

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    if (onSelect) {
      onSelect(avatar);
    }
  };

  const saveAvatar = async () => {
    if (!selectedAvatar) {
      toast({
        title: "خطا",
        description: "لطفاً یک آواتار انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: selectedAvatar })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "آواتار شما ذخیره شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطا در ذخیره آواتار",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">انتخاب آواتار</h3>
      <div className="grid grid-cols-5 gap-3">
        {avatars.map((avatar, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(avatar)}
            className={`p-1 cursor-pointer transition-all hover:scale-105 ${
              selectedAvatar === avatar
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <img
              src={avatar}
              alt={`آواتار ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </Card>
        ))}
      </div>
      {onSelect === undefined && (
        <Button 
          onClick={saveAvatar} 
          disabled={saving || !selectedAvatar}
          className="w-full gradient-primary"
        >
          {saving ? "در حال ذخیره..." : "ذخیره آواتار"}
        </Button>
      )}
    </div>
  );
};

export default AvatarSelector;
