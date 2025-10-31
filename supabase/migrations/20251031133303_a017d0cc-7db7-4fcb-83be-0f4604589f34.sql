-- Add new fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field TEXT;

-- Create study_books table for educational materials
CREATE TABLE IF NOT EXISTS study_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL, -- پایه تحصیلی: اول تا دوازدهم
  field TEXT, -- رشته: ریاضی، تجربی، انسانی (برای نهم به بالا)
  subject TEXT NOT NULL, -- نام درس
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  book_type TEXT NOT NULL DEFAULT 'textbook', -- textbook, workbook, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE study_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view study books"
ON study_books FOR SELECT
USING (true);

-- Create step_by_step_solutions table
CREATE TABLE IF NOT EXISTS step_by_step_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL,
  field TEXT,
  subject TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  solution TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE step_by_step_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view solutions"
ON step_by_step_solutions FOR SELECT
USING (true);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exams"
ON exams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create exams"
ON exams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
ON exams FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_books_grade ON study_books(grade);
CREATE INDEX IF NOT EXISTS idx_study_books_subject ON study_books(subject);
CREATE INDEX IF NOT EXISTS idx_solutions_grade ON step_by_step_solutions(grade);
CREATE INDEX IF NOT EXISTS idx_solutions_subject ON step_by_step_solutions(subject);
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);