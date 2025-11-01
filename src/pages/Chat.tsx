import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { ArrowRight, MessageSquare, Users, Radio, Search, Plus, User, Edit2, Trash2, Bookmark, BookmarkCheck, Hash, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { messageSchema, channelNameSchema, groupNameSchema, descriptionSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { usePageView } from "@/hooks/usePageView";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageView();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  useEffect(() => {
    loadProfile();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      loadSavedMessages();
      subscribeToMessages();
    }
  }, [selectedConversation]);

  const loadSavedMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_messages")
      .select("message_id")
      .eq("user_id", user.id);

    if (data) {
      setSavedMessageIds(new Set(data.map(s => s.message_id)));
    }
  };

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

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load channels
    const { data: channels } = await supabase
      .from("channel_members")
      .select(`
        channel_id,
        channels (
          id,
          name,
          description,
          owner_id
        )
      `)
      .eq("user_id", user.id);

    // Load groups
    const { data: groups } = await supabase
      .from("group_members")
      .select(`
        group_id,
        groups (
          id,
          name,
          description,
          owner_id
        )
      `)
      .eq("user_id", user.id);

    // Load friends
    const { data: friends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id);

    // Get friend profiles
    const friendProfiles = friends ? await Promise.all(
      friends.map(async (f) => {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .eq("id", f.friend_id)
          .single();
        return data;
      })
    ) : [];

    const allConversations = [
      ...(channels?.map(c => ({
        id: c.channels.id,
        name: c.channels.name,
        type: 'channel',
        icon: Radio,
      })) || []),
      ...(groups?.map(g => ({
        id: g.groups.id,
        name: g.groups.name,
        type: 'group',
        icon: Users,
      })) || []),
      ...(friendProfiles
        .filter(p => p !== null)
        .map(p => ({
          id: p!.id,
          name: p!.full_name || p!.username || 'کاربر',
          type: 'direct',
          icon: User,
        })) || []),
    ];

    setConversations(allConversations);
  };

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (selectedConversation.type === 'channel') {
      const { data } = await supabase
        .from("channel_messages")
        .select(`
          *,
          profiles (full_name, username)
        `)
        .eq("channel_id", selectedConversation.id)
        .order("created_at", { ascending: true });
      
      setMessages(data || []);
    } else if (selectedConversation.type === 'group') {
      const { data } = await supabase
        .from("group_messages")
        .select(`
          *,
          profiles (full_name, username)
        `)
        .eq("group_id", selectedConversation.id)
        .order("created_at", { ascending: true });
      
      setMessages(data || []);
    } else {
      const { data } = await supabase
        .from("direct_messages")
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey (full_name, username)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${selectedConversation.id},receiver_id.eq.${selectedConversation.id}`)
        .order("created_at", { ascending: true });
      
      setMessages(data || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase.channel('messages-changes');
    
    if (selectedConversation.type === 'channel') {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${selectedConversation.id}`
        },
        () => loadMessages()
      );
    } else if (selectedConversation.type === 'group') {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedConversation.id}`
        },
        () => loadMessages()
      );
    } else {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages'
        },
        () => loadMessages()
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      const validatedMessage = messageSchema.parse({ content: messageInput });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingId) {
        // Update existing message
        if (selectedConversation.type === 'channel') {
          await supabase
            .from("channel_messages")
            .update({ content: validatedMessage.content, is_edited: true })
            .eq("id", editingId);
        } else if (selectedConversation.type === 'group') {
          await supabase
            .from("group_messages")
            .update({ content: validatedMessage.content, is_edited: true })
            .eq("id", editingId);
        } else {
          await supabase
            .from("direct_messages")
            .update({ content: validatedMessage.content, is_edited: true })
            .eq("id", editingId);
        }
        setEditingId(null);
      } else {
        // Insert new message
        if (selectedConversation.type === 'channel') {
          const { data: channel } = await supabase
            .from("channels")
            .select("owner_id")
            .eq("id", selectedConversation.id)
            .single();

          if (channel?.owner_id !== user.id) {
            toast({
              title: "خطا",
              description: "فقط صاحب کانال می‌تواند پیام بفرستد",
              variant: "destructive",
            });
            return;
          }

          await supabase.from("channel_messages").insert({
            channel_id: selectedConversation.id,
            user_id: user.id,
            content: validatedMessage.content,
          });
        } else if (selectedConversation.type === 'group') {
          await supabase.from("group_messages").insert({
            group_id: selectedConversation.id,
            user_id: user.id,
            content: validatedMessage.content,
          });
        } else {
          await supabase.from("direct_messages").insert({
            sender_id: user.id,
            receiver_id: selectedConversation.id,
            content: validatedMessage.content,
          });
        }
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
      if (selectedConversation.type === 'channel') {
        await supabase.from("channel_messages").delete().eq("id", messageId);
      } else if (selectedConversation.type === 'group') {
        await supabase.from("group_messages").delete().eq("id", messageId);
      } else {
        await supabase.from("direct_messages").delete().eq("id", messageId);
      }
      toast({ title: "موفق", description: "پیام حذف شد" });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const startEdit = (msg: any) => {
    setEditingId(msg.id);
    setMessageInput(msg.content);
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
      toast({ title: "خطا", description: "لطفا نام کانال را وارد کنید", variant: "destructive" });
      return;
    }

    try {
      const validatedName = channelNameSchema.parse(newChannelName);
      const validatedDesc = newChannelDesc.trim() ? descriptionSchema.parse(newChannelDesc) : "";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      const { data, error } = await supabase
        .from("channels")
        .insert({
          name: validatedName,
          description: validatedDesc || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("channel_members").insert({
        channel_id: data.id,
        user_id: user.id,
      });

      toast({ title: "موفق! ✨", description: "کانال ایجاد شد" });
      setNewChannelName("");
      setNewChannelDesc("");
      setShowCreateChannel(false);
      loadConversations();
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "خطا", description: "لطفا نام گروه را وارد کنید", variant: "destructive" });
      return;
    }

    try {
      const validatedName = groupNameSchema.parse(newGroupName);
      const validatedDesc = newGroupDesc.trim() ? descriptionSchema.parse(newGroupDesc) : "";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: validatedName,
          description: validatedDesc || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        is_admin: true,
      });

      toast({ title: "موفق! ✨", description: "گروه ایجاد شد" });
      setNewGroupName("");
      setNewGroupDesc("");
      setShowCreateGroup(false);
      loadConversations();
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const toggleSaveMessage = async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (savedMessageIds.has(messageId)) {
      await supabase
        .from("saved_messages")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id);
      
      setSavedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      toast({ title: "موفق", description: "پیام از ذخیره شده‌ها حذف شد" });
    } else {
      await supabase.from("saved_messages").insert({
        user_id: user.id,
        message_id: messageId,
        message_type: selectedConversation.type,
      });
      
      setSavedMessageIds(prev => new Set(prev).add(messageId));
      toast({ title: "موفق", description: "پیام ذخیره شد" });
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-gradient animate-neon-pulse">پیام‌رسان ایزی درس</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-2 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="p-3 md:p-4 flex flex-col glassmorphism-card animate-scale-in">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-bold text-gradient">پیام‌رسان</h2>
              <div className="flex gap-1">
                <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="hover-lift hover:shadow-glow" title="ایجاد کانال">
                      <Hash className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism-card">
                    <DialogHeader>
                      <DialogTitle className="text-gradient">ایجاد کانال جدید</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>نام کانال</Label>
                        <Input
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="نام کانال"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label>توضیحات</Label>
                        <Textarea
                          value={newChannelDesc}
                          onChange={(e) => setNewChannelDesc(e.target.value)}
                          placeholder="توضیحات کانال"
                          dir="rtl"
                        />
                      </div>
                      <Button onClick={createChannel} className="w-full gradient-primary hover-lift">
                        ایجاد کانال ✨
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="hover-lift hover:shadow-glow" title="ایجاد گروه">
                      <Users className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism-card">
                    <DialogHeader>
                      <DialogTitle className="text-gradient">ایجاد گروه جدید</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>نام گروه</Label>
                        <Input
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="نام گروه"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label>توضیحات</Label>
                        <Textarea
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          placeholder="توضیحات گروه"
                          dir="rtl"
                        />
                      </div>
                      <Button onClick={createGroup} className="w-full gradient-primary hover-lift">
                        ایجاد گروه ✨
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" variant="ghost" className="hover-lift hover:shadow-glow" onClick={() => navigate("/chat/friends")} title="مدیریت دوستان">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative mb-3 md:mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="text-sm md:text-base h-9 md:h-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
              />
            </div>

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

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredConversations.map((conv) => {
                  const Icon = conv.icon;
                  return (
                    <Card
                      key={conv.id}
                      className={`p-3 cursor-pointer hover-lift transition-all ${
                        selectedConversation?.id === conv.id 
                          ? "glassmorphism border-primary/50 shadow-glow" 
                          : "glassmorphism-card hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${selectedConversation?.id === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{conv.name}</p>
                          <p className="text-xs text-muted-foreground">{conv.type === 'channel' ? '📡 کانال' : conv.type === 'group' ? '👥 گروه' : '💬 گفتگوی خصوصی'}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="md:col-span-2 p-4 flex flex-col glassmorphism-card animate-scale-in">
            {selectedConversation ? (
              <>
                <div className="border-b pb-3 mb-4">
                  <h2 className="text-lg font-bold">{selectedConversation.name}</h2>
                </div>

                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.user_id === profile?.id || msg.sender_id === profile?.id;
                      const isSaved = savedMessageIds.has(msg.id);
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-scale-in`}>
                          <Card className={`p-3 max-w-[70%] hover-lift ${
                            isOwn 
                              ? "gradient-primary text-white shadow-glow" 
                              : "glassmorphism-card"
                          }`}>
                            {!isOwn && (
                              <p className="text-xs font-bold mb-1 text-primary">
                                {msg.profiles?.full_name || msg.sender?.full_name || "کاربر"}
                              </p>
                            )}
                            <p className="text-sm break-words">{msg.content}</p>
                            {msg.is_edited && (
                              <p className="text-xs opacity-70 mt-1">✏️ ویرایش شده</p>
                            )}
                            <div className="flex gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSaveMessage(msg.id)}
                                className="h-6 px-2 hover:scale-110 transition-transform"
                                title={isSaved ? "حذف از ذخیره شده‌ها" : "ذخیره پیام"}
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-3 h-3 text-accent" />
                                ) : (
                                  <Bookmark className="w-3 h-3" />
                                )}
                              </Button>
                              {isOwn && (
                                <>
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
                                </>
                              )}
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={editingId ? "✏️ ویرایش پیام..." : "💬 پیام خود را بنویسید..."}
                    className="flex-1 glassmorphism"
                  />
                  {editingId && (
                    <Button variant="outline" className="hover-lift" onClick={() => { setEditingId(null); setMessageInput(""); }}>
                      انصراف
                    </Button>
                  )}
                  <Button onClick={sendMessage} className="gradient-primary hover-lift shadow-glow">
                    {editingId ? "✅ ویرایش" : "🚀 ارسال"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4 text-primary/30 animate-bounce-slow" />
                <p className="text-lg">یک گفتگو را انتخاب کنید</p>
                <p className="text-sm text-muted-foreground/70 mt-2">برای شروع پیام رسانی، از لیست سمت راست انتخاب کنید</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
