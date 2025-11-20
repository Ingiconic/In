import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResourceRecommenderProps {
  companionData: any;
}

export default function ResourceRecommender({ companionData }: ResourceRecommenderProps) {
  const recommendations = [
    {
      title: "تولید خودکار آزمون",
      description: "آزمون‌های متناسب با سطح خود بسازید",
      link: "/exam-v2",
      difficulty: companionData?.difficulty_areas?.length > 2 ? "پیشنهاد ویژه" : "پیشنهاد",
      color: "from-orange-500 to-red-500",
    },
    {
      title: "فلش‌کارت هوشمند",
      description: "برای مرور سریع مطالب",
      link: "/flashcards",
      difficulty: "مناسب همه",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "خلاصه‌ساز AI",
      description: "خلاصه‌سازی هوشمند متون درسی",
      link: "/summarize",
      difficulty: "سریع و کارآمد",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Mind Map هوشمند",
      description: "نقشه ذهنی برای سازماندهی مفاهیم",
      link: "/mindmap",
      difficulty: "بصری",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>منابع پیشنهادی</CardTitle>
            <CardDescription>بر اساس نیازهای شما</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg bg-gradient-to-br ${rec.color} bg-opacity-10 border border-border hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{rec.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {rec.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={rec.link}>
                  مشاهده
                  <ExternalLink className="w-3 h-3 mr-1" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
