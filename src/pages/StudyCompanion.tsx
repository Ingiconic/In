import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target, TrendingUp } from "lucide-react";
import LearningStyleAnalyzer from "@/components/companion/LearningStyleAnalyzer";
import StudyTimeRecommender from "@/components/companion/StudyTimeRecommender";
import ResourceRecommender from "@/components/companion/ResourceRecommender";

export default function StudyCompanion() {
  const { data: companionData } = useQuery({
    queryKey: ["study-companion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_companion_data")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const insights = [
    {
      icon: Brain,
      title: "سبک یادگیری",
      value: companionData?.learning_style || "تحلیل نشده",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Clock,
      title: "میانگین تمرکز",
      value: companionData?.focus_duration_avg ? `${companionData.focus_duration_avg} دقیقه` : "-",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Target,
      title: "درس‌های محبوب",
      value: companionData?.preferred_subjects?.join(", ") || "-",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: TrendingUp,
      title: "نقاط ضعف",
      value: companionData?.difficulty_areas?.length || 0,
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            همراه هوشمند یادگیری
          </h1>
          <p className="text-muted-foreground mt-2">
            تحلیل هوشمند سبک یادگیری و پیشنهادات شخصی‌سازی‌شده
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${insight.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <CardDescription>{insight.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl">{insight.value}</CardTitle>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LearningStyleAnalyzer />
          <StudyTimeRecommender />
        </div>

        <ResourceRecommender companionData={companionData} />
      </div>
    </div>
  );
}
