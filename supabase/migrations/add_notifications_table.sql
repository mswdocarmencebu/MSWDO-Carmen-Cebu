-- ==============================================================================
-- MSWDO CARMEN: LIVE NOTIFICATIONS TABLE MIGRATION
-- Creates public.notifications table to support multi-role, sector-restricted,
-- and individual-targeted live notifications with Supabase Realtime synchronization.
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create public.notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (
    type IN (
      'application_submitted',
      'application_approved',
      'document_correction',
      'benefit_submitted',
      'benefit_processed',
      'system',
      'announcement'
    )
  ),
  sector TEXT DEFAULT 'General',
  recipient_role TEXT NOT NULL DEFAULT 'all' CHECK (
    recipient_role IN ('admin', 'staff', 'applicant', 'all')
  ),
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  reference TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_by JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast query filtering by role, email, sector, and creation time
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON public.notifications (recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON public.notifications (recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sector ON public.notifications (sector);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);

-- 3. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Anyone can view relevant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;

-- SELECT: Permissive policy allowing client and auth retrieval
CREATE POLICY "Anyone can view relevant notifications"
  ON public.notifications FOR SELECT
  USING (true);

-- INSERT: Anyone can trigger notification creation (e.g. citizen pre-registration or staff operations)
CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- UPDATE: Allow marking notifications as read
CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE: Allow dismissing notifications
CREATE POLICY "Users can delete notifications"
  ON public.notifications FOR DELETE
  USING (true);

-- 5. Enable Supabase Realtime for notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If publication doesn't exist yet, ignore
    NULL;
END $$;
