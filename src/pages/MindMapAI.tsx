import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Brain, Sparkles, Loader2, Download, Save, FolderOpen } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";
import ResourceSelector from "@/components/ResourceSelector";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from 'html-to-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Resource {
  id: string;
  title: string;
  file_url?: string;
  created_at: string;
}

const MindMapAI = () => {
  const { toast } = useToast();
  const { handleCoinError } = useCoinError();
  usePageView();
  const [topic, setTopic] = useState("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [showResult, setShowResult] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [userCoins, setUserCoins] = useState<number>(0);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const coins = await getUserCoins();
    setUserCoins(coins);
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedResource) {
      toast({
        title: "خطا",
        description: "لطفا موضوع را وارد کنید یا منبعی را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    if (userCoins < COIN_COSTS.MINDMAP_GENERATE) {
      toast({
        title: "سکه کافی نیست",
        description: `برای این عملیات به ${COIN_COSTS.MINDMAP_GENERATE} سکه نیاز دارید.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowResult(false);

    try {
      let finalTopic = topic;
      
      // If resource is selected, add context
      if (selectedResource) {
        finalTopic = `بر اساس منبع "${selectedResource.title}"، ${topic || "یک نقشه ذهنی کامل بساز"}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-mindmap-generator-v2', {
        body: { 
          topic: finalTopic,
          detailLevel: 'detailed'
        }
      });

      if (error) throw error;

      // رنگ‌های متنوع برای سطوح مختلف
      const levelColors = [
        { bg: '#FF6B6B', border: '#C92A2A' }, // قرمز - سطح 0 (مرکزی)
        { bg: '#4ECDC4', border: '#0B8C85' }, // فیروزه‌ای - سطح 1
        { bg: '#FFD93D', border: '#F08C00' }, // زرد - سطح 2
        { bg: '#95E1D3', border: '#38B2AC' }, // سبز آبی - سطح 3
      ];

      // Convert AI response to ReactFlow format
      const flowNodes: Node[] = data.nodes.map((node: any) => {
        const level = node.level || 0;
        const colors = levelColors[level] || levelColors[0];
        
        // تعیین شکل بر اساس سطح
        let borderRadius = '8px';
        let width = 'auto';
        let minWidth = '120px';
        let padding = '12px 16px';
        
        if (level === 0) {
          borderRadius = '50%';
          width = '180px';
          minWidth = '180px';
          padding = '40px 20px';
        } else if (level === 1) {
          borderRadius = '16px';
          minWidth = '140px';
          padding = '14px 18px';
        } else if (level === 2) {
          borderRadius = '50%';
          width = '120px';
          minWidth = '120px';
          padding = '30px 15px';
        } else {
          borderRadius = '20px';
          minWidth = '100px';
          padding = '10px 14px';
        }

        return {
          id: node.id,
          type: 'default',
          position: node.position,
          data: { label: node.label },
          draggable: false,
          connectable: false,
          style: {
            background: colors.bg,
            color: 'white',
            border: `3px solid ${colors.border}`,
            borderRadius,
            padding,
            fontWeight: level === 0 ? 'bold' : level === 1 ? '600' : 'normal',
            fontSize: level === 0 ? '18px' : level === 1 ? '15px' : '13px',
            textAlign: 'center',
            width,
            minWidth,
            boxShadow: `0 4px 12px ${colors.border}40`,
          },
        };
      });

      const flowEdges: Edge[] = data.edges.map((edge: any, index: number) => {
        const edgeColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];
        const color = edgeColors[index % edgeColors.length];
        
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: true,
          style: { 
            stroke: color, 
            strokeWidth: 3,
          },
          labelStyle: {
            fill: color,
            fontWeight: 600,
            fontSize: 12,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setShowResult(true);

      toast({
        title: "موفق",
        description: "نقشه ذهنی با موفقیت ساخته شد",
      });
    } catch (error: any) {
      if (!handleCoinError(error, COIN_COSTS.MINDMAP_GENERATE)) {
        toast({
          title: "خطا",
          description: error.message || "خطا در ساخت نقشه ذهنی",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedMaps();
  }, []);

  const loadSavedMaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedMaps(data || []);
    } catch (error) {
      console.error('Error loading saved maps:', error);
    }
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      toast({
        title: "خطا",
        description: "لطفا عنوان نقشه ذهنی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('لطفا ابتدا وارد شوید');

      const { error } = await supabase.from('mind_maps').insert({
        user_id: user.id,
        title: saveTitle,
        nodes: nodes as any,
        edges: edges as any,
      } as any);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "نقشه ذهنی با موفقیت ذخیره شد",
      });

      setSaveTitle("");
      setShowSaveDialog(false);
      loadSavedMaps();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره نقشه ذهنی",
        variant: "destructive",
      });
    }
  };

  const handleLoad = (map: any) => {
    const levelColors = [
      { bg: '#FF6B6B', border: '#C92A2A' },
      { bg: '#4ECDC4', border: '#0B8C85' },
      { bg: '#FFD93D', border: '#F08C00' },
      { bg: '#95E1D3', border: '#38B2AC' },
    ];

    const flowNodes: Node[] = map.nodes.map((node: any) => {
      const level = node.level || 0;
      const colors = levelColors[level] || levelColors[0];
      
      let borderRadius = '8px';
      let width = 'auto';
      let minWidth = '120px';
      let padding = '12px 16px';
      
      if (level === 0) {
        borderRadius = '50%';
        width = '180px';
        minWidth = '180px';
        padding = '40px 20px';
      } else if (level === 1) {
        borderRadius = '16px';
        minWidth = '140px';
        padding = '14px 18px';
      } else if (level === 2) {
        borderRadius = '50%';
        width = '120px';
        minWidth = '120px';
        padding = '30px 15px';
      } else {
        borderRadius = '20px';
        minWidth = '100px';
        padding = '10px 14px';
      }

      return {
        id: node.id,
        type: 'default',
        position: node.position,
        data: { label: node.data?.label || node.label },
        draggable: false,
        connectable: false,
        style: {
          background: colors.bg,
          color: 'white',
          border: `3px solid ${colors.border}`,
          borderRadius,
          padding,
          fontWeight: level === 0 ? 'bold' : level === 1 ? '600' : 'normal',
          fontSize: level === 0 ? '18px' : level === 1 ? '15px' : '13px',
          textAlign: 'center',
          width,
          minWidth,
          boxShadow: `0 4px 12px ${colors.border}40`,
        },
      };
    });

    const flowEdges: Edge[] = map.edges.map((edge: any, index: number) => {
      const edgeColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];
      const color = edgeColors[index % edgeColors.length];
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: true,
        style: { 
          stroke: color, 
          strokeWidth: 3,
        },
        labelStyle: {
          fill: color,
          fontWeight: 600,
          fontSize: 12,
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
    setShowResult(true);
    setShowLoadDialog(false);
    setTopic(map.title);

    toast({
      title: "موفق",
      description: "نقشه ذهنی با موفقیت بارگذاری شد",
    });
  };

  const handleDownload = async () => {
    if (!flowRef.current) return;

    try {
      // محاسبه ابعاد کل نقشه ذهنی
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodes.forEach((node) => {
        const width = parseInt(node.style?.width as string || '120');
        const height = 100; // ارتفاع تقریبی
        
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
      });

      const padding = 100;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      const dataUrl = await toPng(flowRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
        }
      });

      const link = document.createElement('a');
      link.download = `${topic || 'نقشه-ذهنی'}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "موفق",
        description: "نقشه ذهنی با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دانلود نقشه ذهنی",
        variant: "destructive",
      });
    }
  };

  const handleRefine = async () => {
    if (!refinementText.trim()) {
      toast({
        title: "خطا",
        description: "لطفا متن اصلاح را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mindmap-generator-v2', {
        body: { 
          topic: `${topic}\n\nاصلاحات: ${refinementText}`,
          detailLevel: 'detailed'
        }
      });

      if (error) throw error;

      // رنگ‌های متنوع برای سطوح مختلف
      const levelColors = [
        { bg: '#FF6B6B', border: '#C92A2A' },
        { bg: '#4ECDC4', border: '#0B8C85' },
        { bg: '#FFD93D', border: '#F08C00' },
        { bg: '#95E1D3', border: '#38B2AC' },
      ];

      const flowNodes: Node[] = data.nodes.map((node: any) => {
        const level = node.level || 0;
        const colors = levelColors[level] || levelColors[0];
        
        let borderRadius = '8px';
        let width = 'auto';
        let minWidth = '120px';
        let padding = '12px 16px';
        
        if (level === 0) {
          borderRadius = '50%';
          width = '180px';
          minWidth = '180px';
          padding = '40px 20px';
        } else if (level === 1) {
          borderRadius = '16px';
          minWidth = '140px';
          padding = '14px 18px';
        } else if (level === 2) {
          borderRadius = '50%';
          width = '120px';
          minWidth = '120px';
          padding = '30px 15px';
        } else {
          borderRadius = '20px';
          minWidth = '100px';
          padding = '10px 14px';
        }

        return {
          id: node.id,
          type: 'default',
          position: node.position,
          data: { label: node.label },
          draggable: false,
          connectable: false,
          style: {
            background: colors.bg,
            color: 'white',
            border: `3px solid ${colors.border}`,
            borderRadius,
            padding,
            fontWeight: level === 0 ? 'bold' : level === 1 ? '600' : 'normal',
            fontSize: level === 0 ? '18px' : level === 1 ? '15px' : '13px',
            textAlign: 'center',
            width,
            minWidth,
            boxShadow: `0 4px 12px ${colors.border}40`,
          },
        };
      });

      const flowEdges: Edge[] = data.edges.map((edge: any, index: number) => {
        const edgeColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];
        const color = edgeColors[index % edgeColors.length];
        
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: true,
          style: { 
            stroke: color, 
            strokeWidth: 3,
          },
          labelStyle: {
            fill: color,
            fontWeight: 600,
            fontSize: 12,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setRefinementText("");

      toast({
        title: "موفق",
        description: "نقشه ذهنی با موفقیت اصلاح شد",
      });
    } catch (error: any) {
      if (!handleCoinError(error, COIN_COSTS.MINDMAP_GENERATE)) {
        toast({
          title: "خطا",
          description: error.message || "خطا در اصلاح نقشه ذهنی",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="gradient-primary p-2.5 rounded-xl shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                نقشه ذهنی با AI
                <span className="text-sm font-normal text-primary flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  10 سکه
                </span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              موضوع یا منبع خود را وارد کنید تا AI نقشه ذهنی بسازد
            </p>
          </div>
        </div>

        {!showResult ? (
          <>
            {/* Input Card */}
            <Card className="p-6 mb-4 glassmorphism-card border-primary/10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">موضوع نقشه ذهنی</label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثلا: جنگ جهانی دوم، فتوسنتز، معادلات درجه دوم..."
                    className="min-h-[120px]"
                    dir="rtl"
                  />
                </div>

                {selectedResource && (
                  <Card className="p-3 bg-primary/5 border-primary/20">
                    <p className="text-sm">
                      <span className="font-bold">منبع انتخاب شده:</span> {selectedResource.title}
                    </p>
                  </Card>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <ResourceSelector
                onResourceSelect={setSelectedResource}
                selectedResource={selectedResource}
              />
              <Button
                onClick={handleGenerate}
                disabled={loading || (!topic.trim() && !selectedResource)}
                className="flex-1 gradient-primary shadow-glow"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    در حال ساخت...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    ساخت نقشه ذهنی
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Save className="w-4 h-4" />
                    ذخیره نقشه
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ذخیره نقشه ذهنی</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="عنوان نقشه ذهنی را وارد کنید..."
                      className="text-right"
                    />
                    <Button onClick={handleSave} className="w-full gradient-primary">
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FolderOpen className="w-4 h-4" />
                    بارگذاری نقشه
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>نقشه‌های ذهنی ذخیره شده</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-4">
                    {savedMaps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        هیچ نقشه ذهنی ذخیره شده‌ای وجود ندارد
                      </p>
                    ) : (
                      savedMaps.map((map) => (
                        <Card
                          key={map.id}
                          className="p-4 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleLoad(map)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{map.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(map.created_at).toLocaleDateString('fa-IR')}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              بارگذاری
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                دانلود PNG
              </Button>

              <Button
                onClick={() => {
                  setShowResult(false);
                  setNodes([]);
                  setEdges([]);
                  setTopic("");
                  setSelectedResource(null);
                }}
                variant="outline"
                className="gap-2"
              >
                ساخت نقشه جدید
              </Button>
            </div>

            {/* Result */}
            <Card className="flex-1 overflow-hidden min-h-[700px]">
              <div ref={flowRef} className="h-full w-full min-h-[700px]">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  fitViewOptions={{ 
                    padding: 0.15,
                    includeHiddenNodes: true,
                    minZoom: 0.1,
                    maxZoom: 1.5
                  }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  zoomOnScroll={true}
                  panOnScroll={false}
                  panOnDrag={true}
                  minZoom={0.1}
                  maxZoom={2}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                >
                  <Background />
                  <Controls 
                    showZoom={true}
                    showFitView={true}
                    showInteractive={false}
                  />
                </ReactFlow>
              </div>
            </Card>

            {/* Refinement Section */}
            <Card className="p-4 mt-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  اصلاح نقشه ذهنی
                </h3>
                <Textarea
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="چه تغییری می‌خواهید؟ مثلاً: جزئیات بیشتر درباره ... اضافه کن، یا موضوع ... را حذف کن"
                  className="min-h-[80px] resize-none"
                  
                />
                <Button
                  onClick={handleRefine}
                  disabled={loading || !refinementText.trim()}
                  className="w-full gradient-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال اصلاح...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      اصلاح نقشه ذهنی
                      <span className="mr-2 text-xs opacity-80">({COIN_COSTS.MINDMAP_GENERATE} سکه)</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MindMapAI;
