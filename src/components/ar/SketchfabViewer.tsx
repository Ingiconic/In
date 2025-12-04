import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

interface SketchfabViewerProps {
  model: {
    id: string;
    title: string;
    title_fa: string;
    description?: string;
    detailed_info?: string;
    sketchfab_id: string;
  };
  onClose: () => void;
}

export default function SketchfabViewer({ model, onClose }: SketchfabViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const embedUrl = `https://sketchfab.com/models/${model.sketchfab_id}/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_watermark_link=0`;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'w-full max-w-4xl mx-auto'} bg-card/95 backdrop-blur-sm border-border/50`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/30">
        <div className="flex-1">
          <CardTitle className="text-xl font-bold text-foreground">{model.title_fa}</CardTitle>
          <p className="text-sm text-muted-foreground">{model.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`w-full ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[400px] md:h-[500px]'} bg-background/50`}>
          <iframe
            title={model.title}
            src={embedUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
        </div>
        
        {/* Description Panel */}
        <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
          {model.description && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">توضیحات کوتاه</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.description}</p>
            </div>
          )}
          
          {model.detailed_info && (
            <div className="bg-secondary/50 rounded-lg p-4 border border-border/30">
              <h4 className="font-semibold text-foreground mb-2">اطلاعات تکمیلی</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{model.detailed_info}</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
            <p>برای چرخاندن مدل: کلیک چپ و درگ</p>
            <p>برای زوم: اسکرول موس</p>
            <p>برای جابجایی: کلیک راست و درگ</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
