-- ==============================================================================
-- MSWDO CARMEN MIGRATION: BENEFIT PROGRAMS & BENEFIT CLAIMS TABLES
-- Run this script in your Supabase SQL Editor to add the benefit_programs and benefit_claims tables.
-- ==============================================================================

-- 1. Create public.benefit_programs Table
CREATE TABLE IF NOT EXISTS public.benefit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '₱1,000.00',
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create public.benefit_claims Table
CREATE TABLE IF NOT EXISTS public.benefit_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT UNIQUE NOT NULL,
  program_id UUID REFERENCES public.benefit_programs(id) ON DELETE SET NULL,
  member_id TEXT,
  member_name TEXT NOT NULL,
  benefit_name TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '₱1,000.00',
  release_method TEXT DEFAULT 'Cash',
  release_date DATE DEFAULT CURRENT_DATE,
  reference_no TEXT,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Cancelled', 'Rejected')),
  processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.benefit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_claims ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Benefit Programs
DROP POLICY IF EXISTS "Anyone can view benefit programs" ON public.benefit_programs;
DROP POLICY IF EXISTS "Staff can manage benefit programs" ON public.benefit_programs;

CREATE POLICY "Anyone can view benefit programs"
  ON public.benefit_programs FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage benefit programs"
  ON public.benefit_programs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. RLS Policies for Benefit Claims
DROP POLICY IF EXISTS "Anyone can view benefit claims" ON public.benefit_claims;
DROP POLICY IF EXISTS "Staff can manage benefit claims" ON public.benefit_claims;

CREATE POLICY "Anyone can view benefit claims"
  ON public.benefit_claims FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage benefit claims"
  ON public.benefit_claims FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Insert initial seed programs and claims
INSERT INTO public.benefit_programs (code, name, description, sector, amount, status)
VALUES
  ('BEN-001', 'Ayuda Sa Kabataan', 'This ''Ayuda'' is for Youth', 'Youth', '₱1,000.00', 'Active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.benefit_claims (claim_number, member_id, member_name, benefit_name, amount, release_date, status)
VALUES
  ('CLM-001', 'MSWDO-87656', 'Neil M Delante', 'Ayuda Sa Kabataan', '₱1,000.00', '2026-09-11', 'Pending'),
  ('CLM-002', 'MSWDO-87656', 'Neil M Delante', 'Ayuda Sa Kabataan', '₱1,000.00', '2026-09-10', 'Cancelled'),
  ('CLM-003', 'MSWDO-87656', 'Neil M Delante', 'Ayuda Sa Kabataan', '₱1,000.00', '2026-09-03', 'Cancelled'),
  ('CLM-004', 'MSWDO-87656', 'Neil M Delante', 'Ayuda Sa Kabataan', '₱1,000.00', '2026-09-03', 'Processed')
ON CONFLICT (claim_number) DO NOTHING;
