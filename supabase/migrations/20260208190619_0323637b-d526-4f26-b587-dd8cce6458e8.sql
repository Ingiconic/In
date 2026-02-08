
-- Sport cache table for matches, standings, news
CREATE TABLE public.sport_cache (
  id TEXT PRIMARY KEY,
  cache_type TEXT NOT NULL, -- 'matches', 'standings', 'news'
  data JSONB NOT NULL DEFAULT '{}',
  league_code TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sport_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sport cache is publicly readable"
ON public.sport_cache FOR SELECT USING (true);

CREATE POLICY "Service role can manage sport cache"
ON public.sport_cache FOR ALL USING (true);

CREATE INDEX idx_sport_cache_type ON public.sport_cache(cache_type);
CREATE INDEX idx_sport_cache_league ON public.sport_cache(league_code);
