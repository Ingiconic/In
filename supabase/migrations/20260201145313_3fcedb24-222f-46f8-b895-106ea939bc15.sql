-- Create handout categories table with nested support
CREATE TABLE public.handout_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.handout_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create handouts table
CREATE TABLE public.handouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.handout_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  page_count INTEGER,
  author TEXT,
  grade TEXT,
  subject TEXT,
  tags TEXT[] DEFAULT '{}',
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR DEFAULT 'pending',
  uploaded_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handout_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handouts ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Everyone can view active categories"
  ON public.handout_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.handout_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Handouts policies
CREATE POLICY "Everyone can view approved active handouts"
  ON public.handouts FOR SELECT
  USING (is_active = true AND status = 'approved');

CREATE POLICY "Admins can view all handouts"
  ON public.handouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage handouts"
  ON public.handouts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create storage bucket for handouts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('handouts', 'handouts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view handout files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'handouts');

CREATE POLICY "Admins can upload handout files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'handouts' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update handout files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'handouts' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete handout files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'handouts' AND has_role(auth.uid(), 'admin'));

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_handout_downloads(handout_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE handouts SET downloads_count = downloads_count + 1 WHERE id = handout_id_param;
END;
$$;