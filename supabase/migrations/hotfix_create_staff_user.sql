-- ==============================================================================
-- HOTFIX: gen_salt "does not exist" error
-- Adds the `extensions` schema to SET search_path so pgcrypto's gen_salt/crypt
-- functions are resolved correctly inside the create_staff_user RPC.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ==============================================================================

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
  v_hashed_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));  -- explicit schema

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
-- KEY FIX: include `extensions` so gen_salt / crypt are found
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.create_staff_user TO authenticated;
