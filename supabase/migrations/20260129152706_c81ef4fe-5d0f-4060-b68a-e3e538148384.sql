-- Fix search_path for new functions
CREATE OR REPLACE FUNCTION public.increment_video_views(video_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE videos SET views_count = views_count + 1 WHERE id = video_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_video_like(video_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM video_likes WHERE user_id = auth.uid() AND video_id = video_id_param) THEN
    DELETE FROM video_likes WHERE user_id = auth.uid() AND video_id = video_id_param;
    UPDATE videos SET likes_count = likes_count - 1 WHERE id = video_id_param;
    liked := FALSE;
  ELSE
    INSERT INTO video_likes (user_id, video_id) VALUES (auth.uid(), video_id_param);
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = video_id_param;
    liked := TRUE;
  END IF;
  RETURN liked;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_comment_like(comment_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM comment_likes WHERE user_id = auth.uid() AND comment_id = comment_id_param) THEN
    DELETE FROM comment_likes WHERE user_id = auth.uid() AND comment_id = comment_id_param;
    UPDATE video_comments SET likes_count = likes_count - 1 WHERE id = comment_id_param;
    liked := FALSE;
  ELSE
    INSERT INTO comment_likes (user_id, comment_id) VALUES (auth.uid(), comment_id_param);
    UPDATE video_comments SET likes_count = likes_count + 1 WHERE id = comment_id_param;
    liked := TRUE;
  END IF;
  RETURN liked;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_channel_stats(channel_id_param UUID)
RETURNS TABLE(subscribers_count BIGINT, videos_count BIGINT, total_views BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM channel_subscriptions WHERE channel_id = channel_id_param)::BIGINT,
    (SELECT COUNT(*) FROM videos WHERE user_id = channel_id_param)::BIGINT,
    (SELECT COALESCE(SUM(views_count), 0) FROM videos WHERE user_id = channel_id_param)::BIGINT;
END;
$$;