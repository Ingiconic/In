import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface StudyEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: number;
  subject: string;
  completed: boolean;
  reminder_enabled: boolean;
}

const StudyCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_time: "09:00",
    duration: 60,
    subject: "",
    reminder_enabled: true,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (date) {
      filterEventsByDate(date);
    }
  }, [date, events]);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("study_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsByDate = (selectedDate: Date) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const filtered = events.filter((event) => event.event_date === dateStr);
    setSelectedDateEvents(filtered);
  };

  const handleCreateEvent = async () => {
    try {
      if (!date || !newEvent.title) {
        toast({ title: "خطا", description: "لطفا عنوان را وارد کنید", variant: "destructive" });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("study_events").insert({
        user_id: user.id,
        title: newEvent.title,
        description: newEvent.description,
        event_date: format(date, "yyyy-MM-dd"),
        event_time: newEvent.event_time,
        duration: newEvent.duration,
        subject: newEvent.subject,
        reminder_enabled: newEvent.reminder_enabled,
      });

      if (error) throw error;

      toast({ title: "موفق", description: "رویداد با موفقیت ایجاد شد" });
      setDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        event_time: "09:00",
        duration: 60,
        subject: "",
        reminder_enabled: true,
      });
      loadEvents();
    } catch (error: any) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    }
  };

  const toggleComplete = async (eventId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("study_events")
        .update({ completed: !completed })
        .eq("id", eventId);

      if (error) throw error;
      loadEvents();
    } catch (error) {
      console.error("Error toggling event:", error);
    }
  };

  const getDayEvents = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return events.filter((event) => event.event_date === dateStr);
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              تقویم مطالعاتی 📅
            </h1>
            <p className="text-muted-foreground mt-2">
              برنامه مطالعاتی خود را مدیریت کنید
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                افزودن رویداد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رویداد جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>عنوان *</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="مثال: مطالعه فیزیک"
                  />
                </div>
                <div>
                  <Label>توضیحات</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="جزئیات رویداد..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ساعت</Label>
                    <Input
                      type="time"
                      value={newEvent.event_time}
                      onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>مدت زمان (دقیقه)</Label>
                    <Input
                      type="number"
                      value={newEvent.duration}
                      onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>موضوع</Label>
                  <Input
                    value={newEvent.subject}
                    onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                    placeholder="فیزیک، ریاضی، ..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newEvent.reminder_enabled}
                    onCheckedChange={(checked) =>
                      setNewEvent({ ...newEvent, reminder_enabled: checked as boolean })
                    }
                  />
                  <Label>یادآوری فعال باشد</Label>
                </div>
                <Button onClick={handleCreateEvent} className="w-full">
                  ایجاد رویداد
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                locale={ar}
                modifiers={{
                  hasEvents: (day) => getDayEvents(day).length > 0,
                }}
                modifiersStyles={{
                  hasEvents: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    color: "hsl(var(--primary))",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                رویدادهای {date && format(date, "d MMMM", { locale: ar })}
              </h3>
              <div className="space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    رویدادی برای این روز ثبت نشده
                  </p>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border transition-all ${
                        event.completed
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-secondary/30 border-border/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`font-bold ${event.completed ? "line-through text-muted-foreground" : ""}`}>
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComplete(event.id, event.completed)}
                        >
                          {event.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.event_time}
                        </span>
                        <span>{event.duration} دقیقه</span>
                        {event.subject && <span className="text-primary">#{event.subject}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudyCalendar;
