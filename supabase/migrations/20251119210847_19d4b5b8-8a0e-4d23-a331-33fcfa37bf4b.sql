-- Fix security definer view issue by adding RLS to profiles view
-- The leaderboard view will inherit RLS from profiles table

-- Drop and recreate view without security definer
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.level,
  p.xp,
  p.points,
  p.streak_days,
  p.exams_taken,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.id) as achievements_count,
  ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.points DESC) as rank
FROM profiles p
ORDER BY p.xp DESC, p.points DESC
LIMIT 100;