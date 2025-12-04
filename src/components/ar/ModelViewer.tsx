import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Cylinder, Cone, Torus, Text } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { useState } from "react";

interface ModelViewerProps {
  model: any;
  onClose: () => void;
}

// Brain Model
function BrainModel() {
  return (
    <group>
      {/* Main brain - two hemispheres */}
      <Sphere args={[1.2, 32, 32]} position={[-0.3, 0, 0]}>
        <meshStandardMaterial color="#f5b7b1" roughness={0.8} />
      </Sphere>
      <Sphere args={[1.2, 32, 32]} position={[0.3, 0, 0]}>
        <meshStandardMaterial color="#f5b7b1" roughness={0.8} />
      </Sphere>
      {/* Cerebellum */}
      <Sphere args={[0.5, 32, 32]} position={[0, -0.8, -0.5]}>
        <meshStandardMaterial color="#e8daef" roughness={0.7} />
      </Sphere>
      {/* Brain stem */}
      <Cylinder args={[0.2, 0.3, 0.8]} position={[0, -1.3, -0.3]} rotation={[0.3, 0, 0]}>
        <meshStandardMaterial color="#d5dbdb" />
      </Cylinder>
    </group>
  );
}

// Heart Model
function HeartModel() {
  return (
    <group>
      {/* Main heart chambers */}
      <Sphere args={[0.8, 32, 32]} position={[-0.3, 0, 0]}>
        <meshStandardMaterial color="#c0392b" />
      </Sphere>
      <Sphere args={[0.8, 32, 32]} position={[0.3, 0, 0]}>
        <meshStandardMaterial color="#e74c3c" />
      </Sphere>
      {/* Aorta */}
      <Cylinder args={[0.15, 0.2, 0.8]} position={[0, 0.9, 0]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color="#922b21" />
      </Cylinder>
      {/* Pulmonary artery */}
      <Cylinder args={[0.12, 0.15, 0.6]} position={[0.3, 0.8, 0.2]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color="#641e16" />
      </Cylinder>
      {/* Bottom tip */}
      <Cone args={[0.5, 0.8]} position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#c0392b" />
      </Cone>
    </group>
  );
}

// Ear Model
function EarModel() {
  return (
    <group>
      {/* Outer ear (pinna) */}
      <Torus args={[0.8, 0.2, 16, 100]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#f5cba7" />
      </Torus>
      {/* Ear canal */}
      <Cylinder args={[0.15, 0.15, 0.8]} position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#d4ac0d" />
      </Cylinder>
      {/* Eardrum */}
      <Sphere args={[0.2, 32, 32]} position={[0, 0, 0.9]}>
        <meshStandardMaterial color="#f7dc6f" />
      </Sphere>
      {/* Cochlea (spiral) */}
      <Torus args={[0.3, 0.1, 8, 50]} position={[0, 0, 1.3]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#e59866" />
      </Torus>
    </group>
  );
}

// Eye Model
function EyeModel() {
  return (
    <group>
      {/* Eyeball */}
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial color="#ecf0f1" />
      </Sphere>
      {/* Iris */}
      <Sphere args={[0.4, 32, 32]} position={[0, 0, 0.85]}>
        <meshStandardMaterial color="#3498db" />
      </Sphere>
      {/* Pupil */}
      <Sphere args={[0.15, 32, 32]} position={[0, 0, 0.95]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Sphere>
      {/* Optic nerve */}
      <Cylinder args={[0.2, 0.15, 0.8]} position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#f5b7b1" />
      </Cylinder>
    </group>
  );
}

// Lung Model
function LungModel() {
  return (
    <group>
      {/* Left lung */}
      <Sphere args={[0.8, 32, 32]} position={[-0.9, 0, 0]} scale={[0.7, 1.2, 0.6]}>
        <meshStandardMaterial color="#f1948a" />
      </Sphere>
      {/* Right lung (slightly larger) */}
      <Sphere args={[0.9, 32, 32]} position={[0.9, 0, 0]} scale={[0.7, 1.2, 0.6]}>
        <meshStandardMaterial color="#f1948a" />
      </Sphere>
      {/* Trachea */}
      <Cylinder args={[0.15, 0.15, 1.2]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#fadbd8" />
      </Cylinder>
      {/* Bronchi */}
      <Cylinder args={[0.1, 0.08, 0.6]} position={[-0.4, 0.3, 0]} rotation={[0, 0, 0.8]}>
        <meshStandardMaterial color="#fadbd8" />
      </Cylinder>
      <Cylinder args={[0.1, 0.08, 0.6]} position={[0.4, 0.3, 0]} rotation={[0, 0, -0.8]}>
        <meshStandardMaterial color="#fadbd8" />
      </Cylinder>
    </group>
  );
}

// Kidney Model
function KidneyModel() {
  return (
    <group>
      <Sphere args={[0.8, 32, 32]} scale={[1, 1.5, 0.6]}>
        <meshStandardMaterial color="#c0392b" />
      </Sphere>
      {/* Ureter */}
      <Cylinder args={[0.08, 0.08, 1]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#e74c3c" />
      </Cylinder>
      {/* Renal artery */}
      <Cylinder args={[0.1, 0.1, 0.5]} position={[-0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#922b21" />
      </Cylinder>
    </group>
  );
}

// Stomach Model
function StomachModel() {
  return (
    <group>
      <Sphere args={[1, 32, 32]} scale={[1.2, 0.8, 0.7]}>
        <meshStandardMaterial color="#f5b7b1" />
      </Sphere>
      {/* Esophagus */}
      <Cylinder args={[0.15, 0.15, 0.8]} position={[-0.8, 0.5, 0]} rotation={[0, 0, 0.5]}>
        <meshStandardMaterial color="#e8daef" />
      </Cylinder>
      {/* Duodenum */}
      <Cylinder args={[0.12, 0.12, 0.6]} position={[0.9, -0.2, 0]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color="#e8daef" />
      </Cylinder>
    </group>
  );
}

// Liver Model
function LiverModel() {
  return (
    <group>
      {/* Main lobe */}
      <Sphere args={[1.2, 32, 32]} scale={[1.5, 0.8, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#943126" />
      </Sphere>
      {/* Left lobe */}
      <Sphere args={[0.6, 32, 32]} position={[-1, 0.2, 0]}>
        <meshStandardMaterial color="#7b241c" />
      </Sphere>
    </group>
  );
}

// Tooth Model
function ToothModel() {
  return (
    <group>
      {/* Crown */}
      <Box args={[0.6, 0.8, 0.5]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#fdfefe" />
      </Box>
      {/* Root */}
      <Cone args={[0.25, 1]} position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#f8f9f9" />
      </Cone>
      {/* Pulp inside */}
      <Cylinder args={[0.1, 0.05, 0.6]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#e74c3c" />
      </Cylinder>
    </group>
  );
}

// Spine Model
function SpineModel() {
  return (
    <group>
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[0, 2 - i * 0.5, 0]}>
          <Cylinder args={[0.3, 0.35, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#f5f5dc" />
          </Cylinder>
          {/* Disc */}
          <Cylinder args={[0.25, 0.25, 0.1]} position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#5dade2" />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

// Neuron Model
function NeuronModel() {
  return (
    <group>
      {/* Cell body (soma) */}
      <Sphere args={[0.5, 32, 32]}>
        <meshStandardMaterial color="#f5b041" />
      </Sphere>
      {/* Nucleus */}
      <Sphere args={[0.2, 32, 32]}>
        <meshStandardMaterial color="#9b59b6" />
      </Sphere>
      {/* Axon */}
      <Cylinder args={[0.08, 0.08, 2.5]} position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#f5b041" />
      </Cylinder>
      {/* Dendrites */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Cylinder 
          key={i}
          args={[0.05, 0.03, 0.8]} 
          position={[-0.5 - Math.random() * 0.3, Math.sin(i) * 0.4, Math.cos(i) * 0.4]} 
          rotation={[Math.random(), Math.random(), Math.PI / 2 + Math.random() * 0.5]}
        >
          <meshStandardMaterial color="#f5b041" />
        </Cylinder>
      ))}
      {/* Axon terminals */}
      {[0, 1, 2].map((i) => (
        <Sphere key={i} args={[0.1]} position={[2.8, (i - 1) * 0.3, 0]}>
          <meshStandardMaterial color="#f5b041" />
        </Sphere>
      ))}
    </group>
  );
}

// DNA Model
function DNAModel() {
  return (
    <group>
      {Array.from({ length: 20 }).map((_, i) => (
        <group key={i}>
          {/* Left strand */}
          <Sphere args={[0.1]} position={[Math.sin(i * 0.5) * 0.5, i * 0.3 - 3, Math.cos(i * 0.5) * 0.5]}>
            <meshStandardMaterial color="#3498db" />
          </Sphere>
          {/* Right strand */}
          <Sphere args={[0.1]} position={[-Math.sin(i * 0.5) * 0.5, i * 0.3 - 3, -Math.cos(i * 0.5) * 0.5]}>
            <meshStandardMaterial color="#e74c3c" />
          </Sphere>
          {/* Base pairs */}
          {i % 2 === 0 && (
            <Cylinder 
              args={[0.03, 0.03, 1]} 
              position={[0, i * 0.3 - 3, 0]}
              rotation={[Math.PI / 2, 0, i * 0.5]}
            >
              <meshStandardMaterial color={i % 4 === 0 ? "#2ecc71" : "#f39c12"} />
            </Cylinder>
          )}
        </group>
      ))}
    </group>
  );
}

// Cell Model
function CellModel() {
  return (
    <group>
      {/* Cell membrane */}
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial color="#a9cce3" transparent opacity={0.5} />
      </Sphere>
      {/* Nucleus */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#5b2c6f" />
      </Sphere>
      {/* Mitochondria */}
      <Cylinder args={[0.15, 0.15, 0.5]} position={[0.7, 0.3, 0.5]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial color="#e74c3c" />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.4]} position={[-0.6, -0.4, 0.6]} rotation={[0, 0, -Math.PI / 3]}>
        <meshStandardMaterial color="#e74c3c" />
      </Cylinder>
      {/* Ribosomes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Sphere 
          key={i} 
          args={[0.05]} 
          position={[
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ]}
        >
          <meshStandardMaterial color="#f39c12" />
        </Sphere>
      ))}
    </group>
  );
}

// Atom Model
function AtomModel() {
  return (
    <group>
      {/* Nucleus */}
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial color="#e74c3c" />
      </Sphere>
      {/* Electron orbits */}
      <Torus args={[1, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#3498db" />
      </Torus>
      <Torus args={[1.3, 0.02, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
        <meshStandardMaterial color="#3498db" />
      </Torus>
      <Torus args={[1.6, 0.02, 16, 100]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#3498db" />
      </Torus>
      {/* Electrons */}
      <Sphere args={[0.1]} position={[1, 0, 0]}>
        <meshStandardMaterial color="#2ecc71" />
      </Sphere>
      <Sphere args={[0.1]} position={[-0.65, 1, 0.5]}>
        <meshStandardMaterial color="#2ecc71" />
      </Sphere>
      <Sphere args={[0.1]} position={[0.8, 0.8, 1]}>
        <meshStandardMaterial color="#2ecc71" />
      </Sphere>
    </group>
  );
}

// Water Molecule Model
function WaterMoleculeModel() {
  return (
    <group>
      {/* Oxygen */}
      <Sphere args={[0.6, 32, 32]}>
        <meshStandardMaterial color="#e74c3c" />
      </Sphere>
      {/* Hydrogen atoms */}
      <Sphere args={[0.35, 32, 32]} position={[-0.8, -0.6, 0]}>
        <meshStandardMaterial color="#ecf0f1" />
      </Sphere>
      <Sphere args={[0.35, 32, 32]} position={[0.8, -0.6, 0]}>
        <meshStandardMaterial color="#ecf0f1" />
      </Sphere>
      {/* Bonds */}
      <Cylinder args={[0.08, 0.08, 0.7]} position={[-0.4, -0.3, 0]} rotation={[0, 0, 0.6]}>
        <meshStandardMaterial color="#bdc3c7" />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.7]} position={[0.4, -0.3, 0]} rotation={[0, 0, -0.6]}>
        <meshStandardMaterial color="#bdc3c7" />
      </Cylinder>
    </group>
  );
}

// Cube (existing)
function CubeModel() {
  return (
    <Box args={[2, 2, 2]}>
      <meshStandardMaterial color="orange" />
    </Box>
  );
}

// Triangle (existing)
function TriangleModel() {
  return (
    <mesh position={[0, -1, 0]}>
      <coneGeometry args={[2, 3, 3]} />
      <meshStandardMaterial color="cyan" wireframe />
    </mesh>
  );
}

// Sphere (default)
function SphereModel() {
  return (
    <Sphere args={[1.5, 32, 32]}>
      <meshStandardMaterial color="purple" />
    </Sphere>
  );
}

// Pyramid
function PyramidModel() {
  return (
    <Cone args={[1.5, 2.5, 4]}>
      <meshStandardMaterial color="#f1c40f" />
    </Cone>
  );
}

// Cylinder
function CylinderModel() {
  return (
    <Cylinder args={[1, 1, 2.5]}>
      <meshStandardMaterial color="#9b59b6" />
    </Cylinder>
  );
}

// Bone Model
function BoneModel() {
  return (
    <group>
      {/* Shaft */}
      <Cylinder args={[0.2, 0.2, 2.5]}>
        <meshStandardMaterial color="#f5f5dc" />
      </Cylinder>
      {/* Epiphysis (ends) */}
      <Sphere args={[0.4, 32, 32]} position={[0, 1.3, 0]}>
        <meshStandardMaterial color="#fff8dc" />
      </Sphere>
      <Sphere args={[0.4, 32, 32]} position={[0, -1.3, 0]}>
        <meshStandardMaterial color="#fff8dc" />
      </Sphere>
    </group>
  );
}

// Muscle Model
function MuscleModel() {
  return (
    <group>
      <Cylinder args={[0.3, 0.6, 2]} position={[0, 0, 0]} scale={[1, 1, 0.6]}>
        <meshStandardMaterial color="#c0392b" />
      </Cylinder>
      {/* Tendons */}
      <Cylinder args={[0.1, 0.15, 0.5]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#f5f5dc" />
      </Cylinder>
      <Cylinder args={[0.1, 0.15, 0.5]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#f5f5dc" />
      </Cylinder>
    </group>
  );
}

// Skin Layers Model
function SkinModel() {
  return (
    <group>
      {/* Epidermis */}
      <Box args={[3, 0.3, 2]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#f5cba7" />
      </Box>
      {/* Dermis */}
      <Box args={[3, 0.6, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#f1948a" />
      </Box>
      {/* Hypodermis */}
      <Box args={[3, 0.8, 2]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#f7dc6f" />
      </Box>
      {/* Hair follicle */}
      <Cylinder args={[0.05, 0.05, 1.5]} position={[0.5, 0.8, 0]}>
        <meshStandardMaterial color="#5d4e37" />
      </Cylinder>
    </group>
  );
}

// Intestine Model
function IntestineModel() {
  return (
    <group>
      {/* Small intestine coils */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Torus 
          key={i}
          args={[0.6 + i * 0.1, 0.15, 16, 100]} 
          position={[0, 1.5 - i * 0.5, 0]}
          rotation={[Math.PI / 2, i * 0.2, 0]}
        >
          <meshStandardMaterial color="#f5b7b1" />
        </Torus>
      ))}
    </group>
  );
}

// Blood Cell Model
function BloodCellModel() {
  return (
    <group>
      {/* Red blood cells */}
      <Torus args={[0.5, 0.2, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#e74c3c" />
      </Torus>
      <Torus args={[0.5, 0.2, 16, 100]} position={[1.2, 0.3, 0.5]} rotation={[Math.PI / 3, 0.2, 0]}>
        <meshStandardMaterial color="#c0392b" />
      </Torus>
      {/* White blood cell */}
      <Sphere args={[0.4, 32, 32]} position={[-1, 0.2, 0]}>
        <meshStandardMaterial color="#ecf0f1" />
      </Sphere>
      {/* Platelets */}
      <Sphere args={[0.15]} position={[0.3, -0.5, 0.3]}>
        <meshStandardMaterial color="#f5b041" />
      </Sphere>
      <Sphere args={[0.12]} position={[-0.5, -0.3, -0.4]}>
        <meshStandardMaterial color="#f5b041" />
      </Sphere>
    </group>
  );
}

function Scene({ modelData }: { modelData: any }) {
  const modelType = modelData?.type || modelData?.modelType || 'sphere';
  
  switch (modelType) {
    case "cube": return <CubeModel />;
    case "triangle": return <TriangleModel />;
    case "pyramid": return <PyramidModel />;
    case "cylinder": return <CylinderModel />;
    case "brain": return <BrainModel />;
    case "heart": return <HeartModel />;
    case "ear": return <EarModel />;
    case "eye": return <EyeModel />;
    case "lung": return <LungModel />;
    case "kidney": return <KidneyModel />;
    case "stomach": return <StomachModel />;
    case "liver": return <LiverModel />;
    case "tooth": return <ToothModel />;
    case "spine": return <SpineModel />;
    case "neuron": return <NeuronModel />;
    case "dna": return <DNAModel />;
    case "cell": return <CellModel />;
    case "atom": return <AtomModel />;
    case "water": return <WaterMoleculeModel />;
    case "bone": return <BoneModel />;
    case "muscle": return <MuscleModel />;
    case "skin": return <SkinModel />;
    case "intestine": return <IntestineModel />;
    case "blood": return <BloodCellModel />;
    default: return <SphereModel />;
  }
}

export default function ModelViewer({ model, onClose }: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{model.title_fa}</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "توقف چرخش" : "شروع چرخش"}
            >
              <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} />
            <Scene modelData={model.model_data} />
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
            <gridHelper args={[10, 10, '#444', '#222']} />
          </Canvas>
        </div>
        
        {/* Description */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{model.description}</p>
        </div>

        {/* Detailed info if available */}
        {model.detailed_info && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-primary">توضیحات کامل:</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {model.detailed_info}
            </p>
          </div>
        )}
        
        {/* Controls guide */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">راهنمای کنترل:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <span className="text-foreground">چرخش:</span> کلیک کرده و بکشید</li>
            <li>• <span className="text-foreground">زوم:</span> اسکرول کنید</li>
            <li>• <span className="text-foreground">چرخش خودکار:</span> دکمه چرخش</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
