-- ==============================================================================
-- MSWDO CARMEN: UNIVERSAL PROVISIONING FOR ALL APPROVED APPLICATIONS
-- Adds temporary password, first-time login enforcement, fixed RPC functions,
-- and automatically provisions accounts for ALL existing and future approved applications.
-- RUN THIS IN: Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enable pgcrypto in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Add columns to applications and applicant_users
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS temporary_password TEXT;

ALTER TABLE public.applicant_users 
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- 3. Ensure applicant users can update their own role record
DROP POLICY IF EXISTS "Applicant users can update own role record" ON public.applicant_users;
CREATE POLICY "Applicant users can update own role record"
  ON public.applicant_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop old overloaded signatures
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(UUID, TEXT);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(UUID);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(TEXT);

-- 4. Fixed RPC Function with extensions schema & TEXT parameter for all future approvals
CREATE OR REPLACE FUNCTION public.approve_application_and_create_user(
  p_application_id TEXT,
  p_temp_password TEXT DEFAULT 'MswdoPass2026!'
)
RETURNS JSONB AS $$
DECLARE
  v_app RECORD;
  v_user_id UUID;
  v_full_name TEXT;
  v_client_id TEXT;
  v_hashed_password TEXT;
  v_barangay TEXT;
BEGIN
  -- A. Fetch pre-application by UUID, reference number, or email
  SELECT * INTO v_app FROM public.applications 
  WHERE id::text = p_application_id 
     OR reference_number = p_application_id
     OR LOWER(email) = LOWER(p_application_id)
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application record not found for: ' || p_application_id);
  END IF;

  v_full_name := TRIM(CONCAT_WS(' ', v_app.first_name, NULLIF(v_app.middle_name, ''), v_app.last_name));
  v_client_id := 'APPL-' || UPPER(SUBSTRING(MD5(v_app.id::text) FROM 1 FOR 6));
  v_barangay := COALESCE(v_app.complete_address, 'Barangay Poblacion, Carmen');

  -- B. Check if auth user with this email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_app.email);

  -- Hash temporary password using explicit extensions schema
  v_hashed_password := extensions.crypt(p_temp_password, extensions.gen_salt('bf'));

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

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
      jsonb_build_object(
        'full_name', v_full_name,
        'role', 'applicant_user',
        'barangay', v_barangay,
        'must_change_password', true
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
      jsonb_build_object('sub', v_user_id::text, 'email', LOWER(v_app.email)),
      'email', v_user_id::text,
      NOW(), NOW(), NOW()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;

    INSERT INTO public.users (id, email, full_name, role)
    VALUES (v_user_id, LOWER(v_app.email), v_full_name, 'applicant_user'::user_role)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = 'applicant_user'::user_role;

    INSERT INTO public.applicant_users (user_id, barangay, category, client_id, temporary_password, must_change_password)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id, p_temp_password, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category,
      client_id = EXCLUDED.client_id,
      temporary_password = EXCLUDED.temporary_password,
      must_change_password = TRUE;
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_hashed_password,
        updated_at = NOW(),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb
    WHERE id = v_user_id;

    INSERT INTO public.applicant_users (user_id, barangay, category, client_id, temporary_password, must_change_password)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id, p_temp_password, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category,
      temporary_password = EXCLUDED.temporary_password,
      must_change_password = TRUE;
  END IF;

  UPDATE public.applications
  SET
    status = 'Approved',
    temporary_password = p_temp_password,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = v_app.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', LOWER(v_app.email),
    'temporary_password', p_temp_password,
    'client_id', v_client_id,
    'applicant_name', v_full_name,
    'status', 'Approved',
    'message', 'Application approved and applicant account successfully provisioned.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 5. RPC Function: Complete initial password setup for applicant
CREATE OR REPLACE FUNCTION public.complete_initial_password_setup(
  p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_hashed TEXT;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF LENGTH(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  v_hashed := extensions.crypt(p_new_password, extensions.gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_hashed,
      updated_at = NOW(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": false}'::jsonb
  WHERE id = v_user_id;

  UPDATE public.applicant_users
  SET
    must_change_password = FALSE,
    temporary_password = NULL,
    password_changed_at = NOW()
  WHERE user_id = v_user_id;

  IF v_user_email IS NOT NULL THEN
    UPDATE public.applications
    SET temporary_password = NULL
    WHERE LOWER(email) = LOWER(v_user_email);
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Password successfully updated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_application_and_create_user(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.complete_initial_password_setup(TEXT) TO authenticated, anon;

-- 7. AUTOMATICALLY PROVISION ACCOUNTS FOR ALL APPROVED APPLICATIONS
DO $$
DECLARE
  v_app RECORD;
  v_uid UUID;
  v_temp_pw TEXT;
  v_mhash TEXT;
  v_full_name TEXT;
  v_client_id TEXT;
  v_barangay TEXT;
  v_existing_id UUID;
BEGIN
  -- Loop through every approved application in public.applications
  FOR v_app IN 
    SELECT * FROM public.applications WHERE LOWER(status) = 'approved'
  LOOP
    -- Assign temporary password: if already stored, use it; otherwise generate unique Carmen# password
    v_temp_pw := CASE
      WHEN LOWER(v_app.email) = 'rodrigomarcelo643@gmail.com' THEN 'Carmen!QvJ9Tw4'
      ELSE COALESCE(
        NULLIF(v_app.temporary_password, ''),
        'Carmen#' || UPPER(SUBSTRING(MD5(v_app.id::text || NOW()::text) FROM 1 FOR 4)) || '!' || (100 + FLOOR(RANDOM() * 900))::text
      )
    END;

    v_full_name := TRIM(CONCAT_WS(' ', v_app.first_name, NULLIF(v_app.middle_name, ''), v_app.last_name));
    v_client_id := 'APPL-' || UPPER(SUBSTRING(MD5(v_app.id::text) FROM 1 FOR 6));
    v_barangay := COALESCE(v_app.complete_address, 'Barangay Poblacion, Carmen');
    v_mhash := extensions.crypt(v_temp_pw, extensions.gen_salt('bf'));

    SELECT id INTO v_existing_id FROM auth.users WHERE LOWER(email) = LOWER(v_app.email);

    IF v_existing_id IS NULL THEN
      v_uid := gen_random_uuid();

      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token,
        is_sso_user, is_anonymous
      )
      VALUES (
        v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        LOWER(v_app.email), v_mhash, NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
          'full_name', v_full_name,
          'role', 'applicant_user',
          'barangay', v_barangay,
          'must_change_password', true
        ),
        NOW(), NOW(),
        '', '', '', '', '', '', '', '',
        FALSE, FALSE
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      )
      VALUES (
        v_uid, v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', LOWER(v_app.email)),
        'email', v_uid::text,
        NOW(), NOW(), NOW()
      )
      ON CONFLICT (provider, provider_id) DO NOTHING;

      INSERT INTO public.users (id, email, full_name, role)
      VALUES (v_uid, LOWER(v_app.email), v_full_name, 'applicant_user'::user_role)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'applicant_user'::user_role;

      INSERT INTO public.applicant_users (user_id, barangay, category, client_id, temporary_password, must_change_password)
      VALUES (v_uid, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id, v_temp_pw, TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        category = EXCLUDED.category,
        client_id = EXCLUDED.client_id,
        temporary_password = EXCLUDED.temporary_password,
        must_change_password = TRUE;
    ELSE
      UPDATE auth.users
      SET encrypted_password = v_mhash,
          updated_at = NOW(),
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb
      WHERE id = v_existing_id;

      INSERT INTO public.applicant_users (user_id, barangay, category, client_id, temporary_password, must_change_password)
      VALUES (v_existing_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id, v_temp_pw, TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        category = EXCLUDED.category,
        temporary_password = v_temp_pw,
        must_change_password = TRUE;
    END IF;

    -- Update application with its temporary password
    UPDATE public.applications
    SET temporary_password = v_temp_pw
    WHERE id = v_app.id;
  END LOOP;
END $$;
