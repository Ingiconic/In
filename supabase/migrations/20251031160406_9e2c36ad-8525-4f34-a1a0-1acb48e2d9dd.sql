-- Fix function search_path for security best practices

-- Drop and recreate auto_join_announcement_channel with search_path
CREATE OR REPLACE FUNCTION public.auto_join_announcement_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  announcement_channel_id UUID;
BEGIN
  -- Find the announcement channel (owned by IngIconic)
  SELECT c.id INTO announcement_channel_id
  FROM public.channels c
  JOIN public.profiles p ON c.owner_id = p.id
  WHERE p.username = 'IngIconic'
  LIMIT 1;
  
  IF announcement_channel_id IS NOT NULL THEN
    INSERT INTO public.channel_members (channel_id, user_id)
    VALUES (announcement_channel_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate update_updated_at with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop and recreate update_updated_at_column with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;