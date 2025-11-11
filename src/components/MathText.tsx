import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  content: string;
  className?: string;
}

const MathText = ({ content, className = "" }: MathTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Process text to find and render math expressions
    const processedContent = content
      // Match inline math: $...$
      .replace(/\$([^\$]+)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false,
          });
        } catch {
          return match;
        }
      })
      // Match display math: $$...$$
      .replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: true,
          });
        } catch {
          return match;
        }
      })
      // Match LaTeX environments: \[...\] or \(...\)
      .replace(/\\\[([^\]]+)\\\]/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: true,
          });
        } catch {
          return match;
        }
      })
      .replace(/\\\(([^\)]+)\\\)/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false,
          });
        } catch {
          return match;
        }
      });

    containerRef.current.innerHTML = processedContent;
  }, [content]);

  return <div ref={containerRef} className={`whitespace-pre-wrap ${className}`} />;
};

export default MathText;
