-- ==============================================================================
-- MSWDO CARMEN MIGRATION: ANNOUNCEMENTS & BULLETINS TABLE
-- Run this script in your Supabase SQL Editor to add the announcements table.
-- ==============================================================================

-- 1. Create public.announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience JSONB NOT NULL DEFAULT '[]'::jsonb,
  expiry DATE,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast filtering and ordering
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Announcements
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff and Admin can manage announcements" ON public.announcements;

CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Staff and Admin can manage announcements"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);
