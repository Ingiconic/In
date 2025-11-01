-- حذف trigger و function قبلی با CASCADE
DROP FUNCTION IF EXISTS public.auto_join_announcement_channel() CASCADE;

-- فانکشن جدید برای عضویت خودکار در کانال اطلاع‌رسانی
CREATE OR REPLACE FUNCTION public.auto_join_announcement_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  announcement_channel_id UUID;
BEGIN
  -- پیدا کردن کانال اطلاع‌رسانی
  SELECT id INTO announcement_channel_id
  FROM public.channels
  WHERE name = 'اطلاع‌رسانی ایزی درس'
  LIMIT 1;
  
  IF announcement_channel_id IS NOT NULL THEN
    -- عضو کردن کاربر جدید
    INSERT INTO public.channel_members (channel_id, user_id)
    VALUES (announcement_channel_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ساخت trigger برای کاربران جدید
CREATE TRIGGER auto_join_announcement_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_announcement_channel();