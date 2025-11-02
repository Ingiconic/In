/**
 * Common TypeScript types for the application
 */

export interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  correct_answer?: number;
  type?: string;
  explanation?: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface SavedMessage {
  id: string;
  user_id: string;
  message_id: string;
  saved_at: string;
  message?: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
  };
}

export interface GroupMessage {
  id: string;
  content: string;
  user_id: string;
  group_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

export interface DirectMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

export interface ChannelMessage {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  created_at: string;
}
