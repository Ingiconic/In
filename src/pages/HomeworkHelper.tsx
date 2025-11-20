import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Camera, Upload, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";
import { Textarea } from "@/components/ui/textarea";

const HomeworkHelper = () => {
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
        description: "لطفاً ابتدا تصویر تکلیف را آپلود کنید",
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
          prompt: "این یک تکلیف درسی است. لطفاً تمام سوالات و تمرین‌ها را بخوان و برای هر کدام راهنمایی کامل و مرحله‌به‌مرحله ارائه بده. پاسخ‌ها را به زبان فارسی و به صورت واضح و آموزشی توضیح بده تا دانش‌آموز یاد بگیرد."
        }
      });

      if (error) throw error;

      setSolution(data.analysis);
      
      toast({
        title: "موفق",
        description: "تکلیف با موفقیت تحلیل شد",
      });
    } catch (error: any) {
      console.error("Error analyzing homework:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در تحلیل تکلیف",
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
            <h1 className="text-3xl font-bold">حل تکالیف</h1>
          </div>
          <p className="text-muted-foreground">
            از تکلیفاتت عکس بگیر راهنمایی کامل دریافت کن!
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img 
                    src={imagePreview} 
                    alt="Homework Preview" 
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
                  <p className="text-muted-foreground">تصویر تکلیف خود را آپلود کنید</p>
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
                    تحلیل تکلیف
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
              راهنمای حل تکلیف
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

export default HomeworkHelper;
