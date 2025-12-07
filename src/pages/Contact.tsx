import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Send, MessageSquare, Loader2, Clock, CheckCircle, XCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns-jalali";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthAndLoadTickets();
  }, []);

  const checkAuthAndLoadTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsLoggedIn(true);
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!error) {
          setTickets(data || []);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "خطا",
        description: "لطفا موضوع و پیام را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "نیاز به ورود",
        description: "برای ارسال تیکت ابتدا وارد حساب کاربری شوید",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .insert([{
          user_id: session.user.id,
          subject: subject.trim(),
          message: message.trim(),
          status: "open"
        }]);

      if (error) throw error;

      toast({ 
        title: "موفق", 
        description: "تیکت شما با موفقیت ثبت شد. به زودی پاسخ داده خواهد شد." 
      });
      
      setSubject("");
      setMessage("");
      await checkAuthAndLoadTickets();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "answered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "در انتظار پاسخ";
      case "answered":
        return "پاسخ داده شده";
      case "closed":
        return "بسته شده";
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gradient mb-2">ارتباط با ما</h1>
          <p className="text-muted-foreground">
            سوال یا پیشنهادی دارید؟ تیکت ارسال کنید
          </p>
        </motion.div>

        {/* Submit Ticket Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 glass-card border-primary/20 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              ارسال تیکت جدید
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>موضوع</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع تیکت..."
                  className="text-right mt-2"
                />
              </div>

              <div>
                <Label>پیام</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="text-right min-h-32 mt-2"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full gradient-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    ارسال تیکت
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Previous Tickets */}
        {isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              تیکت‌های من
            </h2>

            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="p-4 glass-card border-primary/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "yyyy/MM/dd - HH:mm")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm">{getStatusText(ticket.status)}</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg mb-3">
                      <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {ticket.admin_reply && (
                      <div className="bg-primary/10 p-3 rounded-lg border-r-4 border-primary">
                        <p className="text-xs text-muted-foreground mb-1">
                          پاسخ پشتیبانی - {ticket.replied_at && format(new Date(ticket.replied_at), "yyyy/MM/dd - HH:mm")}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{ticket.admin_reply}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}

              {tickets.length === 0 && !loading && (
                <Card className="p-8 text-center glass-card border-primary/20">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    هنوز تیکتی ارسال نکرده‌اید
                  </p>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Contact;
