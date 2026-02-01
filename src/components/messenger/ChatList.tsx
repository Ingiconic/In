import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Plus, Users, Hash, MessageCircle, Pin, User,
  Loader2
} from "lucide-react";
import type { ChatItem, UserProfile } from "./types";
import { formatChatTime } from "./utils";

interface ChatListProps {
  chats: ChatItem[];
  selectedChat: ChatItem | null;
  currentUser: UserProfile | null;
  loading: boolean;
  onSelectChat: (chat: ChatItem) => void;
  onNewChat: () => void;
}

export const ChatList = ({
  chats,
  selectedChat,
  currentUser,
  loading,
  onSelectChat,
  onNewChat,
}: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');

  const filteredChats = useMemo(() => {
    let filtered = chats;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage?.toLowerCase().includes(query)
      );
    }
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(chat => {
        if (activeTab === 'direct') return chat.type === 'direct';
        if (activeTab === 'groups') return chat.type === 'group';
        if (activeTab === 'channels') return chat.type === 'channel';
        return true;
      });
    }
    
    return filtered;
  }, [chats, searchQuery, activeTab]);

  const tabs = [
    { key: 'all', label: 'همه' },
    { key: 'direct', label: 'خصوصی' },
    { key: 'groups', label: 'گروه‌ها' },
    { key: 'channels', label: 'کانال‌ها' },
  ] as const;

  const getChatAvatar = (chat: ChatItem) => {
    if (chat.avatar) return chat.avatar;
    return null;
  };

  const getChatFallback = (chat: ChatItem) => {
    if (chat.type === 'direct') {
      return chat.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />;
    }
    if (chat.type === 'group') return <Users className="w-5 h-5" />;
    return <Hash className="w-5 h-5" />;
  };

  const getAvatarGradient = (chat: ChatItem) => {
    switch (chat.type) {
      case 'direct': return 'bg-gradient-to-br from-blue-500 to-purple-600';
      case 'group': return 'bg-gradient-to-br from-emerald-500 to-teal-600';
      case 'channel': return 'bg-gradient-to-br from-orange-500 to-pink-600';
      default: return 'bg-gradient-to-br from-primary to-purple-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-xl border-l border-border/40">
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">پیام‌ها</h1>
              <p className="text-xs text-muted-foreground">{chats.length} گفتگو</p>
            </div>
          </div>
          <Button 
            size="icon" 
            onClick={onNewChat}
            className="rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted/50 border-0 rounded-xl h-10 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-muted/30 border-b border-border/30">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">در حال بارگذاری...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">گفتگویی یافت نشد</p>
              <p className="text-xs mt-1">یک چت جدید شروع کنید</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredChats.map((chat, idx) => {
                const isSelected = selectedChat?.id === chat.id && selectedChat?.type === chat.type;
                
                return (
                  <motion.div
                    key={`${chat.type}-${chat.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.02 }}
                    layout
                  >
                    <button
                      onClick={() => onSelectChat(chat)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 text-right ${
                        isSelected
                          ? 'bg-primary/15 border border-primary/30 shadow-md'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 ring-2 ring-background shadow-md">
                          {getChatAvatar(chat) ? (
                            <AvatarImage src={getChatAvatar(chat)!} />
                          ) : null}
                          <AvatarFallback className={`${getAvatarGradient(chat)} text-white font-bold`}>
                            {getChatFallback(chat)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online indicator */}
                        {chat.isOnline && chat.type === 'direct' && (
                          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background shadow-lg" />
                        )}
                        
                        {/* Pin indicator */}
                        {chat.isPinned && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                            <Pin className="w-2.5 h-2.5 text-primary-foreground fill-current" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold truncate ${isSelected ? 'text-primary' : ''}`}>
                            {chat.name}
                          </span>
                          {chat.lastMessageTime && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 mr-2">
                              {formatChatTime(chat.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {chat.lastMessage || 'گفتگو را شروع کنید...'}
                          </p>
                          
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 min-w-[18px] h-[18px] rounded-full mr-2">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Current user info */}
      {currentUser && (
        <div className="p-3 border-t border-border/40 bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 ring-2 ring-primary/30">
              <AvatarImage src={currentUser.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm">
                {currentUser.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.full_name}</p>
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                آنلاین
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
