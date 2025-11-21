-- Create study_battle_queue table for matchmaking
CREATE TABLE IF NOT EXISTS public.study_battle_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_battle_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own queue entries"
  ON public.study_battle_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue entries"
  ON public.study_battle_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries"
  ON public.study_battle_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster matching
CREATE INDEX idx_battle_queue_subject_status ON public.study_battle_queue(subject, status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_battle_queue;