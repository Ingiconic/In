-- Fix RLS policies for channels and groups to work with triggers

-- Drop and recreate the set_owner_id function to ensure it works correctly
DROP FUNCTION IF EXISTS public.set_owner_id() CASCADE;

CREATE OR REPLACE FUNCTION public.set_owner_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate triggers
DROP TRIGGER IF EXISTS set_owner_id_channels ON public.channels;
DROP TRIGGER IF EXISTS set_owner_id_groups ON public.groups;

CREATE TRIGGER set_owner_id_channels
BEFORE INSERT ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

CREATE TRIGGER set_owner_id_groups
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

-- Make sure owner_id columns allow NULL temporarily during insert
ALTER TABLE public.channels ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.groups ALTER COLUMN owner_id DROP NOT NULL;

-- Add constraint to ensure owner_id is set after trigger
ALTER TABLE public.channels ADD CONSTRAINT channels_owner_id_check CHECK (owner_id IS NOT NULL);
ALTER TABLE public.groups ADD CONSTRAINT groups_owner_id_check CHECK (owner_id IS NOT NULL);