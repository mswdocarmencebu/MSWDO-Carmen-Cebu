-- ==============================================================================
-- MSWDO CARMEN: Edit & Delete Staff User RPCs
-- Adds atomic update and delete functions for staff management by Super Admin
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure Super Admin can manage public.users
DROP POLICY IF EXISTS "Super Admin can manage all users" ON public.users;
CREATE POLICY "Super Admin can manage all users"
  ON public.users FOR ALL USING (
    public.get_auth_user_role() = 'super_admin_user'
  );

-- 2. RPC: update_staff_user
-- Atomically updates auth.users (if needed), public.users, and public.admin_staff_users
CREATE OR REPLACE FUNCTION public.update_staff_user(
  p_user_id         UUID,
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
  p_can_delete      BOOLEAN DEFAULT FALSE,
  p_is_active       BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_full_name   TEXT;
  v_staff_tier  TEXT;
BEGIN
  -- Build full name
  v_full_name := TRIM(
    p_first_name || ' ' ||
    COALESCE(NULLIF(p_middle_initial, '') || '. ', '') ||
    p_last_name
  );

  -- Derive staff tier
  v_staff_tier := CASE
    WHEN p_position = 'IT Staff'       THEN 'Technical Staff'
    WHEN p_position = 'Senior Citizen' THEN 'Senior Citizen Welfare Officer'
    WHEN p_position = 'PWD'            THEN 'PWD Affairs Officer'
    WHEN p_position = 'Women''s'       THEN 'Women''s Welfare Officer'
    WHEN p_position = 'Youth'          THEN 'Youth Affairs Officer'
    ELSE 'Intake Officer'
  END;

  -- Update public.users
  UPDATE public.users
  SET
    first_name     = p_first_name,
    last_name      = p_last_name,
    middle_initial = p_middle_initial,
    full_name      = v_full_name,
    updated_at     = NOW()
  WHERE id = p_user_id;

  -- Update auth.users raw_user_meta_data
  UPDATE auth.users
  SET
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'full_name', v_full_name,
      'position', p_position
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update admin_staff_users
  UPDATE public.admin_staff_users
  SET
    position        = p_position,
    staff_tier      = v_staff_tier,
    category_access = p_category_access,
    can_view        = p_can_view,
    can_edit        = p_can_edit,
    can_approve     = p_can_approve,
    can_delete      = p_can_delete,
    id_number       = p_id_number,
    contact_number  = p_contact_number,
    birth_date      = p_birth_date,
    is_active       = p_is_active,
    updated_at      = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'name',    v_full_name,
    'message', 'Staff account updated successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.update_staff_user TO authenticated;

-- 3. RPC: delete_staff_user
-- Atomically deletes from public.admin_staff_users, public.users, and auth.users
CREATE OR REPLACE FUNCTION public.delete_staff_user(
  p_user_id UUID
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Delete admin staff profile
  DELETE FROM public.admin_staff_users WHERE user_id = p_user_id;

  -- 2. Delete public user record
  DELETE FROM public.users WHERE id = p_user_id;

  -- 3. Delete auth identity and user
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'Staff account deleted successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.delete_staff_user TO authenticated;
