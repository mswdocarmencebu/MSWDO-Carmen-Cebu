-- ==============================================================================
-- MIGRATION: Password Reset Support RPC
--
-- Enables secure password resetting for registered users by email
-- Can be called during the password recovery workflow.
-- Run in: Supabase Dashboard → SQL Editor
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.reset_user_password_by_email(
  p_email           TEXT,
  p_new_password    TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_hashed  TEXT;
BEGIN
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email is required');
  END IF;

  IF LENGTH(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;

  -- 1. Find user in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_email));
  
  -- 2. Fallback to public.users
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(TRIM(p_email));
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User account not found with this email');
  END IF;

  -- 3. Hash new password with blowfish
  v_hashed := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  -- 4. Update auth.users credentials and metadata
  UPDATE auth.users
  SET encrypted_password = v_hashed,
      updated_at         = NOW(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'must_change_password', false,
        'has_permanent_password', true,
        'password_updated_at', NOW()
      )
  WHERE id = v_user_id;

  -- 5. Clear must_change_password flags on admin_staff_users
  UPDATE public.admin_staff_users
  SET
    must_change_password = FALSE,
    temporary_password   = NULL,
    updated_at           = NOW()
  WHERE user_id = v_user_id;

  -- 6. Clear must_change_password flags on super_admin_users
  UPDATE public.super_admin_users
  SET
    must_change_password = FALSE,
    temporary_password   = NULL,
    updated_at           = NOW()
  WHERE user_id = v_user_id;

  -- 7. Clear must_change_password flags on applicant_users
  UPDATE public.applicant_users
  SET
    must_change_password = FALSE,
    temporary_password   = NULL,
    password_changed_at  = NOW()
  WHERE user_id = v_user_id;

  -- 8. Clear temporary password on applications table if any
  UPDATE public.applications
  SET
    temporary_password = NULL,
    updated_at         = NOW()
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Password updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Grant permissions so recovery callers can execute
GRANT EXECUTE ON FUNCTION public.reset_user_password_by_email(TEXT, TEXT) TO anon, authenticated, service_role;
