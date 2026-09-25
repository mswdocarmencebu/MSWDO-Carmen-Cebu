-- ==============================================================================
-- MSWDO CARMEN: USER TERMINATION AND TRACKING MIGRATION
-- Adds termination tracking table referencing public.users(id),
-- alters public.users to add is_terminated status flags,
-- and provides atomic RPC functions for terminate_user and unterminate_user.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Alter public.users table to support termination
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_terminated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS terminated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Alter admin_staff_users and applicant_users tables for consistency
ALTER TABLE public.admin_staff_users 
  ADD COLUMN IF NOT EXISTS is_terminated BOOLEAN DEFAULT FALSE;

ALTER TABLE public.applicant_users 
  ADD COLUMN IF NOT EXISTS is_terminated BOOLEAN DEFAULT FALSE;

-- 3. Create public.user_terminations tracking table
CREATE TABLE IF NOT EXISTS public.user_terminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('Terminated', 'Unterminated')),
  reason TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  performed_by_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_terminations_user_id ON public.user_terminations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terminations_created_at ON public.user_terminations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_terminated ON public.users(is_terminated);

-- 5. Enable Row Level Security (RLS) on public.user_terminations
ALTER TABLE public.user_terminations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view termination history
DROP POLICY IF EXISTS "Allow authenticated users to read termination history" ON public.user_terminations;
CREATE POLICY "Allow authenticated users to read termination history"
  ON public.user_terminations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated staff/admins to insert termination tracking
DROP POLICY IF EXISTS "Allow authenticated users to insert termination tracking" ON public.user_terminations;
CREATE POLICY "Allow authenticated users to insert termination tracking"
  ON public.user_terminations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Update staff_users_view to include is_terminated, terminated_at, termination_reason
DROP VIEW IF EXISTS public.staff_users_view;
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
  u.is_terminated,
  u.terminated_at,
  u.termination_reason,
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

-- 7. Atomic RPC function: terminate_user
CREATE OR REPLACE FUNCTION public.terminate_user(
  p_user_id           UUID,
  p_reason            TEXT    DEFAULT NULL,
  p_performed_by      UUID    DEFAULT NULL,
  p_performed_by_name TEXT    DEFAULT NULL,
  p_performed_by_role TEXT    DEFAULT NULL,
  p_notes             TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_role  TEXT;
BEGIN
  -- Check user exists
  SELECT email, role::text INTO v_user_email, v_user_role
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found in public.users');
  END IF;

  -- 1. Mark user as terminated
  UPDATE public.users
  SET 
    is_terminated = TRUE,
    terminated_at = NOW(),
    termination_reason = p_reason,
    terminated_by = p_performed_by,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 2. Deactivate role-specific rows
  UPDATE public.admin_staff_users
  SET is_active = FALSE, is_terminated = TRUE, updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.applicant_users
  SET is_terminated = TRUE
  WHERE user_id = p_user_id;

  -- 3. Synchronize applications and members status if applicable
  IF v_user_email IS NOT NULL AND v_user_email <> '' THEN
    UPDATE public.applications
    SET status = 'Terminated', updated_at = NOW()
    WHERE LOWER(email) = LOWER(v_user_email);

    UPDATE public.members
    SET status = 'Terminated', updated_at = NOW()
    WHERE LOWER(email) = LOWER(v_user_email) OR user_id = p_user_id;
  END IF;

  -- 4. Record entry in tracking table
  INSERT INTO public.user_terminations (
    user_id,
    action,
    reason,
    notes,
    performed_by,
    performed_by_name,
    performed_by_role
  ) VALUES (
    p_user_id,
    'Terminated',
    p_reason,
    p_notes,
    p_performed_by,
    p_performed_by_name,
    p_performed_by_role
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'status', 'Terminated',
    'action', 'Terminated'
  );
END;
$$;

-- 8. Atomic RPC function: unterminate_user
CREATE OR REPLACE FUNCTION public.unterminate_user(
  p_user_id           UUID,
  p_reason            TEXT    DEFAULT NULL,
  p_performed_by      UUID    DEFAULT NULL,
  p_performed_by_name TEXT    DEFAULT NULL,
  p_performed_by_role TEXT    DEFAULT NULL,
  p_notes             TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_role  TEXT;
BEGIN
  -- Check user exists
  SELECT email, role::text INTO v_user_email, v_user_role
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found in public.users');
  END IF;

  -- 1. Unmark user as terminated
  UPDATE public.users
  SET 
    is_terminated = FALSE,
    terminated_at = NULL,
    termination_reason = NULL,
    terminated_by = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 2. Reactivate role-specific rows
  UPDATE public.admin_staff_users
  SET is_active = TRUE, is_terminated = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.applicant_users
  SET is_terminated = FALSE
  WHERE user_id = p_user_id;

  -- 3. Synchronize applications and members status if applicable
  IF v_user_email IS NOT NULL AND v_user_email <> '' THEN
    UPDATE public.applications
    SET status = 'Approved', updated_at = NOW()
    WHERE LOWER(email) = LOWER(v_user_email) AND status = 'Terminated';

    UPDATE public.members
    SET status = 'Active', updated_at = NOW()
    WHERE (LOWER(email) = LOWER(v_user_email) OR user_id = p_user_id) AND status = 'Terminated';
  END IF;

  -- 4. Record entry in tracking table
  INSERT INTO public.user_terminations (
    user_id,
    action,
    reason,
    notes,
    performed_by,
    performed_by_name,
    performed_by_role
  ) VALUES (
    p_user_id,
    'Unterminated',
    p_reason,
    p_notes,
    p_performed_by,
    p_performed_by_name,
    p_performed_by_role
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'status', 'Active',
    'action', 'Unterminated'
  );
END;
$$;
