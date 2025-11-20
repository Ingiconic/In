-- Fix RLS policy to allow users to send messages to themselves (for saved messages feature)
DROP POLICY IF EXISTS "Users can send direct messages to friends" ON direct_messages;

CREATE POLICY "Users can send direct messages to friends or self"
ON direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    -- Allow sending to self (for saved messages)
    sender_id = receiver_id
    OR
    -- Or if they are friends
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (
        (friendships.user_id = auth.uid() AND friendships.friend_id = direct_messages.receiver_id)
        OR
        (friendships.user_id = direct_messages.receiver_id AND friendships.friend_id = auth.uid())
      )
    )
  )
);