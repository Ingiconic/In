-- Create video categories table
CREATE TABLE public.video_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.video_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create video comments table
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.video_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Create channel subscriptions table
CREATE TABLE public.channel_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  notify BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, channel_id)
);

-- Create saved videos table
CREATE TABLE public.saved_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create watch history table
CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_categories (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.video_categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.video_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for videos
CREATE POLICY "Anyone can view public videos" ON public.videos FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own videos" ON public.videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for video_likes
CREATE POLICY "Anyone can view likes" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users can like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for video_comments
CREATE POLICY "Anyone can view comments" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.video_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.video_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for channel_subscriptions
CREATE POLICY "Anyone can view subscriptions" ON public.channel_subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can subscribe" ON public.channel_subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Users can unsubscribe" ON public.channel_subscriptions FOR DELETE USING (auth.uid() = subscriber_id);
CREATE POLICY "Users can update subscription" ON public.channel_subscriptions FOR UPDATE USING (auth.uid() = subscriber_id);

-- RLS Policies for saved_videos
CREATE POLICY "Users can view own saved" ON public.saved_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save videos" ON public.saved_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave videos" ON public.saved_videos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for watch_history
CREATE POLICY "Users can view own history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update history" ON public.watch_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can clear history" ON public.watch_history FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_comments_updated_at BEFORE UPDATE ON public.video_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment video views
CREATE OR REPLACE FUNCTION public.increment_video_views(video_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE videos SET views_count = views_count + 1 WHERE id = video_id_param;
END;
$$;

-- Function to toggle video like
CREATE OR REPLACE FUNCTION public.toggle_video_like(video_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  -- Check if already liked
  IF EXISTS (SELECT 1 FROM video_likes WHERE user_id = auth.uid() AND video_id = video_id_param) THEN
    -- Unlike
    DELETE FROM video_likes WHERE user_id = auth.uid() AND video_id = video_id_param;
    UPDATE videos SET likes_count = likes_count - 1 WHERE id = video_id_param;
    liked := FALSE;
  ELSE
    -- Like
    INSERT INTO video_likes (user_id, video_id) VALUES (auth.uid(), video_id_param);
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = video_id_param;
    liked := TRUE;
  END IF;
  RETURN liked;
END;
$$;

-- Function to toggle comment like
CREATE OR REPLACE FUNCTION public.toggle_comment_like(comment_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to get channel stats
CREATE OR REPLACE FUNCTION public.get_channel_stats(channel_id_param UUID)
RETURNS TABLE(subscribers_count BIGINT, videos_count BIGINT, total_views BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM channel_subscriptions WHERE channel_id = channel_id_param)::BIGINT,
    (SELECT COUNT(*) FROM videos WHERE user_id = channel_id_param)::BIGINT,
    (SELECT COALESCE(SUM(views_count), 0) FROM videos WHERE user_id = channel_id_param)::BIGINT;
END;
$$;

-- Insert default categories
INSERT INTO public.video_categories (name, name_fa, icon) VALUES
  ('math', 'ریاضی', '➗'),
  ('physics', 'فیزیک', '⚛️'),
  ('chemistry', 'شیمی', '🧪'),
  ('biology', 'زیست', '🧬'),
  ('literature', 'ادبیات', '📚'),
  ('english', 'زبان انگلیسی', '🇬🇧'),
  ('arabic', 'عربی', '🕌'),
  ('history', 'تاریخ', '📜'),
  ('geography', 'جغرافیا', '🌍'),
  ('other', 'سایر', '📹');

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('easytube-videos', 'easytube-videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('easytube-thumbnails', 'easytube-thumbnails', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'easytube-videos');
CREATE POLICY "Users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'easytube-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE USING (bucket_id = 'easytube-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails
CREATE POLICY "Anyone can view thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'easytube-thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'easytube-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'easytube-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for videos
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;