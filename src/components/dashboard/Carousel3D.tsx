import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Carousel3DProps {
  items: {
    key: string;
    label: string;
    icon: ReactNode;
    color: string;
    content: ReactNode;
  }[];
}

const Carousel3D = ({ items }: Carousel3DProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const rotateY = useTransform(x, [-100, 100], [15, -15]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (info.offset.x < -threshold && activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
    animate(x, 0, { duration: 0.3 });
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < items.length) {
      setActiveIndex(index);
    }
  };

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const isActive = diff === 0;
    
    return {
      transform: `
        translateX(${diff * 90}%) 
        translateZ(${isActive ? 0 : -150}px) 
        rotateY(${diff * -25}deg)
        scale(${isActive ? 1 : 0.75})
      `,
      zIndex: items.length - Math.abs(diff),
      opacity: Math.abs(diff) > 1 ? 0 : 1 - Math.abs(diff) * 0.3,
    };
  };

  return (
    <div className="w-full space-y-4">
      {/* 3D Cards Container */}
      <div 
        ref={containerRef}
        className="relative h-[120px] perspective-1000"
        style={{ perspective: "1000px" }}
      >
        <motion.div 
          className="relative w-full h-full flex items-center justify-center"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.key}
              onClick={() => goTo(index)}
              className={`absolute w-[200px] sm:w-[240px] cursor-pointer transition-all duration-500 ease-out`}
              style={{
                ...getCardStyle(index),
                transformStyle: "preserve-3d",
              }}
            >
              <div 
                className={`
                  ${item.color} 
                  p-4 rounded-2xl shadow-lg 
                  ${index === activeIndex ? 'shadow-glow ring-2 ring-white/20' : ''}
                  transition-shadow duration-300
                `}
              >
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Arrows */}
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-background/80 border border-border/40 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === items.length - 1}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-background/80 border border-border/40 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === activeIndex 
                ? 'w-6 bg-primary' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}
            `}
          />
        ))}
      </div>

      {/* Active Content */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {items[activeIndex].content}
      </motion.div>
    </div>
  );
};

export default Carousel3D;
