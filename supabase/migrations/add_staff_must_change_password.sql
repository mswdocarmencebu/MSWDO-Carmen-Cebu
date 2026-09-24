-- ==============================================================================
-- MIGRATION: Staff must_change_password — columns + updated RPC
--
-- What this does:
--   1. Adds must_change_password (bool) + temporary_password (text) columns to
--      admin_staff_users (IF NOT EXISTS — safe to re-run)
--   2. Recreates create_staff_user RPC to embed must_change_password=true in
--      raw_user_meta_data at account creation, so the flag is in the JWT from
--      the very first login — no secondary JS update needed.
--
-- Run in: Supabase Dashboard → SQL Editor
-- ==============================================================================

-- ── 1. Add columns ────────────────────────────────────────────────────────────
ALTER TABLE public.admin_staff_users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS temporary_password   TEXT;

-- Optional index for fast lookup in ProtectedRoute / auth checks
CREATE INDEX IF NOT EXISTS idx_admin_staff_must_change
  ON public.admin_staff_users (must_change_password)
  WHERE must_change_password = TRUE;

-- ── 2. Updated RPC — embeds must_change_password=true in user_metadata ────────
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
  -- NOTE: must_change_password=true is embedded in raw_user_meta_data so the flag
  --       is present in the JWT from the very first login. The JS client clears it
  --       via supabase.auth.updateUser({ data: { must_change_password: false } })
  --       after the staff member sets their real password.
  v_user_id   := gen_random_uuid();
  v_hashed_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

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
      'full_name',           v_full_name,
      'role',                'admin_staff',
      'position',            p_position,
      'must_change_password', TRUE          -- ← NEW: cleared by JS after first password set
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

  -- Create admin_staff_users record with privileges + must_change_password flag
  INSERT INTO public.admin_staff_users (
    user_id, staff_tier, assigned_cluster, position,
    category_access, can_view, can_edit, can_approve, can_delete,
    id_number, contact_number, birth_date, is_active,
    must_change_password, updated_at
  )
  VALUES (
    v_user_id, v_staff_tier, 'Carmen MSWDO', p_position,
    p_category_access, p_can_view, p_can_edit, p_can_approve, p_can_delete,
    p_id_number, p_contact_number, p_birth_date, TRUE,
    TRUE,   -- ← must_change_password = true for new accounts
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    staff_tier           = EXCLUDED.staff_tier,
    position             = EXCLUDED.position,
    category_access      = EXCLUDED.category_access,
    can_view             = EXCLUDED.can_view,
    can_edit             = EXCLUDED.can_edit,
    can_approve          = EXCLUDED.can_approve,
    can_delete           = EXCLUDED.can_delete,
    id_number            = EXCLUDED.id_number,
    contact_number       = EXCLUDED.contact_number,
    birth_date           = EXCLUDED.birth_date,
    is_active            = TRUE,
    must_change_password = TRUE,
    updated_at           = NOW();

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

GRANT EXECUTE ON FUNCTION public.create_staff_user TO authenticated;

-- ── 3. Policy allowing staff to update their own record ───────────────────────
DROP POLICY IF EXISTS "Admin staff can update own role record" ON public.admin_staff_users;
CREATE POLICY "Admin staff can update own role record"
  ON public.admin_staff_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. RPC: Complete staff password setup (SECURITY DEFINER) ───────────────────
CREATE OR REPLACE FUNCTION public.complete_staff_password_setup(
  p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_hashed  TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF LENGTH(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;

  -- Hash new password and update auth.users
  v_hashed := extensions.crypt(p_new_password, extensions.gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_hashed,
      updated_at         = NOW(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": false, "has_permanent_password": true}'::jsonb
  WHERE id = v_user_id;

  -- Clear flags on admin_staff_users
  UPDATE public.admin_staff_users
  SET
    must_change_password = FALSE,
    temporary_password   = NULL,
    updated_at           = NOW()
  WHERE user_id = v_user_id;

  -- Also clear on super_admin_users if applicable
  UPDATE public.super_admin_users
  SET
    must_change_password = FALSE,
    temporary_password   = NULL,
    updated_at           = NOW()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Staff password updated successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.complete_staff_password_setup(TEXT) TO authenticated;

