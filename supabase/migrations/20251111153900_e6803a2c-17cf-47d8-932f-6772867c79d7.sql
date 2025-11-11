-- Change default coins from 1000 to 100 for new users
ALTER TABLE profiles ALTER COLUMN coins SET DEFAULT 100;

-- Update existing users with 1000 coins to 100 coins
UPDATE profiles SET coins = 100 WHERE coins = 1000;