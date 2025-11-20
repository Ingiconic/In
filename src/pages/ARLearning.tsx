import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Calculator, FlaskConical } from "lucide-react";
import ModelViewer from "@/components/ar/ModelViewer";
import { useState } from "react";

export default function ARLearning() {
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const { data: models } = useQuery({
    queryKey: ["ar-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ar_models")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sample models for demo
  const sampleModels = [
    {
      id: "1",
      title: "Pythagorean Theorem",
      title_fa: "قضیه فیثاغورث",
      description: "تصویر سه‌بعدی مثلث قائم‌الزاویه",
      subject: "ریاضی",
      model_type: "3d_model",
      model_data: { type: "triangle" },
    },
    {
      id: "2",
      title: "Sine Wave",
      title_fa: "موج سینوسی",
      description: "نمایش تابع سینوس در فضای سه‌بعدی",
      subject: "ریاضی",
      model_type: "formula",
      model_data: { formula: "y = sin(x)" },
    },
    {
      id: "3",
      title: "Cube Rotation",
      title_fa: "چرخش مکعب",
      description: "مکعب سه‌بعدی قابل چرخش",
      subject: "هندسه",
      model_type: "3d_model",
      model_data: { type: "cube" },
    },
  ];

  const displayModels = models && models.length > 0 ? models : sampleModels;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
            یادگیری سه‌بعدی
          </h1>
          <p className="text-muted-foreground mt-2">
            تجربه یادگیری تعاملی با مدل‌های سه‌بعدی
          </p>
        </div>

        {selectedModel ? (
          <ModelViewer model={selectedModel} onClose={() => setSelectedModel(null)} />
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">همه</TabsTrigger>
              <TabsTrigger value="math">ریاضی</TabsTrigger>
              <TabsTrigger value="physics">فیزیک</TabsTrigger>
              <TabsTrigger value="chemistry">شیمی</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayModels.map((model) => (
                  <Card
                    key={model.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedModel(model)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{model.title_fa}</CardTitle>
                          <CardDescription>{model.description}</CardDescription>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-orange-500 flex items-center justify-center">
                          {model.model_type === "3d_model" ? (
                            <Box className="w-5 h-5 text-white" />
                          ) : model.model_type === "formula" ? (
                            <Calculator className="w-5 h-5 text-white" />
                          ) : (
                            <FlaskConical className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{model.subject}</Badge>
                        <Badge variant="outline">{model.model_type === "3d_model" ? "مدل 3D" : "فرمول"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
