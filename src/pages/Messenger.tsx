import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePresence } from "@/hooks/usePresence";
import { messageSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Plus, Send, Mic, Image, Paperclip, Smile, MoreVertical,
  Phone, Video, ArrowRight, Check, CheckCheck, Edit2, Reply, Forward,
  Trash2, Pin, Bookmark, Copy, Users, Hash, User, Settings, Bell,
  BellOff, Lock, X, MessageCircle, ChevronDown, Star, Archive,
  Clock, Filter, UserPlus, Link2, Crown, Shield, VolumeX, LogOut,
  ImageIcon, FileText, Music, MapPin, BarChart3, Circle
} from "lucide-react";

// Types
interface ChatItem {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned?: boolean;
  isOnline?: boolean;
  isMuted?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  read_at?: string | null;
  reactions?: any[];
  reply_to_id?: string;
  forwarded_from?: string;
  media_type?: string;
  media_url?: string;
  sender?: { full_name: string; avatar_url?: string };
  replied_message?: any;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  username?: string;
  is_online?: boolean;
  last_seen?: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '💯', '🎉', '✨', '💪', '🤔', '😍', '🥳', '😎'];

const Messenger = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group' | 'channel'>('direct');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInfoOpen, setChatInfoOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { presences, updateTypingStatus } = usePresence(selectedChat ? `chat:${selectedChat.id}` : undefined);

  // Load current user
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Load chats when user is available
  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [currentUser]);

  // Handle URL params for direct chat
  useEffect(() => {
    const chatType = searchParams.get('type');
    const chatId = searchParams.get('id');
    if (chatType && chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId && c.type === chatType);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [searchParams, chats]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && currentUser) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedChat, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter chats based on search and tab
  useEffect(() => {
    let filtered = chats;
    
    if (searchQuery) {
      filtered = filtered.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab !== "all") {
      filtered = filtered.filter(chat => {
        if (activeTab === "direct") return chat.type === "direct";
        if (activeTab === "groups") return chat.type === "group";
        if (activeTab === "channels") return chat.type === "channel";
        return true;
      });
    }
    
    // Sort: pinned first, then by last message time
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
    });
    
    setFilteredChats(filtered);
  }, [chats, searchQuery, activeTab]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentUser(profile);
      }
    } catch (error) {
      logger.error("Failed to load user", error);
    }
  };

  const loadChats = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const allChats: ChatItem[] = [];
      
      // Load direct messages
      const { data: dmData } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });

      if (dmData) {
        const dmChats = new Map<string, ChatItem>();
        for (const msg of dmData) {
          const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          
          if (otherUserId && !dmChats.has(otherUserId)) {
            // Fetch the other user's profile
            const { data: otherUserProfile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, is_online")
              .eq("id", otherUserId)
              .maybeSingle();
            
            if (otherUserProfile) {
              dmChats.set(otherUserId, {
                id: otherUserProfile.id,
                type: 'direct',
                name: otherUserProfile.full_name,
                avatar: otherUserProfile.avatar_url || undefined,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at || undefined,
                unreadCount: 0,
                isOnline: otherUserProfile.is_online || false,
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
              lastMessageTime: lastMsg?.created_at || group.created_at,
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
            const { data: lastMsg } = await supabase
              .from("channel_messages")
              .select("content, created_at")
              .eq("channel_id", channel.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            allChats.push({
              id: channel.id,
              type: 'channel',
              name: channel.name,
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at || channel.created_at,
              unreadCount: 0,
            });
          }
        }
      }

      // Load pinned chats
      const { data: pinnedData } = await supabase
        .from("pinned_chats")
        .select("chat_id, chat_type")
        .eq("user_id", currentUser.id);

      if (pinnedData) {
        for (const pinned of pinnedData) {
          const chat = allChats.find(c => c.id === pinned.chat_id && c.type === pinned.chat_type);
          if (chat) {
            chat.isPinned = true;
          }
        }
      }

      setChats(allChats);
    } catch (error) {
      logger.error("Failed to load chats", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat || !currentUser) return;

    try {
      let data: any[] = [];

      if (selectedChat.type === 'direct') {
        const { data: msgs } = await supabase
          .from("direct_messages")
          .select("*, sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)")
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
          .order("created_at", { ascending: true });
        data = msgs || [];

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
          .select("*, sender:profiles!group_messages_user_id_fkey(full_name, avatar_url)")
          .eq("group_id", selectedChat.id)
          .order("created_at", { ascending: true });
        data = (msgs || []).map(m => ({ ...m, sender_id: m.user_id }));
      } else if (selectedChat.type === 'channel') {
        const { data: msgs } = await supabase
          .from("channel_messages")
          .select("*, sender:profiles!channel_messages_user_id_fkey(full_name, avatar_url)")
          .eq("channel_id", selectedChat.id)
          .order("created_at", { ascending: true });
        data = (msgs || []).map(m => ({ ...m, sender_id: m.user_id }));
      }

      setMessages(data);
    } catch (error) {
      logger.error("Failed to load messages", error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedChat) return;

    const table = 
      selectedChat.type === 'direct' ? 'direct_messages' :
      selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

    const channel = supabase
      .channel(`${table}_${selectedChat.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        loadMessages();
        loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !currentUser) return;

    try {
      const validatedMessage = messageSchema.parse({ content: message });
      const content = validatedMessage.content;

      if (editingMessage) {
        const table = 
          selectedChat.type === 'direct' ? 'direct_messages' :
          selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

        await supabase
          .from(table)
          .update({ content, is_edited: true })
          .eq("id", editingMessage.id);
        
        setEditingMessage(null);
      } else {
        if (selectedChat.type === 'direct') {
          await supabase.from("direct_messages").insert({
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
            content,
            reply_to_id: replyingTo?.id || null,
          });
        } else if (selectedChat.type === 'group') {
          await supabase.from("group_messages").insert({
            group_id: selectedChat.id,
            user_id: currentUser.id,
            content,
            reply_to_id: replyingTo?.id || null,
          });
        } else if (selectedChat.type === 'channel') {
          await supabase.from("channel_messages").insert({
            channel_id: selectedChat.id,
            user_id: currentUser.id,
            content,
          });
        }
      }

      setMessage("");
      setReplyingTo(null);
      loadMessages();
      loadChats();
    } catch (error) {
      logger.error("Failed to send message", error);
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive",
      });
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    if (text.length > 0) {
      updateTypingStatus(true);
      setTimeout(() => updateTypingStatus(false), 2000);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!selectedChat) return;

    const table = 
      selectedChat.type === 'direct' ? 'direct_messages' :
      selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

    await supabase.from(table).delete().eq("id", msgId);
    loadMessages();
    toast({ title: "پیام حذف شد" });
  };

  const togglePin = async () => {
    if (!selectedChat || !currentUser) return;

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
  };

  const saveMessage = async (msgId: string) => {
    if (!currentUser || !selectedChat) return;

    await supabase.from("saved_messages").insert({
      user_id: currentUser.id,
      message_id: msgId,
      message_type: selectedChat.type,
    });
    toast({ title: "پیام ذخیره شد" });
  };

  const addReaction = async (msgId: string, emoji: string) => {
    if (!selectedChat || !currentUser) return;

    const table = 
      selectedChat.type === 'direct' ? 'direct_messages' :
      selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    let reactions = msg.reactions || [];
    const existingReaction = reactions.find((r: any) => r.emoji === emoji);

    if (existingReaction) {
      if (existingReaction.user_ids.includes(currentUser.id)) {
        existingReaction.user_ids = existingReaction.user_ids.filter((id: string) => id !== currentUser.id);
        if (existingReaction.user_ids.length === 0) {
          reactions = reactions.filter((r: any) => r.emoji !== emoji);
        }
      } else {
        existingReaction.user_ids.push(currentUser.id);
      }
    } else {
      reactions.push({ emoji, user_ids: [currentUser.id] });
    }

    await supabase.from(table).update({ reactions }).eq("id", msgId);
    loadMessages();
  };

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, username")
      .neq("id", currentUser?.id || "");
    
    if (data) setAllUsers(data);
  };

  const createNewChat = async () => {
    if (!currentUser) return;

    try {
      if (newChatType === 'direct' && selectedUsers.length === 1) {
        const userId = selectedUsers[0];
        // Check if chat already exists
        const existingChat = chats.find(c => c.type === 'direct' && c.id === userId);
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          const user = allUsers.find(u => u.id === userId);
          if (user) {
            const newChat: ChatItem = {
              id: user.id,
              type: 'direct',
              name: user.full_name,
              avatar: user.avatar_url,
              unreadCount: 0,
            };
            setChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat);
          }
        }
      } else if (newChatType === 'group' && newGroupName.trim()) {
        const { data: group, error } = await supabase
          .from("groups")
          .insert({
            name: newGroupName,
            description: newGroupDesc,
            owner_id: currentUser.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Add creator as admin
        await supabase.from("group_members").insert({
          group_id: group.id,
          user_id: currentUser.id,
          is_admin: true,
        });

        // Add selected users
        for (const userId of selectedUsers) {
          await supabase.from("group_members").insert({
            group_id: group.id,
            user_id: userId,
          });
        }

        toast({ title: "گروه ایجاد شد" });
        loadChats();
      } else if (newChatType === 'channel' && newGroupName.trim()) {
        const { data: channel, error } = await supabase
          .from("channels")
          .insert({
            name: newGroupName,
            description: newGroupDesc,
            owner_id: currentUser.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Add creator as member
        await supabase.from("channel_members").insert({
          channel_id: channel.id,
          user_id: currentUser.id,
        });

        toast({ title: "کانال ایجاد شد" });
        loadChats();
      }

      setShowNewChatDialog(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedUsers([]);
    } catch (error) {
      logger.error("Failed to create chat", error);
      toast({ title: "خطا در ایجاد", variant: "destructive" });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'دیروز';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fa-IR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
      case 'channel': return <Hash className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* Chat List Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-l border-border/50 bg-card/50 backdrop-blur-xl`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                پیام‌رسان
              </h1>
              <div className="flex items-center gap-2">
                <Dialog open={showNewChatDialog} onOpenChange={(open) => {
                  setShowNewChatDialog(open);
                  if (open) loadAllUsers();
                }}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 hover:bg-primary/20">
                      <Plus className="w-5 h-5 text-primary" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>چت جدید</DialogTitle>
                    </DialogHeader>
                    <Tabs value={newChatType} onValueChange={(v) => setNewChatType(v as any)}>
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="direct">چت خصوصی</TabsTrigger>
                        <TabsTrigger value="group">گروه</TabsTrigger>
                        <TabsTrigger value="channel">کانال</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="direct" className="mt-4 space-y-3">
                        <p className="text-sm text-muted-foreground">یک کاربر انتخاب کنید:</p>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {allUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => setSelectedUsers([user.id])}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                  selectedUsers.includes(user.id) 
                                    ? 'bg-primary/20 border border-primary' 
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback className="gradient-primary text-white">
                                    {user.full_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.full_name}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="group" className="mt-4 space-y-3">
                        <Input
                          placeholder="نام گروه"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="text-right"
                        />
                        <Textarea
                          placeholder="توضیحات (اختیاری)"
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="text-right"
                        />
                        <p className="text-sm text-muted-foreground">اعضا را انتخاب کنید:</p>
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {allUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setSelectedUsers(prev => 
                                    prev.includes(user.id) 
                                      ? prev.filter(id => id !== user.id)
                                      : [...prev, user.id]
                                  );
                                }}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                  selectedUsers.includes(user.id) 
                                    ? 'bg-primary/20' 
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{user.full_name}</span>
                                {selectedUsers.includes(user.id) && (
                                  <Check className="w-4 h-4 text-primary mr-auto" />
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="channel" className="mt-4 space-y-3">
                        <Input
                          placeholder="نام کانال"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="text-right"
                        />
                        <Textarea
                          placeholder="توضیحات (اختیاری)"
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="text-right"
                        />
                      </TabsContent>
                    </Tabs>
                    
                    <Button onClick={createNewChat} className="w-full gradient-primary text-white mt-4">
                      ایجاد
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در چت‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted/50 border-0 rounded-xl"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 bg-muted/30">
            {['all', 'direct', 'groups', 'channels'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'hover:bg-muted'
                }`}
              >
                {tab === 'all' ? 'همه' : tab === 'direct' ? 'خصوصی' : tab === 'groups' ? 'گروه‌ها' : 'کانال‌ها'}
              </button>
            ))}
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>چتی یافت نشد</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredChats.map((chat, idx) => (
                    <motion.div
                      key={`${chat.type}-${chat.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => {
                        setSelectedChat(chat);
                        setSearchParams({ type: chat.type, id: chat.id });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedChat?.id === chat.id && selectedChat?.type === chat.type
                          ? 'bg-primary/20 border border-primary/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          {chat.avatar ? (
                            <AvatarImage src={chat.avatar} />
                          ) : null}
                          <AvatarFallback className={`${
                            chat.type === 'direct' ? 'gradient-primary' :
                            chat.type === 'group' ? 'gradient-secondary' :
                            'gradient-accent'
                          } text-white`}>
                            {chat.type === 'direct' ? chat.name?.[0] :
                             chat.type === 'group' ? <Users className="w-5 h-5" /> :
                             <Hash className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                        {chat.isOnline && chat.type === 'direct' && (
                          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                        {chat.isPinned && (
                          <Pin className="absolute -top-1 -right-1 w-4 h-4 text-primary fill-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold truncate">{chat.name}</span>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(chat.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {chat.lastMessage || 'پیامی نیست'}
                          </p>
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-2 min-w-[20px] h-5">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Chat Area */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-b from-background to-muted/20`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  
                  <Avatar className="w-10 h-10">
                    {selectedChat.avatar ? (
                      <AvatarImage src={selectedChat.avatar} />
                    ) : null}
                    <AvatarFallback className="gradient-primary text-white">
                      {selectedChat.type === 'direct' ? selectedChat.name?.[0] :
                       selectedChat.type === 'group' ? <Users className="w-5 h-5" /> :
                       <Hash className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="font-bold">{selectedChat.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.type === 'direct' && selectedChat.isOnline ? (
                        <span className="text-green-500">آنلاین</span>
                      ) : selectedChat.type === 'group' ? (
                        'گروه'
                      ) : selectedChat.type === 'channel' ? (
                        'کانال'
                      ) : (
                        'آفلاین'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Search className="w-5 h-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={togglePin}>
                        <Pin className="w-4 h-4 ml-2" />
                        {selectedChat.isPinned ? 'برداشتن پین' : 'پین کردن'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BellOff className="w-4 h-4 ml-2" />
                        بی‌صدا کردن
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 ml-2" />
                        آرشیو
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف چت
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3 max-w-3xl mx-auto">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === currentUser.id;
                    const isRead = msg.read_at;
                    const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-start' : 'justify-end'} group`}
                      >
                        <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
                          {showAvatar && !isOwn && (
                            <Avatar className="w-8 h-8 mt-auto">
                              <AvatarImage src={msg.sender?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {msg.sender?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && !isOwn && <div className="w-8" />}
                          
                          <div className="space-y-1">
                            {msg.replied_message && (
                              <div className="bg-muted/50 p-2 rounded-lg border-r-2 border-primary text-xs">
                                <span className="text-primary font-medium">
                                  پاسخ به {msg.replied_message.sender?.full_name}
                                </span>
                                <p className="truncate opacity-70">{msg.replied_message.content}</p>
                              </div>
                            )}
                            
                            <div className={`rounded-2xl p-3 ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                : 'bg-muted rounded-bl-sm'
                            }`}>
                              {!isOwn && selectedChat.type !== 'direct' && (
                                <p className="text-xs font-bold mb-1 opacity-80">
                                  {msg.sender?.full_name}
                                </p>
                              )}
                              
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                              
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <span className="text-[10px] opacity-60">
                                  {formatTime(msg.created_at)}
                                  {msg.is_edited && ' • ویرایش شده'}
                                </span>
                                {isOwn && (
                                  <span className="flex items-center">
                                    {isRead ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 opacity-60" />
                                    )}
                                  </span>
                                )}
                              </div>
                              
                              {/* Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {msg.reactions.map((r: any, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => addReaction(msg.id, r.emoji)}
                                      className="flex items-center gap-1 bg-background/50 rounded-full px-2 py-0.5 text-xs hover:bg-background/80 transition-colors"
                                    >
                                      <span>{r.emoji}</span>
                                      <span className="text-muted-foreground">{r.user_ids.length}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Message Actions */}
                            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-start' : 'justify-end'}`}>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-2">
                                  <div className="grid grid-cols-4 gap-1">
                                    {EMOJI_LIST.slice(0, 8).map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => addReaction(msg.id, emoji)}
                                        className="p-2 hover:bg-muted rounded-lg text-lg"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <button
                                onClick={() => saveMessage(msg.id)}
                                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMessage(msg);
                                      setMessage(msg.content);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-muted transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-xl">
                {/* Reply Preview */}
                {replyingTo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-primary/10 p-3 rounded-xl mb-3 border-r-4 border-primary"
                  >
                    <div>
                      <p className="text-xs text-primary font-medium">پاسخ به {replyingTo.sender?.full_name}</p>
                      <p className="text-sm truncate max-w-[300px]">{replyingTo.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
                
                {/* Edit Preview */}
                {editingMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-amber-500/10 p-3 rounded-xl mb-3 border-r-4 border-amber-500"
                  >
                    <div>
                      <p className="text-xs text-amber-600 font-medium">ویرایش پیام</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingMessage(null);
                      setMessage("");
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
                
                <div className="flex items-end gap-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="پیام خود را بنویسید..."
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="min-h-[44px] max-h-32 resize-none rounded-2xl pr-12 bg-muted/50 border-0"
                      dir="rtl"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute left-2 bottom-1 rounded-full"
                        >
                          <Smile className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="p-3 w-64" align="end">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJI_LIST.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => setMessage(prev => prev + emoji)}
                              className="p-2 hover:bg-muted rounded-lg text-xl"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {message.trim() ? (
                    <Button 
                      onClick={sendMessage} 
                      size="icon" 
                      className="rounded-full gradient-primary h-11 w-11"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-11 w-11"
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center mb-6"
              >
                <MessageCircle className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">به پیام‌رسان ایزی‌درس خوش آمدید!</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                با دوستان و همکلاسی‌هایت چت کن، گروه بساز و در کانال‌های آموزشی عضو شو
              </p>
              <Button 
                onClick={() => {
                  setShowNewChatDialog(true);
                  loadAllUsers();
                }}
                className="gradient-primary text-white"
              >
                <Plus className="w-5 h-5 ml-2" />
                شروع چت جدید
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messenger;
