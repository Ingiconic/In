-- Add presence and messaging features for Telegram-like experience

-- Update profiles for online status and last seen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Create pinned chats table
CREATE TABLE IF NOT EXISTS public.pinned_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chat_type text NOT NULL CHECK (chat_type IN ('direct', 'group', 'channel')),
  chat_id uuid NOT NULL,
  pinned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, chat_type, chat_id)
);

ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their pinned chats"
  ON public.pinned_chats
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add reactions to messages
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS forwarded_from uuid,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_silent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

ALTER TABLE public.group_messages 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS forwarded_from uuid,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_silent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS read_by jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reply_to_id uuid;

ALTER TABLE public.channel_messages 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS forwarded_from uuid,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Create unread messages tracking table
CREATE TABLE IF NOT EXISTS public.unread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chat_type text NOT NULL CHECK (chat_type IN ('direct', 'group', 'channel')),
  chat_id uuid NOT NULL,
  unread_count integer DEFAULT 0,
  last_message_at timestamp with time zone,
  UNIQUE(user_id, chat_type, chat_id)
);

ALTER TABLE public.unread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unread counts"
  ON public.unread_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their unread counts"
  ON public.unread_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update last seen
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET last_seen = now(), is_online = true
  WHERE id = auth.uid();
END;
$$;

-- Enable realtime for presence tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;