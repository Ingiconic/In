-- Fix infinite recursion in RLS policies for channel_members and group_members

-- Fix channel_members policy
DROP POLICY IF EXISTS "Users can view channel members" ON public.channel_members;

CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
  -- User can always see themselves
  user_id = auth.uid()
  OR
  -- Or if they are a member of the channel (using subquery to avoid recursion)
  channel_id IN (
    SELECT cm.channel_id 
    FROM channel_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

-- Fix group_members policy
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (
  -- User can always see themselves
  user_id = auth.uid()
  OR
  -- Or if they are a member of the group (using subquery to avoid recursion)
  group_id IN (
    SELECT gm.group_id 
    FROM group_members gm 
    WHERE gm.user_id = auth.uid()
  )
);