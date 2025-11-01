-- Fix channel and group creation by making owner_id properly work with triggers

-- First, ensure the triggers fire BEFORE insert and set owner_id from auth.uid()
DROP TRIGGER IF EXISTS set_owner_id_channels ON public.channels;
DROP TRIGGER IF EXISTS set_owner_id_groups ON public.groups;

-- Recreate the function to handle owner_id
CREATE OR REPLACE FUNCTION public.set_owner_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Always set owner_id to current user
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$function$;

-- Create BEFORE INSERT triggers
CREATE TRIGGER set_owner_id_channels
BEFORE INSERT ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

CREATE TRIGGER set_owner_id_groups
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

-- Make sure the columns can temporarily be null during insert
-- but the trigger will always set them
ALTER TABLE public.channels ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.groups ALTER COLUMN owner_id SET DEFAULT auth.uid();