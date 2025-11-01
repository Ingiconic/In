-- Fix 1: Secure page_views table to prevent unauthorized insertions
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;

CREATE POLICY "Users can track their own page views" ON page_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix 2: Improve create_friendship function with proper validation
CREATE OR REPLACE FUNCTION public.create_friendship(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT * INTO req 
  FROM public.friend_requests 
  WHERE id = request_id
  FOR UPDATE;
  
  -- Validate request exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found';
  END IF;
  
  -- Verify caller is receiver
  IF req.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Only receiver can accept';
  END IF;
  
  -- Check status is accepted
  IF req.status != 'accepted' THEN
    RAISE EXCEPTION 'Request not in accepted state';
  END IF;
  
  -- Prevent duplicate processing
  IF EXISTS (
    SELECT 1 FROM friendships 
    WHERE user_id = req.sender_id AND friend_id = req.receiver_id
  ) THEN
    RAISE EXCEPTION 'Friendship already exists';
  END IF;
  
  -- Create bidirectional friendship
  INSERT INTO friendships (user_id, friend_id)
  VALUES (req.sender_id, req.receiver_id),
         (req.receiver_id, req.sender_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Fix 3: Auto-set owner_id for channels and groups to prevent manipulation
CREATE OR REPLACE FUNCTION public.set_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER channels_set_owner
BEFORE INSERT ON channels
FOR EACH ROW
EXECUTE FUNCTION set_owner_id();

CREATE TRIGGER groups_set_owner
BEFORE INSERT ON groups
FOR EACH ROW
EXECUTE FUNCTION set_owner_id();

-- Fix 4: Restrict profile visibility to friends only for privacy
DROP POLICY IF EXISTS "Users can view relevant profiles" ON profiles;

CREATE POLICY "Users can view friend profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM friendships 
    WHERE user_id = auth.uid() AND friend_id = profiles.id
  )
);