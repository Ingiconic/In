import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

interface ResourceSelectorProps {
  onResourceSelect: (resource: Resource) => void;
  selectedResource?: Resource | null;
}

export default function ResourceSelector({ onResourceSelect, selectedResource }: ResourceSelectorProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open]);

  const handleSelect = (resource: Resource) => {
    onResourceSelect(resource);
    setOpen(false);
    toast({
      title: "منبع انتخاب شد",
      description: resource.title,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="استفاده از منبع">
          <FileText className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>انتخاب منبع</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {resources.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  هیچ منبعی یافت نشد. ابتدا منابع خود را آپلود کنید.
                </p>
              ) : (
                resources.map((resource) => (
                  <Card
                    key={resource.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedResource?.id === resource.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleSelect(resource)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-bold text-base mb-1">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{resource.file_type?.split("/")[1]?.toUpperCase()}</span>
                          <span>•</span>
                          <span>{new Date(resource.created_at).toLocaleDateString("fa-IR")}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
