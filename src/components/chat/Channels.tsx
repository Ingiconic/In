import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Edit2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Channel {
  id: string;
  name: string;
  description: string;
  owner_id: string;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_edited: boolean;
  user: { full_name: string };
}

const Channels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [channelOwnerId, setChannelOwnerId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
      loadChannelOwner();
      subscribeToMessages();
    }
  }, [selectedChannel]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadChannels = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChannels(data);
    }
  };

  const loadChannelOwner = async () => {
    if (!selectedChannel) return;

    const { data, error } = await supabase
      .from("channels")
      .select("owner_id")
      .eq("id", selectedChannel)
      .single();

    if (!error && data) {
      setChannelOwnerId(data.owner_id);
    }
  };

  const loadMessages = async () => {
    if (!selectedChannel) return;

    const { data, error } = await supabase
      .from("channel_messages")
      .select(`
        id,
        content,
        user_id,
        created_at,
        is_edited,
        user:profiles!channel_messages_user_id_fkey(full_name)
      `)
      .eq("channel_id", selectedChannel)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("channel_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_messages",
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

  const createChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      const { data, error } = await supabase
        .from("channels")
        .insert({
          name: newChannelName,
          description: newChannelDesc,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the owner
      await supabase.from("channel_members").insert({
        channel_id: data.id,
        user_id: user.id,
      });

      toast({
        title: "موفق",
        description: "کانال ایجاد شد",
      });

      setNewChannelName("");
      setNewChannelDesc("");
      setShowCreateForm(false);
      loadChannels();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChannel || !currentUserId) return;

    // Only channel owner can send messages
    if (currentUserId !== channelOwnerId) {
      toast({
        title: "خطا",
        description: "فقط صاحب کانال می‌تواند پیام بفرستد",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("channel_messages")
          .update({ content: message, is_edited: true })
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from("channel_messages").insert({
          channel_id: selectedChannel,
          user_id: currentUserId,
          content: message,
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
        .from("channel_messages")
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

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="p-4 md:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">کانال‌ها</h3>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showCreateForm && (
          <div className="space-y-2 mb-4">
            <Input
              placeholder="نام کانال"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              dir="rtl"
            />
            <Textarea
              placeholder="توضیحات"
              value={newChannelDesc}
              onChange={(e) => setNewChannelDesc(e.target.value)}
              dir="rtl"
            />
            <Button onClick={createChannel} className="w-full">
              ایجاد کانال
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedChannel === channel.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <p className="font-medium">{channel.name}</p>
              <p className="text-sm opacity-70">{channel.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        {selectedChannel ? (
          <>
            <div className="h-[500px] overflow-y-auto mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">
                      {msg.user.full_name}
                    </p>
                    <p>{msg.content}</p>
                    {msg.is_edited && (
                      <p className="text-xs opacity-70 mt-1">ویرایش شده</p>
                    )}
                    {msg.user_id === currentUserId && (
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
                ))}
              </div>
            </div>

            {currentUserId === channelOwnerId && (
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
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            یک کانال را انتخاب کنید
          </div>
        )}
      </Card>
    </div>
  );
};

export default Channels;
