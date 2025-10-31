import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Edit2, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { messageSchema } from "@/lib/validation";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  sender: { full_name: string };
}

const DirectMessages = () => {
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get("user");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedUserId && currentUserId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedUserId, currentUserId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadMessages = async () => {
    if (!selectedUserId || !currentUserId) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select(`
        id,
        content,
        sender_id,
        created_at,
        is_edited,
        sender:profiles!direct_messages_sender_id_fkey(full_name)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as any);
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
      // Validate message
      const validatedMessage = messageSchema.parse({ content: message });

      if (editingId) {
        const { error } = await supabase
          .from("direct_messages")
          .update({ content: validatedMessage.content, is_edited: true })
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: currentUserId,
          receiver_id: selectedUserId,
          content: validatedMessage.content,
        });

        if (error) throw error;
      }

      setMessage("");
      loadMessages();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("direct_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadMessages();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setMessage(msg.content);
  };

  if (!selectedUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          یک دوست را از لیست انتخاب کنید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 h-[500px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === currentUserId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {msg.sender.full_name}
                </p>
                <p>{msg.content}</p>
                {msg.is_edited && (
                  <p className="text-xs opacity-70 mt-1">ویرایش شده</p>
                )}
                {msg.sender_id === currentUserId && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(msg)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="پیام خود را بنویسید..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          dir="rtl"
        />
        <Button onClick={sendMessage}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DirectMessages;
