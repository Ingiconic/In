import { useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  content: string;
  className?: string;
}

interface MathSegment {
  type: "text" | "inline-math" | "block-math";
  content: string;
}

const MathText = ({ content, className = "" }: MathTextProps) => {
  const segments = useMemo(() => {
    const result: MathSegment[] = [];
    let remaining = content;
    let lastIndex = 0;

    // Process math expressions using regex patterns
    const patterns = [
      { regex: /\$\$([^\$]+)\$\$/g, type: "block-math" as const },
      { regex: /\$([^\$]+)\$/g, type: "inline-math" as const },
      { regex: /\\\[([^\]]+)\\\]/g, type: "block-math" as const },
      { regex: /\\\(([^\)]+)\\\)/g, type: "inline-math" as const },
    ];

    // Find all math expressions with their positions
    const matches: Array<{ start: number; end: number; type: string; formula: string }> = [];
    
    patterns.forEach(({ regex, type }) => {
      const matches_temp = [...remaining.matchAll(regex)];
      matches_temp.forEach((match) => {
        if (match.index !== undefined) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type,
            formula: match[1],
          });
        }
      });
    });

    // Sort by start position
    matches.sort((a, b) => a.start - b.start);

    // Build segments
    matches.forEach((match) => {
      // Add text before math
      if (lastIndex < match.start) {
        result.push({
          type: "text",
          content: remaining.substring(lastIndex, match.start),
        });
      }
      
      // Add math segment
      result.push({
        type: match.type as "inline-math" | "block-math",
        content: match.formula,
      });
      
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < remaining.length) {
      result.push({
        type: "text",
        content: remaining.substring(lastIndex),
      });
    }

    return result;
  }, [content]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === "inline-math") {
          return <InlineMath key={index} math={segment.content} />;
        } else if (segment.type === "block-math") {
          return <BlockMath key={index} math={segment.content} />;
        } else {
          return <span key={index}>{segment.content}</span>;
        }
      })}
    </div>
  );
};

export default MathText;
