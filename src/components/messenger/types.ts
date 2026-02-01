import { Json } from "@/integrations/supabase/types";

// Messenger Types
export interface ChatItem {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned?: boolean;
  isOnline?: boolean;
  isMuted?: boolean;
  membersCount?: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  read_at?: string | null;
  reactions?: Json;
  reply_to_id?: string;
  forwarded_from?: string;
  media_type?: string;
  media_url?: string;
  sender?: UserProfile | null;
  replied_message?: Message;
}

export interface Reaction {
  emoji: string;
  user_ids: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  username?: string;
  is_online?: boolean;
  last_seen?: string;
  bio?: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  user_id: string;
  is_admin: boolean;
  joined_at: string;
  profile?: UserProfile;
}

export interface ChannelInfo {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  subscribers_count?: number;
}

export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '💯', '🎉', '✨', '💪', '🤔', '😍', '🥳', '😎'];
