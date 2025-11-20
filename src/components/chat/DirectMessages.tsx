import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowRight, Mic, Check, CheckCheck, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { messageSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import OnlineStatus from "./OnlineStatus";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import PinButton from "./PinButton";
import { usePresence } from "@/hooks/usePresence";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  read_at: string | null;
  reactions: any;
  reply_to_id?: string;
  forwarded_from?: string;
  media_type?: string;
  media_url?: string;
  sender: { full_name: string; avatar_url?: string };
  replied_message?: Message;
}

const DirectMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get("user");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { presences, updateTypingStatus } = usePresence(`chat:${selectedUserId}`);

  const otherUserPresence = selectedUserId ? presences[selectedUserId] : null;
  const isOtherUserTyping = otherUserPresence?.is_typing || false;

  useEffect(() => {
    loadCurrentUser();
    if (selectedUserId) {
      loadOtherUser();
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedUserId && currentUserId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedUserId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadOtherUser = async () => {
    if (!selectedUserId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", selectedUserId)
      .single();

    if (data) setOtherUser(data);
  };

  const loadMessages = async () => {
    if (!selectedUserId || !currentUserId) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const messagesWithReplies = await Promise.all(
        data.map(async (msg: any) => {
          if (msg.reply_to_id) {
            const { data: repliedMsg } = await supabase
              .from("direct_messages")
              .select("*, sender:profiles!direct_messages_sender_id_fkey(full_name)")
              .eq("id", msg.reply_to_id)
              .single();
            return { ...msg, replied_message: repliedMsg };
          }
          return msg;
        })
      );
      setMessages(messagesWithReplies as any);

      // Mark as read
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", currentUserId)
        .eq("sender_id", selectedUserId)
        .is("read_at", null);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedUserId || !currentUserId) return;

    try {
      const validatedMessage = messageSchema.parse({ content: message });

      if (editingId) {
        await supabase
          .from("direct_messages")
          .update({ content: validatedMessage.content, is_edited: true })
          .eq("id", editingId);
        setEditingId(null);
      } else {
        await supabase.from("direct_messages").insert({
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          content: validatedMessage.content,
          reply_to_id: replyingTo?.id || null,
        });
      }

      setMessage("");
      setReplyingTo(null);
      loadMessages();
    } catch (error) {
      logger.error("Failed to send direct message", error);
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطا در ارسال پیام",
        variant: "destructive",
      });
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    if (text.length > 0) {
      updateTypingStatus(true);
      setTimeout(() => updateTypingStatus(false), 2000);
    } else {
      updateTypingStatus(false);
    }
  };

  if (!selectedUserId) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
        یک چت را انتخاب کنید
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/messenger")}
              className="md:hidden"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 gradient-primary text-white">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold">
                  {otherUser?.full_name?.[0]}
                </div>
              )}
            </Avatar>
            <div>
              <p className="font-bold">{otherUser?.full_name}</p>
              {selectedUserId && <OnlineStatus userId={selectedUserId} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedUserId && <PinButton chatType="direct" chatId={selectedUserId} />}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const isRead = msg.sender_id === currentUserId && msg.read_at;

            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className="group max-w-[70%]">
                  {msg.replied_message && (
                    <div className="bg-muted/50 p-2 rounded-t-lg border-r-2 border-primary mb-1">
                      <p className="text-xs text-muted-foreground">
                        پاسخ به {msg.replied_message.sender.full_name}
                      </p>
                      <p className="text-xs truncate">{msg.replied_message.content}</p>
                    </div>
                  )}

                  {msg.forwarded_from && (
                    <p className="text-xs text-muted-foreground mb-1">
                      🔁 فوروارد شده
                    </p>
                  )}

                  <Card
                    className={`p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-bold mb-1 opacity-70">
                        {msg.sender.full_name}
                      </p>
                    )}

                    <p className="text-sm break-words">{msg.content}</p>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <span>{new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.is_edited && <span>• ویرایش شده</span>}
                      </div>

                      {isOwn && (
                        <div className="flex items-center">
                          {isRead ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>

                    <MessageReactions
                      messageId={msg.id}
                      messageType="direct"
                      reactions={msg.reactions || []}
                      onReactionsUpdate={loadMessages}
                    />
                  </Card>

                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageActions
                      messageId={msg.id}
                      messageType="direct"
                      isOwn={isOwn}
                      content={msg.content}
                      onReply={() => setReplyingTo(msg)}
                      onEdit={() => {
                        setEditingId(msg.id);
                        setMessage(msg.content);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {isOtherUserTyping && (
            <div className="flex justify-start">
              <Card className="p-3 bg-muted max-w-[70%]">
                <p className="text-sm">در حال نوشتن...</p>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 p-4">
        {replyingTo && (
          <div className="bg-muted/50 p-2 rounded-lg mb-2 flex items-center justify-between">
            <div className="flex-1 truncate">
              <p className="text-xs text-muted-foreground">پاسخ به {replyingTo.sender.full_name}</p>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {editingId && (
          <div className="bg-primary/10 p-2 rounded-lg mb-2 flex items-center justify-between">
            <p className="text-sm">در حال ویرایش پیام...</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setMessage("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            placeholder="پیام خود را بنویسید..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            dir="rtl"
            className="flex-1"
          />
          <Button onClick={sendMessage} className="gradient-primary">
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
