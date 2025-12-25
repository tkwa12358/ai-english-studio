-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Everyone can view published videos" ON public.videos;

CREATE POLICY "Everyone can view published videos" 
ON public.videos 
FOR SELECT 
TO public
USING (is_published = true);