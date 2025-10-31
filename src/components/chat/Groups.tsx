import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Edit2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Group {
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

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedGroup]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGroups(data);
    }
  };

  const loadMessages = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from("group_messages")
      .select(`
        id,
        content,
        user_id,
        created_at,
        is_edited,
        user:profiles!group_messages_user_id_fkey(full_name)
      `)
      .eq("group_id", selectedGroup)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("group_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_messages",
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

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: newGroupName,
          description: newGroupDesc,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the owner
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        is_admin: true,
      });

      toast({
        title: "موفق",
        description: "گروه ایجاد شد",
      });

      setNewGroupName("");
      setNewGroupDesc("");
      setShowCreateForm(false);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedGroup || !currentUserId) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("group_messages")
          .update({ content: message, is_edited: true })
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from("group_messages").insert({
          group_id: selectedGroup,
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
        .from("group_messages")
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
          <h3 className="font-semibold">گروه‌ها</h3>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showCreateForm && (
          <div className="space-y-2 mb-4">
            <Input
              placeholder="نام گروه"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              dir="rtl"
            />
            <Textarea
              placeholder="توضیحات"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              dir="rtl"
            />
            <Button onClick={createGroup} className="w-full">
              ایجاد گروه
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedGroup === group.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <p className="font-medium">{group.name}</p>
              <p className="text-sm opacity-70">{group.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        {selectedGroup ? (
          <>
            <div className="h-[500px] overflow-y-auto mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 ${
                      msg.user_id === currentUserId
                        ? "bg-primary text-primary-foreground ml-auto max-w-[70%]"
                        : "bg-muted mr-auto max-w-[70%]"
                    }`}
                  >
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            یک گروه را انتخاب کنید
          </div>
        )}
      </Card>
    </div>
  );
};

export default Groups;
