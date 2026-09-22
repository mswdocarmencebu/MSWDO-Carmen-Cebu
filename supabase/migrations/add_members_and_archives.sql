-- ==============================================================================
-- MSWDO CARMEN MIGRATION: MEMBERS & ARCHIVES TABLES
-- Run this script in your Supabase SQL Editor to add the members and archives tables.
-- ==============================================================================

-- 1. Create public.members Table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  member_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  email TEXT,
  contact_number TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
  dob DATE,
  gender TEXT,
  civil_status TEXT,
  occupation TEXT,
  complete_address TEXT,
  barangay TEXT,
  category_details JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  source_application TEXT DEFAULT 'Online Program Application',
  duplicate_of UUID REFERENCES public.members(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create public.archives Table
CREATE TABLE IF NOT EXISTS public.archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL DEFAULT 'member',
  record_id TEXT NOT NULL,
  member_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  reason TEXT DEFAULT 'Archived by administrator',
  archived_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  archived_by_name TEXT DEFAULT 'Super Admin',
  original_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Archived'
);

-- 3. Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Members Table
DROP POLICY IF EXISTS "Super Admin can manage all members" ON public.members;
DROP POLICY IF EXISTS "Staff can manage members" ON public.members;
DROP POLICY IF EXISTS "Anyone can view members" ON public.members;

CREATE POLICY "Super Admin can manage all members"
  ON public.members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin_user')
  );

CREATE POLICY "Staff can manage members"
  ON public.members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin_user', 'admin_staff'))
  );

CREATE POLICY "Anyone can view members"
  ON public.members FOR SELECT
  USING (true);

-- 5. RLS Policies for Archives Table
DROP POLICY IF EXISTS "Super Admin can manage all archives" ON public.archives;
DROP POLICY IF EXISTS "Staff can view and insert archives" ON public.archives;
DROP POLICY IF EXISTS "Anyone can view archives" ON public.archives;

CREATE POLICY "Super Admin can manage all archives"
  ON public.archives FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin_user')
  );

CREATE POLICY "Staff can view and insert archives"
  ON public.archives FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin_user', 'admin_staff'))
  );

CREATE POLICY "Anyone can view archives"
  ON public.archives FOR SELECT
  USING (true);

-- 6. Backfill existing approved applications into public.members
INSERT INTO public.members (
  application_id,
  member_id,
  full_name,
  first_name,
  middle_name,
  last_name,
  email,
  contact_number,
  category,
  status,
  dob,
  gender,
  civil_status,
  occupation,
  complete_address,
  category_details,
  documents,
  source_application,
  created_at
)
SELECT
  a.id,
  'MSWDO-' || UPPER(SUBSTRING(REPLACE(a.reference_number, 'MSWDO-2026-', '') FROM 1 FOR 6)),
  TRIM(CONCAT_WS(' ', a.first_name, NULLIF(a.middle_name, ''), a.last_name)),
  a.first_name,
  a.middle_name,
  a.last_name,
  LOWER(a.email),
  a.contact_number,
  CASE
    WHEN LOWER(a.category) = 'senior' THEN 'Senior Citizen'
    WHEN LOWER(a.category) = 'pwd' THEN 'Person with Disability (PWD)'
    WHEN LOWER(a.category) = 'women' THEN 'Women''s Welfare'
    WHEN LOWER(a.category) = 'youth' THEN 'Youth'
    ELSE 'General'
  END,
  'Active',
  a.dob,
  a.gender,
  a.civil_status,
  COALESCE(a.category_details->>'occupation', 'Resident'),
  a.complete_address,
  a.category_details,
  a.documents,
  'Online Program Application',
  COALESCE(a.submitted_at, NOW())
FROM public.applications a
WHERE a.status = 'Approved'
ON CONFLICT (member_id) DO NOTHING;
