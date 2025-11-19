-- Add referral system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to handle referral signup
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile_id UUID;
BEGIN
  -- Generate referral code for new user
  NEW.referral_code := generate_referral_code();
  
  -- Check if referred by someone
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    -- Find referrer
    SELECT id INTO referrer_profile_id
    FROM profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    IF referrer_profile_id IS NOT NULL THEN
      -- Set referred_by
      NEW.referred_by := referrer_profile_id;
      
      -- Award 500 coins to referrer
      UPDATE profiles
      SET coins = coins + 500
      WHERE id = referrer_profile_id;
      
      -- Log transaction
      INSERT INTO coin_transactions (user_id, amount, reason)
      VALUES (referrer_profile_id, 500, 'referral_bonus');
      
      -- Create referral record
      INSERT INTO referrals (referrer_id, referred_id, reward_claimed)
      VALUES (referrer_profile_id, NEW.id, true);
      
      -- Create notification
      PERFORM create_notification(
        referrer_profile_id,
        'پاداش دعوت دریافت شد! 🎉',
        'یکی از دوستانت از لینک دعوت شما استفاده کرد و شما 500 سکه دریافت کردید!',
        'referral',
        '🎁',
        '/profile'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the handle_new_user trigger to include referral handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile_id UUID;
BEGIN
  -- Insert profile with referral code
  INSERT INTO public.profiles (id, full_name, username, grade, field, birth_date, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'کاربر'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'grade',
    NEW.raw_user_meta_data->>'field',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    generate_referral_code()
  );
  
  -- Check if referred by someone
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    -- Find referrer
    SELECT id INTO referrer_profile_id
    FROM profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    IF referrer_profile_id IS NOT NULL THEN
      -- Set referred_by
      UPDATE profiles
      SET referred_by = referrer_profile_id
      WHERE id = NEW.id;
      
      -- Award 500 coins to referrer
      UPDATE profiles
      SET coins = coins + 500
      WHERE id = referrer_profile_id;
      
      -- Log transaction
      INSERT INTO coin_transactions (user_id, amount, reason)
      VALUES (referrer_profile_id, 500, 'referral_bonus');
      
      -- Create referral record
      INSERT INTO referrals (referrer_id, referred_id, reward_claimed)
      VALUES (referrer_profile_id, NEW.id, true);
      
      -- Create notification
      PERFORM create_notification(
        referrer_profile_id,
        'پاداش دعوت دریافت شد! 🎉',
        'یکی از دوستانت از لینک دعوت شما استفاده کرد و شما 500 سکه دریافت کردید!',
        'referral',
        '🎁',
        '/profile'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();