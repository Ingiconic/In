-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'study', 'social', 'progress', 'special'
  requirement_type TEXT NOT NULL, -- 'exams_count', 'points_total', 'streak_days', 'friends_count', etc.
  requirement_value INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create levels table
CREATE TABLE public.levels (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT
);

-- Add level and xp to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Everyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others achievements"
  ON public.user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = user_achievements.user_id)
         OR (friend_id = auth.uid() AND user_id = user_achievements.user_id)
    )
  );

-- RLS Policies for levels
CREATE POLICY "Everyone can view levels"
  ON public.levels FOR SELECT
  USING (true);

-- Function to award XP and handle level ups
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id UUID,
  _xp_amount INTEGER,
  _reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  level_up BOOLEAN := FALSE;
  next_level_xp INTEGER;
  coins_rewarded INTEGER := 0;
BEGIN
  -- Get current stats
  SELECT xp, level INTO current_xp, current_level
  FROM profiles
  WHERE id = _user_id;
  
  new_xp := current_xp + _xp_amount;
  new_level := current_level;
  
  -- Check for level up
  LOOP
    SELECT xp_required INTO next_level_xp
    FROM levels
    WHERE level = new_level + 1;
    
    EXIT WHEN next_level_xp IS NULL OR new_xp < next_level_xp;
    
    new_level := new_level + 1;
    level_up := TRUE;
    
    -- Award level up coins
    SELECT reward_coins INTO coins_rewarded
    FROM levels
    WHERE level = new_level;
  END LOOP;
  
  -- Update profile
  UPDATE profiles
  SET 
    xp = new_xp,
    level = new_level,
    coins = coins + COALESCE(coins_rewarded, 0)
  WHERE id = _user_id;
  
  -- Log coin transaction if coins were awarded
  IF coins_rewarded > 0 THEN
    INSERT INTO coin_transactions (user_id, amount, reason)
    VALUES (_user_id, coins_rewarded, 'level_up_' || new_level);
  END IF;
  
  RETURN jsonb_build_object(
    'level_up', level_up,
    'old_level', current_level,
    'new_level', new_level,
    'xp', new_xp,
    'coins_rewarded', coins_rewarded
  );
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_achievements JSONB := '[]'::jsonb;
  achievement RECORD;
  user_stats RECORD;
  meets_requirement BOOLEAN;
