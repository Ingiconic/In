import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UnreadBadgeProps {
  chatType: 'direct' | 'group' | 'channel';
  chatId: string;
}

const UnreadBadge = ({ chatType, chatId }: UnreadBadgeProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    const channel = supabase
      .channel(`unread:${chatType}:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unread_messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatType, chatId]);

  const loadUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('unread_messages')
      .select('unread_count')
      .eq('user_id', user.id)
      .eq('chat_type', chatType)
      .eq('chat_id', chatId)
      .maybeSingle();

    setUnreadCount(data?.unread_count || 0);
  };

  if (unreadCount === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default UnreadBadge;
