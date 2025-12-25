-- Fix infinite recursion issues by replacing policies that query public.profiles
-- Use has_role() function instead to avoid recursion

-- 1. Fix auth_codes table
DROP POLICY IF EXISTS "Admins can manage auth codes" ON public.auth_codes;
CREATE POLICY "Admins can manage auth codes"
ON public.auth_codes
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Fix profiles table (remove recursive admin policies)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Fix video_categories table
DROP POLICY IF EXISTS "Admins can manage categories" ON public.video_categories;
CREATE POLICY "Admins can manage categories"
ON public.video_categories
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Fix voice_assessment_models table
DROP POLICY IF EXISTS "Admins can manage voice assessment models" ON public.voice_assessment_models;
CREATE POLICY "Admins can manage voice assessment models"
ON public.voice_assessment_models
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));