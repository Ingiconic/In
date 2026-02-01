import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, Search, ArrowLeft, Sparkles, Copy, Check, 
  Equal, Divide, Percent, RotateCcw, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CalculationHistory {
  expression: string;
  result: string;
  timestamp: Date;
}

const SmartCalculator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const buttons = [
    ["C", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    [".", "0", "±", "="],
  ];

  const scientificButtons = [
    ["sin", "cos", "tan", "√"],
    ["log", "ln", "^", "π"],
    ["(", ")", "!", "e"],
  ];

  const handleButtonClick = (btn: string) => {
    if (btn === "C") {
      setExpression("");
      setResult("");
    } else if (btn === "⌫") {
      setExpression(prev => prev.slice(0, -1));
    } else if (btn === "=") {
      calculateResult();
    } else if (btn === "±") {
      if (expression.startsWith("-")) {
        setExpression(expression.slice(1));
      } else {
        setExpression("-" + expression);
      }
    } else if (btn === "π") {
      setExpression(prev => prev + "3.14159");
    } else if (btn === "e") {
      setExpression(prev => prev + "2.71828");
    } else if (btn === "√") {
      setExpression(prev => "sqrt(" + prev + ")");
    } else if (["sin", "cos", "tan", "log", "ln"].includes(btn)) {
      setExpression(prev => btn + "(" + prev + ")");
    } else if (btn === "!") {
      setExpression(prev => "factorial(" + prev + ")");
    } else {
      const mappedBtn = btn === "÷" ? "/" : btn === "×" ? "*" : btn;
      setExpression(prev => prev + mappedBtn);
    }
  };

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  const calculateResult = () => {
    try {
      let expr = expression
        .replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)")
        .replace(/sin\(([^)]+)\)/g, "Math.sin($1 * Math.PI / 180)")
        .replace(/cos\(([^)]+)\)/g, "Math.cos($1 * Math.PI / 180)")
        .replace(/tan\(([^)]+)\)/g, "Math.tan($1 * Math.PI / 180)")
        .replace(/log\(([^)]+)\)/g, "Math.log10($1)")
        .replace(/ln\(([^)]+)\)/g, "Math.log($1)")
        .replace(/factorial\(([^)]+)\)/g, "(function(n){let r=1;for(let i=2;i<=n;i++)r*=i;return r})($1)")
        .replace(/\^/g, "**");
      
      // eslint-disable-next-line no-eval
      const calculated = eval(expr);
      const resultStr = Number.isInteger(calculated) ? calculated.toString() : calculated.toFixed(6).replace(/\.?0+$/, "");
      
      setResult(resultStr);
      setHistory(prev => [{
        expression: expression,
        result: resultStr,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    } catch {
      setResult("خطا");
    }
  };

  const copyResult = async () => {
    if (result && result !== "خطا") {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadFromHistory = (item: CalculationHistory) => {
    setExpression(item.expression);
    setResult(item.result);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ماشین‌حساب هوشمند</h1>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg hover:bg-muted/50"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border/50 p-6 mb-4 shadow-xl"
        >
          <div className="text-left mb-2">
            <p className="text-muted-foreground text-sm h-6 overflow-hidden">
              {expression || "0"}
            </p>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-foreground">
              {result || "0"}
            </span>
            {result && result !== "خطا" && (
              <button onClick={copyResult} className="p-2 rounded-lg hover:bg-muted/50">
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Scientific Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          {scientificButtons.flat().map((btn) => (
            <button
              key={btn}
              onClick={() => handleButtonClick(btn)}
              className="h-12 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
            >
              {btn}
            </button>
          ))}
        </motion.div>

        {/* Main Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-2"
        >
          {buttons.flat().map((btn, i) => {
            const isOperator = ["÷", "×", "-", "+", "="].includes(btn);
            const isClear = btn === "C";
            
            return (
              <button
                key={i}
                onClick={() => handleButtonClick(btn)}
                className={`h-14 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                  isOperator
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : isClear
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                {btn}
              </button>
            );
          })}
        </motion.div>

        {/* History Panel */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card rounded-2xl border border-border/50 p-4"
          >
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              تاریخچه
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                هنوز محاسبه‌ای انجام نشده
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => loadFromHistory(item)}
                    className="w-full p-2 rounded-lg hover:bg-muted/50 text-right"
                  >
                    <p className="text-sm text-muted-foreground">{item.expression}</p>
                    <p className="font-bold">{item.result}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SmartCalculator;
