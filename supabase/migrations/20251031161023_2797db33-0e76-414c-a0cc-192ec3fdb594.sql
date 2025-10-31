-- Secure the point system to prevent direct manipulation

-- 1. Create audit trail for points
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  exam_id UUID REFERENCES public.exams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their points history"
ON public.points_history FOR SELECT
USING (auth.uid() = user_id);

-- 2. Create SECURITY DEFINER function for awarding points
CREATE OR REPLACE FUNCTION public.award_exam_points(
  points_to_award INTEGER,
  exam_id_param UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate points are reasonable (prevent abuse even from function)
  IF points_to_award < 0 OR points_to_award > 50 THEN
    RAISE EXCEPTION 'Invalid points amount';
  END IF;

  -- Update profile
  UPDATE profiles SET 
    points = points + points_to_award,
    exams_taken = exams_taken + 1
  WHERE id = auth.uid();

  -- Log the transaction
  INSERT INTO points_history (user_id, points_change, reason, exam_id)
  VALUES (auth.uid(), points_to_award, 'exam_completion', exam_id_param);
END;
$$ LANGUAGE plpgsql;

-- 3. Restrict RLS policy to prevent direct points updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update profile except points"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent direct modification of points and exams_taken
  points = (SELECT points FROM profiles WHERE id = auth.uid()) AND
  exams_taken = (SELECT exams_taken FROM profiles WHERE id = auth.uid())
);