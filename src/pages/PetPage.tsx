import PetSystem from "@/components/gamification/PetSystem";

export default function PetPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
        حیوان خانگی من
      </h1>
      <PetSystem />
    </div>
  );
}
