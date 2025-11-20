import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
}

const OnlineStatus = ({ userId, showText = true }: OnlineStatusProps) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setIsOnline(payload.new.is_online);
            setLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadStatus = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('is_online, last_seen')
      .eq('id', userId)
      .single();

    if (data) {
      setIsOnline(data.is_online);
      setLastSeen(data.last_seen);
    }
  };

  const getStatusText = () => {
    if (isOnline) return 'آنلاین';
    if (lastSeen) {
      try {
        return `آخرین بازدید ${formatDistanceToNow(new Date(lastSeen), { 
          locale: faIR,
          addSuffix: true 
        })}`;
      } catch {
        return 'آفلاین';
      }
    }
    return 'آفلاین';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
