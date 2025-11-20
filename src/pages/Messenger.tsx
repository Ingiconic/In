import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Radio,
  Bookmark
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePageView } from "@/hooks/usePageView";
import DirectMessages from "@/components/chat/DirectMessages";
import Groups from "@/components/chat/Groups";
import Channels from "@/components/chat/Channels";
import SavedMessages from "@/components/chat/SavedMessages";
import UnreadBadge from "@/components/chat/UnreadBadge";
import OnlineStatus from "@/components/chat/OnlineStatus";

interface ChatListItem {
  id: string;
  name: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  type: 'direct' | 'group' | 'channel' | 'saved';
  avatar?: string;
}

const Messenger = () => {
  usePageView();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [profile, setProfile] = useState<any>(null);
  
  const activeTab = searchParams.get("tab") || "chats";
  const selectedUserId = searchParams.get("user");
  const selectedGroupId = searchParams.get("group");
  const selectedChannelId = searchParams.get("channel");
  const showSaved = searchParams.get("saved") === "true";

  useEffect(() => {
    loadProfile();
    loadChats();
  }, []);

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

  const loadChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load pinned chats first
    const { data: pinnedChats } = await supabase
      .from("pinned_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned_at", { ascending: false });

    const pinnedIds = new Set(pinnedChats?.map(p => p.chat_id) || []);

    // Load direct messages
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id);

    let friendsData: any[] = [];
    if (friendships) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", friendships.map(f => f.friend_id));
      friendsData = data || [];
    }

    // Load groups
    const { data: groupMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    let groups: any[] = [];
    if (groupMemberships && groupMemberships.length > 0) {
      const { data } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupMemberships.map(m => m.group_id));
      groups = data || [];
    }

    // Load channels
    const { data: channelMemberships } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", user.id);

    let channels: any[] = [];
    if (channelMemberships && channelMemberships.length > 0) {
      const { data } = await supabase
        .from("channels")
        .select("id, name")
        .in("id", channelMemberships.map(m => m.channel_id));
      channels = data || [];
    }

    const allChats: ChatListItem[] = [
      {
        id: 'saved',
        name: 'پیام‌های ذخیره‌شده',
        type: 'saved',
      },
      ...(friendsData?.map(f => ({
        id: f.id,
        name: f.full_name,
        type: 'direct' as const,
        avatar: f.avatar_url,
      })) || []),
      ...(groups?.filter(g => g.name !== 'ایزی درس')?.map(g => ({
        id: g.id,
        name: g.name,
        type: 'group' as const,
      })) || []),
      ...(channels?.filter(c => c.name !== 'اعلانات ایزی درس')?.map(c => ({
        id: c.id,
        name: c.name,
        type: 'channel' as const,
      })) || []),
    ];

    allChats.sort((a, b) => {
      const aIsPinned = pinnedIds.has(a.id);
      const bIsPinned = pinnedIds.has(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });

    setChatList(allChats);
  };

  const handleNewChat = async () => {
    if (!newChatUsername.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام کاربری را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: targetUser, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("username", newChatUsername.trim())
        .single();

      if (error || !targetUser) {
        toast({
          title: "خطا",
          description: "کاربری با این نام کاربری پیدا نشد",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingFriendship } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_id", user.id)
        .eq("friend_id", targetUser.id)
        .single();

      if (existingFriendship) {
        setShowNewChatDialog(false);
        setNewChatUsername("");
        setSearchParams({ user: targetUser.id });
        toast({
          title: "موفق",
          description: `چت با ${targetUser.full_name} باز شد`,
        });
      } else {
        const { error: requestError } = await supabase
          .from("friend_requests")
          .insert({
            sender_id: user.id,
            receiver_id: targetUser.id,
            status: "pending",
          });

        if (requestError) {
          if (requestError.code === "23505") {
            toast({
              title: "اطلاع",
              description: "قبلاً درخواست دوستی فرستاده‌اید",
            });
          } else {
            throw requestError;
          }
        } else {
          toast({
            title: "موفق",
            description: `درخواست دوستی به ${targetUser.full_name} ارسال شد`,
          });
        }
        setShowNewChatDialog(false);
        setNewChatUsername("");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "خطا",
        description: "خطا در برقراری ارتباط",
        variant: "destructive",
      });
    }

  const handleChatSelect = (chat: ChatListItem) => {
    if (chat.type === 'saved') {
      setSearchParams({ saved: 'true' });
    } else if (chat.type === 'direct') {
      setSearchParams({ user: chat.id });
    } else if (chat.type === 'group') {
      setSearchParams({ group: chat.id });
    } else if (chat.type === 'channel') {
      setSearchParams({ channel: chat.id });
    }
  };

  const filteredChats = chatList.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'saved': return <Bookmark className="w-5 h-5" />;
      case 'group': return <Users className="w-5 h-5" />;
      case 'channel': return <Radio className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const showChatView = selectedUserId || selectedGroupId || selectedChannelId || showSaved;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">پیام‌رسان ایزی درس</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className={`${showChatView ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-l border-border/50`}>
          {/* Search */}
          <div className="p-3 border-b border-border/30">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در چت‌ها..."
                className="pr-10"
                dir="rtl"
              />
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    (chat.type === 'saved' && showSaved) ||
                    (chat.type === 'direct' && selectedUserId === chat.id) ||
                    (chat.type === 'group' && selectedGroupId === chat.id) ||
                    (chat.type === 'channel' && selectedChannelId === chat.id)
                      ? 'bg-primary/10 border-r-2 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Avatar className="w-12 h-12 gradient-primary text-white">
                    <div className="w-full h-full flex items-center justify-center">
                      {chat.avatar ? (
                        <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getChatIcon(chat.type)
                      )}
                    </div>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{chat.name}</p>
                      <div className="flex items-center gap-2">
                        {chat.time && (
                          <span className="text-xs text-muted-foreground">{chat.time}</span>
                        )}
                        {chat.type !== 'saved' && (
                          <UnreadBadge
                            chatType={chat.type}
                            chatId={chat.id}
                          />
                        )}
                      </div>
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    )}
                    {chat.type === 'direct' && <OnlineStatus userId={chat.id} showText={false} />}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* New Chat FAB */}
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button
                className="fixed bottom-6 left-6 md:left-auto md:right-6 w-14 h-14 rounded-full shadow-lg gradient-primary"
                size="icon"
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>چت جدید</DialogTitle>
                <DialogDescription>
                  نام کاربری فرد را وارد کنید
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="نام کاربری..."
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNewChat()}
                  dir="rtl"
                />
                <Button onClick={handleNewChat} className="w-full gradient-primary">
                  شروع چت
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Chat Area */}
        <div className={`${showChatView ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {showSaved ? (
            <SavedMessages />
          ) : selectedUserId ? (
            <DirectMessages />
          ) : selectedGroupId ? (
            <div className="flex-1 p-4">
              <Groups />
            </div>
          ) : selectedChannelId ? (
            <div className="flex-1 p-4">
              <Channels />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="gradient-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">به پیام‌رسان ایزی درس خوش آمدید</h3>
                  <p className="text-muted-foreground">یک چت را از لیست انتخاب کنید یا چت جدیدی بسازید</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;
