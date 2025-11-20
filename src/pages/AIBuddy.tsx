import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile, Zap, Heart, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";

const personalities = [
  { id: "friendly", name: "دوستانه", icon: Smile, color: "text-blue-500" },
  { id: "energetic", name: "پرانرژی", icon: Zap, color: "text-yellow-500" },
  { id: "caring", name: "مهربان", icon: Heart, color: "text-pink-500" },
  { id: "smart", name: "هوشمند", icon: Brain, color: "text-purple-500" },
];

export default function AIBuddy() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [personality, setPersonality] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
    loadPersonality();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("ai_chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const loadPersonality = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("ai_buddy_personality")
        .eq("id", user.id)
        .single();

      if (data?.ai_buddy_personality) {
        setPersonality(data.ai_buddy_personality);
      }
    } catch (error) {
      console.error("Error loading personality:", error);
    }
  };

  const changePersonality = async (newPersonality: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ ai_buddy_personality: newPersonality })
        .eq("id", user.id);

      setPersonality(newPersonality);
      toast({
        title: "شخصیت AI تغییر کرد!",
        description: `حالا من ${personalities.find(p => p.id === newPersonality)?.name} هستم!`,
      });
    } catch (error) {
      console.error("Error changing personality:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call AI function
      const { data, error } = await supabase.functions.invoke("ai-chat-buddy", {
        body: { message: userMessage, personality },
      });

      if (error) throw error;

      // Save to database
      const { data: savedMessage } = await supabase
        .from("ai_chat_history")
        .insert({
          user_id: user.id,
          message: userMessage,
          response: data.response,
          personality_type: personality,
        })
        .select()
        .single();

      if (savedMessage) {
        setMessages([...messages, savedMessage]);
      }
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
        <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          دوست هوشمند من 🤖
        </h1>

        {/* Personality Selector */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {personalities.map((p) => (
            <Button
              key={p.id}
              variant={personality === p.id ? "default" : "outline"}
              onClick={() => changePersonality(p.id)}
              className="flex items-center gap-2"
            >
              <p.icon className={`w-4 h-4 ${p.color}`} />
              {p.name}
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 overflow-y-auto p-4 mb-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              <p className="text-xl mb-2">👋 سلام! من دوست هوشمند توام!</p>
              <p>هر سوالی داری ازم بپرس یا درباره درسات حرف بزن!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[70%]">
                  {msg.message}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-2 max-w-[70%]">
                  {msg.response}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl px-4 py-2 animate-pulse">
                در حال تایپ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="پیامت رو بنویس..."
            className="resize-none"
            rows={2}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-full aspect-square"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}