-- Remove automatic public group join trigger and function
DROP TRIGGER IF EXISTS add_user_to_public_group_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.add_user_to_public_group() CASCADE;

-- Remove automatic announcement channel join trigger and function
DROP TRIGGER IF EXISTS on_profile_created_join_announcement ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_join_announcement_channel() CASCADE;