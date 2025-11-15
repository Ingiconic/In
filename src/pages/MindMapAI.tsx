import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Brain, Sparkles, Loader2, Coins } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";
import ResourceSelector from "@/components/ResourceSelector";
import { COIN_COSTS } from "@/lib/coinCosts";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

interface Resource {
  id: string;
  title: string;
  file_url?: string;
  created_at: string;
}

const MindMapAI = () => {
  const { toast } = useToast();
  usePageView();
  const [topic, setTopic] = useState("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [showResult, setShowResult] = useState(false);
  const [refinementText, setRefinementText] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedResource) {
      toast({
        title: "خطا",
        description: "لطفا موضوع را وارد کنید یا منبعی را انتخاب کنید",
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
      toast({
        title: "خطا",
        description: error.message || "خطا در ساخت نقشه ذهنی",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      toast({
        title: "خطا",
        description: error.message || "خطا در اصلاح نقشه ذهنی",
        variant: "destructive",
      });
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
            {/* Result */}
            <Card className="flex-1 overflow-hidden mb-4">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background />
                <Controls />
              </ReactFlow>
            </Card>
            <Button
              onClick={() => {
                setShowResult(false);
                setNodes([]);
                setEdges([]);
                setTopic("");
                setSelectedResource(null);
              }}
              variant="outline"
              className="w-full"
            >
              ساخت نقشه جدید
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MindMapAI;
