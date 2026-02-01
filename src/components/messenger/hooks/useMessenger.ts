import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { ChatItem, Message, UserProfile } from "../types";

export const useMessenger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

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
              // Count unread messages
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
            const { data: lastMsg } = await supabase
              .from("channel_messages")
              .select("content, created_at")
              .eq("channel_id", channel.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const { count } = await supabase
              .from("channel_members")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id);

            allChats.push({
              id: channel.id,
              type: 'channel',
              name: channel.name,
              lastMessage: lastMsg?.content,
              lastMessageTime: lastMsg?.created_at || channel.created_at || undefined,
              unreadCount: 0,
              membersCount: count || 0,
            });
          }
        }
      }

      // Load pinned status
      const { data: pinnedData } = await supabase
        .from("pinned_chats")
        .select("chat_id, chat_type")
        .eq("user_id", currentUser.id);

      if (pinnedData) {
        for (const pinned of pinnedData) {
          const chat = allChats.find(c => c.id === pinned.chat_id && c.type === pinned.chat_type);
          if (chat) chat.isPinned = true;
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
        const { data: msgs, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        // Fetch sender profiles separately
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

        // Mark messages as read
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", currentUser.id)
          .eq("sender_id", selectedChat.id)
          .is("read_at", null);

      } else if (selectedChat.type === 'group') {
        const { data: msgs, error } = await supabase
          .from("group_messages")
          .select("*")
          .eq("group_id", selectedChat.id)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        // Fetch sender profiles separately
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
        const { data: msgs, error } = await supabase
          .from("channel_messages")
          .select("*")
          .eq("channel_id", selectedChat.id)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        // Fetch sender profiles separately
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

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    replyToId?: string
  ): Promise<boolean> => {
    if (!content.trim() || !selectedChat || !currentUser) return false;
    
    setSendingMessage(true);
    
    try {
      if (selectedChat.type === 'direct') {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: currentUser.id,
          receiver_id: selectedChat.id,
          content: content.trim(),
          reply_to_id: replyToId || null,
        });
        if (error) throw error;

      } else if (selectedChat.type === 'group') {
        const { error } = await supabase.from("group_messages").insert({
          group_id: selectedChat.id,
          user_id: currentUser.id,
          content: content.trim(),
          reply_to_id: replyToId || null,
        });
        if (error) throw error;

      } else if (selectedChat.type === 'channel') {
        const { error } = await supabase.from("channel_messages").insert({
          channel_id: selectedChat.id,
          user_id: currentUser.id,
          content: content.trim(),
        });
        if (error) throw error;
      }

      return true;
    } catch (error) {
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
      return false;
    }
  }, [selectedChat, toast]);

  // Toggle pin chat
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
      return true;
    } catch (error) {
      logger.error("Failed to toggle pin", error);
      return false;
    }
  }, [selectedChat, currentUser]);

  // Subscribe to realtime messages
  const subscribeToMessages = useCallback(() => {
    if (!selectedChat) return () => {};

    const table = 
      selectedChat.type === 'direct' ? 'direct_messages' :
      selectedChat.type === 'group' ? 'group_messages' : 'channel_messages';

    const channel = supabase
      .channel(`messenger_${table}_${selectedChat.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, loadMessages]);

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
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [selectedChat, currentUser, loadMessages, subscribeToMessages]);

  return {
    currentUser,
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    deleteMessage,
    togglePinChat,
    loadChats,
    loadMessages,
  };
};
