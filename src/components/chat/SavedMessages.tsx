import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Radio, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { messageSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

interface SavedMessage {
  id: string;
  message_type: string;
  message_id: string;
  saved_at: string;
  message?: any;
}

const SavedMessages = () => {
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSavedMessages();
  }, []);

  const loadSavedMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (data) {
      // Load actual messages
      const messagesWithContent = await Promise.all(
        data.map(async (saved) => {
          let message = null;
          if (saved.message_type === "channel") {
            const { data: msg } = await supabase
              .from("channel_messages")
              .select("*, profiles(full_name)")
              .eq("id", saved.message_id)
              .single();
            message = msg;
          } else if (saved.message_type === "group") {
            const { data: msg } = await supabase
              .from("group_messages")
              .select("*, profiles(full_name)")
              .eq("id", saved.message_id)
              .single();
            message = msg;
          } else {
            const { data: msg } = await supabase
              .from("direct_messages")
              .select("*, sender:profiles!direct_messages_sender_id_fkey(full_name)")
              .eq("id", saved.message_id)
              .single();
            message = msg;
          }
          return { ...saved, message };
        })
      );

      setSavedMessages(messagesWithContent);
    }
  };

  const sendNoteToSelf = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطا",
          description: "برای ارسال پیام وارد شوید",
          variant: "destructive",
        });
        return;
      }

      const validated = messageSchema.parse({ content: newMessage });

      const { data: inserted, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          receiver_id: user.id,
          content: validated.content,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        throw error || new Error("ارسال پیام ناموفق بود");
      }

      const { error: saveError } = await supabase
        .from("saved_messages")
        .insert({
          user_id: user.id,
          message_id: inserted.id,
          message_type: "direct",
        });

      if (saveError) throw saveError;

      setNewMessage("");
      loadSavedMessages();
    } catch (error) {
      logger.error("Failed to send saved message note", error);
      toast({
        title: "خطا",
        description:
          error instanceof Error ? error.message : "خطا در ارسال پیام",
        variant: "destructive",
      });
    }
  };

  const unsaveMessage = async (id: string) => {
    const { error } = await supabase
      .from("saved_messages")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "موفق", description: "پیام از ذخیره شده‌ها حذف شد" });
      loadSavedMessages();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "channel":
        return <Radio className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 bg-card/50 p-4">
        <h2 className="text-lg font-bold">پیام‌های ذخیره‌شده</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {savedMessages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              هنوز پیامی ذخیره نکردی؛ از چت‌ها روی «ذخیره» بزن یا اینجا برای
              خودت پیام بفرست.
            </p>
          ) : (
            savedMessages.map((saved) => (
              <Card key={saved.id} className="p-4 bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(saved.message_type)}
                    <span className="text-xs text-muted-foreground">
                      {saved.message_type === "channel"
                        ? "کانال"
                        : saved.message_type === "group"
                        ? "گروه"
                        : "خصوصی"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => unsaveMessage(saved.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {saved.message && (
                  <>
                    <p className="text-sm font-medium mb-1">
                      {saved.message.profiles?.full_name ||
                        saved.message.sender?.full_name ||
                        "کاربر"}
                    </p>
                    <p className="text-sm">{saved.message.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      ذخیره شده در:{" "}
                      {new Date(saved.saved_at).toLocaleDateString("fa-IR")}
                    </p>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 bg-card/50 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="هر چیزی می‌خواهی برای خودت یادداشت کن..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            dir="rtl"
            className="min-h-[56px] max-h-40"
          />
          <Button
            onClick={sendNoteToSelf}
            className="gradient-primary h-11 w-11 rounded-full flex items-center justify-center"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SavedMessages;
