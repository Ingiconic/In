import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, Loader2, ArrowLeft, Settings, Moon, Sun, 
  Plus, Search, Menu, Bookmark, Users, Hash, User, Pin,
  Check, CheckCheck, Send, Smile, MoreVertical, ArrowRight,
  Reply, Copy, Trash2, X, Phone, Video, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewChatDialog } from "@/components/messenger";
import type { ChatItem, Message, UserProfile } from "@/components/messenger/types";
import { EMOJI_LIST } from "@/components/messenger/types";
import { formatChatTime, formatMessageTime, groupMessagesByDate } from "@/components/messenger/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

const Messenger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load current user and open saved messages
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
        const userProfile = profile as UserProfile;
        setCurrentUser(userProfile);
        
        // Auto-select Saved Messages
        const savedChat: ChatItem = {
          id: userProfile.id,
          type: 'direct',
          name: 'پیام‌های ذخیره شده',
          avatar: userProfile.avatar_url,
          unreadCount: 0,
          isOnline: true,
        };
        setSelectedChat(savedChat);
        
        return userProfile;
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
      
      // Add Saved Messages first
      allChats.push({
        id: currentUser.id,
        type: 'direct',
        name: 'پیام‌های ذخیره شده',
        avatar: currentUser.avatar_url,
        unreadCount: 0,
        isOnline: true,
        isPinned: true,
      });
      
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
          
          // Skip self messages (they're in Saved Messages)
          if (otherUserId === currentUser.id) continue;
          
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

            const { count } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id);

            allChats.push({
              id: group.id,
              type: 'group',
              name: group.name,
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at || group.created_at || undefined,
              unreadCount: 0,
              membersCount: count || 0,
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
            const { count } = await supabase
              .from("channel_members")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id);

            allChats.push({
              id: channel.id,
              type: 'channel',
              name: channel.name,
              lastMessage: undefined,
              lastMessageTime: channel.created_at || undefined,
              unreadCount: 0,
              membersCount: count || 0,
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
        // For saved messages (self chat)
        const isSelfChat = selectedChat.id === currentUser.id;
        
        let query;
        if (isSelfChat) {
          query = supabase
            .from("direct_messages")
            .select("*")
            .eq("sender_id", currentUser.id)
            .eq("receiver_id", currentUser.id)
            .order("created_at", { ascending: true });
        } else {
          query = supabase
            .from("direct_messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
            .order("created_at", { ascending: true });
        }
        
        const { data: msgs } = await query;
        
        const senderIds = [...new Set((msgs || []).map(m => m.sender_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        data = (msgs || []).map(m => ({
          ...m,
          sender: profileMap.get(m.sender_id) || null,
        })) as Message[];

        // Mark as read (not for self)
        if (!isSelfChat) {
          await supabase
            .from("direct_messages")
            .update({ read_at: new Date().toISOString() })
            .eq("receiver_id", currentUser.id)
            .eq("sender_id", selectedChat.id)
            .is("read_at", null);
        }

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

  // Send message with optimistic update
  const sendMessage = useCallback(async (): Promise<boolean> => {
    if (!messageText.trim() || !selectedChat || !currentUser) return false;
    
    const content = messageText.trim();
    setMessageText("");
    
    // Create optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_edited: false,
      reply_to_id: replyingTo?.id,
      sender: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
    };

    // INSTANT UI update
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyingTo(null);
    setSendingMessage(true);

    try {
      if (selectedChat.type === 'direct') {
        const { data, error } = await supabase.from("direct_messages").insert({
          sender_id: currentUser.id,
          receiver_id: selectedChat.id,
          content,
          reply_to_id: replyingTo?.id || null,
        }).select().single();
        
        if (error) throw error;
        
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));

      } else if (selectedChat.type === 'group') {
        const { data, error } = await supabase.from("group_messages").insert({
          group_id: selectedChat.id,
          user_id: currentUser.id,
          content,
          reply_to_id: replyingTo?.id || null,
        }).select().single();
        
        if (error) throw error;
        
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));

      } else if (selectedChat.type === 'channel') {
        const { data, error } = await supabase.from("channel_messages").insert({
          channel_id: selectedChat.id,
          user_id: currentUser.id,
          content,
        }).select().single();
        
        if (error) throw error;
        
        setMessages(prev => prev.map(m => 
          m.id === optimisticId ? { ...m, id: data.id } : m
        ));
      }

      return true;
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setMessageText(content);
      logger.error("Failed to send message", error);
      toast({
        title: "خطا در ارسال",
        variant: "destructive",
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [messageText, selectedChat, currentUser, replyingTo, toast]);

  // Delete message
  const deleteMessage = useCallback(async (msgId: string) => {
    if (!selectedChat) return;

    setMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      const table = 
        selectedChat.type === 'direct' ? 'direct_messages' :
        selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

      await supabase.from(table).delete().eq("id", msgId);
    } catch (error) {
      logger.error("Failed to delete message", error);
      loadMessages();
    }
  }, [selectedChat, loadMessages]);

  // Filter chats
  const filteredChats = chats.filter(chat => {
    const matchesSearch = !searchQuery || 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'direct' && chat.type === 'direct') ||
      (activeTab === 'groups' && chat.type === 'group') ||
      (activeTab === 'channels' && chat.type === 'channel');
    
    return matchesSearch && matchesTab;
  });

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

  // Get chat icon
  const getChatIcon = (chat: ChatItem) => {
    if (chat.id === currentUser?.id) return <Bookmark className="w-5 h-5" />;
    if (chat.type === 'group') return <Users className="w-5 h-5" />;
    if (chat.type === 'channel') return <Hash className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  // Loading
  if (!currentUser) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="h-[100dvh] w-screen flex overflow-hidden bg-background">
      {/* Sidebar - Chat List */}
      <div className={`${selectedChat && window.innerWidth < 768 ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 lg:w-96 border-l border-border bg-card`}>
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-bold text-lg">پیام‌ها</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowNewChat(true)} className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted/50 border-0 rounded-full h-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border/50">
          {[
            { key: 'all', label: 'همه' },
            { key: 'direct', label: 'خصوصی' },
            { key: 'groups', label: 'گروه' },
            { key: 'channels', label: 'کانال' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">گفتگویی یافت نشد</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map(chat => {
                const isSelected = selectedChat?.id === chat.id && selectedChat?.type === chat.type;
                const isSavedMessages = chat.id === currentUser.id;
                
                return (
                  <button
                    key={`${chat.type}-${chat.id}`}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-right transition-colors ${
                      isSelected ? 'bg-primary/15' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        {chat.avatar && !isSavedMessages ? (
                          <AvatarImage src={chat.avatar} />
                        ) : null}
                        <AvatarFallback className={`${
                          isSavedMessages ? 'bg-primary' :
                          chat.type === 'group' ? 'bg-emerald-500' :
                          chat.type === 'channel' ? 'bg-orange-500' : 'bg-primary'
                        } text-white`}>
                          {getChatIcon(chat)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isOnline && !isSavedMessages && (
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                      )}
                      {chat.isPinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Pin className="w-2 h-2 text-primary-foreground fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold truncate ${isSelected ? 'text-primary' : ''}`}>
                          {chat.name}
                        </span>
                        {chat.lastMessageTime && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatChatTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {chat.lastMessage || (isSavedMessages ? 'پیام‌های خود را اینجا ذخیره کنید' : 'شروع گفتگو')}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-primary text-[10px] px-1.5 h-5 rounded-full">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedChat && window.innerWidth < 768 ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-background`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedChat(null)}
                className="md:hidden rounded-full"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <Avatar className="w-10 h-10">
                {selectedChat.avatar && selectedChat.id !== currentUser.id ? (
                  <AvatarImage src={selectedChat.avatar} />
                ) : null}
                <AvatarFallback className={`${
                  selectedChat.id === currentUser.id ? 'bg-primary' :
                  selectedChat.type === 'group' ? 'bg-emerald-500' :
                  selectedChat.type === 'channel' ? 'bg-orange-500' : 'bg-primary'
                } text-white`}>
                  {getChatIcon(selectedChat)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-bold truncate">{selectedChat.name}</h2>
                <p className={`text-xs ${selectedChat.isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {selectedChat.id === currentUser.id ? 'ذخیره پیام برای خودم' :
                   selectedChat.type === 'direct' ? (selectedChat.isOnline ? 'آنلاین' : 'آفلاین') :
                   `${selectedChat.membersCount || 0} عضو`}
                </p>
              </div>
              
              {selectedChat.type === 'direct' && selectedChat.id !== currentUser.id && (
                <div className="hidden sm:flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3" ref={scrollRef}>
              <div className="py-4 space-y-1">
                {Array.from(groupedMessages.entries()).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        {dateKey}
                      </span>
                    </div>
                    
                    <AnimatePresence>
                      {msgs.map((msg, idx) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const isRead = isOwn && msg.read_at;
                        const showAvatar = !isOwn && (idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id);
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}
                          >
                            <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                              {!isOwn && showAvatar && selectedChat.type !== 'direct' && (
                                <Avatar className="w-7 h-7">
                                  {msg.sender?.avatar_url ? (
                                    <AvatarImage src={msg.sender.avatar_url} />
                                  ) : null}
                                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                    {msg.sender?.full_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isOwn && !showAvatar && selectedChat.type !== 'direct' && <div className="w-7" />}
                              
                              <div className={`relative px-3 py-2 rounded-2xl ${
                                isOwn 
                                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                                  : 'bg-muted rounded-bl-md'
                              }`}>
                                {!isOwn && showAvatar && selectedChat.type !== 'direct' && (
                                  <p className="text-xs font-bold mb-1 opacity-80">
                                    {msg.sender?.full_name}
                                  </p>
                                )}
                                
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                                
                                <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'opacity-70' : 'opacity-50'}`}>
                                  <span className="text-[10px]">
                                    {formatMessageTime(msg.created_at)}
                                  </span>
                                  {isOwn && (
                                    isRead 
                                      ? <CheckCheck className="w-3 h-3" />
                                      : <Check className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                              
                              <div className={`opacity-0 group-hover:opacity-100 flex gap-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setReplyingTo(msg)}>
                                  <Reply className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => navigator.clipboard.writeText(msg.content)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                                {isOwn && (
                                  <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full text-destructive" onClick={() => deleteMessage(msg.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      {selectedChat.id === currentUser.id ? <Bookmark className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
                    </div>
                    <p className="font-medium">
                      {selectedChat.id === currentUser.id ? 'پیام‌های ذخیره شده' : 'هنوز پیامی نیست'}
                    </p>
                    <p className="text-xs mt-1">
                      {selectedChat.id === currentUser.id ? 'یادداشت و پیام‌های مهم را اینجا ذخیره کنید' : 'اولین پیام را ارسال کنید'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mx-3 mb-2 p-2 bg-muted rounded-xl flex items-center gap-2 border-r-2 border-primary"
                >
                  <Reply className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium">پاسخ به {replyingTo.sender?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setReplyingTo(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <div className="flex items-end gap-2">
                <div className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowEmoji(!showEmoji)}>
                    <Smile className="w-5 h-5" />
                  </Button>
                  <AnimatePresence>
                    {showEmoji && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-12 right-0 p-2 bg-card border rounded-xl shadow-xl grid grid-cols-8 gap-1 z-50"
                      >
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => { setMessageText(prev => prev + emoji); setShowEmoji(false); }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Input
                  placeholder="پیام..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 bg-muted border-0 rounded-full h-10"
                  dir="rtl"
                />
                
                <Button 
                  size="icon"
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="rounded-full"
                >
                  {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10" />
            </div>
            <p className="font-medium">یک گفتگو انتخاب کنید</p>
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
  );
};

export default Messenger;
