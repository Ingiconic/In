import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, Send, Mic, Smile, MoreVertical, Phone, Video,
  Check, CheckCheck, Edit2, Reply, Trash2, Pin, Copy,
  Users, Hash, X, Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatItem, Message, UserProfile } from "./types";
import { formatMessageTime, getDateLabel, groupMessagesByDate } from "./utils";
import { EMOJI_LIST } from "./types";

interface ChatAreaProps {
  chat: ChatItem;
  messages: Message[];
  currentUser: UserProfile;
  sendingMessage: boolean;
  onBack: () => void;
  onSendMessage: (content: string, replyToId?: string) => Promise<boolean>;
  onDeleteMessage: (msgId: string) => Promise<boolean>;
  onTogglePin: () => Promise<boolean>;
}

export const ChatArea = ({
  chat,
  messages,
  currentUser,
  sendingMessage,
  onBack,
  onSendMessage,
  onDeleteMessage,
  onTogglePin,
}: ChatAreaProps) => {
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sendingMessage) return;
    
    const success = await onSendMessage(messageText, replyingTo?.id);
    if (success) {
      setMessageText("");
      setReplyingTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const getChatIcon = () => {
    if (chat.type === 'group') return <Users className="w-4 h-4" />;
    if (chat.type === 'channel') return <Hash className="w-4 h-4" />;
    return null;
  };

  const getStatusText = () => {
    if (chat.type === 'direct') {
      return chat.isOnline ? 'آنلاین' : 'آفلاین';
    }
    if (chat.membersCount) {
      return `${chat.membersCount} ${chat.type === 'channel' ? 'عضو' : 'عضو'}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="md:hidden rounded-xl"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <Avatar className="w-10 h-10 ring-2 ring-background shadow-lg">
          {chat.avatar ? (
            <AvatarImage src={chat.avatar} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
            {chat.type === 'direct' ? chat.name?.[0] : getChatIcon()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate">{chat.name}</h2>
          <p className={`text-xs ${chat.isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            {getStatusText()}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {chat.type === 'direct' && (
            <>
              <Button variant="ghost" size="icon" className="rounded-xl hidden sm:flex">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl hidden sm:flex">
                <Video className="w-4 h-4" />
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onTogglePin}>
                <Pin className="w-4 h-4 ml-2" />
                {chat.isPinned ? 'برداشتن پین' : 'پین کردن'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 ml-2" />
                حذف گفتگو
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        <div className="py-4 space-y-1">
          {Array.from(groupedMessages.entries()).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 bg-muted/80 text-muted-foreground text-xs rounded-full backdrop-blur-sm">
                  {dateKey}
                </span>
              </div>
              
              {/* Messages for this date */}
              <AnimatePresence>
                {msgs.map((msg, idx) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  const isRead = isOwn && msg.read_at;
                  const showAvatar = !isOwn && (
                    idx === 0 || 
                    msgs[idx - 1]?.sender_id !== msg.sender_id
                  );
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div className={`group flex items-end gap-2 max-w-[80%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        {!isOwn && showAvatar && chat.type !== 'direct' && (
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            {msg.sender?.avatar_url ? (
                              <AvatarImage src={msg.sender.avatar_url} />
                            ) : null}
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-purple-600 text-white">
                              {msg.sender?.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!isOwn && !showAvatar && chat.type !== 'direct' && (
                          <div className="w-7" />
                        )}
                        
                        {/* Message bubble */}
                        <div
                          className={`relative px-3 py-2 rounded-2xl shadow-sm ${
                            isOwn 
                              ? 'bg-primary text-primary-foreground rounded-br-md' 
                              : 'bg-card border border-border/50 rounded-bl-md'
                          }`}
                        >
                          {/* Sender name in groups */}
                          {!isOwn && showAvatar && chat.type !== 'direct' && (
                            <p className="text-xs font-bold mb-1 opacity-80">
                              {msg.sender?.full_name}
                            </p>
                          )}
                          
                          {/* Reply indicator */}
                          {msg.reply_to_id && (
                            <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? 'border-primary-foreground/20' : 'border-border'} opacity-70`}>
                              ↩️ پاسخ به پیام
                            </div>
                          )}
                          
                          {/* Content */}
                          <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          
                          {/* Time and status */}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'opacity-70' : 'opacity-50'}`}>
                            <span className="text-[10px]">
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {msg.is_edited && (
                              <span className="text-[10px]">• ویرایش</span>
                            )}
                            {isOwn && (
                              isRead 
                                ? <CheckCheck className="w-3 h-3 text-sky-400" />
                                : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                        
                        {/* Message actions */}
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 rounded-full"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 rounded-full"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {isOwn && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 rounded-full text-destructive"
                              onClick={() => onDeleteMessage(msg.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                💬
              </div>
              <p className="text-sm font-medium">هنوز پیامی نیست</p>
              <p className="text-xs mt-1">اولین پیام را ارسال کنید!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-3 mb-2 p-2 bg-muted/80 rounded-xl flex items-center gap-2 border-r-2 border-primary"
          >
            <Reply className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium">
                پاسخ به {replyingTo.sender?.full_name || 'پیام'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 rounded-full"
              onClick={() => setReplyingTo(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="p-3 border-t border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          {/* Emoji picker */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <Smile className="w-5 h-5" />
            </Button>
            
            <AnimatePresence>
              {showEmoji && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-12 right-0 p-2 bg-card border border-border rounded-xl shadow-xl grid grid-cols-8 gap-1 z-50"
                >
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg text-lg transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Voice message */}
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Mic className="w-5 h-5" />
          </Button>
          
          {/* Text input */}
          <div className="flex-1">
            <Input
              placeholder="پیام خود را بنویسید..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-muted/50 border-0 rounded-xl h-10 text-sm"
              dir="rtl"
            />
          </div>
          
          {/* Send button */}
          <Button 
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendingMessage}
            className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
          >
            {sendingMessage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