BEGIN
  -- Get user stats
  SELECT 
    points, 
    exams_taken, 
    streak_days,
    (SELECT COUNT(*) FROM friendships WHERE user_id = _user_id) as friends_count,
    (SELECT COUNT(*) FROM questions WHERE user_id = _user_id) as questions_asked,
    (SELECT COUNT(*) FROM flashcard_decks WHERE user_id = _user_id) as decks_created
  INTO user_stats
  FROM profiles
  WHERE id = _user_id;
  
  -- Check each achievement
  FOR achievement IN 
    SELECT a.* FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    )
  LOOP
    meets_requirement := FALSE;
    
    CASE achievement.requirement_type
      WHEN 'exams_count' THEN
        meets_requirement := user_stats.exams_taken >= achievement.requirement_value;
      WHEN 'points_total' THEN
        meets_requirement := user_stats.points >= achievement.requirement_value;
      WHEN 'streak_days' THEN
        meets_requirement := user_stats.streak_days >= achievement.requirement_value;
      WHEN 'friends_count' THEN
        meets_requirement := user_stats.friends_count >= achievement.requirement_value;
      WHEN 'questions_asked' THEN
        meets_requirement := user_stats.questions_asked >= achievement.requirement_value;
      WHEN 'decks_created' THEN
        meets_requirement := user_stats.decks_created >= achievement.requirement_value;
    END CASE;
    
    IF meets_requirement THEN
      -- Award achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (_user_id, achievement.id);
      
      -- Award rewards
      UPDATE profiles
      SET 
        coins = coins + COALESCE(achievement.reward_coins, 0)
      WHERE id = _user_id;
      
      -- Award XP through the award_xp function
      IF achievement.reward_xp > 0 THEN
        PERFORM award_xp(_user_id, achievement.reward_xp, 'achievement_' || achievement.id);
      END IF;
      
      -- Log coin transaction
      IF achievement.reward_coins > 0 THEN
        INSERT INTO coin_transactions (user_id, amount, reason)
        VALUES (_user_id, achievement.reward_coins, 'achievement_' || achievement.name);
      END IF;
      
      new_achievements := new_achievements || jsonb_build_object(
        'id', achievement.id,
        'name', achievement.name_fa,
        'icon', achievement.icon,
        'reward_coins', achievement.reward_coins,
        'reward_xp', achievement.reward_xp
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('new_achievements', new_achievements);
END;
$$;

-- Insert initial levels
INSERT INTO levels (level, name, name_fa, xp_required, reward_coins, color) VALUES
(1, 'Beginner', 'مبتدی', 0, 0, '#94a3b8'),
(2, 'Student', 'دانش‌آموز', 100, 20, '#22c55e'),
(3, 'Scholar', 'دانشجو', 250, 30, '#3b82f6'),
(4, 'Expert', 'کارشناس', 500, 50, '#a855f7'),
(5, 'Master', 'استاد', 1000, 75, '#f59e0b'),
(6, 'Genius', 'نابغه', 2000, 100, '#ef4444'),
(7, 'Legend', 'افسانه', 5000, 200, '#ec4899'),
(8, 'Champion', 'قهرمان', 10000, 300, '#14b8a6'),
(9, 'Grand Master', 'استاد بزرگ', 20000, 500, '#8b5cf6'),
(10, 'Ultimate', 'نهایی', 50000, 1000, '#f97316');

-- Insert initial achievements
INSERT INTO achievements (name, name_fa, description, icon, category, requirement_type, requirement_value, reward_coins, reward_xp, rarity) VALUES
-- Study Achievements
('First Steps', 'قدم‌های اول', 'اولین آزمون خود را تکمیل کنید', '🎯', 'study', 'exams_count', 1, 10, 20, 'common'),
('Dedicated Learner', 'یادگیرنده متعهد', '5 آزمون تکمیل کنید', '📚', 'study', 'exams_count', 5, 25, 50, 'common'),
('Quiz Master', 'استاد آزمون', '10 آزمون تکمیل کنید', '🏆', 'study', 'exams_count', 10, 50, 100, 'rare'),
('Test Champion', 'قهرمان آزمون', '25 آزمون تکمیل کنید', '👑', 'study', 'exams_count', 25, 100, 200, 'epic'),
('Exam Legend', 'افسانه آزمون', '50 آزمون تکمیل کنید', '⭐', 'study', 'exams_count', 50, 250, 500, 'legendary'),

-- Points Achievements
('Point Collector', 'جمع‌آور امتیاز', '100 امتیاز کسب کنید', '💎', 'progress', 'points_total', 100, 15, 30, 'common'),
('Rising Star', 'ستاره درخشان', '500 امتیاز کسب کنید', '🌟', 'progress', 'points_total', 500, 50, 100, 'rare'),
('Point Master', 'استاد امتیاز', '1000 امتیاز کسب کنید', '💫', 'progress', 'points_total', 1000, 100, 200, 'epic'),
('Elite Scorer', 'امتیاز‌گیر حرفه‌ای', '2500 امتیاز کسب کنید', '🔥', 'progress', 'points_total', 2500, 250, 500, 'legendary'),

-- Streak Achievements
('On Fire', 'در حال شعله‌ور شدن', '3 روز متوالی فعالیت', '🔥', 'progress', 'streak_days', 3, 20, 40, 'common'),
('Week Warrior', 'جنگجوی هفته', '7 روز متوالی فعالیت', '⚡', 'progress', 'streak_days', 7, 50, 100, 'rare'),
('Unstoppable', 'توقف‌ناپذیر', '30 روز متوالی فعالیت', '💪', 'progress', 'streak_days', 30, 200, 400, 'epic'),
('Legendary Streak', 'رکورد افسانه‌ای', '100 روز متوالی فعالیت', '🏅', 'progress', 'streak_days', 100, 500, 1000, 'legendary'),

-- Social Achievements
('Friendly', 'دوستانه', 'اولین دوست خود را اضافه کنید', '👋', 'social', 'friends_count', 1, 10, 20, 'common'),
('Social Butterfly', 'اجتماعی', '5 دوست داشته باشید', '🦋', 'social', 'friends_count', 5, 30, 60, 'rare'),
('Popular', 'محبوب', '10 دوست داشته باشید', '⭐', 'social', 'friends_count', 10, 75, 150, 'epic'),
('Community Leader', 'رهبر جامعه', '25 دوست داشته باشید', '👑', 'social', 'friends_count', 25, 200, 400, 'legendary'),

-- Question Achievements
('Curious Mind', 'ذهن کنجکاو', 'اولین سوال خود را بپرسید', '❓', 'study', 'questions_asked', 1, 10, 20, 'common'),
('Question Master', 'استاد پرسیدن', '10 سوال بپرسید', '💭', 'study', 'questions_asked', 10, 50, 100, 'rare'),

-- Flashcard Achievements  
('Card Collector', 'جمع‌آور کارت', 'اولین دسته فلش کارت خود را بسازید', '🎴', 'study', 'decks_created', 1, 10, 20, 'common'),
('Flashcard Pro', 'حرفه‌ای فلش کارت', '5 دسته فلش کارت بسازید', '📇', 'study', 'decks_created', 5, 40, 80, 'rare');

-- Trigger to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is a new day
  IF NEW.last_activity_date IS NULL OR NEW.last_activity_date < CURRENT_DATE THEN
    -- Check if streak continues (yesterday or today)
    IF NEW.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
      NEW.streak_days := COALESCE(NEW.streak_days, 0) + 1;
    ELSIF NEW.last_activity_date < CURRENT_DATE - INTERVAL '1 day' THEN
      -- Streak broken
      NEW.streak_days := 1;
    END IF;
    
    NEW.last_activity_date := CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_streak
BEFORE UPDATE OF points, exams_taken, xp ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();