import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Monitor, Palette, Type, TextCursor } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const ThemeCustomizer = () => {
  const { theme, setTheme, loading } = useTheme();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dark/Light Mode */}
      <Card>
        <CardContent className="p-6">
          <Label className="flex items-center gap-2 mb-4 text-lg font-bold">
            {theme.theme_mode === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            حالت نمایش
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={theme.theme_mode === "light" ? "default" : "outline"}
              className="flex flex-col gap-2 h-auto py-4"
              onClick={() => setTheme({ theme_mode: "light" })}
            >
              <Sun className="w-6 h-6" />
              <span>روشن</span>
            </Button>
            <Button
              variant={theme.theme_mode === "dark" ? "default" : "outline"}
              className="flex flex-col gap-2 h-auto py-4"
              onClick={() => setTheme({ theme_mode: "dark" })}
            >
              <Moon className="w-6 h-6" />
              <span>تاریک</span>
            </Button>
            <Button
              variant={theme.theme_mode === "system" ? "default" : "outline"}
              className="flex flex-col gap-2 h-auto py-4"
              onClick={() => setTheme({ theme_mode: "system" })}
            >
              <Monitor className="w-6 h-6" />
              <span>سیستم</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardContent className="p-6">
          <Label className="flex items-center gap-2 mb-4 text-lg font-bold">
            <Palette className="w-5 h-5" />
            رنگ اصلی
          </Label>
          <div className="grid grid-cols-5 gap-3">
            {[
              { value: "blue", label: "آبی", color: "bg-blue-500" },
              { value: "purple", label: "بنفش", color: "bg-purple-500" },
              { value: "green", label: "سبز", color: "bg-green-500" },
              { value: "red", label: "قرمز", color: "bg-red-500" },
              { value: "orange", label: "نارنجی", color: "bg-orange-500" },
            ].map((color) => (
              <Button
                key={color.value}
                variant="outline"
                className={`flex flex-col gap-2 h-auto py-4 ${
                  theme.color_scheme === color.value ? "border-2 border-primary" : ""
                }`}
                onClick={() => setTheme({ color_scheme: color.value as any })}
              >
                <div className={`w-8 h-8 rounded-full ${color.color}`} />
                <span className="text-xs">{color.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Family */}
      <Card>
        <CardContent className="p-6">
          <Label className="flex items-center gap-2 mb-4 text-lg font-bold">
            <Type className="w-5 h-5" />
            فونت
          </Label>
          <Select
            value={theme.font_family}
            onValueChange={(value) => setTheme({ font_family: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">پیش‌فرض</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardContent className="p-6">
          <Label className="flex items-center gap-2 mb-4 text-lg font-bold">
            <TextCursor className="w-5 h-5" />
            اندازه فونت
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "small", label: "کوچک" },
              { value: "medium", label: "متوسط" },
              { value: "large", label: "بزرگ" },
            ].map((size) => (
              <Button
                key={size.value}
                variant={theme.font_size === size.value ? "default" : "outline"}
                onClick={() => setTheme({ font_size: size.value as any })}
              >
                {size.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
