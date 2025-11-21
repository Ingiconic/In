import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, MessageSquare, Send, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  views_count: number;
  replies_count: number;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  upvotes: number;
  is_best_answer: boolean;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

const ForumTopic = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTopicData();
    incrementViewCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('forum-replies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_replies',
          filter: `topic_id=eq.${topicId}`
        },
        () => {
          loadReplies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId]);

  const incrementViewCount = async () => {
    try {
      const { data } = await supabase
        .from('forum_topics')
        .select('views_count')
        .eq('id', topicId)
        .single();

      if (data) {
        await supabase
          .from('forum_topics')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', topicId);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const loadTopicData = async () => {
    try {
      // Load topic
      const { data: topicData, error: topicError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError) throw topicError;

      // Load author
      const { data: author } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', topicData.user_id)
        .single();

      setTopic({ ...topicData, author });

      await loadReplies();
    } catch (error) {
      console.error('Error loading topic:', error);
      toast.error('خطا در بارگذاری موضوع');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const { data: repliesData, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get authors
      const repliesWithAuthors = await Promise.all(
        (repliesData || []).map(async (reply) => {
          const { data: author } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', reply.user_id)
            .single();

          return {
            ...reply,
            author,
          };
        })
      );

      setReplies(repliesWithAuthors);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim() || newReply.trim().length < 10) {
      toast.error('پاسخ باید حداقل ۱۰ کاراکتر باشد');
      return;
    }

    if (newReply.trim().length > 10000) {
      toast.error('پاسخ نباید بیشتر از ۱۰۰۰۰ کاراکتر باشد');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('لطفا ابتدا وارد شوید');
        return;
      }

      const { error } = await supabase
        .from('forum_replies')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          content: newReply.trim(),
        });

      if (error) throw error;

      // Update replies count
      await supabase
        .from('forum_topics')
        .update({ 
          replies_count: (topic?.replies_count || 0) + 1 
        })
        .eq('id', topicId);

      setNewReply('');
      toast.success('پاسخ با موفقیت ارسال شد');
      loadReplies();
      loadTopicData();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('خطا در ارسال پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (replyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reply = replies.find(r => r.id === replyId);
      if (!reply) return;

      await supabase
        .from('forum_replies')
        .update({ upvotes: reply.upvotes + 1 })
        .eq('id', replyId);

      loadReplies();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!topic) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>

        {/* Topic Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{topic.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={topic.author?.avatar_url} />
                  <AvatarFallback>{topic.author?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <span>{topic.author?.full_name}</span>
              </div>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(topic.created_at), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {topic.replies_count} پاسخ
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {topic.content}
            </p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold">پاسخ‌ها ({replies.length})</h2>
          
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={reply.author?.avatar_url} />
                    <AvatarFallback>{reply.author?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">{reply.author?.full_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                      {reply.content}
                    </p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(reply.id)}
                      className="gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {reply.upvotes || 0}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {replies.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                هنوز پاسخی ارسال نشده است. اولین نفر باشید!
              </p>
            </Card>
          )}
        </div>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle>پاسخ خود را بنویسید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="پاسخ خود را بنویسید..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              disabled={submitting}
            />
            <Button
              onClick={handleSubmitReply}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                'در حال ارسال...'
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  ارسال پاسخ
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ForumTopic;