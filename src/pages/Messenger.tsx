import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChatList, 
  ChatArea, 
  NewChatDialog,
} from "@/components/messenger";
import type { ChatItem, Message, UserProfile } from "@/components/messenger/types";
import { MessageCircle, Loader2, ArrowLeft, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

const Messenger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  // Load current user
  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return null;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentUser(profile as UserProfile);
        return profile;
      }
      return null;
    } catch (error) {
      logger.error("Failed to load user", error);
      return null;
    }
  }, [navigate]);

  // Load all chats
  const loadChats = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const allChats: ChatItem[] = [];
      
      // Load direct message conversations
      const { data: dmData } = await supabase
        .from("direct_messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });

      if (dmData) {
        const dmChats = new Map<string, ChatItem>();
        
        for (const msg of dmData) {
          const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          
          if (otherUserId && !dmChats.has(otherUserId)) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, is_online, last_seen")
              .eq("id", otherUserId)
              .maybeSingle();
            
            if (profile) {
              const { count } = await supabase
                .from("direct_messages")
                .select("*", { count: "exact", head: true })
                .eq("sender_id", otherUserId)
                .eq("receiver_id", currentUser.id)
                .is("read_at", null);

              dmChats.set(otherUserId, {
                id: profile.id,
                type: 'direct',
                name: profile.full_name,
                avatar: profile.avatar_url || undefined,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at || undefined,
                unreadCount: count || 0,
                isOnline: profile.is_online || false,
              });
            }
          }
        }
        allChats.push(...Array.from(dmChats.values()));
      }

      // Load groups
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", currentUser.id);

      if (memberGroups && memberGroups.length > 0) {
        const groupIds = memberGroups.map(m => m.group_id);
        const { data: groups } = await supabase
          .from("groups")
          .select("*")
          .in("id", groupIds);

        if (groups) {
          for (const group of groups) {
            const { data: lastMsg } = await supabase
              .from("group_messages")
              .select("content, created_at")
              .eq("group_id", group.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            allChats.push({
              id: group.id,
              type: 'group',
              name: group.name,
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at || group.created_at || undefined,
              unreadCount: 0,
            });
          }
        }
      }

      // Load channels
      const { data: memberChannels } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", currentUser.id);

      if (memberChannels && memberChannels.length > 0) {
        const channelIds = memberChannels.map(m => m.channel_id);
        const { data: channels } = await supabase
          .from("channels")
          .select("*")
          .in("id", channelIds);

        if (channels) {
          for (const channel of channels) {
            allChats.push({
              id: channel.id,
              type: 'channel',
              name: channel.name,
              lastMessage: undefined,
              lastMessageTime: channel.created_at || undefined,
              unreadCount: 0,
            });
          }
        }
      }

      // Sort: pinned first, then by time
      allChats.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = new Date(a.lastMessageTime || 0).getTime();
        const timeB = new Date(b.lastMessageTime || 0).getTime();
        return timeB - timeA;
      });

      setChats(allChats);
    } catch (error) {
      logger.error("Failed to load chats", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load messages for selected chat
  const loadMessages = useCallback(async () => {
    if (!selectedChat || !currentUser) return;

    try {
      let data: Message[] = [];

      if (selectedChat.type === 'direct') {
        const { data: msgs } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
          .order("created_at", { ascending: true });
        
        const senderIds = [...new Set((msgs || []).map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        data = (msgs || []).map(m => ({
          ...m,
          sender: profileMap.get(m.sender_id) || null,
        })) as Message[];

        // Mark as read
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", currentUser.id)
          .eq("sender_id", selectedChat.id)
          .is("read_at", null);

      } else if (selectedChat.type === 'group') {
        const { data: msgs } = await supabase
          .from("group_messages")
          .select("*")
          .eq("group_id", selectedChat.id)
          .order("created_at", { ascending: true });
        
        const senderIds = [...new Set((msgs || []).map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        data = (msgs || []).map(m => ({
          ...m,
          sender_id: m.user_id,
          sender: profileMap.get(m.user_id) || null,
        })) as Message[];

      } else if (selectedChat.type === 'channel') {
        const { data: msgs } = await supabase
          .from("channel_messages")
          .select("*")
          .eq("channel_id", selectedChat.id)
          .order("created_at", { ascending: true });
        
        const senderIds = [...new Set((msgs || []).map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        data = (msgs || []).map(m => ({
          ...m,
          sender_id: m.user_id,
          sender: profileMap.get(m.user_id) || null,
        })) as Message[];
      }

      setMessages(data);
    } catch (error) {
      logger.error("Failed to load messages", error);
    }
  }, [selectedChat, currentUser]);

  // OPTIMISTIC send message - instant UI update
  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<boolean> => {
    if (!content.trim() || !selectedChat || !currentUser) return false;
    
    // Create optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content: content.trim(),
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_edited: false,
      reply_to_id: replyToId,
      sender: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
    };

    // INSTANT UI update
    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessage(true);

    try {
      if (selectedChat.type === 'direct') {
        const { data, error } = await supabase.from("direct_messages").insert({
          sender_id: currentUser.id,
          receiver_id: selectedChat.id,
          content: content.trim(),
          reply_to_id: replyToId || null,
        }).select().single();
        
        if (error) throw error;
        
        // Replace optimistic with real message
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));

      } else if (selectedChat.type === 'group') {
        const { data, error } = await supabase.from("group_messages").insert({
          group_id: selectedChat.id,
          user_id: currentUser.id,
          content: content.trim(),
          reply_to_id: replyToId || null,
        }).select().single();
        
        if (error) throw error;
        
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));

      } else if (selectedChat.type === 'channel') {
        const { data, error } = await supabase.from("channel_messages").insert({
          channel_id: selectedChat.id,
          user_id: currentUser.id,
          content: content.trim(),
        }).select().single();
        
        if (error) throw error;
        
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));
      }

      return true;
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      logger.error("Failed to send message", error);
      toast({
        title: "خطا در ارسال",
        description: "پیام ارسال نشد. دوباره تلاش کنید.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [selectedChat, currentUser, toast]);

  // Delete message
  const deleteMessage = useCallback(async (msgId: string): Promise<boolean> => {
    if (!selectedChat) return false;

    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      const table = 
        selectedChat.type === 'direct' ? 'direct_messages' :
        selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

      const { error } = await supabase.from(table).delete().eq("id", msgId);
      if (error) throw error;

      toast({ title: "پیام حذف شد" });
      return true;
    } catch (error) {
      logger.error("Failed to delete message", error);
      loadMessages(); // Reload on error
      return false;
    }
  }, [selectedChat, toast, loadMessages]);

  // Toggle pin
  const togglePinChat = useCallback(async (): Promise<boolean> => {
    if (!selectedChat || !currentUser) return false;

    try {
      if (selectedChat.isPinned) {
        await supabase
          .from("pinned_chats")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("chat_id", selectedChat.id);
      } else {
        await supabase.from("pinned_chats").insert({
          user_id: currentUser.id,
          chat_id: selectedChat.id,
          chat_type: selectedChat.type,
        });
      }
      loadChats();
      return true;
    } catch (error) {
      logger.error("Failed to toggle pin", error);
      return false;
    }
  }, [selectedChat, currentUser, loadChats]);

  // Initialize
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [currentUser, loadChats]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      loadMessages();

      // Real-time subscription
      const table = 
        selectedChat.type === 'direct' ? 'direct_messages' :
        selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

      const channel = supabase
        .channel(`msg_${selectedChat.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table }, (payload) => {
          const newMsg = payload.new as any;
          // Don't duplicate our own optimistic messages
          if (newMsg.sender_id !== currentUser.id && newMsg.user_id !== currentUser.id) {
            loadMessages();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat, currentUser, loadMessages]);

  const handleChatCreated = (chat: ChatItem) => {
    setSelectedChat(chat);
    loadChats();
  };

  // Loading state - Telegram style
  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Minimal header - only back button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/50 backdrop-blur-xl">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">بازگشت</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main messenger area - full height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0`}
        >
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            currentUser={currentUser}
            loading={loading}
            onSelectChat={setSelectedChat}
            onNewChat={() => setShowNewChat(true)}
          />
        </motion.div>

        {/* Chat Area */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedChat ? (
            <motion.div 
              key={selectedChat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <ChatArea
                chat={selectedChat}
                messages={messages}
                currentUser={currentUser}
                sendingMessage={sendingMessage}
                onBack={() => setSelectedChat(null)}
                onSendMessage={sendMessage}
                onDeleteMessage={deleteMessage}
                onTogglePin={togglePinChat}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-b from-background to-muted/20">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">پیام‌رسان ایزی درس</h2>
                <p className="text-sm max-w-xs mx-auto leading-relaxed">
                  یک گفتگو انتخاب کنید
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* New Chat Dialog */}
        <NewChatDialog
          open={showNewChat}
          onOpenChange={setShowNewChat}
          currentUser={currentUser}
          existingChats={chats}
          onChatCreated={handleChatCreated}
        />
      </div>
    </div>
  );
};

export default Messenger;
