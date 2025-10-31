import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, X, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FriendRequest {
  id: string;
  sender_id: string;
  sender: { full_name: string; username: string };
  created_at: string;
}

interface Friend {
  id: string;
  friend_id: string;
  friend: { full_name: string; username: string };
}

const Friends = () => {
  const [username, setUsername] = useState("");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFriendRequests();
    loadFriends();
  }, []);

  const loadFriendRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        id,
        sender_id,
        created_at,
        sender:profiles!friend_requests_sender_id_fkey(full_name, username)
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (!error && data) {
      setFriendRequests(data as any);
    }
  };

  const loadFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        friend_id,
        friend:profiles!friendships_friend_id_fkey(full_name, username)
      `)
      .eq("user_id", user.id);

    if (!error && data) {
      setFriends(data as any);
    }
  };

  const sendFriendRequest = async () => {
    if (!username.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لطفاً وارد شوید");

      // Find user by username
      const { data: targetUser, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .single();

      if (userError || !targetUser) {
        throw new Error("کاربری با این نام کاربری یافت نشد");
      }

      if (targetUser.id === user.id) {
        throw new Error("نمی‌توانید به خودتان درخواست دوستی بفرستید");
      }

      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: targetUser.id,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("قبلاً درخواست فرستاده‌اید");
        }
        throw error;
      }

      toast({
        title: "موفق",
        description: "درخواست دوستی ارسال شد",
      });
      setUsername("");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      if (accept) {
        await supabase.rpc("create_friendship", { request_id: requestId });
      }

      toast({
        title: accept ? "قبول شد" : "رد شد",
        description: accept ? "دوست جدید اضافه شد" : "درخواست رد شد",
      });

      loadFriendRequests();
      loadFriends();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">افزودن دوست</h3>
        <div className="flex gap-2">
          <Input
            placeholder="نام کاربری را وارد کنید"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendFriendRequest()}
            dir="rtl"
          />
          <Button onClick={sendFriendRequest} disabled={loading}>
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {friendRequests.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">درخواست‌های دوستی</h3>
          <div className="space-y-2">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{request.sender.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{request.sender.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, true)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.id, false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-4">دوستان ({friends.length})</h3>
        <div className="space-y-2">
          {friends.map((friendship) => (
            <div
              key={friendship.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div>
                <p className="font-medium">{friendship.friend.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  @{friendship.friend.username}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/chat?user=${friendship.friend_id}`)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {friends.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              هنوز دوستی ندارید
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Friends;
