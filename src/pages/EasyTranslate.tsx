import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Languages, ArrowLeftRight, Copy, Volume2, Check, Sparkles,
  ChevronDown, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const languages = [
  { code: "fa", name: "فارسی", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "en", name: "انگلیسی", nativeName: "English", flag: "🇺🇸" },
  { code: "ar", name: "عربی", nativeName: "العربية", flag: "🇸🇦" },
  { code: "tr", name: "ترکی", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "fr", name: "فرانسوی", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "آلمانی", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "اسپانیایی", nativeName: "Español", flag: "🇪🇸" },
  { code: "it", name: "ایتالیایی", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ru", name: "روسی", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "چینی", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "ژاپنی", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "کره‌ای", nativeName: "한국어", flag: "🇰🇷" },
  { code: "hi", name: "هندی", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "پرتغالی", nativeName: "Português", flag: "🇧🇷" },
  { code: "nl", name: "هلندی", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "لهستانی", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "اوکراینی", nativeName: "Українська", flag: "🇺🇦" },
  { code: "sv", name: "سوئدی", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "th", name: "تایلندی", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "ویتنامی", nativeName: "Tiếng Việt", flag: "🇻🇳" },
];

const EasyTranslate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState(languages[0]);
  const [targetLang, setTargetLang] = useState(languages[1]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSourceLangs, setShowSourceLangs] = useState(false);
  const [showTargetLangs, setShowTargetLangs] = useState(false);
  const [copied, setCopied] = useState(false);

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "متنی وارد نشده",
        description: "لطفاً متنی برای ترجمه وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-translate", {
        body: {
          text: sourceText,
          sourceLang: sourceLang.code,
          targetLang: targetLang.code,
          sourceLangName: sourceLang.name,
          targetLangName: targetLang.name,
        },
      });

      if (error) throw error;
      setTranslatedText(data.translation);
    } catch (error: any) {
      console.error("Translation error:", error);
      toast({
        title: "خطا در ترجمه",
        description: "مشکلی پیش آمد، دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "کپی شد!",
      description: "متن ترجمه شده کپی شد",
    });
  };

  const LanguageSelector = ({ 
    selected, 
    onSelect, 
    show, 
    setShow,
    label
  }: { 
    selected: typeof languages[0];
    onSelect: (lang: typeof languages[0]) => void;
    show: boolean;
    setShow: (show: boolean) => void;
    label: string;
  }) => (
    <div className="relative flex-1">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-card border border-border/50 rounded-xl hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selected.flag}</span>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-sm">{selected.name}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelect(lang);
                  setShow(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                  selected.code === lang.code ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="text-right flex-1">
                  <p className="font-medium text-sm">{lang.name}</p>
                  <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                </div>
                {selected.code === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ایزی ترنسلیت</h1>
              <p className="text-[10px] text-muted-foreground">ترجمه هوشمند</p>
            </div>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">قدرت‌گرفته از هوش مصنوعی ایزی درس</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            ترجمه <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">روان و طبیعی</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            به بیش از ۲۰ زبان دنیا، با دقت بالا و حفظ معنی
          </p>
        </motion.div>

        {/* Translator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden"
        >
          {/* Language Selectors */}
          <div className="p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <LanguageSelector
                selected={sourceLang}
                onSelect={setSourceLang}
                show={showSourceLangs}
                setShow={setShowSourceLangs}
                label="از زبان"
              />
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={swapLanguages}
                className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-shadow flex-shrink-0"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </motion.button>
              
              <LanguageSelector
                selected={targetLang}
                onSelect={setTargetLang}
                show={showTargetLangs}
                setShow={setShowTargetLangs}
                label="به زبان"
              />
            </div>
          </div>

          {/* Text Areas */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border/50">
            {/* Source */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">متن اصلی</span>
                <span className="text-xs text-muted-foreground">
                  {sourceText.length} کاراکتر
                </span>
              </div>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="متن خود را اینجا وارد کنید..."
                className="min-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base leading-relaxed p-0"
                dir="auto"
              />
            </div>

            {/* Target */}
            <div className="p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">ترجمه</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!translatedText}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    disabled={!translatedText}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div 
                className="min-h-[200px] text-base leading-relaxed"
                dir="auto"
              >
                {isTranslating ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال ترجمه...</span>
                  </div>
                ) : translatedText ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-pre-wrap"
                  >
                    {translatedText}
                  </motion.p>
                ) : (
                  <p className="text-muted-foreground">
                    ترجمه اینجا نمایش داده می‌شود...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Translate Button */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold text-base rounded-xl shadow-lg"
            >
              {isTranslating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Languages className="w-5 h-5 ml-2" />
                  ترجمه کن
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mt-6"
        >
          {[
            { icon: "⚡", title: "سریع", desc: "ترجمه آنی" },
            { icon: "🎯", title: "دقیق", desc: "با حفظ معنی" },
            { icon: "🌍", title: "+۲۰ زبان", desc: "پشتیبانی گسترده" },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border/50 p-3 text-center"
            >
              <span className="text-2xl">{feature.icon}</span>
              <p className="font-bold text-sm mt-1">{feature.title}</p>
              <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default EasyTranslate;
