import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Hash, Check, Loader2, Search, User, AtSign } from "lucide-react";
import type { ChatItem, UserProfile } from "./types";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserProfile;
  existingChats: ChatItem[];
  onChatCreated: (chat: ChatItem) => void;
}

export const NewChatDialog = ({
  open,
  onOpenChange,
  currentUser,
  existingChats,
  onChatCreated,
}: NewChatDialogProps) => {
  const { toast } = useToast();
  const [chatType, setChatType] = useState<'direct' | 'group' | 'channel'>('direct');
  
  // Direct chat - username search
  const [usernameSearch, setUsernameSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Group/Channel
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Search for user by username
  const searchUser = async () => {
    if (!usernameSearch.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      // Remove @ if user added it
      const query = usernameSearch.replace('@', '').trim().toLowerCase();
      
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username, is_online, bio")
        .neq("id", currentUser.id)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      
      setSearchResults(data as UserProfile[] || []);
      
      if (!data || data.length === 0) {
        toast({ title: "کاربری یافت نشد", description: "آیدی یا نام دیگری امتحان کنید" });
      }
    } catch (error) {
      toast({ title: "خطا در جستجو", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const loadUsers = async () => {
    if (allUsers.length > 0) return;
    
    setLoadingUsers(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username, is_online")
        .neq("id", currentUser.id)
        .order("full_name");
      
      if (data) setAllUsers(data as UserProfile[]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      loadUsers();
    } else {
      // Reset state
      setSelectedUsers([]);
      setSelectedUser(null);
      setUsernameSearch("");
      setSearchResults([]);
      setGroupName("");
      setGroupDesc("");
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const createChat = async () => {
    if (chatType === 'direct' && !selectedUser) {
      toast({ title: "یک کاربر انتخاب کنید", variant: "destructive" });
      return;
    }
    
    if ((chatType === 'group' || chatType === 'channel') && !groupName.trim()) {
      toast({ title: "نام را وارد کنید", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    try {
      if (chatType === 'direct' && selectedUser) {
        // Check if chat already exists
        const existingChat = existingChats.find(c => c.type === 'direct' && c.id === selectedUser.id);
        if (existingChat) {
          onChatCreated(existingChat);
          handleOpenChange(false);
          return;
        }
        
        const newChat: ChatItem = {
          id: selectedUser.id,
          type: 'direct',
          name: selectedUser.full_name,
          avatar: selectedUser.avatar_url,
          unreadCount: 0,
          isOnline: selectedUser.is_online,
        };
        onChatCreated(newChat);
        toast({ title: `گفتگو با ${selectedUser.full_name} شروع شد` });
        
      } else if (chatType === 'group') {
        const { data: group, error } = await supabase
          .from("groups")
          .insert({
            name: groupName.trim(),
            description: groupDesc.trim(),
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
        if (selectedUsers.length > 0) {
          await supabase.from("group_members").insert(
            selectedUsers.map(userId => ({
              group_id: group.id,
              user_id: userId,
              is_admin: false,
            }))
          );
        }

        const newChat: ChatItem = {
          id: group.id,
          type: 'group',
          name: group.name,
          unreadCount: 0,
          membersCount: selectedUsers.length + 1,
        };
        onChatCreated(newChat);
        toast({ title: `گروه "${group.name}" ایجاد شد` });
        
      } else if (chatType === 'channel') {
        const { data: channel, error } = await supabase
          .from("channels")
          .insert({
            name: groupName.trim(),
            description: groupDesc.trim(),
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

        const newChat: ChatItem = {
          id: channel.id,
          type: 'channel',
          name: channel.name,
          unreadCount: 0,
          membersCount: 1,
        };
        onChatCreated(newChat);
        toast({ title: `کانال "${channel.name}" ایجاد شد` });
      }

      handleOpenChange(false);
    } catch (error: any) {
      console.error("Create chat error:", error);
      toast({ 
        title: "خطا در ایجاد", 
        description: error?.message || "مشکلی پیش آمد",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center">گفتگوی جدید</DialogTitle>
        </DialogHeader>
        
        <Tabs value={chatType} onValueChange={(v) => {
          setChatType(v as any);
          setSelectedUser(null);
          setSearchResults([]);
          setUsernameSearch("");
        }}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="direct" className="text-sm">خصوصی</TabsTrigger>
            <TabsTrigger value="group" className="text-sm">گروه</TabsTrigger>
            <TabsTrigger value="channel" className="text-sm">کانال</TabsTrigger>
          </TabsList>
          
          {/* Direct Chat - Username Search */}
          <TabsContent value="direct" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                آیدی یا نام کاربر را وارد کنید
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="@username یا نام..."
                  value={usernameSearch}
                  onChange={(e) => setUsernameSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                  className="flex-1"
                  dir="ltr"
                />
                <Button 
                  onClick={searchUser} 
                  disabled={searching || !usernameSearch.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Search results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                        selectedUser?.id === user.id 
                          ? 'bg-primary/20 border border-primary' 
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                            {user.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <div className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{user.full_name}</p>
                        {user.username && (
                          <p className="text-xs text-primary" dir="ltr">@{user.username}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {/* Selected user preview */}
            {selectedUser && (
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedUser.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold">{selectedUser.full_name}</p>
                    <p className="text-xs text-primary" dir="ltr">@{selectedUser.username}</p>
                  </div>
                  <Check className="w-5 h-5 text-primary" />
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Group */}
          <TabsContent value="group" className="mt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="نام گروه *"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-bold h-auto focus-visible:ring-0"
                />
              </div>
            </div>
            
            <Textarea
              placeholder="توضیحات گروه (اختیاری)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                افزودن اعضا (اختیاری)
              </p>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                {selectedUsers.length} نفر
              </span>
            </div>
            
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-right ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-emerald-500/20' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          {user.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{user.full_name}</span>
                      {selectedUsers.includes(user.id) && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          {/* Channel */}
          <TabsContent value="channel" className="mt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shrink-0">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="نام کانال *"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-bold h-auto focus-visible:ring-0"
                />
              </div>
            </div>
            
            <Textarea
              placeholder="توضیحات کانال (اختیاری)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="resize-none"
              rows={3}
            />
            
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <p className="text-xs text-muted-foreground">
                💡 کانال‌ها برای پخش پیام به تعداد زیادی مخاطب استفاده می‌شوند. شما مدیر کانال خواهید بود.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <Button 
          onClick={createChat} 
          disabled={loading || (chatType === 'direct' && !selectedUser) || ((chatType === 'group' || chatType === 'channel') && !groupName.trim())}
          className="w-full mt-4"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          {chatType === 'direct' ? 'شروع گفتگو' : chatType === 'group' ? 'ایجاد گروه' : 'ایجاد کانال'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
