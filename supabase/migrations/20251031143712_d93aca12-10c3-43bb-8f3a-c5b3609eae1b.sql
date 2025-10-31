-- Add username to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create channel_messages table
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_edited BOOLEAN DEFAULT false
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_edited BOOLEAN DEFAULT false
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_edited BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can view channels they are members of" ON public.channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channels.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create channels" ON public.channels FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Channel owners can update their channels" ON public.channels FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Channel owners can delete their channels" ON public.channels FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members" ON public.channel_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Channel owners can add members" ON public.channel_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of" ON public.groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for group_members
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);

CREATE POLICY "Group owners and admins can add members" ON public.group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their friend requests" ON public.friend_requests FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their friend requests" ON public.friend_requests FOR DELETE USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

CREATE POLICY "System can create friendships" ON public.friendships FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for channel_messages
CREATE POLICY "Users can view channel messages" ON public.channel_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid())
);

CREATE POLICY "Channel owners can send messages" ON public.channel_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can update their own messages" ON public.channel_messages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.channel_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_messages
CREATE POLICY "Users can view group messages" ON public.group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

CREATE POLICY "Group members can send messages" ON public.group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own messages" ON public.group_messages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.group_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their direct messages" ON public.direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send direct messages to friends" ON public.direct_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.friendships WHERE 
    (user_id = auth.uid() AND friend_id = receiver_id) OR
    (user_id = receiver_id AND friend_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_messages_updated_at BEFORE UPDATE ON public.channel_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_messages_updated_at BEFORE UPDATE ON public.group_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle friendship creation
CREATE OR REPLACE FUNCTION create_friendship(request_id UUID)
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req FROM public.friend_requests WHERE id = request_id;
  
  IF req.status = 'accepted' THEN
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.sender_id, req.receiver_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.receiver_id, req.sender_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-join announcement channel
CREATE OR REPLACE FUNCTION auto_join_announcement_channel()
RETURNS TRIGGER AS $$
DECLARE
  announcement_channel_id UUID;
BEGIN
  -- Find the announcement channel (owned by IngIconic)
  SELECT c.id INTO announcement_channel_id
  FROM public.channels c
  JOIN public.profiles p ON c.owner_id = p.id
  WHERE p.username = 'IngIconic'
  LIMIT 1;
  
  IF announcement_channel_id IS NOT NULL THEN
    INSERT INTO public.channel_members (channel_id, user_id)
    VALUES (announcement_channel_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-join announcement channel
CREATE TRIGGER on_user_created_join_channel
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION auto_join_announcement_channel();