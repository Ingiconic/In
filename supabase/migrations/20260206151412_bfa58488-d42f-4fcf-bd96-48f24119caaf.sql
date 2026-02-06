
-- Add new columns to user_blogs for advanced features
ALTER TABLE public.user_blogs 
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS reading_score INTEGER,
  ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_draft JSONB;

-- Allow users to update their own blogs (for drafts, edits)
DROP POLICY IF EXISTS "Users can update their own blogs" ON public.user_blogs;
CREATE POLICY "Users can update their own blogs" 
ON public.user_blogs 
FOR UPDATE 
USING (auth.uid() = user_id);
