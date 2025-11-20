import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Brain } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "چگونه بهتر یاد می‌گیرید؟",
    options: [
      { value: "visual", label: "با دیدن تصاویر و نمودارها" },
      { value: "auditory", label: "با شنیدن توضیحات" },
      { value: "kinesthetic", label: "با انجام عملی کارها" },
      { value: "reading", label: "با خواندن متن" },
    ],
  },
  {
    id: 2,
    question: "در کلاس ترجیح می‌دهید:",
    options: [
      { value: "visual", label: "معلم از تصاویر استفاده کند" },
      { value: "auditory", label: "معلم توضیح دهد" },
      { value: "kinesthetic", label: "تمرین عملی انجام شود" },
      { value: "reading", label: "جزوه مطالعه کنم" },
    ],
  },
  {
    id: 3,
    question: "وقتی چیز جدیدی یاد می‌گیرید:",
    options: [
      { value: "visual", label: "آن را تصور می‌کنم" },
      { value: "auditory", label: "با خودم تکرار می‌کنم" },
      { value: "kinesthetic", label: "امتحانش می‌کنم" },
      { value: "reading", label: "یادداشت می‌کنم" },
    ],
  },
];

export default function LearningStyleAnalyzer() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const styles = Object.values(answers);
      const styleCounts = styles.reduce((acc, style) => {
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0][0];

      const { error } = await supabase
        .from("study_companion_data")
        .upsert({
          user_id: user.id,
          learning_style: dominantStyle,
          last_analysis_at: new Date().toISOString(),
        });

      if (error) throw error;
      return dominantStyle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-companion"] });
      setShowResults(true);
      toast.success("تحلیل سبک یادگیری کامل شد");
    },
  });

  const styleDescriptions: Record<string, { title: string; description: string }> = {
    visual: {
      title: "یادگیری بصری",
      description: "شما با دیدن تصاویر، نمودارها و ویدیوها بهتر یاد می‌گیرید. از mind map و رنگ‌ها استفاده کنید.",
    },
    auditory: {
      title: "یادگیری شنیداری",
      description: "شما با شنیدن توضیحات و بحث کردن بهتر یاد می‌گیرید. پادکست و توضیحات صوتی مفید هستند.",
    },
    kinesthetic: {
      title: "یادگیری حرکتی",
      description: "شما با انجام عملی و تجربه کردن بهتر یاد می‌گیرید. تمرین‌های عملی انجام دهید.",
    },
    reading: {
      title: "یادگیری خوانشی",
      description: "شما با خواندن و نوشتن بهتر یاد می‌گیرید. یادداشت‌برداری و مطالعه متون مفید است.",
    },
  };

  const canAnalyze = Object.keys(answers).length === questions.length;
  const result = analyzeMutation.data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>تحلیل سبک یادگیری</CardTitle>
            <CardDescription>سبک یادگیری خود را کشف کنید</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showResults ? (
          <>
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="font-semibold">{q.question}</Label>
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                >
                  {q.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={option.value} id={`${q.id}-${option.value}`} />
                      <Label htmlFor={`${q.id}-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={!canAnalyze || analyzeMutation.isPending}
              className="w-full"
            >
              تحلیل سبک یادگیری
            </Button>
          </>
        ) : result ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{styleDescriptions[result].title}</h3>
              <p className="text-sm text-muted-foreground">{styleDescriptions[result].description}</p>
            </div>
            <Button variant="outline" onClick={() => setShowResults(false)} className="w-full">
              تحلیل مجدد
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
