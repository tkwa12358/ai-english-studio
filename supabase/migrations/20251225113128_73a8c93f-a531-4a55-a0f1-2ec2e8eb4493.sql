-- Fix infinite recursion by avoiding policies that query public.profiles
-- Use security-definer function public.has_role() against public.user_roles instead.

DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;

CREATE POLICY "Admins can view all videos"
ON public.videos
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage videos"
ON public.videos
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
