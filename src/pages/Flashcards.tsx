import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, RotateCw, CheckCircle, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { usePageView } from "@/hooks/usePageView";
import ResourceSelector from "@/components/ResourceSelector";
import MathText from "@/components/MathText";

interface Deck {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty: string;
  review_count: number;
}

const Flashcards = () => {
  const { toast } = useToast();
  usePageView();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNewDeckDialog, setShowNewDeckDialog] = useState(false);
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("10");

  const [newDeck, setNewDeck] = useState({ title: "", description: "" });
  const [newCard, setNewCard] = useState({
    question: "",
    answer: "",
    difficulty: "medium",
  });

  useEffect(() => {
    loadDecks();
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      loadFlashcards(selectedDeck.id);
    }
  }, [selectedDeck]);

  const loadDecks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setDecks(data);
    }
  };

  const loadFlashcards = async (deckId: string) => {
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true });

    if (data) {
      setFlashcards(data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  };

  const createDeck = async () => {
    if (!newDeck.title.trim()) {
      toast({ title: "خطا", description: "عنوان دسته را وارد کنید", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("flashcard_decks")
      .insert([{ ...newDeck, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "دسته جدید ایجاد شد" });
      setNewDeck({ title: "", description: "" });
      setShowNewDeckDialog(false);
      loadDecks();
      setSelectedDeck(data);
    }
  };

  const generateFlashcardsWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({ title: "خطا", description: "موضوع را وارد کنید", variant: "destructive" });
      return;
    }

    if (!selectedDeck) {
      toast({ title: "خطا", description: "ابتدا یک دسته انتخاب کنید", variant: "destructive" });
      return;
    }

    setGeneratingCards(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-flashcard-generator', {
        body: { 
          topic: aiTopic,
          count: parseInt(aiCount),
          resourceId: selectedResource?.id
        }
      });

      if (error) throw error;

      if (data?.flashcards) {
        // اضافه کردن فلش کارت‌ها به دیتابیس
        const cardsToInsert = data.flashcards.map((card: any) => ({
          deck_id: selectedDeck.id,
          question: card.question,
          answer: card.answer,
          difficulty: 'medium'
        }));

        const { error: insertError } = await supabase
          .from('flashcards')
          .insert(cardsToInsert);

        if (insertError) throw insertError;

        toast({ 
          title: "موفق", 
          description: `${data.flashcards.length} فلش کارت با هوش مصنوعی ساخته شد` 
        });
        
        setAiTopic("");
        setAiCount("10");
        setShowAIGenerateDialog(false);
        loadFlashcards(selectedDeck.id);
      }
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast({ 
        title: "خطا", 
        description: error.message || "خطا در تولید فلش کارت", 
        variant: "destructive" 
      });
    } finally {
      setGeneratingCards(false);
    }
  };

  const createFlashcard = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      toast({ title: "خطا", description: "سوال و جواب را وارد کنید", variant: "destructive" });
      return;
    }

    if (!selectedDeck) return;

    const { error } = await supabase
      .from("flashcards")
      .insert([{ ...newCard, deck_id: selectedDeck.id }]);

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "فلش کارت جدید اضافه شد" });
      setNewCard({ question: "", answer: "", difficulty: "medium" });
      setShowNewCardDialog(false);
      loadFlashcards(selectedDeck.id);
    }
  };

  const deleteDeck = async (deckId: string) => {
    const { error } = await supabase.from("flashcard_decks").delete().eq("id", deckId);

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "دسته حذف شد" });
      loadDecks();
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null);
        setFlashcards([]);
      }
    }
  };

  const deleteFlashcard = async (cardId: string) => {
    const { error } = await supabase.from("flashcards").delete().eq("id", cardId);

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "موفق", description: "کارت حذف شد" });
      if (selectedDeck) loadFlashcards(selectedDeck.id);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const markReviewed = async () => {
    if (!flashcards[currentCardIndex]) return;

    const card = flashcards[currentCardIndex];
    const { error } = await supabase
      .from("flashcards")
      .update({
        review_count: (card.review_count || 0) + 1,
        last_reviewed: new Date().toISOString(),
      })
      .eq("id", card.id);

    if (!error) {
      toast({ title: "✅ مرور شد" });
      nextCard();
    }
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2 rounded-xl shadow-glow">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">فلش کارت‌ها</h2>
                  <p className="text-xs text-muted-foreground">کارت‌های آموزشی از محتوا یا منابع</p>
                </div>
              </div>
              <div className="flex gap-2">
                <ResourceSelector
                  onResourceSelect={setSelectedResource}
                  selectedResource={selectedResource}
                />
                <Dialog open={showNewDeckDialog} onOpenChange={setShowNewDeckDialog}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Plus className="w-4 h-4 ml-1" />
                      دسته جدید
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ایجاد دسته جدید</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>عنوان دسته</Label>
                      <Input
                        value={newDeck.title}
                        onChange={(e) => setNewDeck({ ...newDeck, title: e.target.value })}
                        placeholder="مثلاً: لغات ریاضی"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label>توضیحات</Label>
                      <Textarea
                        value={newDeck.description}
                        onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                        placeholder="توضیحات اختیاری..."
                        dir="rtl"
                        rows={3}
                      />
                    </div>
                    <Button onClick={createDeck} className="w-full gradient-primary">
                      ایجاد دسته
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decks Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 glassmorphism-card">
              <h3 className="font-bold mb-3">دسته‌های من</h3>
              <div className="space-y-2">
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className={`p-3 cursor-pointer hover:shadow-glow transition-all ${
                      selectedDeck?.id === deck.id ? "border-primary shadow-glow" : ""
                    }`}
                    onClick={() => setSelectedDeck(deck)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{deck.title}</p>
                        {deck.description && (
                          <p className="text-xs text-muted-foreground">{deck.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDeck(deck.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {decks.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    دسته‌ای وجود ندارد
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedDeck ? (
              <div className="space-y-4">
                {/* Study Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setStudyMode(!studyMode)}
                      variant={studyMode ? "default" : "outline"}
                      className={studyMode ? "gradient-primary" : ""}
                    >
                      {studyMode ? "حالت مطالعه" : "حالت مدیریت"}
                    </Button>
                    {!studyMode && (
                      <>
                        <Dialog open={showAIGenerateDialog} onOpenChange={setShowAIGenerateDialog}>
                          <DialogTrigger asChild>
                            <Button variant="secondary">
                              <Sparkles className="w-4 h-4 ml-1" />
                              تولید با هوش مصنوعی
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تولید فلش کارت با هوش مصنوعی</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>موضوع</Label>
                                <Input
                                  value={aiTopic}
                                  onChange={(e) => setAiTopic(e.target.value)}
                                  placeholder="مثلاً: لغات انگلیسی سطح مبتدی"
                                  disabled={generatingCards}
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <Label>تعداد فلش کارت</Label>
                                <Select value={aiCount} onValueChange={setAiCount} disabled={generatingCards}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5 عدد</SelectItem>
                                    <SelectItem value="10">10 عدد</SelectItem>
                                    <SelectItem value="15">15 عدد</SelectItem>
                                    <SelectItem value="20">20 عدد</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>منبع (اختیاری)</Label>
                                <ResourceSelector
                                  selectedResource={selectedResource}
                                  onResourceSelect={setSelectedResource}
                                />
                              </div>
                              <Button 
                                onClick={generateFlashcardsWithAI} 
                                className="w-full gradient-primary"
                                disabled={generatingCards}
                              >
                                {generatingCards ? "در حال تولید..." : "تولید فلش کارت"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
                          <DialogTrigger asChild>
                            <Button className="gradient-secondary">
                              <Plus className="w-4 h-4 ml-1" />
                              کارت دستی
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>افزودن کارت جدید</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>سوال</Label>
                              <Textarea
                                value={newCard.question}
                                onChange={(e) =>
                                  setNewCard({ ...newCard, question: e.target.value })
                                }
                                placeholder="سوال را بنویسید..."
                                dir="rtl"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>جواب</Label>
                              <Textarea
                                value={newCard.answer}
                                onChange={(e) =>
                                  setNewCard({ ...newCard, answer: e.target.value })
                                }
                                placeholder="جواب را بنویسید..."
                                dir="rtl"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>سختی</Label>
                              <Select
                                value={newCard.difficulty}
                                onValueChange={(value) =>
                                  setNewCard({ ...newCard, difficulty: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">آسان</SelectItem>
                                  <SelectItem value="medium">متوسط</SelectItem>
                                  <SelectItem value="hard">سخت</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={createFlashcard} className="w-full gradient-primary">
                              افزودن کارت
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {flashcards.length} کارت
                  </p>
                </div>

                {/* Study Mode */}
                {studyMode && flashcards.length > 0 && currentCard && (
                  <div className="space-y-4">
                    <Card
                      className="min-h-[400px] flex items-center justify-center cursor-pointer hover:shadow-glow transition-all perspective-1000"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className={`p-8 text-center transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {!isFlipped ? (
                          <div>
                            <p className="text-sm text-muted-foreground mb-4">سوال</p>
                            <MathText content={currentCard.question} className="text-xl font-bold" />
                            <p className="text-sm text-muted-foreground mt-6">
                              کلیک کنید تا جواب را ببینید
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground mb-4">جواب</p>
                            <MathText content={currentCard.answer} className="text-xl font-bold" />
                            <div className="mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs inline-block">
                              {currentCard.difficulty === "easy" && "آسان"}
                              {currentCard.difficulty === "medium" && "متوسط"}
                              {currentCard.difficulty === "hard" && "سخت"}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    <div className="flex items-center justify-between">
                      <Button onClick={prevCard} variant="outline">
                        قبلی
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={markReviewed} className="gradient-primary">
                          <CheckCircle className="w-4 h-4 ml-1" />
                          مرور شد
                        </Button>
                        <Button onClick={() => setIsFlipped(!isFlipped)} variant="outline">
                          <RotateCw className="w-4 h-4 ml-1" />
                          برگردان
                        </Button>
                      </div>
                      <Button onClick={nextCard} variant="outline">
                        بعدی
                      </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      کارت {currentCardIndex + 1} از {flashcards.length}
                    </p>
                  </div>
                )}

                {/* Management Mode */}
                {!studyMode && (
                  <div className="space-y-2">
                    {flashcards.map((card) => (
                      <Card key={card.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-bold mb-2" dir="rtl">
                              {card.question}
                            </p>
                            <p className="text-sm text-muted-foreground" dir="rtl">
                              {card.answer}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                {card.difficulty === "easy" && "آسان"}
                                {card.difficulty === "medium" && "متوسط"}
                                {card.difficulty === "hard" && "سخت"}
                              </span>
                              {card.review_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {card.review_count} بار مرور شده
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFlashcard(card.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {flashcards.length === 0 && (
                      <Card className="p-8">
                        <p className="text-center text-muted-foreground">
                          هنوز کارتی اضافه نشده است
                        </p>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  یک دسته را انتخاب کنید یا دسته جدید ایجاد کنید
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Flashcards;
