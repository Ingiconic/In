-- Drop existing policies for channels and groups
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel owners can update their channels" ON public.channels;
DROP POLICY IF EXISTS "Channel owners can delete their channels" ON public.channels;
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.channels;

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Drop existing triggers and constraints
DROP TRIGGER IF EXISTS set_owner_id_channels ON public.channels;
DROP TRIGGER IF EXISTS set_owner_id_groups ON public.groups;
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_owner_id_check;
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_owner_id_check;

-- Make owner_id NOT NULL
ALTER TABLE public.channels ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.groups ALTER COLUMN owner_id SET NOT NULL;

-- Create new RLS policies for channels
CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Channel owners can update their channels"
ON public.channels
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Channel owners can delete their channels"
ON public.channels
FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view channels they are members of"
ON public.channels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = channels.id
    AND channel_members.user_id = auth.uid()
  )
);

-- Create new RLS policies for groups
CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
ON public.groups
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups"
ON public.groups
FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view groups they are members of"
ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);