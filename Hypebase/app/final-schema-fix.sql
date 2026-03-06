-- 1. Ensure all required columns exist in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. DROP old policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 4. Create proper policies
-- Allows users to see their own data
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allows users to update their own data
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allows users to create their own record
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 5. Ensure storage policies for avatars are also robust
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;

CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Avatar Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated Avatar Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');
