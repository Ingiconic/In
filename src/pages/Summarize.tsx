import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Sparkles, FileText, Loader2, Image, Mic, MicOff } from "lucide-react";
import ResourceSelector from "@/components/ResourceSelector";
import { usePageView } from "@/hooks/usePageView";
import { logger } from "@/lib/logger";
import AppLayout from "@/components/layout/AppLayout";

const Summarize = () => {
  const { toast } = useToast();
  usePageView();
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"summarize" | "explain">("summarize");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "ضبط صدا", description: "صدای شما در حال ضبط است..." });
    } catch (error) {
      toast({ title: "خطا", description: "دسترسی به میکروفون ممکن نیست", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        setContent(data.text);
        toast({ title: "موفق", description: "متن از صدا استخراج شد" });
      };
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim() && !imageFile && !selectedResource) {
      toast({ title: "خطا", description: "لطفا محتوا را وارد کنید یا منبعی انتخاب کنید", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      let finalContent = content;
      
      if (selectedResource) {
        finalContent = `بر اساس منبع "${selectedResource.title}"، ${content || "خلاصه‌ای کامل بده"}`;
      }

      if (imageFile) {
        const { data, error } = await supabase.functions.invoke('ai-image-analysis', {
          body: { image: imagePreview, prompt: 'لطفا این تصویر را خلاصه کن و توضیح بده.' }
        });
        if (error) throw error;
        setResult(data.result);
      } else {
        const { data, error } = await supabase.functions.invoke("ai-summarize", {
          body: { content: finalContent, type },
        });
        if (error) throw error;
        setResult(data.summary);
      }
      
      toast({ title: "موفق", description: "خلاصه‌سازی انجام شد" });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message || "خطا در خلاصه‌سازی", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">خلاصه‌سازی با AI (2 سکه)</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              متن، تصویر، صدا یا منبع خود را انتخاب کنید
            </p>
            {selectedResource && (
              <Card className="mt-3 p-2 bg-primary/5 border-primary/20">
                <p className="text-xs"><span className="font-bold">منبع:</span> {selectedResource.title}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Type Selection */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={type === "summarize" ? "default" : "outline"}
            onClick={() => setType("summarize")}
            className={type === "summarize" ? "gradient-primary" : ""}
          >
            خلاصه‌سازی
          </Button>
          <Button
            variant={type === "explain" ? "default" : "outline"}
            onClick={() => setType("explain")}
            className={type === "explain" ? "gradient-primary" : ""}
          >
            توضیح کامل
          </Button>
        </div>

        {/* Upload Options */}
        <Card className="p-4 mb-4 glassmorphism-card border-primary/10">
          <div className="flex gap-2 mb-4">
            <ResourceSelector
              onResourceSelect={setSelectedResource}
              selectedResource={selectedResource}
            />
            <label htmlFor="image-upload" className="flex-1">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Image className="w-5 h-5 ml-2" />
                  آپلود تصویر
                </span>
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            <Button
              variant="outline"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "bg-destructive/10" : ""}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>

          {imagePreview && (
            <div className="mb-4">
              <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg mx-auto" />
            </div>
          )}

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="متن خود را اینجا وارد کنید..."
            className="min-h-[200px]"
            dir="rtl"
          />
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSummarize}
          disabled={loading || (!content.trim() && !imageFile && !selectedResource)}
          className="w-full gradient-primary shadow-glow mb-4"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              در حال پردازش...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 ml-2" />
              خلاصه‌سازی
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <Card className="p-6 glassmorphism-card border-primary/10">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              نتیجه
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Summarize;
