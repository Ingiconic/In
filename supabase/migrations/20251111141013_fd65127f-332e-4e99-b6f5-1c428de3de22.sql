-- Create mind_maps table
CREATE TABLE IF NOT EXISTS public.mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flashcard_decks table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mind_maps
CREATE POLICY "Users can view their own mind maps"
  ON public.mind_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mind maps"
  ON public.mind_maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps"
  ON public.mind_maps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind maps"
  ON public.mind_maps FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flashcard_decks
CREATE POLICY "Users can view their own decks"
  ON public.flashcard_decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON public.flashcard_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON public.flashcard_decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.flashcard_decks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can view flashcards in their decks"
  ON public.flashcards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE flashcard_decks.id = flashcards.deck_id
    AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can create flashcards in their decks"
  ON public.flashcards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE flashcard_decks.id = flashcards.deck_id
    AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update flashcards in their decks"
  ON public.flashcards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE flashcard_decks.id = flashcards.deck_id
    AND flashcard_decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete flashcards in their decks"
  ON public.flashcards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE flashcard_decks.id = flashcards.deck_id
    AND flashcard_decks.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_mind_maps_updated_at
  BEFORE UPDATE ON public.mind_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcard_decks_updated_at
  BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();