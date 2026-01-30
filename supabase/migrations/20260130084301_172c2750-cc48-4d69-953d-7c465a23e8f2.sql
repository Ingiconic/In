-- First create a helper function to get user's protected fields
CREATE OR REPLACE FUNCTION public.get_user_protected_fields(_user_id uuid)
RETURNS TABLE(coins integer, points integer, exams_taken integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.coins, p.points, p.exams_taken
  FROM profiles p
  WHERE p.id = _user_id
$$;

-- Drop the old problematic policy
DROP POLICY IF EXISTS "Users can update profile except protected fields" ON public.profiles;

-- Create new policy that uses the security definer function
CREATE POLICY "Users can update own profile safely"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  coins = (SELECT get_user_protected_fields.coins FROM get_user_protected_fields(auth.uid())) AND
  points = (SELECT get_user_protected_fields.points FROM get_user_protected_fields(auth.uid())) AND
  exams_taken = (SELECT get_user_protected_fields.exams_taken FROM get_user_protected_fields(auth.uid()))
);

-- Create blog_comments table for EasyBlog
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.user_blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blog_likes table
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.user_blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

-- Add author_name field to user_blogs
ALTER TABLE public.user_blogs ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Add likes_count to user_blogs
ALTER TABLE public.user_blogs ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- blog_comments policies
CREATE POLICY "Anyone can view comments on approved blogs"
ON public.blog_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_blogs WHERE id = blog_id AND status = 'approved'
));

CREATE POLICY "Authenticated users can create comments"
ON public.blog_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.blog_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- blog_likes policies
CREATE POLICY "Anyone can view likes"
ON public.blog_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.blog_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.blog_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create toggle blog like function
CREATE OR REPLACE FUNCTION public.toggle_blog_like(blog_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM blog_likes WHERE user_id = auth.uid() AND blog_id = blog_id_param) THEN
    DELETE FROM blog_likes WHERE user_id = auth.uid() AND blog_id = blog_id_param;
    UPDATE user_blogs SET likes_count = likes_count - 1 WHERE id = blog_id_param;
    liked := FALSE;
  ELSE
    INSERT INTO blog_likes (user_id, blog_id) VALUES (auth.uid(), blog_id_param);
    UPDATE user_blogs SET likes_count = likes_count + 1 WHERE id = blog_id_param;
    liked := TRUE;
  END IF;
  RETURN liked;
END;
$$;