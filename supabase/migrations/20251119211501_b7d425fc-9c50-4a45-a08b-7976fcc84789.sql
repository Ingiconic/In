-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_topic_views(topic_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE forum_topics
  SET views_count = views_count + 1
  WHERE id = topic_id_param;
END;
$$;