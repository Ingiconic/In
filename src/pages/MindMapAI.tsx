import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Brain, Sparkles, Loader2 } from "lucide-react";
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showResult, setShowResult] = useState(false);

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

      // Convert AI response to ReactFlow format
      const flowNodes: Node[] = data.nodes.map((node: any) => ({
        id: node.id,
        type: 'default',
        position: node.position,
        data: { label: node.label },
        style: {
          background: 'hsl(var(--primary))',
          color: 'white',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '8px',
          padding: '10px',
          fontWeight: 'bold',
        },
      }));

      const flowEdges: Edge[] = data.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      }));

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
              <h1 className="text-2xl font-bold">نقشه ذهنی با AI</h1>
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
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
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
