import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserPresence {
  user_id: string;
  online_at: string;
  is_typing?: boolean;
}

export const usePresence = (channelName: string) => {
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const [myPresence, setMyPresence] = useState<UserPresence | null>(null);

  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: '',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>();
        const flatState: Record<string, UserPresence> = {};
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            flatState[key] = presences[0];
          }
        });
        setPresences(flatState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const presence: UserPresence = {
              user_id: user.id,
              online_at: new Date().toISOString(),
            };
            await channel.track(presence);
            setMyPresence(presence);

            // Update database
            await supabase.rpc('update_last_seen');
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [channelName]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (myPresence) {
      const updatedPresence = { ...myPresence, is_typing: isTyping };
      const channel = supabase.channel(channelName);
      await channel.track(updatedPresence);
      setMyPresence(updatedPresence);
    }
  };

  return { presences, myPresence, updateTypingStatus };
};
