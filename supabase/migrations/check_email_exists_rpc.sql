-- ============================================================
-- check_email_exists_rpc.sql
-- Provides a SECURITY DEFINER RPC that safely checks whether
-- a given email is registered in auth.users or public.users,
-- bypassing RLS so unauthenticated (anon) callers on the
-- Forgot Password page can resolve account existence without
-- exposing any PII beyond a boolean + minimal safe fields.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_email_registered(p_email TEXT)
RETURNS TABLE (
  exists_in_auth   BOOLEAN,
  exists_in_public BOOLEAN,
  user_role        TEXT,
  display_name     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_auth_exists BOOLEAN := FALSE;
  v_pub_exists  BOOLEAN := FALSE;
  v_role        TEXT    := NULL;
  v_name        TEXT    := NULL;
BEGIN
  -- 1. Check auth.users (bypasses RLS via SECURITY DEFINER)
  SELECT TRUE INTO v_auth_exists
  FROM auth.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  -- 2. Check public.users (bypasses RLS via SECURITY DEFINER)
  SELECT TRUE, role, full_name
  INTO v_pub_exists, v_role, v_name
  FROM public.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  RETURN QUERY SELECT
    COALESCE(v_auth_exists, FALSE),
    COALESCE(v_pub_exists, FALSE),
    v_role,
    v_name;
END;
$$;

-- Allow anon and authenticated roles to call this function
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT) TO anon, authenticated;
