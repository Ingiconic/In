-- Create forum categories
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum topics
CREATE TABLE public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reply votes
CREATE TABLE public.forum_reply_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL, -- 'upvote' or 'downvote'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Create focus sessions table
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  subject TEXT,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create user themes table
CREATE TABLE public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme_mode TEXT DEFAULT 'light', -- 'light', 'dark', 'system'
  color_scheme TEXT DEFAULT 'blue', -- 'blue', 'purple', 'green', 'red', 'orange'
  font_family TEXT DEFAULT 'default', -- 'default', 'serif', 'mono'
  font_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories
CREATE POLICY "Everyone can view forum categories"
  ON public.forum_categories FOR SELECT
  USING (true);

-- RLS Policies for forum_topics
CREATE POLICY "Everyone can view forum topics"
  ON public.forum_topics FOR SELECT
  USING (true);

CREATE POLICY "Users can create topics"
  ON public.forum_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics"
  ON public.forum_topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics"
  ON public.forum_topics FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for forum_replies
CREATE POLICY "Everyone can view forum replies"
  ON public.forum_replies FOR SELECT
  USING (true);

CREATE POLICY "Users can create replies"
  ON public.forum_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
  ON public.forum_replies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
  ON public.forum_replies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for forum_reply_votes
CREATE POLICY "Users can manage their own votes"
  ON public.forum_reply_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for focus_sessions
CREATE POLICY "Users can manage their own focus sessions"
  ON public.focus_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_themes
CREATE POLICY "Users can manage their own theme"
  ON public.user_themes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to vote on reply
CREATE OR REPLACE FUNCTION public.vote_forum_reply(
  _reply_id UUID,
  _vote_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing vote if any
  DELETE FROM forum_reply_votes
  WHERE reply_id = _reply_id AND user_id = auth.uid();
  
  -- Insert new vote
  INSERT INTO forum_reply_votes (reply_id, user_id, vote_type)
  VALUES (_reply_id, auth.uid(), _vote_type);
  
  -- Update upvotes count
  UPDATE forum_replies
  SET upvotes = (
    SELECT COUNT(*) FROM forum_reply_votes
    WHERE reply_id = _reply_id AND vote_type = 'upvote'
  )
  WHERE id = _reply_id;
END;
$$;

-- Triggers
CREATE TRIGGER trigger_update_forum_topics
BEFORE UPDATE ON forum_topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_forum_replies
BEFORE UPDATE ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_themes
BEFORE UPDATE ON user_themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial forum categories
INSERT INTO forum_categories (name, name_fa, description, icon) VALUES
('math', 'ریاضی', 'بحث و تبادل نظر درباره ریاضیات', '🔢'),
('physics', 'فیزیک', 'سوالات و مباحث فیزیک', '⚛️'),
('chemistry', 'شیمی', 'بحث درباره شیمی', '🧪'),
('biology', 'زیست‌شناسی', 'مباحث زیست‌شناسی', '🧬'),
('literature', 'ادبیات', 'ادبیات فارسی و عربی', '📚'),
('english', 'زبان انگلیسی', 'یادگیری زبان انگلیسی', '🌍'),
('general', 'عمومی', 'بحث‌های عمومی و آزاد', '💬'),
('study_tips', 'نکات مطالعاتی', 'تکنیک‌ها و روش‌های مطالعه', '💡');