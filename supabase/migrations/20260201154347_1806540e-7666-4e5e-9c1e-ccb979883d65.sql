-- =====================================================
-- Fix Messenger Platform - Complete Migration
-- =====================================================

-- 1. Add invite_link column to groups and channels if not exists
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_link TEXT UNIQUE;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS invite_link TEXT UNIQUE;

-- 2. Create function to generate random invite links (using gen_random_uuid)
CREATE OR REPLACE FUNCTION public.generate_invite_link()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'inv_' || replace(gen_random_uuid()::text, '-', '');
$$;

-- 3. Create trigger to auto-generate invite links for groups
CREATE OR REPLACE FUNCTION public.auto_generate_group_invite_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_link IS NULL THEN
    NEW.invite_link := 'inv_' || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_group_invite_link ON public.groups;
CREATE TRIGGER trigger_auto_group_invite_link
BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_group_invite_link();

-- 4. Create trigger to auto-generate invite links for channels
CREATE OR REPLACE FUNCTION public.auto_generate_channel_invite_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_link IS NULL THEN
    NEW.invite_link := 'inv_' || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_channel_invite_link ON public.channels;
CREATE TRIGGER trigger_auto_channel_invite_link
BEFORE INSERT ON public.channels
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_channel_invite_link();

-- 5. Create EasyDars public group
INSERT INTO public.groups (id, name, description, owner_id, invite_link)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'چت عمومی ایزی‌درس',
  'گروه عمومی برای همه کاربران ایزی‌درس',
  (SELECT id FROM profiles LIMIT 1),
  'inv_easydars_public'
WHERE NOT EXISTS (SELECT 1 FROM public.groups WHERE id = '00000000-0000-0000-0000-000000000001');

-- 6. Create EasyDars official channel
INSERT INTO public.channels (id, name, description, owner_id, invite_link)
SELECT 
  '00000000-0000-0000-0000-000000000002',
  'کانال رسمی ایزی‌درس',
  'اطلاع‌رسانی رسمی ایزی‌درس',
  (SELECT id FROM profiles LIMIT 1),
  'inv_easydars_official'
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE id = '00000000-0000-0000-0000-000000000002');

-- 7. Create function to auto-join new users to default group and channel
CREATE OR REPLACE FUNCTION public.auto_join_default_chats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, false)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES ('00000000-0000-0000-0000-000000000002', NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_join_default_chats ON public.profiles;
CREATE TRIGGER trigger_auto_join_default_chats
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_join_default_chats();

-- 8. Add all existing users to the public group and channel
INSERT INTO public.group_members (group_id, user_id, is_admin)
SELECT '00000000-0000-0000-0000-000000000001', id, false
FROM public.profiles
ON CONFLICT DO NOTHING;

INSERT INTO public.channel_members (channel_id, user_id)
SELECT '00000000-0000-0000-0000-000000000002', id
FROM public.profiles
ON CONFLICT DO NOTHING;

-- 9. Fix direct_messages policy - Allow messaging anyone (not just friends)
DROP POLICY IF EXISTS "Users can send direct messages to friends or self" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;

CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 10. Allow users to join groups/channels themselves
DROP POLICY IF EXISTS "Users can join groups via invite" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can add members" ON public.group_members;

CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join channels" ON public.channel_members;
DROP POLICY IF EXISTS "Channel owners can add members" ON public.channel_members;

CREATE POLICY "Users can join channels"
ON public.channel_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 11. Create functions to join via invite link
CREATE OR REPLACE FUNCTION public.join_group_by_invite(invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_record RECORD;
BEGIN
  SELECT * INTO group_record FROM public.groups WHERE invite_link = invite_code;
  
  IF group_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'لینک دعوت نامعتبر است');
  END IF;
  
  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES (group_record.id, auth.uid(), false)
  ON CONFLICT DO NOTHING;
  
  RETURN json_build_object('success', true, 'group_id', group_record.id, 'group_name', group_record.name);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_channel_by_invite(invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  channel_record RECORD;
BEGIN
  SELECT * INTO channel_record FROM public.channels WHERE invite_link = invite_code;
  
  IF channel_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'لینک دعوت نامعتبر است');
  END IF;
  
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (channel_record.id, auth.uid())
  ON CONFLICT DO NOTHING;
  
  RETURN json_build_object('success', true, 'channel_id', channel_record.id, 'channel_name', channel_record.name);
END;
$$;

-- 12. Update existing groups/channels with invite links
UPDATE public.groups SET invite_link = 'inv_' || replace(gen_random_uuid()::text, '-', '') WHERE invite_link IS NULL;
UPDATE public.channels SET invite_link = 'inv_' || replace(gen_random_uuid()::text, '-', '') WHERE invite_link IS NULL;