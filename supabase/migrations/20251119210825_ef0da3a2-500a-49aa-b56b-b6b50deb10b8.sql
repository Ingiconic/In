-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
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

-- Create study calendar events table
CREATE TABLE public.study_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  duration INTEGER, -- in minutes
  subject TEXT,
  completed BOOLEAN DEFAULT false,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'reminder', 'level_up', 'friend_request', 'system'
  icon TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shop items table
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'theme', 'avatar', 'power_up', 'boost'
  price_coins INTEGER NOT NULL,
  icon TEXT,
  rarity TEXT DEFAULT 'common',
  is_available BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user purchases table
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, item_id)
);

-- Add theme preference to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
ADD COLUMN IF NOT EXISTS active_avatar TEXT,
ADD COLUMN IF NOT EXISTS active_theme TEXT;

-- Enable RLS
ALTER TABLE public.study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_events
CREATE POLICY "Users can manage their own events"
  ON public.study_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for shop_items
CREATE POLICY "Everyone can view available shop items"
  ON public.shop_items FOR SELECT
  USING (is_available = true);

-- RLS Policies for user_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.user_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Function to purchase item
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  _item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_price INTEGER;
  user_coins INTEGER;
  item_data RECORD;
BEGIN
  -- Get item details
  SELECT * INTO item_data
  FROM shop_items
  WHERE id = _item_id AND is_available = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or not available';
  END IF;
  
  item_price := item_data.price_coins;
  
  -- Get user coins
  SELECT coins INTO user_coins
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user has enough coins
  IF user_coins < item_price THEN
    RAISE EXCEPTION 'سکه کافی نیست';
  END IF;
  
  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM user_purchases WHERE user_id = auth.uid() AND item_id = _item_id) THEN
    RAISE EXCEPTION 'You already own this item';
  END IF;
  
  -- Deduct coins
  UPDATE profiles
  SET coins = coins - item_price
  WHERE id = auth.uid();
  
  -- Log transaction
  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (auth.uid(), -item_price, 'shop_purchase_' || item_data.name);
  
  -- Add purchase
  INSERT INTO user_purchases (user_id, item_id)
  VALUES (auth.uid(), _item_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'item', row_to_json(item_data)
  );
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT,
  _icon TEXT DEFAULT NULL,
  _action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, icon, action_url)
  VALUES (_user_id, _title, _message, _type, _icon, _action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger to send achievement notification
CREATE OR REPLACE FUNCTION notify_achievement_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_data RECORD;
BEGIN
  SELECT * INTO achievement_data
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  PERFORM create_notification(
    NEW.user_id,
    'جایزه جدید! 🎉',
    'شما جایزه "' || achievement_data.name_fa || '" را باز کردید!',
    'achievement',
    achievement_data.icon,
    '/progress'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_achievement
AFTER INSERT ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION notify_achievement_unlock();

-- Update study events timestamp
CREATE TRIGGER trigger_update_study_events
BEFORE UPDATE ON study_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample shop items
INSERT INTO shop_items (name, name_fa, description, item_type, price_coins, icon, rarity) VALUES
('Dark Theme', 'پوسته تاریک', 'یک پوسته زیبا با رنگ‌های تیره', 'theme', 100, '🌙', 'common'),
('Ocean Theme', 'پوسته اقیانوس', 'پوسته‌ای با رنگ‌های آبی و آرامش‌بخش', 'theme', 150, '🌊', 'rare'),
('Sunset Theme', 'پوسته غروب', 'پوسته‌ای با رنگ‌های گرم غروب', 'theme', 150, '🌅', 'rare'),
('Forest Theme', 'پوسته جنگل', 'پوسته‌ای با رنگ‌های سبز و طبیعت', 'theme', 200, '🌲', 'epic'),
('Space Theme', 'پوسته فضایی', 'پوسته‌ای با طرح کهکشانی', 'theme', 300, '🌌', 'legendary'),

('2x XP Boost', 'دو برابر XP', 'XP دریافتی شما برای 24 ساعت دو برابر می‌شود', 'boost', 200, '⚡', 'rare'),
('Coin Multiplier', 'ضریب سکه', 'سکه‌های دریافتی برای 24 ساعت 1.5 برابر می‌شود', 'boost', 250, '💰', 'rare'),
('Streak Freeze', 'یخ زدن Streak', 'اگر یک روز فعالیت نکنید، Streak شما حفظ می‌شود', 'power_up', 300, '❄️', 'epic'),

('Student Avatar', 'آواتار دانش‌آموز', 'آواتار ویژه دانش‌آموز', 'avatar', 50, '👨‍🎓', 'common'),
('Genius Avatar', 'آواتار نابغه', 'آواتار ویژه نابغه', 'avatar', 200, '🧠', 'rare'),
('Champion Avatar', 'آواتار قهرمان', 'آواتار ویژه قهرمان', 'avatar', 500, '🏆', 'legendary');