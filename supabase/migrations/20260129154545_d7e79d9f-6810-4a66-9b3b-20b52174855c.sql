-- Add approval status to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add user_id to blog_posts for user-submitted blogs
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create user blogs table for easier management
CREATE TABLE IF NOT EXISTS public.user_blogs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blogs
CREATE POLICY "Users can view their own blogs" 
ON public.user_blogs 
FOR SELECT 
USING (auth.uid() = user_id OR status = 'approved');

CREATE POLICY "Users can create their own blogs" 
ON public.user_blogs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending blogs" 
ON public.user_blogs 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete their own blogs" 
ON public.user_blogs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admin policies for user_blogs
CREATE POLICY "Admins can do anything on user_blogs"
ON public.user_blogs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for videos approval
CREATE POLICY "Admins can update any video"
ON public.videos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update videos RLS to only show approved videos publicly
DROP POLICY IF EXISTS "Anyone can view public videos" ON public.videos;
CREATE POLICY "Anyone can view approved public videos"
ON public.videos
FOR SELECT
USING (is_public = true AND status = 'approved');

-- Users can see their own videos regardless of status
CREATE POLICY "Users can view their own videos"
ON public.videos
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all videos
CREATE POLICY "Admins can view all videos"
ON public.videos
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_user_blogs_updated_at
BEFORE UPDATE ON public.user_blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();