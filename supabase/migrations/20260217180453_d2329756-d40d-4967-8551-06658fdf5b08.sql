
-- Table for translated sport news articles (each news becomes a page)
CREATE TABLE public.sport_news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_original TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  source_name TEXT,
  source_url TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'football',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_translated BOOLEAN DEFAULT false,
  lang TEXT DEFAULT 'fa'
);

-- Enable RLS
ALTER TABLE public.sport_news_articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Everyone can view sport news" ON public.sport_news_articles
  FOR SELECT USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sport_news_articles;
