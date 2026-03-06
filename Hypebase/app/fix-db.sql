-- Force insert user into public.users if they exist in auth.users
INSERT INTO public.users (id, email, name_first, name_last, name_full, profile_image)
SELECT 
    id, 
    email, 
    SPLIT_PART(raw_user_meta_data->>'full_name', ' ', 1) as name_first,
    SUBSTRING(raw_user_meta_data->>'full_name' FROM POSITION(' ' IN raw_user_meta_data->>'full_name') + 1) as name_last,
    raw_user_meta_data->>'full_name' as name_full,
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture') as profile_image
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Ensure avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS on objects is permissive for avatars so they can upload unconditionally for now
CREATE POLICY "Avatar public access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar insert access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar update access" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
