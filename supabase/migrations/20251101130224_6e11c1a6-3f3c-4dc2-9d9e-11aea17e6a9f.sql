-- Create a public group for all users
INSERT INTO public.groups (name, description, owner_id)
SELECT 
  'چت عمومی ایزی درس',
  'گروه عمومی برای تمام کاربران - با دستور ! می‌توانید با هوش مصنوعی صحبت کنید',
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.groups WHERE name = 'چت عمومی ایزی درس'
);

-- Add all existing users to the public group
INSERT INTO public.group_members (group_id, user_id, is_admin)
SELECT 
  (SELECT id FROM public.groups WHERE name = 'چت عمومی ایزی درس' LIMIT 1),
  p.id,
  false
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = (SELECT id FROM public.groups WHERE name = 'چت عمومی ایزی درس' LIMIT 1)
  AND gm.user_id = p.id
);

-- Create function to auto-add new users to public group
CREATE OR REPLACE FUNCTION public.add_user_to_public_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  public_group_id UUID;
BEGIN
  -- Get the public group ID
  SELECT id INTO public_group_id
  FROM public.groups
  WHERE name = 'چت عمومی ایزی درس'
  LIMIT 1;
  
  IF public_group_id IS NOT NULL THEN
    -- Add user to public group
    INSERT INTO public.group_members (group_id, user_id, is_admin)
    VALUES (public_group_id, NEW.id, false)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-add new users to public group
DROP TRIGGER IF EXISTS add_user_to_public_group_trigger ON public.profiles;
CREATE TRIGGER add_user_to_public_group_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.add_user_to_public_group();