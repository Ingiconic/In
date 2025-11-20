-- Create notes table for Advanced Notes feature
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  pdf_file_url TEXT,
  pdf_annotations JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON public.notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create study companion data table
CREATE TABLE IF NOT EXISTS public.study_companion_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  learning_style TEXT,
  optimal_study_times JSONB,
  focus_duration_avg INTEGER,
  preferred_subjects TEXT[],
  difficulty_areas TEXT[],
  study_patterns JSONB,
  ai_insights JSONB,
  last_analysis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.study_companion_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their companion data"
  ON public.study_companion_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create AR models table
CREATE TABLE IF NOT EXISTS public.ar_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade TEXT,
  model_type TEXT,
  model_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  price_coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ar_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view AR models"
  ON public.ar_models FOR SELECT
  USING (true);

-- Create user avatars table
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  avatar_parts JSONB NOT NULL DEFAULT '{}',
  customization_unlocks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their avatar"
  ON public.user_avatars FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user pets table
CREATE TABLE IF NOT EXISTS public.user_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  pet_type TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_level INTEGER DEFAULT 1,
  pet_xp INTEGER DEFAULT 0,
  pet_happiness INTEGER DEFAULT 100,
  pet_hunger INTEGER DEFAULT 50,
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  customization JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their pet"
  ON public.user_pets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create daily quests table
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  reward_xp INTEGER DEFAULT 50,
  reward_coins INTEGER DEFAULT 25,
  requirement_value INTEGER,
  difficulty TEXT DEFAULT 'easy',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active quests"
  ON public.daily_quests FOR SELECT
  USING (is_active = true);

-- Create user daily quests progress table
CREATE TABLE IF NOT EXISTS public.user_daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.daily_quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quest_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

ALTER TABLE public.user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quest progress"
  ON public.user_daily_quests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add new columns to profiles for gamification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pet_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_customization JSONB DEFAULT '{}';

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_companion_data_updated_at ON public.study_companion_data;
CREATE TRIGGER update_study_companion_data_updated_at
  BEFORE UPDATE ON public.study_companion_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_avatars_updated_at ON public.user_avatars;
CREATE TRIGGER update_user_avatars_updated_at
  BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_pets_updated_at ON public.user_pets;
CREATE TRIGGER update_user_pets_updated_at
  BEFORE UPDATE ON public.user_pets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default daily quests
INSERT INTO public.daily_quests (quest_type, title, title_fa, description, icon, reward_xp, reward_coins, requirement_value, difficulty) VALUES
  ('study_session', 'Study for 30 minutes', 'مطالعه ۳۰ دقیقه‌ای', 'Complete a 30-minute focus session', '📚', 50, 25, 30, 'easy'),
  ('answer_questions', 'Answer 5 questions', 'پاسخ به ۵ سوال', 'Answer 5 questions using AI', '❓', 40, 20, 5, 'easy'),
  ('complete_exam', 'Complete an exam', 'تکمیل یک آزمون', 'Finish and submit an exam', '✅', 100, 50, 1, 'medium'),
  ('create_flashcards', 'Create 10 flashcards', 'ساخت ۱۰ فلش‌کارت', 'Generate 10 flashcards', '🎴', 60, 30, 10, 'medium'),
  ('daily_login', 'Daily login', 'ورود روزانه', 'Login to the platform', '🌟', 20, 10, 1, 'easy')
ON CONFLICT DO NOTHING;