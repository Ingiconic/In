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
import { Users, Hash, Check, Loader2 } from "lucide-react";
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
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      setGroupName("");
      setGroupDesc("");
    }
  };

  const toggleUser = (userId: string) => {
    if (chatType === 'direct') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const createChat = async () => {
    if (chatType === 'direct' && selectedUsers.length !== 1) {
      toast({ title: "یک کاربر انتخاب کنید", variant: "destructive" });
      return;
    }
    
    if ((chatType === 'group' || chatType === 'channel') && !groupName.trim()) {
      toast({ title: "نام را وارد کنید", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    try {
      if (chatType === 'direct') {
        const userId = selectedUsers[0];
        
        // Check if chat already exists
        const existingChat = existingChats.find(c => c.type === 'direct' && c.id === userId);
        if (existingChat) {
          onChatCreated(existingChat);
          handleOpenChange(false);
          return;
        }
        
        const user = allUsers.find(u => u.id === userId);
        if (user) {
          const newChat: ChatItem = {
            id: user.id,
            type: 'direct',
            name: user.full_name,
            avatar: user.avatar_url,
            unreadCount: 0,
            isOnline: user.is_online,
          };
          onChatCreated(newChat);
        }
        
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
        for (const userId of selectedUsers) {
          await supabase.from("group_members").insert({
            group_id: group.id,
            user_id: userId,
          });
        }

        const newChat: ChatItem = {
          id: group.id,
          type: 'group',
          name: group.name,
          unreadCount: 0,
          membersCount: selectedUsers.length + 1,
        };
        onChatCreated(newChat);
        toast({ title: "گروه ایجاد شد" });
        
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
        toast({ title: "کانال ایجاد شد" });
      }

      handleOpenChange(false);
    } catch (error) {
      toast({ title: "خطا در ایجاد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">گفتگوی جدید</DialogTitle>
        </DialogHeader>
        
        <Tabs value={chatType} onValueChange={(v) => setChatType(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="direct">خصوصی</TabsTrigger>
            <TabsTrigger value="group">گروه</TabsTrigger>
            <TabsTrigger value="channel">کانال</TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">یک کاربر انتخاب کنید:</p>
            
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-1 pr-2">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-primary/20 border border-primary' 
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                            {user.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name}</p>
                        {user.username && (
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        )}
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                  
                  {allUsers.length === 0 && !loadingUsers && (
                    <p className="text-center text-muted-foreground py-8">
                      کاربری یافت نشد
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="group" className="mt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="نام گروه"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-medium h-auto"
                />
              </div>
            </div>
            
            <Textarea
              placeholder="توضیحات (اختیاری)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            <p className="text-sm text-muted-foreground">
              اعضا: {selectedUsers.length} انتخاب شده
            </p>
            
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-40">
                <div className="space-y-1 pr-2">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-right ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-purple-600 text-white">
                          {user.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1">{user.full_name}</span>
                      {selectedUsers.includes(user.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="channel" className="mt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="نام کانال"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-medium h-auto"
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
            
            <p className="text-xs text-muted-foreground">
              کانال‌ها برای پخش پیام به تعداد زیادی از مخاطبان استفاده می‌شوند
            </p>
          </TabsContent>
        </Tabs>
        
        <Button 
          onClick={createChat} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 mt-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : null}
          {chatType === 'direct' ? 'شروع گفتگو' : 'ایجاد'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
