import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit2,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Bookmark,
  Copy,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface MessageActionsProps {
  messageId: string;
  messageType: 'direct' | 'group' | 'channel';
  isOwn: boolean;
  content: string;
  onReply?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
}

const MessageActions = ({
  messageId,
  messageType,
  isOwn,
  content,
  onReply,
  onEdit,
  onForward,
}: MessageActionsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    const table = 
      messageType === 'direct' ? 'direct_messages' :
      messageType === 'group' ? 'group_messages' : 'channel_messages';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', messageId);

    if (!error) {
      toast({ title: 'پیام حذف شد' });
    } else {
      toast({ title: 'خطا در حذف پیام', variant: 'destructive' });
    }
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'متن کپی شد' });
    setIsOpen(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('saved_messages')
      .insert({
        user_id: user.id,
        message_id: messageId,
        message_type: messageType,
      });

    if (!error) {
      toast({ title: 'پیام ذخیره شد' });
    } else {
      toast({ title: 'خطا در ذخیره پیام', variant: 'destructive' });
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onReply && (
          <DropdownMenuItem onClick={onReply}>
            <Reply className="w-4 h-4 ml-2" />
            پاسخ
          </DropdownMenuItem>
        )}
        {isOwn && onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="w-4 h-4 ml-2" />
            ویرایش
          </DropdownMenuItem>
        )}
        {onForward && (
          <DropdownMenuItem onClick={onForward}>
            <Forward className="w-4 h-4 ml-2" />
            فوروارد
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 ml-2" />
          کپی متن
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSave}>
          <Bookmark className="w-4 h-4 ml-2" />
          ذخیره پیام
        </DropdownMenuItem>
        {isOwn && (
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageActions;
