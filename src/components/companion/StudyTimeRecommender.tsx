import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function StudyTimeRecommender() {
  const { data: sessions } = useQuery({
    queryKey: ["focus-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const analyzeOptimalTimes = () => {
    if (!sessions || sessions.length === 0) {
      return [
        { time: "صبح (8-12)", reason: "بیشتر افراد در این ساعات تمرکز بالایی دارند" },
        { time: "عصر (16-18)", reason: "زمان مناسب برای مرور و تمرین" },
      ];
    }

    const hourCounts: Record<number, number> = {};
    sessions.forEach((session) => {
      if (session.started_at) {
        const hour = new Date(session.started_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const topHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return topHours.map(([hour]) => {
      const h = parseInt(hour);
      const timeRange = `${h}-${h + 2}`;
      return {
        time: timeRange,
        reason: "بیشترین فعالیت شما در این ساعات است",
      };
    });
  };

  const recommendations = analyzeOptimalTimes();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>زمان‌های بهینه مطالعه</CardTitle>
            <CardDescription>بهترین زمان‌ها برای شما</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg"
            >
              <div className="font-semibold text-lg">{rec.time}</div>
              <div className="text-sm text-muted-foreground">{rec.reason}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
