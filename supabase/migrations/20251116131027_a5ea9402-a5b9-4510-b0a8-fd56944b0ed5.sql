-- Fix blog_posts RLS policies - restrict to admin role only
DROP POLICY IF EXISTS "Service role can manage posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;

CREATE POLICY "Anyone can view published posts"
ON public.blog_posts
FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage all posts"
ON public.blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix friendships RLS policy - restrict INSERT to service role only (for create_friendship function)
DROP POLICY IF EXISTS "System can create friendships" ON public.friendships;

CREATE POLICY "Only service role can create friendships"
ON public.friendships
FOR INSERT
WITH CHECK (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Fix storage policies for blog-images bucket - restrict to admin role
DROP POLICY IF EXISTS "Service role can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete blog images" ON storage.objects;

CREATE POLICY "Admins can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update blog images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images' AND
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'blog-images' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');