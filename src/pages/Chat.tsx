import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Send, Sparkles, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { messageSchema } from "@/lib/validation";
import { aiPromptSchema } from "@/lib/ai-validation";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { usePageView } from "@/hooks/usePageView";
import AppLayout from "@/components/layout/AppLayout";

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
  const { toast } = useToast();
  usePageView();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicGroupId, setPublicGroupId] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadPublicGroup();
    loadProfile();
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
        
        // Validate AI prompt
        const validation = aiPromptSchema.safeParse({ prompt });
        if (!validation.success) {
          toast({
            title: "خطا",
            description: validation.error.errors[0]?.message || "پرامپت نامعتبر است",
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

        // Call AI function (don't send userId, it will be verified from JWT)
        const { error: aiError } = await supabase.functions.invoke("ai-group-chat", {
          body: {
            prompt,
            groupId: publicGroupId,
          },
        });

        setIsAiProcessing(false);

        if (aiError) {
          logger.error("AI group chat request failed", aiError);
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
    } catch (error) {
      logger.error("Failed to send message", error);
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
    } catch (error) {
      logger.error("Failed to delete message", error);
      const message = error instanceof Error ? error.message : "خطا در حذف پیام";
      toast({ title: "خطا", description: message, variant: "destructive" });
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setMessageInput(msg.content);
  };

  const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 max-w-4xl h-full flex flex-col">
        {/* Chat Header */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-xl shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">چت عمومی ایزی درس</h2>
                <p className="text-xs text-muted-foreground">برای صحبت با هوش مصنوعی از ! استفاده کنید</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <Card className="flex-1 glassmorphism-card border-primary/10 flex flex-col overflow-hidden">
          {profile && (
            <div className="p-3 border-b border-border/30 bg-card/50">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 gradient-primary text-white">
                  <div className="w-full h-full flex items-center justify-center font-bold text-sm">
                    {profile.full_name?.[0]}
                  </div>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-sm">{profile.full_name}</p>
                  <p className="text-xs text-primary">
                    {profile.points || 0} امتیاز ⭐
                  </p>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.user_id === profile?.id;
                const isAI = msg.user_id === AI_USER_ID;
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <Card className={`p-3 max-w-[75%] ${
                      isAI
                        ? "gradient-secondary text-white border-accent/30"
                        : isOwn 
                        ? "gradient-primary text-white" 
                        : "glassmorphism-card"
                    }`}>
                      {!isOwn && !isAI && (
                        <p className="text-xs font-bold mb-1 text-primary">
                          {msg.profiles?.full_name || "کاربر"}
                        </p>
                      )}
                      {isAI && (
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4" />
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
                            className="h-6 px-2"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(msg.id)}
                            className="h-6 px-2"
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
                <div className="flex justify-start">
                  <Card className="p-3 gradient-secondary text-white border-accent/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <p className="text-sm">در حال پردازش...</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-border/30 bg-card/50">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={editingId ? "✏️ ویرایش پیام..." : "💬 پیام خود را بنویسید... (! برای AI)"}
                className="flex-1"
                dir="rtl"
                disabled={isAiProcessing}
              />
              {editingId && (
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setEditingId(null); 
                    setMessageInput(""); 
                  }}
                >
                  انصراف
                </Button>
              )}
              <Button 
                onClick={sendMessage} 
                className="gradient-primary shadow-glow" 
                disabled={isAiProcessing}
              >
                {editingId ? "✅" : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Chat;