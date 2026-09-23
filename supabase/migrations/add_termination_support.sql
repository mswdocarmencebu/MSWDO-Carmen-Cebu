-- ==============================================================================
-- MSWDO CARMEN: TERMINATION SUPPORT MIGRATION
-- Updates the check constraint on public.applications to support 'Terminated'
-- and ensures 'Active' or 'Terminated' statuses are valid across the system.
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Update public.applications status check constraint to include 'Terminated' and 'Active'
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('Pending', 'Needs correction', 'Approved', 'Rejected', 'Resubmitted', 'Terminated', 'Active'));

-- 2. Update public.members status check constraint to also allow 'Terminated'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'members_status_check' AND table_name = 'members'
  ) THEN
    ALTER TABLE public.members DROP CONSTRAINT members_status_check;
    ALTER TABLE public.members ADD CONSTRAINT members_status_check 
      CHECK (status IN ('Active', 'Inactive', 'Archived', 'Terminated'));
  END IF;
END $$;
