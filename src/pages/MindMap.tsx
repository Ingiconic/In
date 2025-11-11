import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, Save, Trash2, FolderOpen } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";

interface MindMap {
  id: string;
  title: string;
  nodes: any;
  edges: any;
  created_at: string;
}

const MindMap = () => {
  const { toast } = useToast();
  usePageView();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [mapTitle, setMapTitle] = useState("");
  const [nodeLabel, setNodeLabel] = useState("");
  const [showNewNodeDialog, setShowNewNodeDialog] = useState(false);
  const [showMapsDialog, setShowMapsDialog] = useState(false);

  useEffect(() => {
    loadMindMaps();
  }, []);

  const loadMindMaps = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("mind_maps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMindMaps(data);
    }
  };

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const addNewNode = () => {
    if (!nodeLabel.trim()) return;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: nodeLabel },
      style: {
        background: "hsl(var(--primary))",
        color: "white",
        border: "2px solid hsl(var(--primary))",
        borderRadius: "8px",
        padding: "10px",
        fontWeight: "bold",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeLabel("");
    setShowNewNodeDialog(false);
    toast({ title: "گره جدید اضافه شد" });
  };

  const saveMindMap = async () => {
    if (!mapTitle.trim()) {
      toast({ title: "خطا", description: "لطفاً عنوان نقشه را وارد کنید", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mapData = {
      user_id: user.id,
      title: mapTitle,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    if (currentMapId) {
      const { error } = await supabase
        .from("mind_maps")
        .update(mapData)
        .eq("id", currentMapId);

      if (error) {
        toast({ title: "خطا", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "موفق", description: "نقشه ذهنی بروزرسانی شد" });
        loadMindMaps();
      }
    } else {
      const { data, error } = await supabase
        .from("mind_maps")
        .insert([mapData])
        .select()
        .single();

      if (error) {
        toast({ title: "خطا", description: error.message, variant: "destructive" });
      } else {
        setCurrentMapId(data.id);
        toast({ title: "موفق", description: "نقشه ذهنی ذخیره شد" });
        loadMindMaps();
      }
    }
  };

  const loadMap = (map: MindMap) => {
    setNodes(map.nodes as Node[]);
    setEdges(map.edges as Edge[]);
    setMapTitle(map.title);
    setCurrentMapId(map.id);
    setShowMapsDialog(false);
    toast({ title: "نقشه بارگذاری شد" });
  };

  const deleteMap = async (mapId: string) => {
    const { error } = await supabase.from("mind_maps").delete().eq("id", mapId);

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "نقشه ذهنی حذف شد" });
      loadMindMaps();
      if (currentMapId === mapId) {
        setNodes([]);
        setEdges([]);
        setMapTitle("");
        setCurrentMapId(null);
      }
    }
  };

  const createNewMap = () => {
    setNodes([]);
    setEdges([]);
    setMapTitle("");
    setCurrentMapId(null);
    toast({ title: "نقشه جدید", description: "یک نقشه ذهنی جدید ایجاد کنید" });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2 rounded-xl shadow-glow">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">نقشه ذهنی</h2>
                  <p className="text-xs text-muted-foreground">مفاهیم را به صورت بصری سازماندهی کنید</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createNewMap} variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  جدید
                </Button>
                <Dialog open={showMapsDialog} onOpenChange={setShowMapsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="w-4 h-4 ml-1" />
                      نقشه‌ها
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>نقشه‌های ذهنی من</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {mindMaps.map((map) => (
                        <Card key={map.id} className="p-3 flex items-center justify-between">
                          <div className="flex-1 cursor-pointer" onClick={() => loadMap(map)}>
                            <p className="font-bold">{map.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(map.created_at).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMap(map.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </Card>
                      ))}
                      {mindMaps.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          هنوز نقشه‌ای ایجاد نکرده‌اید
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="p-3 mb-4">
          <div className="flex items-center gap-2">
            <Input
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              placeholder="عنوان نقشه ذهنی..."
              className="flex-1"
              dir="rtl"
            />
            <Dialog open={showNewNodeDialog} onOpenChange={setShowNewNodeDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 ml-1" />
                  گره جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>افزودن گره جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>عنوان گره</Label>
                    <Input
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewNode()}
                      placeholder="مفهوم را وارد کنید..."
                      dir="rtl"
                    />
                  </div>
                  <Button onClick={addNewNode} className="w-full gradient-primary">
                    افزودن
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={saveMindMap} className="gradient-secondary">
              <Save className="w-4 h-4 ml-1" />
              ذخیره
            </Button>
          </div>
        </Card>

        {/* Mind Map Canvas */}
        <Card className="flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MindMap;
