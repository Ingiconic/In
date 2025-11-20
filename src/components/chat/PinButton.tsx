import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pin, PinOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PinButtonProps {
  chatType: 'direct' | 'group' | 'channel';
  chatId: string;
}

const PinButton = ({ chatType, chatId }: PinButtonProps) => {
  const [isPinned, setIsPinned] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPinStatus();
  }, [chatType, chatId]);

  const checkPinStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('pinned_chats')
      .select('id')
      .eq('user_id', user.id)
      .eq('chat_type', chatType)
      .eq('chat_id', chatId)
      .maybeSingle();

    setIsPinned(!!data);
  };

  const togglePin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isPinned) {
      const { error } = await supabase
        .from('pinned_chats')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_type', chatType)
        .eq('chat_id', chatId);

      if (!error) {
        setIsPinned(false);
        toast({ title: 'چت از پین شده‌ها حذف شد' });
      }
    } else {
      const { error } = await supabase
        .from('pinned_chats')
        .insert({
          user_id: user.id,
          chat_type: chatType,
          chat_id: chatId,
        });

      if (!error) {
        setIsPinned(true);
        toast({ title: 'چت پین شد' });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={togglePin}
      className="h-8 w-8 p-0"
    >
      {isPinned ? (
        <PinOff className="w-4 h-4 text-primary" />
      ) : (
        <Pin className="w-4 h-4" />
      )}
    </Button>
  );
};

export default PinButton;
