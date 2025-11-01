import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { ArrowRight, MessageSquare, Edit2, Trash2, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { messageSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { usePageView } from "@/hooks/usePageView";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_edited: boolean;
  profiles?: {
    full_name: string;
    username: string;
  };
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicGroupId, setPublicGroupId] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPublicGroup();
  }, []);

  useEffect(() => {
    if (publicGroupId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [publicGroupId]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const loadPublicGroup = async () => {
    const { data } = await supabase
      .from("groups")
      .select("id")
      .eq("name", "چت عمومی ایزی درس")
      .single();

    if (data) {
      setPublicGroupId(data.id);
    }
  };

  const loadMessages = async () => {
    if (!publicGroupId) return;

    const { data } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", publicGroupId)
      .order("created_at", { ascending: true });

    if (data) {
      // Manually fetch profile data for each message
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", msg.user_id)
            .single();
          
          return {
            ...msg,
            profiles: profileData || { full_name: "کاربر", username: "user" }
          };
        })
      );
      setMessages(messagesWithProfiles);
    }
  };

  const subscribeToMessages = () => {
    if (!publicGroupId) return;

    const channel = supabase.channel('public-group-messages');
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${publicGroupId}`
      },
      () => loadMessages()
    );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !publicGroupId) return;

    try {
      const validatedMessage = messageSchema.parse({ content: messageInput });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if message starts with ! for AI
      if (messageInput.trim().startsWith("!")) {
        const prompt = messageInput.trim().substring(1).trim();
        if (!prompt) {
          toast({
            title: "خطا",
            description: "لطفاً بعد از ! متنی وارد کنید",
            variant: "destructive",
          });
          return;
        }

        // Send user message first
        await supabase.from("group_messages").insert({
          group_id: publicGroupId,
          user_id: user.id,
          content: messageInput,
        });

        setMessageInput("");
        setIsAiProcessing(true);

        // Call AI function
        const { error: aiError } = await supabase.functions.invoke("ai-group-chat", {
          body: {
            prompt,
            groupId: publicGroupId,
            userId: user.id,
          },
        });

        setIsAiProcessing(false);

        if (aiError) {
          console.error("AI error:", aiError);
          toast({
            title: "خطا",
            description: "خطا در پردازش درخواست هوش مصنوعی",
            variant: "destructive",
          });
        }
        return;
      }

      if (editingId) {
        await supabase
          .from("group_messages")
          .update({ content: validatedMessage.content, is_edited: true })
          .eq("id", editingId);
        setEditingId(null);
      } else {
        await supabase.from("group_messages").insert({
          group_id: publicGroupId,
          user_id: user.id,
          content: validatedMessage.content,
        });
      }

      setMessageInput("");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await supabase.from("group_messages").delete().eq("id", messageId);
      toast({ title: "موفق", description: "پیام حذف شد" });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setMessageInput(msg.content);
  };

  const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

  return (
    <div className="min-h-screen bg-background">
      <header className="glassmorphism border-b border-border/30 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hover:shadow-glow hover-lift transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-xl shadow-glow animate-pulse-glow">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient animate-neon-pulse">چت عمومی ایزی درس</h1>
                <p className="text-xs text-muted-foreground">برای صحبت با هوش مصنوعی از ! استفاده کنید</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-2 md:p-4 max-w-4xl">
        <Card className="p-4 flex flex-col glassmorphism-card animate-scale-in h-[calc(100vh-180px)]">
          {profile && (
            <Card className="p-3 mb-4 glassmorphism border-primary/30 hover-lift">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 gradient-primary text-white shadow-glow">
                  <div className="w-full h-full flex items-center justify-center font-bold">
                    {profile.full_name?.[0]}
                  </div>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-sm">{profile.full_name}</p>
                  <p className="text-xs text-primary animate-pulse">
                    {profile.points || 0} امتیاز ⭐
                  </p>
                </div>
              </div>
            </Card>
          )}

          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.user_id === profile?.id;
                const isAI = msg.user_id === AI_USER_ID;
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-scale-in`}>
                    <Card className={`p-3 max-w-[70%] hover-lift ${
                      isAI
                        ? "gradient-secondary text-white shadow-neon border-accent/50"
                        : isOwn 
                        ? "gradient-primary text-white shadow-glow" 
                        : "glassmorphism-card"
                    }`}>
                      {!isOwn && !isAI && (
                        <p className="text-xs font-bold mb-1 text-primary">
                          {msg.profiles?.full_name || "کاربر"}
                        </p>
                      )}
                      {isAI && (
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <p className="text-xs font-bold">دستیار هوشمند</p>
                        </div>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      {msg.is_edited && (
                        <p className="text-xs opacity-70 mt-1">✏️ ویرایش شده</p>
                      )}
                      {isOwn && !isAI && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(msg)}
                            className="h-6 px-2 hover:scale-110 transition-transform"
                            title="ویرایش پیام"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(msg.id)}
                            className="h-6 px-2 hover:scale-110 transition-transform"
                            title="حذف پیام"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
              {isAiProcessing && (
                <div className="flex justify-start animate-scale-in">
                  <Card className="p-3 max-w-[70%] gradient-secondary text-white shadow-neon border-accent/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <p className="text-sm">در حال پردازش...</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={editingId ? "✏️ ویرایش پیام..." : "💬 پیام خود را بنویسید... (! برای AI)"}
              className="flex-1 glassmorphism"
              dir="rtl"
            />
            {editingId && (
              <Button variant="outline" className="hover-lift" onClick={() => { setEditingId(null); setMessageInput(""); }}>
                انصراف
              </Button>
            )}
            <Button onClick={sendMessage} className="gradient-primary hover-lift shadow-glow" disabled={isAiProcessing}>
              {editingId ? "✅ ویرایش" : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;