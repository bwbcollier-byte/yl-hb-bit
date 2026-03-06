-- 1. COUNTRIES
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country_code TEXT,
    about TEXT,
    region TEXT,
    flag_square TEXT,
    flag_emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    project_type TEXT,
    description TEXT,
    owner_company TEXT,
    owner_contact TEXT,
    owner_user TEXT,
    admin_users TEXT[] DEFAULT '{}',
    invited_talent_profiles TEXT[] DEFAULT '{}',
    applied_talent_profiles TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROJECT APPLICATIONS
CREATE TABLE IF NOT EXISTS public.project_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_applied UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_applied TEXT,
    talent_applied TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PROJECT INVITATIONS
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_invited UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_sent TEXT,
    talent_invited TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    details TEXT,
    parent_task UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_owner TEXT,
    user_creator TEXT,
    status TEXT DEFAULT 'pending',
    task_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    participants TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    user_admin_creator TEXT,
    attached_project UUID REFERENCES public.projects(id),
    attached_talent TEXT,
    attached_event TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CONVERSATION MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    parent_conversation UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_from TEXT,
    user_tagged TEXT[] DEFAULT '{}',
    user_emojied TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
