-- Fix infinite recursion in RLS policies for channel_members and group_members

-- Create helper function to check channel membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_channel_member(
  _user_id UUID,
  _channel_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM channel_members
    WHERE user_id = _user_id
      AND channel_id = _channel_id
  )
$$;

-- Create helper function to check group membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(
  _user_id UUID,
  _group_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Fix channel_members SELECT policy (remove self-reference)
DROP POLICY IF EXISTS "Users can view channel members" ON channel_members;

CREATE POLICY "Users can view channel members"
ON channel_members FOR SELECT
USING (
  user_id = auth.uid()
  OR
  public.is_channel_member(auth.uid(), channel_id)
);

-- Fix group_members SELECT policy (remove self-reference)
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
USING (
  user_id = auth.uid()
  OR
  public.is_group_member(auth.uid(), group_id)
);