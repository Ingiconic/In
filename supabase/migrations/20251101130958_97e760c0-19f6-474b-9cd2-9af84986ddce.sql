-- Update award_exam_points function with defensive validation to prevent point manipulation
CREATE OR REPLACE FUNCTION public.award_exam_points(
  points_to_award integer,
  exam_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  exam_record RECORD;
BEGIN
  -- 1. Validate points range
  IF points_to_award < 0 OR points_to_award > 50 THEN
    RAISE EXCEPTION 'Invalid points amount: must be between 0 and 50';
  END IF;

  -- 2. Verify exam exists and belongs to user
  SELECT user_id, points_awarded, completed_at 
  INTO exam_record
  FROM exams
  WHERE id = exam_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  IF exam_record.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Exam does not belong to current user';
  END IF;

  -- 3. Prevent double-claiming points
  IF exam_record.points_awarded IS NOT NULL THEN
    RAISE EXCEPTION 'Points already awarded for this exam';
  END IF;

  -- 4. Update profile with points and exam count
  UPDATE profiles SET 
    points = points + points_to_award,
    exams_taken = exams_taken + 1
  WHERE id = auth.uid();

  -- 5. Log points transaction
  INSERT INTO points_history (user_id, points_change, reason, exam_id)
  VALUES (auth.uid(), points_to_award, 'exam_completion', exam_id_param);
  
  -- 6. Mark exam as processed to prevent re-claiming
  UPDATE exams
  SET points_awarded = points_to_award
  WHERE id = exam_id_param;
END;
$function$;