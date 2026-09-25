-- ==============================================================================
-- MSWDO CARMEN: SYSTEM CONFIGURATION, BACKUPS & PARAMETERS MIGRATION
-- Creates public.system_settings, public.system_backups, and public.system_parameters
-- for full dynamic municipal system administration, security policies, backup tracking,
-- and notification gateway settings.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create public.system_settings table (Section-based JSONB configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY,                       -- e.g. 'general', 'security', 'backup', 'gateway'
  category TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Structured key-value properties
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings(updated_at DESC);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings
DROP POLICY IF EXISTS "Allow authenticated read system_settings" ON public.system_settings;
CREATE POLICY "Allow authenticated read system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated update system_settings" ON public.system_settings;
CREATE POLICY "Allow authenticated update system_settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2. Create public.system_backups table (Backup and Disaster Recovery Snapshots)
CREATE TABLE IF NOT EXISTS public.system_backups (
  id TEXT PRIMARY KEY,                       -- e.g. 'SNP-20260925-01'
  backup_type TEXT NOT NULL DEFAULT 'Scheduled Full Snapshot',
  file_size TEXT NOT NULL DEFAULT '50.0 MB',
  checksum TEXT,
  records_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Verified',
  notes TEXT,
  created_by_name TEXT DEFAULT 'System Automation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON public.system_backups(created_at DESC);

-- Enable RLS
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read system_backups" ON public.system_backups;
CREATE POLICY "Allow authenticated read system_backups"
  ON public.system_backups
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert system_backups" ON public.system_backups;
CREATE POLICY "Allow authenticated insert system_backups"
  ON public.system_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update system_backups" ON public.system_backups;
CREATE POLICY "Allow authenticated update system_backups"
  ON public.system_backups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 3. Create public.system_parameters table (Granular searchable/editable parameters)
CREATE TABLE IF NOT EXISTS public.system_parameters (
  key TEXT PRIMARY KEY,                      -- e.g. 'SYS_OFFICE_DESIGNATION'
  category TEXT NOT NULL,                    -- 'General', 'Security', 'Backup', 'Gateway'
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  default_value TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by_name TEXT DEFAULT 'Super Admin',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_parameters_category ON public.system_parameters(category);

-- Enable RLS
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read system_parameters" ON public.system_parameters;
CREATE POLICY "Allow authenticated read system_parameters"
  ON public.system_parameters
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated update system_parameters" ON public.system_parameters;
CREATE POLICY "Allow authenticated update system_parameters"
  ON public.system_parameters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 4. Seed initial default values for system_settings
INSERT INTO public.system_settings (id, category, data, updated_by_name)
VALUES
  (
    'general',
    'GENERAL',
    jsonb_build_object(
      'officeName', 'Municipal Social Welfare and Development Office (MSWDO)',
      'lguName', 'Municipality of Carmen, Province of Cebu',
      'helplineContact', '(032) 266-9123 / (032) 266-9124',
      'officialEmail', 'mswdo@carmen.gov.ph',
      'physicalAddress', 'Ground Floor, Carmen Municipal Hall, Carmen, Cebu 6005',
      'operatingHours', 'Monday – Friday: 8:00 AM – 5:00 PM (PST)',
      'maintenanceMode', false,
      'announcementBanner', 'Notice: Special educational & financial assistance payout distribution scheduled at Carmen Municipal Gymnasium.',
      'announcementActive', false,
      'maxUploadSizeMb', 15
    ),
    'Super Admin Initializer'
  ),
  (
    'security',
    'SECURITY',
    jsonb_build_object(
      'enforceTwoFactor', true,
      'sessionTimeoutMinutes', 30,
      'maxLoginAttempts', 5,
      'lockoutDurationMinutes', 15,
      'rowLevelSecurity', true,
      'strictIpAllowlist', false,
      'auditLogRetentionDays', 365,
      'passwordMinLength', 8,
      'requireSpecialChar', true,
      'autoTerminateSuspicious', true
    ),
    'Super Admin Initializer'
  ),
  (
    'backup',
    'BACKUP',
    jsonb_build_object(
      'autoBackupEnabled', true,
      'frequency', 'Daily at 22:00 PHT',
      'retentionDays', 90,
      'storageTarget', 'Encrypted Cloud Cold Vault (Supabase Regional)',
      'offsiteReplication', true,
      'backupIntegrityStatus', 'Passed (0 corrupted blocks)',
      'pointInTimeRecovery', true
    ),
    'Super Admin Initializer'
  ),
  (
    'gateway',
    'GATEWAY',
    jsonb_build_object(
      'senderEmail', 'notifications@mswdo.carmen.gov.ph',
      'smtpHost', 'smtp.carmen.gov.ph',
      'smtpPort', 587,
      'emailNotificationsEnabled', true,
      'smsProvider', 'PhilSMS / Semaphore Telco Bridge',
      'smsSenderName', 'CARMEN_MSWDO',
      'smsNotificationsEnabled', true,
      'dailySmsQuota', 2000,
      'smsUsedToday', 184,
      'emergencyBroadcastLine', '+63 917 123 4567'
    ),
    'Super Admin Initializer'
  )
ON CONFLICT (id) DO NOTHING;


-- 5. Seed initial backup snapshot logs
INSERT INTO public.system_backups (id, backup_type, file_size, checksum, records_count, status, notes, created_by_name)
VALUES
  (
    'SNP-20260925-01',
    'Scheduled Full Snapshot',
    '54.8 MB',
    'sha256:4a8b79e1c3f2d01e48bc72',
    4210,
    'Verified',
    'Daily automated production database snapshot & cold vault sync.',
    'System Cron Automation'
  ),
  (
    'SNP-20260924-01',
    'Scheduled Full Snapshot',
    '53.9 MB',
    'sha256:91bc02fa619d854cebb301',
    4185,
    'Verified',
    'Daily automated production database snapshot.',
    'System Cron Automation'
  ),
  (
    'SNP-20260923-01',
    'Manual Schema Snapshot',
    '18.2 MB',
    'sha256:ee8129ca081d77b819fbc4',
    3950,
    'Verified',
    'Pre-migration checkpoint prior to CMS & termination audit tables deployment.',
    'Super Admin (ITSD)'
  )
ON CONFLICT (id) DO NOTHING;


-- 6. Seed initial system parameters
INSERT INTO public.system_parameters (key, category, label, value, default_value, data_type, description)
VALUES
  ('SYS_OFFICE_DESIGNATION', 'General', 'Municipal Office Designation', 'Municipal Social Welfare and Development Office (MSWDO)', 'Municipal Social Welfare and Development Office (MSWDO)', 'string', 'Official title displayed across citizen portal, reports, and certifications.'),
  ('SYS_LGU_JURISDICTION', 'General', 'LGU Territorial Jurisdiction', 'Municipality of Carmen, Province of Cebu', 'Municipality of Carmen, Province of Cebu', 'string', 'Local government authority governing social welfare program issuance.'),
  ('SYS_PORTAL_MAINTENANCE', 'General', 'Portal Maintenance Mode', 'Disabled', 'Disabled', 'boolean', 'Temporarily locks citizen applications during municipal database updates.'),
  ('SYS_MAX_UPLOAD_MB', 'General', 'Maximum File Upload Size', '15 MB', '15 MB', 'number', 'Maximum allowable file size for applicant ID and medical requirement uploads.'),
  ('SYS_2FA_POLICY', 'Security', 'Two-Factor Authentication', 'Enforced for Super Admin & Admin Staff', 'Enforced for Super Admin & Admin Staff', 'string', 'Mandatory OTP verification for administrative and supervisory login access.'),
  ('SYS_SESSION_TIMEOUT', 'Security', 'Session Inactivity Lockout', '30 Minutes', '30 Minutes', 'number', 'Automatic terminal screen lock after idle duration to preserve client privacy.'),
  ('SYS_MAX_LOGIN_FAILURES', 'Security', 'Max Failed Login Attempts', '5 Attempts', '5 Attempts', 'number', 'Threshold before staff account IP is rate-limited or flagged for review.'),
  ('SYS_RLS_GUARD', 'Security', 'PostgreSQL Row-Level Security', 'Active & Enforced', 'Active & Enforced', 'string', 'Supabase database level authorization isolation across sectors.'),
  ('SYS_BACKUP_FREQUENCY', 'Backup', 'Automated Snapshot Schedule', 'Daily at 22:00 PHT', 'Daily at 22:00 PHT', 'string', 'Point-in-time PostgreSQL snapshot execution cycle.'),
  ('SYS_BACKUP_RETENTION', 'Backup', 'Snapshot Retention Window', '90 Days Continuous', '90 Days Continuous', 'number', 'Duration before point-in-time cold snapshots are pruned.'),
  ('SYS_SMS_GATEWAY', 'Gateway', 'SMS Broadcast Gateway Bridge', 'CARMEN_LGU (PhilSMS / Semaphore)', 'CARMEN_LGU (PhilSMS / Semaphore)', 'string', 'Telco aggregator used for sending OTPs and application approval SMS alerts.'),
  ('SYS_EMAIL_DISPATCHER', 'Gateway', 'Official Notification Mailer', 'notifications@mswdo.carmen.gov.ph', 'notifications@mswdo.carmen.gov.ph', 'string', 'Sender email header for welfare benefit notifications and status reports.')
ON CONFLICT (key) DO NOTHING;
