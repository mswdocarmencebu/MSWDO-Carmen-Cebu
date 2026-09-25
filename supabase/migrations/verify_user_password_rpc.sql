-- ============================================================
-- RPC: verify_user_password
-- Verifies a currently-authenticated user's existing password
-- by comparing it against the stored bcrypt hash in auth.users.
-- This is safer than calling signInWithPassword again because
-- it doesn't count as a new login attempt and isn't rate-limited.
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_user_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id         UUID;
  v_encrypted_pwd   TEXT;
BEGIN
  -- Must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Fetch the stored bcrypt hash
  SELECT encrypted_password
    INTO v_encrypted_pwd
    FROM auth.users
   WHERE id = v_user_id;

  IF v_encrypted_pwd IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Compare: crypt(input, stored_hash) must equal stored_hash
  RETURN v_encrypted_pwd = crypt(p_password, v_encrypted_pwd);
END;
$$;

-- Only authenticated users can call this — never anon
REVOKE EXECUTE ON FUNCTION public.verify_user_password(TEXT) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.verify_user_password(TEXT) TO authenticated;
