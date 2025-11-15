-- ============================================
-- CRITICAL SECURITY FIX: Secure Coin System
-- ============================================

-- Step 1: Fix RLS policy on profiles to protect coins field
DROP POLICY IF EXISTS "Users can update profile except points" ON profiles;

CREATE POLICY "Users can update profile except protected fields"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  coins = (SELECT coins FROM profiles WHERE id = auth.uid()) AND
  points = (SELECT points FROM profiles WHERE id = auth.uid()) AND
  exams_taken = (SELECT exams_taken FROM profiles WHERE id = auth.uid())
);

-- Step 2: Create atomic coin deduction function with race condition protection
CREATE OR REPLACE FUNCTION public.deduct_user_coins(
  _amount INTEGER,
  _reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Atomic check and deduct in single transaction
  UPDATE profiles
  SET coins = coins - _amount
  WHERE id = auth.uid() AND coins >= _amount
  RETURNING coins INTO new_balance;
  
  -- If no row updated, user doesn't have enough coins
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Log the transaction (using service role privileges)
  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (auth.uid(), -_amount, _reason);
  
  RETURN TRUE;
END;
$$;

-- Step 3: Create function to check user coins (without deducting)
CREATE OR REPLACE FUNCTION public.get_user_coins()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_coins INTEGER;
BEGIN
  SELECT coins INTO user_coins
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_coins, 0);
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.deduct_user_coins(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_coins() TO authenticated;