-- Fix 1: Update profiles RLS policy to allow viewing friends, group members, and channel members
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view relevant profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM friendships WHERE user_id = auth.uid() AND friend_id = profiles.id) OR
  EXISTS (
    SELECT 1 FROM group_members gm1 
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id 
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
  ) OR
  EXISTS (
    SELECT 1 FROM channel_members cm1 
    JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id 
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
  )
);

-- Fix 2: Add authorization check to create_friendship function
CREATE OR REPLACE FUNCTION public.create_friendship(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req FROM public.friend_requests WHERE id = request_id;
  
  -- CRITICAL: Verify the caller is the receiver who accepted
  IF req.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Only the receiver can accept friend requests';
  END IF;
  
  IF req.status = 'accepted' THEN
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.sender_id, req.receiver_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.receiver_id, req.sender_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Fix 3: Update handle_new_user function with correct search_path syntax
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, grade, field, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'کاربر'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'grade',
    NEW.raw_user_meta_data->>'field',
    (NEW.raw_user_meta_data->>'birth_date')::date
  );
  RETURN NEW;
END;
$$;

-- Fix 4: Add input validation constraints
ALTER TABLE profiles ADD CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30);
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$');

ALTER TABLE channel_messages ADD CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000);
ALTER TABLE group_messages ADD CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000);
ALTER TABLE direct_messages ADD CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000);

ALTER TABLE channels ADD CONSTRAINT channel_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100);
ALTER TABLE groups ADD CONSTRAINT group_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100);