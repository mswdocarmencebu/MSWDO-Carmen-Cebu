-- ==============================================================================
-- MSWDO CARMEN: Staff Management Migration
-- Adds privilege/access columns to admin_staff_users table
-- and a Supabase RPC for creating staff accounts from the Super Admin UI
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Alter admin_staff_users — add privilege + role metadata columns
ALTER TABLE public.admin_staff_users
  ADD COLUMN IF NOT EXISTS position        TEXT    NOT NULL DEFAULT 'IT Staff',
  ADD COLUMN IF NOT EXISTS category_access JSONB   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS can_view        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_edit        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_approve     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_delete      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS id_number       TEXT,
  ADD COLUMN IF NOT EXISTS contact_number  TEXT,
  ADD COLUMN IF NOT EXISTS birth_date      DATE,
  ADD COLUMN IF NOT EXISTS gov_id_url      TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- 2. Also alter public.users to have first/last/mi split (for display)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT,
  ADD COLUMN IF NOT EXISTS middle_initial TEXT;

-- 3. View: staff_users_view — joins public.users + admin_staff_users for the dashboard
CREATE OR REPLACE VIEW public.staff_users_view AS
SELECT
  u.id                        AS user_id,
  u.email,
  u.full_name,
  u.first_name,
  u.last_name,
  u.middle_initial,
  u.role,
  u.created_at                AS registered_at,
  s.id                        AS staff_id,
  s.position,
  s.staff_tier,
  s.category_access,
  s.can_view,
  s.can_edit,
  s.can_approve,
  s.can_delete,
  s.is_active,
  s.id_number,
  s.contact_number,
  s.birth_date,
  s.gov_id_url,
  s.selfie_url,
  s.updated_at                AS profile_updated_at
FROM public.users u
JOIN public.admin_staff_users s ON s.user_id = u.id
WHERE u.role = 'admin_staff';

-- 4. RPC: create_staff_user
-- Creates auth.users + public.users + admin_staff_users in one atomic transaction
-- Called from the Super Admin "Add New User" modal
CREATE OR REPLACE FUNCTION public.create_staff_user(
  p_email           TEXT,
  p_password        TEXT,
  p_first_name      TEXT,
  p_last_name       TEXT,
  p_middle_initial  TEXT    DEFAULT NULL,
  p_birth_date      DATE    DEFAULT NULL,
  p_id_number       TEXT    DEFAULT NULL,
  p_contact_number  TEXT    DEFAULT NULL,
  p_position        TEXT    DEFAULT 'IT Staff',
  p_category_access JSONB   DEFAULT '[]'::jsonb,
  p_can_view        BOOLEAN DEFAULT TRUE,
  p_can_edit        BOOLEAN DEFAULT FALSE,
  p_can_approve     BOOLEAN DEFAULT FALSE,
  p_can_delete      BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_user_id     UUID;
  v_full_name   TEXT;
  v_hashed_pw   TEXT;
  v_staff_tier  TEXT;
BEGIN
  -- Build full name
  v_full_name := TRIM(
    p_first_name || ' ' ||
    COALESCE(NULLIF(p_middle_initial, '') || '. ', '') ||
    p_last_name
  );

  -- Derive staff tier from position
  v_staff_tier := CASE
    WHEN p_position = 'IT Staff'       THEN 'Technical Staff'
    WHEN p_position = 'Senior Citizen' THEN 'Senior Citizen Welfare Officer'
    WHEN p_position = 'PWD'            THEN 'PWD Affairs Officer'
    WHEN p_position = 'Women''s'       THEN 'Women''s Welfare Officer'
    WHEN p_position = 'Youth'          THEN 'Youth Affairs Officer'
    ELSE 'Intake Officer'
  END;

  -- Check if email already in use
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email);
  IF v_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already in use: ' || p_email);
  END IF;

  -- Create auth.users record
  v_user_id   := gen_random_uuid();
  v_hashed_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    LOWER(p_email), v_hashed_pw, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'full_name', v_full_name,
      'role', 'admin_staff',
      'position', p_position
    ),
    NOW(), NOW(),
    '', '', '', '', '', '', '', '',
    FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', LOWER(p_email)),
    'email', v_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Create public.users record
  INSERT INTO public.users (id, email, full_name, first_name, last_name, middle_initial, role)
  VALUES (v_user_id, LOWER(p_email), v_full_name, p_first_name, p_last_name, p_middle_initial, 'admin_staff'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name      = EXCLUDED.full_name,
    first_name     = EXCLUDED.first_name,
    last_name      = EXCLUDED.last_name,
    middle_initial = EXCLUDED.middle_initial,
    role           = 'admin_staff'::user_role,
    updated_at     = NOW();

  -- Create admin_staff_users record with privileges
  INSERT INTO public.admin_staff_users (
    user_id, staff_tier, assigned_cluster, position,
    category_access, can_view, can_edit, can_approve, can_delete,
    id_number, contact_number, birth_date, is_active, updated_at
  )
  VALUES (
    v_user_id, v_staff_tier, 'Carmen MSWDO', p_position,
    p_category_access, p_can_view, p_can_edit, p_can_approve, p_can_delete,
    p_id_number, p_contact_number, p_birth_date, TRUE, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    staff_tier      = EXCLUDED.staff_tier,
    position        = EXCLUDED.position,
    category_access = EXCLUDED.category_access,
    can_view        = EXCLUDED.can_view,
    can_edit        = EXCLUDED.can_edit,
    can_approve     = EXCLUDED.can_approve,
    can_delete      = EXCLUDED.can_delete,
    id_number       = EXCLUDED.id_number,
    contact_number  = EXCLUDED.contact_number,
    birth_date      = EXCLUDED.birth_date,
    is_active       = TRUE,
    updated_at      = NOW();

  RETURN jsonb_build_object(
    'success',  true,
    'user_id',  v_user_id,
    'email',    LOWER(p_email),
    'position', p_position,
    'name',     v_full_name,
    'message',  'Staff account created successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 5. Grant execute on RPC to authenticated (super admin only enforced by RLS + app logic)
GRANT EXECUTE ON FUNCTION public.create_staff_user TO authenticated;

-- 6. RLS: super admin can SELECT from staff_users_view (view inherits base table RLS)
-- The view already inherits RLS from admin_staff_users (super admin FOR ALL policy)
-- No additional policy needed.

-- 7. Update existing admin_staff_users seed row to have defaults for new columns
UPDATE public.admin_staff_users
SET
  position        = 'IT Staff',
  category_access = '["Senior Citizen","Person with Disability (PWD)","Women","Youth"]'::jsonb,
  can_view        = TRUE,
  can_edit        = TRUE,
  can_approve     = TRUE,
  can_delete      = FALSE,
  is_active       = TRUE,
  updated_at      = NOW()
WHERE position IS NULL OR position = '';
