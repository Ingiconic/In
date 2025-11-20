import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Camera, Upload, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";
import { Textarea } from "@/components/ui/textarea";

const WorksheetSolver = () => {
  const { toast } = useToast();
  usePageView();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [solution, setSolution] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا تصویر کاربرگ را آپلود کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSolution("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-image-analysis', {
        body: {
          image: imagePreview,
          prompt: "این یک کاربرگ درسی است. لطفاً تمام سوالات را بخوان و جواب کامل و دقیق هر سوال را به زبان فارسی بنویس. پاسخ‌ها را به صورت مرحله‌به‌مرحله و واضح توضیح بده."
        }
      });

      if (error) throw error;

      setSolution(data.analysis);
      
      toast({
        title: "موفق",
        description: "کاربرگ با موفقیت تحلیل شد",
      });
    } catch (error: any) {
      console.error("Error analyzing worksheet:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در تحلیل کاربرگ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">حل کاربرگ</h1>
          </div>
          <p className="text-muted-foreground">
            از کاربرگت عکس بگیر جوابارو ببین!
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img 
                    src={imagePreview} 
                    alt="Worksheet Preview" 
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImagePreview(null);
                      setSolution("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    حذف تصویر
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">تصویر کاربرگ خود را آپلود کنید</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    انتخاب تصویر
                  </Button>
                </div>
              )}
            </div>

            {imagePreview && (
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    تحلیل کاربرگ
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {solution && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              پاسخ‌های کاربرگ
            </h3>
            <Textarea
              value={solution}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default WorksheetSolver;
