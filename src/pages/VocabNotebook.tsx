import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Notebook, ArrowLeft, Plus, Trash2, Edit2, Check, X,
  Sparkles, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Vocab {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  learned: boolean;
}

const VocabNotebook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newExample, setNewExample] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadVocabs();
  }, []);

  const loadVocabs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For demo, using local storage
      const saved = localStorage.getItem(`vocabs_${user.id}`);
      if (saved) {
        setVocabs(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveVocabs = (newVocabs: Vocab[]) => {
    setVocabs(newVocabs);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`vocabs_${user.id}`, JSON.stringify(newVocabs));
      }
    });
  };

  const addVocab = () => {
    if (!newWord.trim() || !newMeaning.trim()) {
      toast({ title: "کلمه و معنی را وارد کنید", variant: "destructive" });
      return;
    }

    const newVocab: Vocab = {
      id: Date.now().toString(),
      word: newWord.trim(),
      meaning: newMeaning.trim(),
      example: newExample.trim() || undefined,
      learned: false,
    };

    saveVocabs([newVocab, ...vocabs]);
    setNewWord("");
    setNewMeaning("");
    setNewExample("");
    setShowAdd(false);
    toast({ title: "اضافه شد!" });
  };

  const toggleLearned = (id: string) => {
    const updated = vocabs.map(v => 
      v.id === id ? { ...v, learned: !v.learned } : v
    );
    saveVocabs(updated);
  };

  const deleteVocab = (id: string) => {
    saveVocabs(vocabs.filter(v => v.id !== id));
    toast({ title: "حذف شد" });
  };

  const autoComplete = async () => {
    if (!newWord.trim()) return;
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-answer", {
        body: {
          question: `معنی فارسی کلمه "${newWord}" چیست؟ یک مثال کاربردی هم بده. فقط JSON برگردان:
          {"meaning": "معنی", "example": "مثال انگلیسی"}`,
          subject: "زبان انگلیسی",
        },
      });

      if (error) throw error;

      const jsonMatch = data.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setNewMeaning(parsed.meaning || "");
        setNewExample(parsed.example || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredVocabs = vocabs.filter(v => 
    v.word.toLowerCase().includes(search.toLowerCase()) ||
    v.meaning.includes(search)
  );

  const learnedCount = vocabs.filter(v => v.learned).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center shadow-lg">
              <Notebook className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">دفتر لغات</h1>
          </div>

          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Stats */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-card rounded-xl border border-border/50 p-3 text-center">
            <p className="text-2xl font-bold">{vocabs.length}</p>
            <p className="text-xs text-muted-foreground">کل لغات</p>
          </div>
          <div className="flex-1 bg-green-500/10 rounded-xl border border-green-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{learnedCount}</p>
            <p className="text-xs text-muted-foreground">یاد گرفته</p>
          </div>
          <div className="flex-1 bg-orange-500/10 rounded-xl border border-orange-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{vocabs.length - learnedCount}</p>
            <p className="text-xs text-muted-foreground">باقی‌مانده</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی لغت..."
            className="pr-10"
          />
        </div>

        {/* Add Form */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-4 mb-4"
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="کلمه انگلیسی"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={autoComplete}
                  disabled={aiLoading || !newWord.trim()}
                >
                  <Sparkles className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <Input
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="معنی فارسی"
              />
              <Input
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="مثال (اختیاری)"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">
                  انصراف
                </Button>
                <Button onClick={addVocab} className="flex-1">
                  افزودن
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Vocab List */}
        <div className="space-y-2">
          {filteredVocabs.map((vocab, i) => (
            <motion.div
              key={vocab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`p-4 rounded-xl border transition-colors ${
                vocab.learned 
                  ? "bg-green-500/5 border-green-500/30" 
                  : "bg-card border-border/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{vocab.word}</span>
                    {vocab.learned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500">
                        یاد گرفتم
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{vocab.meaning}</p>
                  {vocab.example && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{vocab.example}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleLearned(vocab.id)}
                  >
                    <Check className={`w-4 h-4 ${vocab.learned ? "text-green-500" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteVocab(vocab.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredVocabs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Notebook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز لغتی اضافه نکردید</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VocabNotebook;
