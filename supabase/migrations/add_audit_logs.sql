-- ==============================================================================
-- MSWDO CARMEN: AUDIT & MONITORING LOGS MIGRATION
-- Creates public.audit_logs table to store user login sessions, administrative actions,
-- and system operational events with real-time auditability.
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  role TEXT,
  action TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  details TEXT,
  record_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Staff and Admin can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;

CREATE POLICY "Staff and Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);
