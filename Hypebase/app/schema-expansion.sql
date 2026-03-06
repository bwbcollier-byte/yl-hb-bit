-- schema-expansion.sql
-- Massive expansion for Hypebase CRM and Media management

-- 1. Companies / Agencies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    logo TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' -- active, inactive, lead, client
);

-- 2. Contacts CRM
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name_full TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, inactive, lead
    avatar_url TEXT,
    location TEXT,
    about TEXT,
    social_instagram TEXT,
    social_linkedin TEXT,
    social_twitter TEXT
);

-- 3. Clubs & Teams
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    type TEXT, -- Club, Team, Group, Organization
    location TEXT,
    logo TEXT,
    description TEXT,
    website TEXT,
    status TEXT DEFAULT 'active'
);

-- 4. News Sources
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    url TEXT,
    logo TEXT,
    description TEXT,
    category TEXT
);

-- 5. News Articles
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    url TEXT,
    image TEXT,
    source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'published' -- draft, published, archived
);

-- 6. Tasks (Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'To Do', -- To Do, In Progress, Done, Late
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    due_date TIMESTAMPTZ,
    assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tags TEXT[] -- array of tags
);

-- 7. Messages / Chats
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    media_url TEXT
);

-- Enable RLS for all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Simple Permissive Policies for Demo/Admin-style App
-- In a real app, these would be filtered by tenant or user_id
CREATE POLICY "Allow public select on companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public select on contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow public select on clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Allow public select on news_sources" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Allow public select on news_articles" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "Allow public select on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public select on messages" ON public.messages FOR SELECT USING (true);

-- Allow authenticated users to perform all actions for now
CREATE POLICY "Enable all for authenticated on companies" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on contacts" ON public.contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on clubs" ON public.clubs FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on news_sources" ON public.news_sources FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on news_articles" ON public.news_articles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on tasks" ON public.tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on messages" ON public.messages FOR ALL TO authenticated USING (true);
