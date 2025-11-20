import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Reaction {
  emoji: string;
  user_ids: string[];
}

interface MessageReactionsProps {
  messageId: string;
  messageType: 'direct' | 'group' | 'channel';
  reactions: Reaction[];
  onReactionsUpdate: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

const MessageReactions = ({
  messageId,
  messageType,
  reactions,
  onReactionsUpdate,
}: MessageReactionsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = async (emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const table = 
      messageType === 'direct' ? 'direct_messages' :
      messageType === 'group' ? 'group_messages' : 'channel_messages';

    // Get current reactions
    const { data: message } = await supabase
      .from(table)
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (!message) return;

    let updatedReactions: Reaction[] = (message.reactions as any) || [];
    const existingReaction = updatedReactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Toggle reaction
      if (existingReaction.user_ids.includes(user.id)) {
        existingReaction.user_ids = existingReaction.user_ids.filter(id => id !== user.id);
        if (existingReaction.user_ids.length === 0) {
          updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.user_ids.push(user.id);
      }
    } else {
      updatedReactions.push({ emoji, user_ids: [user.id] });
    }

    const { error } = await supabase
      .from(table)
      .update({ reactions: updatedReactions as any })
      .eq('id', messageId);

    if (!error) {
      onReactionsUpdate();
    } else {
      toast({ title: 'خطا در افزودن ری‌اکشن', variant: 'destructive' });
    }

    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactions.map((reaction, idx) => (
        <Button
          key={idx}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs hover:bg-muted/50"
          onClick={() => handleReaction(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span className="mr-1 text-muted-foreground">{reaction.user_ids.length}</span>
        </Button>
      ))}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            😊
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-xl hover:bg-muted"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
