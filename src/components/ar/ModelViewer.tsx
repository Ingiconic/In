import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ModelViewerProps {
  model: any;
  onClose: () => void;
}

function Scene({ modelData }: { modelData: any }) {
  if (modelData.type === "cube") {
    return (
      <Box args={[2, 2, 2]}>
        <meshStandardMaterial color="orange" />
      </Box>
    );
  }

  if (modelData.type === "triangle") {
    return (
      <group>
        <mesh position={[0, -1, 0]}>
          <coneGeometry args={[2, 3, 3]} />
          <meshStandardMaterial color="cyan" wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <Sphere args={[1.5, 32, 32]}>
      <meshStandardMaterial color="purple" />
    </Sphere>
  );
}

export default function ModelViewer({ model, onClose }: ModelViewerProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{model.title_fa}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Scene modelData={model.model_data} />
            <OrbitControls enableZoom={true} enablePan={false} />
            <gridHelper args={[10, 10]} />
          </Canvas>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{model.description}</p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">راهنما:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• برای چرخش: کلیک کرده و بکشید</li>
              <li>• برای زوم: اسکرول کنید</li>
              <li>• برای بازگشت: دکمه بستن</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
