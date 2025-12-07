import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Loader2, MessageSquare, Trash2, Lock, Unlock, Send, User
} from "lucide-react";
import { motion } from "framer-motion";
import { AdminRoute } from "@/components/auth/AdminRoute";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns-jalali";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  user_profile?: {
    username: string;
    full_name: string;
  };
}

const AdminTickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data: ticketsData, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load user profiles for each ticket
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", ticket.user_id)
            .single();
          return { ...ticket, user_profile: profile };
        })
      );

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          admin_reply: replyText,
          replied_at: new Date().toISOString(),
          status: "answered"
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      toast({ title: "موفق", description: "پاسخ ارسال شد" });
      setSelectedTicket(null);
      setReplyText("");
      await loadTickets();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTicketStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === "closed" ? "open" : "closed";
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);

      if (error) throw error;
      await loadTickets();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این تیکت را حذف کنید؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "موفق", description: "تیکت حذف شد" });
      await loadTickets();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded">باز</span>;
      case "answered":
        return <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded">پاسخ داده شده</span>;
      case "closed":
        return <span className="bg-gray-500/20 text-gray-500 text-xs px-2 py-1 rounded">بسته</span>;
      default:
        return null;
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به پنل
            </Button>
            
            <h1 className="text-3xl font-bold text-gradient">مدیریت تیکت‌ها</h1>
            <p className="text-muted-foreground mt-2">
              مشاهده و پاسخ به تیکت‌های کاربران
            </p>
          </motion.div>

          {/* Tickets List */}
          <div className="space-y-4">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 glass-card border-primary/20">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {ticket.user_profile?.full_name || ticket.user_profile?.username || "کاربر"}
                          </span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <h3 className="text-lg font-bold mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "yyyy/MM/dd - HH:mm")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTicketStatus(ticket)}
                        >
                          {ticket.status === "closed" ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTicket(ticket.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {ticket.admin_reply && (
                      <div className="bg-primary/10 p-4 rounded-lg border-r-4 border-primary">
                        <p className="text-sm text-muted-foreground mb-2">
                          پاسخ ادمین - {ticket.replied_at && format(new Date(ticket.replied_at), "yyyy/MM/dd - HH:mm")}
                        </p>
                        <p className="whitespace-pre-wrap">{ticket.admin_reply}</p>
                      </div>
                    )}

                    {ticket.status !== "closed" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReplyText(ticket.admin_reply || "");
                        }}
                      >
                        <MessageSquare className="w-4 h-4 ml-2" />
                        {ticket.admin_reply ? "ویرایش پاسخ" : "پاسخ دادن"}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}

            {tickets.length === 0 && !loading && (
              <Card className="p-12 text-center glass-card border-primary/20">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  هنوز تیکتی ثبت نشده است
                </p>
              </Card>
            )}
          </div>

          {/* Reply Dialog */}
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>پاسخ به تیکت</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">{selectedTicket?.subject}</h4>
                  <p className="text-sm">{selectedTicket?.message}</p>
                </div>

                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  className="min-h-32 text-right"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        ارسال پاسخ
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminTickets;
