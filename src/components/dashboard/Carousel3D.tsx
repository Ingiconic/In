import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";

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

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 30;
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
        translateX(${diff * 70}%) 
        translateZ(${isActive ? 0 : -100}px) 
        rotateY(${diff * -20}deg)
        scale(${isActive ? 1 : 0.7})
      `,
      zIndex: items.length - Math.abs(diff),
      opacity: Math.abs(diff) > 1 ? 0 : 1 - Math.abs(diff) * 0.4,
    };
  };

  return (
    <div className="w-full space-y-4">
      {/* 3D Cards Container - No buttons, touch/mouse only */}
      <div 
        ref={containerRef}
        className="relative h-[100px] perspective-1000 touch-pan-x"
        style={{ perspective: "800px" }}
      >
        <motion.div 
          className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.key}
              onClick={() => goTo(index)}
              className={`absolute w-[140px] sm:w-[160px] cursor-pointer transition-all duration-400 ease-out`}
              style={{
                ...getCardStyle(index),
                transformStyle: "preserve-3d",
              }}
            >
              <div 
                className={`
                  ${item.color} 
                  p-3 rounded-full shadow-lg 
                  ${index === activeIndex ? 'shadow-glow ring-2 ring-white/30 scale-105' : ''}
                  transition-all duration-300
                `}
              >
                <div className="flex items-center gap-2 text-white justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-bold text-xs">{item.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
      >
        {items[activeIndex].content}
      </motion.div>
    </div>
  );
};

export default Carousel3D;
