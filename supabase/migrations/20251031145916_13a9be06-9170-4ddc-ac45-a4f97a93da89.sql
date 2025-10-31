-- Add points system to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add exam_count to track number of exams taken
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exams_taken INTEGER DEFAULT 0;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);

-- Update the exams table to track points awarded
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;