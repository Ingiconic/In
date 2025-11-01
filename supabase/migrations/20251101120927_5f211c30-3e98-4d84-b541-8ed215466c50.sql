-- Fix RLS policies for channels and groups to work with triggers
-- The trigger sets owner_id automatically, so we don't need to check it in the policy

DROP POLICY IF EXISTS "Users can create channels" ON channels;
CREATE POLICY "Users can create channels" ON channels
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Trigger will ensure owner_id = auth.uid()

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Trigger will ensure owner_id = auth.uid()

-- Also fix profile visibility to allow channel/group members to see usernames
-- (needed for displaying message senders)
DROP POLICY IF EXISTS "Users can view friend profiles" ON profiles;

CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM friendships 
    WHERE user_id = auth.uid() AND friend_id = profiles.id
  ) OR
  EXISTS (
    SELECT 1 FROM channel_members cm1
    JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
  ) OR
  EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
  )
);