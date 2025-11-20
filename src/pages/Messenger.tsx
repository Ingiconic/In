import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Radio,
  Hash,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageView } from "@/hooks/usePageView";
import DirectMessages from "@/components/chat/DirectMessages";
import Groups from "@/components/chat/Groups";
import Channels from "@/components/chat/Channels";
import SavedMessages from "@/components/chat/SavedMessages";
import Friends from "@/components/chat/Friends";

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
    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", 
        (await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
        ).data?.map(m => m.group_id) || []
      );

    // Load channels
    const { data: channels } = await supabase
      .from("channels")
      .select("id, name")
      .in("id", 
        (await supabase
          .from("channel_members")
          .select("channel_id")
          .eq("user_id", user.id)
        ).data?.map(m => m.channel_id) || []
      );

    const chats: ChatListItem[] = [
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
      ...(groups?.map(g => ({
        id: g.id,
        name: g.name,
        type: 'group' as const,
      })) || []),
      ...(channels?.map(c => ({
        id: c.id,
        name: c.name,
        type: 'channel' as const,
      })) || []),
    ];

    setChatList(chats);
  };

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
                      {chat.time && (
                        <span className="text-xs text-muted-foreground">{chat.time}</span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    )}
                  </div>
                  {chat.unread && chat.unread > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread}
                    </div>
                  )}
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
                  یک گروه، کانال بسازید یا با دوستان جدید چت کنید
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="friends">دوستان</TabsTrigger>
                  <TabsTrigger value="groups">گروه</TabsTrigger>
                  <TabsTrigger value="channels">کانال</TabsTrigger>
                </TabsList>
                <TabsContent value="friends" className="mt-4">
                  <Friends />
                </TabsContent>
                <TabsContent value="groups" className="mt-4">
                  <Groups />
                </TabsContent>
                <TabsContent value="channels" className="mt-4">
                  <Channels />
                </TabsContent>
              </Tabs>
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
