-- ==============================================================================
-- MSWDO Carmen Supabase RBAC Schema: Dedicated Tables for Each Role Tier
-- Tables: public.users, public.super_admin_users, public.admin_staff_users, public.applicant_users
-- Roles: super_admin_user, admin_staff, applicant_user
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop old structures if they exist to ensure a clean migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP VIEW IF EXISTS public.itsd_users CASCADE;
DROP VIEW IF EXISTS public.inventory_staff_users CASCADE;
DROP VIEW IF EXISTS public.end_users CASCADE;
DROP TABLE IF EXISTS public.super_admin_users CASCADE;
DROP TABLE IF EXISTS public.admin_staff_users CASCADE;
DROP TABLE IF EXISTS public.applicant_users CASCADE;
DROP TABLE IF EXISTS public.archives CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.itsd_users CASCADE;
DROP TABLE IF EXISTS public.inventory_staff_users CASCADE;
DROP TABLE IF EXISTS public.end_users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Create Clean RBAC Role Enum
CREATE TYPE user_role AS ENUM (
  'super_admin_user',
  'admin_staff',
  'applicant_user'
);

-- 4. Main public.users Table (Linked 1:1 with auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'applicant_user'::user_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Dedicated Role Tables for each MSWDO role
-- 5A. SUPER ADMIN USER Table (Executive Welfare Administrators & System Oversight)
CREATE TABLE public.super_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  admin_level TEXT NOT NULL DEFAULT 'Executive Super Admin',
  office_assignment TEXT DEFAULT 'MSWDO Executive Office - Carmen LGU',
  clearance_scope TEXT DEFAULT 'Statutory Welfare Programs & System Vault',
  can_manage_users BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5B. ADMIN STAFF Table (Intake Officers, Evaluators & Welfare Caseworkers)
CREATE TABLE public.admin_staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  staff_tier TEXT NOT NULL DEFAULT 'Lead Intake Officer',
  assigned_cluster TEXT DEFAULT 'Carmen North & South Barangay Clusters',
  badge_number TEXT DEFAULT 'MSWDO-STF-014',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5C. APPLICANT USER Table (Citizens, Clients & Assistance Requesters)
CREATE TABLE public.applicant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  barangay TEXT NOT NULL DEFAULT 'Barangay Poblacion, Carmen',
  category TEXT DEFAULT 'Citizen Applicant / Beneficiary',
  client_id TEXT DEFAULT 'APPL-9024',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5D. APPLICATIONS Table (Pre-applications & Intake for Senior, PWD, Women, Youth)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('senior', 'pwd', 'women', 'youth')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Needs correction', 'Approved', 'Rejected', 'Resubmitted')),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  civil_status TEXT,
  complete_address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  category_details JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  appointment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5E. MEMBERS Table (Enrolled Beneficiaries / Approved Applicants Registry)
CREATE TABLE public.members (
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

-- 5F. ARCHIVES Table (Dedicated Archive Storage Vault for Members & Welfare Records)
CREATE TABLE public.archives (
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

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Helper function with SECURITY DEFINER to check user role without recursive policy loops
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Drop existing policies first so re-running seed.sql is 100% idempotent
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
DROP POLICY IF EXISTS "Super Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Super Admin users can view own role record" ON public.super_admin_users;
DROP POLICY IF EXISTS "Admin staff can view own role record" ON public.admin_staff_users;
DROP POLICY IF EXISTS "Applicant users can view own role record" ON public.applicant_users;
DROP POLICY IF EXISTS "Super Admin can manage all super admin users" ON public.super_admin_users;
DROP POLICY IF EXISTS "Super Admin can view all admin staff" ON public.admin_staff_users;
DROP POLICY IF EXISTS "Super Admin can view all applicant users" ON public.applicant_users;

-- Users table policies (no recursion because get_auth_user_role is SECURITY DEFINER!)
CREATE POLICY "Users can view own user record"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super Admin can view all users"
  ON public.users FOR SELECT USING (
    public.get_auth_user_role() = 'super_admin_user'
  );

-- Role-specific table policies
CREATE POLICY "Super Admin users can view own role record"
  ON public.super_admin_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin staff can view own role record"
  ON public.admin_staff_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Applicant users can view own role record"
  ON public.applicant_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super Admin can manage all super admin users"
  ON public.super_admin_users FOR ALL USING (
    public.get_auth_user_role() = 'super_admin_user'
  );

CREATE POLICY "Super Admin can view all admin staff"
  ON public.admin_staff_users FOR ALL USING (
    public.get_auth_user_role() = 'super_admin_user'
  );

CREATE POLICY "Super Admin can view all applicant users"
  ON public.applicant_users FOR ALL USING (
    public.get_auth_user_role() = 'super_admin_user'
  );

-- Applications table policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can view and track applications" ON public.applications;
DROP POLICY IF EXISTS "Staff and Super Admin can manage applications" ON public.applications;

CREATE POLICY "Anyone can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view and track applications"
  ON public.applications FOR SELECT
  USING (true);

CREATE POLICY "Staff and Super Admin can manage applications"
  ON public.applications FOR ALL
  USING (
    public.get_auth_user_role() IN ('super_admin_user', 'admin_staff')
  );

-- Members table policies
DROP POLICY IF EXISTS "Super Admin can manage all members" ON public.members;
DROP POLICY IF EXISTS "Staff can manage members" ON public.members;
DROP POLICY IF EXISTS "Anyone can view members" ON public.members;

CREATE POLICY "Super Admin can manage all members"
  ON public.members FOR ALL
  USING (public.get_auth_user_role() = 'super_admin_user');

CREATE POLICY "Staff can manage members"
  ON public.members FOR ALL
  USING (public.get_auth_user_role() IN ('super_admin_user', 'admin_staff'));

CREATE POLICY "Anyone can view members"
  ON public.members FOR SELECT
  USING (true);

-- Archives table policies
DROP POLICY IF EXISTS "Super Admin can manage all archives" ON public.archives;
DROP POLICY IF EXISTS "Staff can view and insert archives" ON public.archives;
DROP POLICY IF EXISTS "Anyone can view archives" ON public.archives;

CREATE POLICY "Super Admin can manage all archives"
  ON public.archives FOR ALL
  USING (public.get_auth_user_role() = 'super_admin_user');

CREATE POLICY "Staff can view and insert archives"
  ON public.archives FOR ALL
  USING (public.get_auth_user_role() IN ('super_admin_user', 'admin_staff'));

CREATE POLICY "Anyone can view archives"
  ON public.archives FOR SELECT
  USING (true);

-- Function: Approve application and provision applicant user account with default credentials
CREATE OR REPLACE FUNCTION public.approve_application_and_create_user(
  p_application_id UUID,
  p_temp_password TEXT DEFAULT 'MswdoPass2026!'
)
RETURNS JSONB AS $$
DECLARE
  v_app RECORD;
  v_user_id UUID;
  v_full_name TEXT;
  v_client_id TEXT;
  v_member_id TEXT;
  v_hashed_password TEXT;
  v_barangay TEXT;
BEGIN
  -- 1. Fetch target pre-application
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application record not found');
  END IF;

  v_full_name := TRIM(CONCAT_WS(' ', v_app.first_name, NULLIF(v_app.middle_name, ''), v_app.last_name));
  v_client_id := 'APPL-' || UPPER(SUBSTRING(MD5(v_app.id::text) FROM 1 FOR 6));
  v_barangay := COALESCE(v_app.complete_address, 'Barangay Poblacion, Carmen');

  -- 2. Check if auth user with this email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_app.email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_hashed_password := crypt(p_temp_password, gen_salt('bf'));

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token,
      is_sso_user, is_anonymous
    )
    VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      LOWER(v_app.email), v_hashed_password, NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', v_full_name, 'role', 'applicant_user', 'barangay', v_barangay),
      NOW(), NOW(),
      '', '', '', '',
      '', '', '', '',
      FALSE, FALSE
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', LOWER(v_app.email)),
      'email', v_user_id::text,
      NOW(), NOW(), NOW()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;

    -- Upsert in public.users
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (v_user_id, LOWER(v_app.email), v_full_name, 'applicant_user'::user_role)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = 'applicant_user'::user_role;

    -- Upsert in public.applicant_users
    INSERT INTO public.applicant_users (user_id, barangay, category, client_id)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category,
      client_id = EXCLUDED.client_id;
  ELSE
    -- User already exists: ensure applicant_users profile is configured
    INSERT INTO public.applicant_users (user_id, barangay, category, client_id)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category;
  END IF;

  -- 3. Update application status to Approved
  UPDATE public.applications
  SET
    status = 'Approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_application_id;

  -- 4. Automatically insert/upsert into public.members (Approved Applicant -> Member Registry)
  v_member_id := 'MSWDO-' || UPPER(SUBSTRING(REPLACE(v_app.reference_number, 'MSWDO-2026-', '') FROM 1 FOR 6));
  IF v_member_id IS NULL OR v_member_id = 'MSWDO-' THEN
    v_member_id := 'MSWDO-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
  END IF;

  INSERT INTO public.members (
    application_id,
    user_id,
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
    barangay,
    category_details,
    documents,
    source_application
  )
  VALUES (
    v_app.id,
    v_user_id,
    v_member_id,
    v_full_name,
    v_app.first_name,
    v_app.middle_name,
    v_app.last_name,
    LOWER(v_app.email),
    v_app.contact_number,
    CASE
      WHEN LOWER(v_app.category) = 'senior' THEN 'Senior Citizen'
      WHEN LOWER(v_app.category) = 'pwd' THEN 'Person with Disability (PWD)'
      WHEN LOWER(v_app.category) = 'women' THEN 'Women''s Welfare'
      WHEN LOWER(v_app.category) = 'youth' THEN 'Youth'
      ELSE 'General'
    END,
    'Active',
    v_app.dob,
    v_app.gender,
    v_app.civil_status,
    COALESCE(v_app.category_details->>'occupation', 'Resident'),
    v_app.complete_address,
    v_barangay,
    v_app.category_details,
    v_app.documents,
    'Online Program Application'
  )
  ON CONFLICT (member_id) DO UPDATE SET
    status = 'Active',
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'member_id', v_member_id,
    'email', LOWER(v_app.email),
    'temporary_password', p_temp_password,
    'client_id', v_client_id,
    'applicant_name', v_full_name,
    'status', 'Approved',
    'message', 'Application approved and enrolled into Members registry. Applicant credentials dispatched.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 8. Auto-provisioning trigger on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role := 'applicant_user'::user_role;
  user_full_name TEXT;
  raw_role_str TEXT;
BEGIN
  -- Determine role from metadata if specified
  raw_role_str := NEW.raw_user_meta_data->>'role';
  IF raw_role_str IS NOT NULL THEN
    IF raw_role_str = 'super_admin_user' THEN
      assigned_role := 'super_admin_user'::user_role;
    ELSIF raw_role_str = 'admin_staff' THEN
      assigned_role := 'admin_staff'::user_role;
    ELSE
      assigned_role := 'applicant_user'::user_role;
    END IF;
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, assigned_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Insert into respective dedicated role table
  IF assigned_role = 'super_admin_user' THEN
    INSERT INTO public.super_admin_users (user_id, admin_level, office_assignment)
    VALUES (NEW.id, 'Executive Tier Admin', 'MSWDO Executive Office')
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF assigned_role = 'admin_staff' THEN
    INSERT INTO public.admin_staff_users (user_id, staff_tier, assigned_cluster)
    VALUES (NEW.id, 'Intake Officer', 'Poblacion & Cluster Barangays')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.applicant_users (user_id, barangay, client_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'barangay', 'Barangay Poblacion'), 'APPL-' || SUBSTRING(NEW.id::TEXT, 1, 4))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. SEED DATA FOR EACH ROLE INTO DEDICATED ROLE TABLES
-- Default password for all seed users: Password123!
-- ==============================================================================

DO $$
DECLARE
  super_admin_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  admin_staff_user_id UUID := 'b0000000-0000-0000-0000-000000000002';
  applicant_user_id UUID := 'c0000000-0000-0000-0000-000000000003';
  hashed_password TEXT;
BEGIN
  hashed_password := crypt('Password123!', gen_salt('bf'));

  -- ----------------------------------------------------------------------------
  -- A. SUPER ADMIN USER -> auth.users, auth.identities, public.users, public.super_admin_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    super_admin_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'super.admin@mswdo.carmen.gov.ph', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alex Rivera (Super Admin)", "role": "super_admin_user"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email = EXCLUDED.email,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    super_admin_user_id, super_admin_user_id,
    jsonb_build_object('sub', super_admin_user_id::text, 'email', 'super.admin@mswdo.carmen.gov.ph'),
    'email', super_admin_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (super_admin_user_id, 'super.admin@mswdo.carmen.gov.ph', 'Alex Rivera (Super Admin)', 'super_admin_user'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = 'super.admin@mswdo.carmen.gov.ph',
    role = 'super_admin_user'::user_role,
    full_name = 'Alex Rivera (Super Admin)';

  INSERT INTO public.super_admin_users (user_id, admin_level, office_assignment, clearance_scope, can_manage_users)
  VALUES (super_admin_user_id, 'Executive Lead Admin', 'MSWDO Executive Office - Carmen LGU', 'Statutory Welfare Programs & System Vault', TRUE)
  ON CONFLICT (user_id) DO UPDATE SET
    admin_level = 'Executive Lead Admin',
    office_assignment = 'MSWDO Executive Office - Carmen LGU';

  -- ----------------------------------------------------------------------------
  -- B. ADMIN STAFF USER -> auth.users, auth.identities, public.users, public.admin_staff_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    admin_staff_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin.staff@mswdo.carmen.gov.ph', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Sarah Chen (Admin Staff)", "role": "admin_staff"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email = EXCLUDED.email,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    admin_staff_user_id, admin_staff_user_id,
    jsonb_build_object('sub', admin_staff_user_id::text, 'email', 'admin.staff@mswdo.carmen.gov.ph'),
    'email', admin_staff_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (admin_staff_user_id, 'admin.staff@mswdo.carmen.gov.ph', 'Sarah Chen (Admin Staff)', 'admin_staff'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = 'admin.staff@mswdo.carmen.gov.ph',
    role = 'admin_staff'::user_role,
    full_name = 'Sarah Chen (Admin Staff)';

  INSERT INTO public.admin_staff_users (user_id, staff_tier, assigned_cluster, badge_number)
  VALUES (admin_staff_user_id, 'Lead Welfare Evaluator', 'Central Carmen Intake Bay 4', 'MSWDO-0042')
  ON CONFLICT (user_id) DO UPDATE SET
    staff_tier = 'Lead Welfare Evaluator',
    assigned_cluster = 'Central Carmen Intake Bay 4';

  -- ----------------------------------------------------------------------------
  -- C. APPLICANT USER -> auth.users, auth.identities, public.users, public.applicant_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    applicant_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'applicant.user@mswdo.carmen.gov.ph', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Michael Torres (Applicant)", "role": "applicant_user"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email = EXCLUDED.email,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    applicant_user_id, applicant_user_id,
    jsonb_build_object('sub', applicant_user_id::text, 'email', 'applicant.user@mswdo.carmen.gov.ph'),
    'email', applicant_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (applicant_user_id, 'applicant.user@mswdo.carmen.gov.ph', 'Michael Torres (Applicant)', 'applicant_user'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = 'applicant.user@mswdo.carmen.gov.ph',
    role = 'applicant_user'::user_role,
    full_name = 'Michael Torres (Applicant)';

  INSERT INTO public.applicant_users (user_id, barangay, category, client_id)
  VALUES (applicant_user_id, 'Barangay Poblacion, Carmen', 'Social Welfare Beneficiary', 'CLNT-7719')
  ON CONFLICT (user_id) DO UPDATE SET
    barangay = 'Barangay Poblacion, Carmen',
    client_id = 'CLNT-7719';

END $$;

-- ----------------------------------------------------------------------------
-- D. PRE-APPLICATION SEED DATA (Youth, Senior Citizen, PWD, Women's Welfare)
-- ----------------------------------------------------------------------------
INSERT INTO public.applications (
  id, reference_number, category, status, first_name, middle_name, last_name,
  dob, gender, civil_status, complete_address, contact_number, email,
  category_details, documents, submitted_at
)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'MSWDO-2026-NR7FKNEAC2',
    'youth',
    'Pending',
    'Neil',
    '',
    'Delante',
    '2000-07-02',
    'Male',
    'Single',
    'Purok 3, Poblacion, Carmen, Cebu',
    '09086602701',
    'nemo.delante@gmail.com',
    '{"educationalAttainment": "College Undergraduate", "outOfSchool": "No, Currently Enrolled", "schoolName": "Cebu Technological University - Carmen", "organization": "Carmen Youth Advocates", "targetAssistance": "Educational Assistance / Scholarship"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "neil_delante_request_form.pdf", "fileType": "application/pdf", "fileSize": 184500, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "delante_psa_cert.jpg", "fileType": "image/jpeg", "fileSize": 320400, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "neil_national_id.jpg", "fileType": "image/jpeg", "fileSize": 245000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"},
      {"key": "voter_cert", "title": "Voter verification / certificate", "fileName": "delante_voter_stub.jpg", "fileType": "image/jpeg", "fileSize": 195000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'MSWDO-2026-SC20269921',
    'senior',
    'Pending',
    'Maria',
    'Gomez',
    'Reyes',
    '1958-04-12',
    'Female',
    'Widowed',
    'Sitio Riverside, Cantipay, Carmen, Cebu',
    '09298765432',
    'mary.reyes@gmail.com',
    '{"citizenship": "Filipino", "religion": "Roman Catholic", "pension": "None", "livingArrangement": "Living with Relatives", "occupation": "None", "annualIncome": "Below 50,000", "regularSupport": "No", "withDisability": "No", "hasIllness": "Hypertension"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "reyes_senior_request.pdf", "fileType": "application/pdf", "fileSize": 210000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "reyes_birth_record.jpg", "fileType": "image/jpeg", "fileSize": 390000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "reyes_postal_id.jpg", "fileType": "image/jpeg", "fileSize": 280000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '2 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'MSWDO-2026-SD99182701',
    'pwd',
    'Approved',
    'Shen',
    'M.',
    'Delante',
    '1994-05-14',
    'Female',
    'Single',
    'Barangay Poblacion, Carmen, Cebu',
    '09436232143',
    'alotajennery@gmail.com',
    '{"applicationType": "New Applicant", "disabilityType": "Orthopedic / Physical Disability", "disabilityCause": "Congenital / Inborn", "educationalAttainment": "College Graduate", "employmentStatus": "Employed"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "shen_pwd_request.pdf", "fileType": "application/pdf", "fileSize": 195000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Verified"},
      {"key": "medical_cert", "title": "Medical certificate", "fileName": "doh_med_assessment.jpg", "fileType": "image/jpeg", "fileSize": 410000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", "status": "Verified"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "shen_philhealth_id.jpg", "fileType": "image/jpeg", "fileSize": 255000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Verified"}
    ]'::jsonb,
    NOW() - INTERVAL '5 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'MSWDO-2026-WW44918290',
    'women',
    'Pending',
    'Elena',
    'Santos',
    'Bautista',
    '1988-09-18',
    'Female',
    'Single',
    'Sitio Proper, Dawis Norte, Carmen, Cebu',
    '09175543210',
    'elena.bautista@gmail.com',
    '{"isSoloParent": "Yes", "numberOfChildren": "2", "occupation": "Self-Employed / Vendor", "placeOfBirth": "Carmen, Cebu", "educationalAttainment": "High School Graduate", "monthlyIncome": "8500"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "bautista_solo_parent_req.pdf", "fileType": "application/pdf", "fileSize": 220000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "brgy_cert", "title": "Barangay certificate", "fileName": "dawis_norte_clearance.jpg", "fileType": "image/jpeg", "fileSize": 310000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "elena_birth_cert.jpg", "fileType": "image/jpeg", "fileSize": 360000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "bautista_national_id.jpg", "fileType": "image/jpeg", "fileSize": 270000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO UPDATE SET
  reference_number = EXCLUDED.reference_number,
  status = EXCLUDED.status,
  category_details = EXCLUDED.category_details,
  documents = EXCLUDED.documents;

-- ----------------------------------------------------------------------------
-- E. MEMBERS SEED DATA (Approved Beneficiaries)
-- ----------------------------------------------------------------------------
INSERT INTO public.members (
  id, application_id, member_id, full_name, first_name, middle_name, last_name,
  email, contact_number, category, status, dob, gender, civil_status,
  occupation, complete_address, barangay, source_application, created_at
)
VALUES
  (
    'm0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'MSWDO-97172',
    'Shen M Delante',
    'Shen',
    'M',
    'Delante',
    'alotajennery@gmail.com',
    '09436232143',
    'Person with Disability (PWD)',
    'Active',
    '1994-05-14',
    'Female',
    'Single',
    'Employed',
    'Poblacion, Carmen, Cebu',
    'Barangay Poblacion',
    'Online Program Application',
    NOW() - INTERVAL '12 days'
  ),
  (
    'm0000000-0000-0000-0000-000000000002',
    NULL,
    'MSWDO-87656',
    'Neil M Delante',
    'Neil',
    'M',
    'Delante',
    'neilmolinadelante@gmail.com',
    '0943632143',
    'Youth',
    'Active',
    '2005-10-28',
    'Male',
    'Single',
    'Student',
    'Dawis Norte, Carmen, Cebu',
    'Dawis Norte',
    'Assisted Counter Application',
    NOW() - INTERVAL '18 days'
  ),
  (
    'm0000000-0000-0000-0000-000000000003',
    NULL,
    'MSWDO-80714',
    'Applicant N One',
    'Applicant',
    'N',
    'One',
    'delanteneil4@gmail.com',
    '0915165156',
    'Women',
    'Active',
    '1988-07-19',
    'Female',
    'Married',
    'Self-employed',
    'Luyang, Carmen, Cebu',
    'Luyang',
    'Online Intake Portal',
    NOW() - INTERVAL '45 days'
  )
ON CONFLICT (member_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;

-- ==============================================================================
-- 10. REPAIR & SANITIZATION FOR SUPABASE GOTRUE COMPLIANCE
-- Ensures all auth.users satisfy non-null token constraints and have auth.identities
-- ==============================================================================
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, FALSE),
  is_anonymous = COALESCE(is_anonymous, FALSE),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL
  OR is_sso_user IS NULL
  OR is_anonymous IS NULL
  OR email_confirmed_at IS NULL;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities WHERE provider = 'email')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ==============================================================================
-- 11. SUPABASE STORAGE BUCKET FOR APPLICATION DOCUMENTS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view application documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage application documents" ON storage.objects;

CREATE POLICY "Anyone can upload application documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Public can view application documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'application-documents');

CREATE POLICY "Staff can manage application documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'application-documents' AND
    public.get_auth_user_role() IN ('super_admin_user', 'admin_staff')
  );

-- ==============================================================================
-- 12. BENEFIT PROGRAMS & BENEFIT CLAIMS TABLES
-- ==============================================================================
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

ALTER TABLE public.benefit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view benefit programs" ON public.benefit_programs;
DROP POLICY IF EXISTS "Staff can manage benefit programs" ON public.benefit_programs;

CREATE POLICY "Anyone can view benefit programs"
  ON public.benefit_programs FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage benefit programs"
  ON public.benefit_programs FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view benefit claims" ON public.benefit_claims;
DROP POLICY IF EXISTS "Staff can manage benefit claims" ON public.benefit_claims;

CREATE POLICY "Anyone can view benefit claims"
  ON public.benefit_claims FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage benefit claims"
  ON public.benefit_claims FOR ALL
  USING (true)
  WITH CHECK (true);

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


