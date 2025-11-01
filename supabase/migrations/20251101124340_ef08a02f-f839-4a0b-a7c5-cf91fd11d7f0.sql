-- Fix channels and groups RLS policies to work with owner_id trigger
-- The issue is that RLS checks happen BEFORE triggers, so we need to allow NULL owner_id in INSERT policy

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

-- Create new INSERT policies that allow NULL owner_id (will be set by trigger)
CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
WITH CHECK (
  owner_id IS NULL OR owner_id = auth.uid()
);

CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (
  owner_id IS NULL OR owner_id = auth.uid()
);