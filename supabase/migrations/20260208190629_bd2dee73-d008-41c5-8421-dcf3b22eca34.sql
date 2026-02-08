
-- Fix the overly permissive policy - only allow service role writes
DROP POLICY IF EXISTS "Service role can manage sport cache" ON public.sport_cache;
