-- Add admin role for METIADMIN user
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE username = 'METIADMIN'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to give/take coins (admin only)
CREATE OR REPLACE FUNCTION admin_adjust_user_coins(
  target_user_id UUID,
  coin_amount INTEGER,
  adjustment_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can adjust user coins';
  END IF;

  -- Update coins
  UPDATE profiles
  SET coins = GREATEST(0, coins + coin_amount)
  WHERE id = target_user_id;

  -- Log transaction
  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (target_user_id, coin_amount, adjustment_reason);
END;
$$;