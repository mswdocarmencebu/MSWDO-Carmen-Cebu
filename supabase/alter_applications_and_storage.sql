-- ==============================================================================
-- MSWDO CARMEN: INCREMENTAL MIGRATION / ALTER SCRIPT
-- Adds:
--   1. public.applications table (Pre-applications & intake)
--   2. Applications RLS policies
--   3. approve_application_and_create_user RPC function
--   4. storage.buckets 'application-documents' configuration
--   5. storage.objects RLS policies
--   6. Sample pre-application seed data (Youth, Senior, PWD, Women)
-- ==============================================================================

-- 1. Create public.applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('senior', 'pwd', 'women', 'youth')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Needs correction', 'Approved', 'Rejected', 'Resubmitted')),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  civil_status TEXT,
  complete_address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  category_details JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  appointment_date TIMESTAMPTZ,
  temporary_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS temporary_password TEXT;

ALTER TABLE public.applicant_users 
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 3. Applications Table RLS Policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can view and track applications" ON public.applications;
DROP POLICY IF EXISTS "Staff and Super Admin can manage applications" ON public.applications;

CREATE POLICY "Anyone can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view and track applications"
  ON public.applications FOR SELECT
  USING (true);

CREATE POLICY "Staff and Super Admin can manage applications"
  ON public.applications FOR ALL
  USING (
    public.get_auth_user_role() IN ('super_admin_user', 'admin_staff')
  );

-- Drop previous overloaded signatures to prevent conflicts
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(UUID, TEXT);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(UUID);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_application_and_create_user(TEXT);

-- 4. RPC Function: Approve application and provision applicant user account with unique credentials
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
  -- A. Fetch target pre-application by UUID, reference number, or email
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

  -- Hash password with explicit extensions schema
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
      '', '', '', '',
      '', '', '', '',
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

    -- Upsert in public.users
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (v_user_id, LOWER(v_app.email), v_full_name, 'applicant_user'::user_role)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = 'applicant_user'::user_role;

    -- Upsert in public.applicant_users with unique temporary password & must_change_password flag
    INSERT INTO public.applicant_users (user_id, barangay, category, client_id, temporary_password, must_change_password)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id, p_temp_password, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category,
      client_id = EXCLUDED.client_id,
      temporary_password = EXCLUDED.temporary_password,
      must_change_password = TRUE;
  ELSE
    -- User already exists: update encrypted password to unique temporary password and flag must_change_password = true
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

  -- C. Update application record with status Approved and save temporary_password
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
    'message', 'Application approved and applicant account successfully provisioned with unique temporary credentials.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 4B. RPC Function: Complete initial password setup for applicant
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
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: User is not authenticated');
  END IF;

  IF LENGTH(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters long');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Update encrypted password in auth.users
  v_hashed := crypt(p_new_password, gen_salt('bf'));
  UPDATE auth.users
  SET encrypted_password = v_hashed,
      updated_at = NOW(),
      raw_user_meta_data = raw_user_meta_data || '{"must_change_password": false}'::jsonb
  WHERE id = v_user_id;

  -- Clear temporary_password and mark must_change_password as false in applicant_users
  UPDATE public.applicant_users
  SET
    must_change_password = FALSE,
    temporary_password = NULL,
    password_changed_at = NOW()
  WHERE user_id = v_user_id;

  -- Also clear temporary_password in applications for this applicant
  IF v_user_email IS NOT NULL THEN
    UPDATE public.applications
    SET temporary_password = NULL
    WHERE LOWER(email) = LOWER(v_user_email);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password successfully updated. You may now access your beneficiary dashboard.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 4C. Ensure applicant users can update their own role record
DROP POLICY IF EXISTS "Applicant users can update own role record" ON public.applicant_users;
CREATE POLICY "Applicant users can update own role record"
  ON public.applicant_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Configure Supabase Storage Bucket for Application Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 6. Storage RLS Policies
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view application documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage application documents" ON storage.objects;

CREATE POLICY "Anyone can upload application documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Public can view application documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'application-documents');

CREATE POLICY "Staff can manage application documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'application-documents' AND
    public.get_auth_user_role() IN ('super_admin_user', 'admin_staff')
  );

-- 7. Seed Sample Applications (Optional: run once if you want initial test data)
INSERT INTO public.applications (
  id, reference_number, category, status, first_name, middle_name, last_name,
  dob, gender, civil_status, complete_address, contact_number, email,
  category_details, documents, submitted_at
)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'MSWDO-2026-NR7FKNEAC2',
    'youth',
    'Pending',
    'Neil',
    '',
    'Delante',
    '2000-07-02',
    'Male',
    'Single',
    'Purok 3, Poblacion, Carmen, Cebu',
    '09086602701',
    'nemo.delante@gmail.com',
    '{"educationalAttainment": "College Undergraduate", "outOfSchool": "No, Currently Enrolled", "schoolName": "Cebu Technological University - Carmen", "organization": "Carmen Youth Advocates", "targetAssistance": "Educational Assistance / Scholarship"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "neil_delante_request_form.pdf", "fileType": "application/pdf", "fileSize": 184500, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "delante_psa_cert.jpg", "fileType": "image/jpeg", "fileSize": 320400, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "neil_national_id.jpg", "fileType": "image/jpeg", "fileSize": 245000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"},
      {"key": "voter_cert", "title": "Voter verification / certificate", "fileName": "delante_voter_stub.jpg", "fileType": "image/jpeg", "fileSize": 195000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'MSWDO-2026-SC20269921',
    'senior',
    'Pending',
    'Maria',
    'Gomez',
    'Reyes',
    '1958-04-12',
    'Female',
    'Widowed',
    'Sitio Riverside, Cantipay, Carmen, Cebu',
    '09298765432',
    'mary.reyes@gmail.com',
    '{"citizenship": "Filipino", "religion": "Roman Catholic", "pension": "None", "livingArrangement": "Living with Relatives", "occupation": "None", "annualIncome": "Below 50,000", "regularSupport": "No", "withDisability": "No", "hasIllness": "Hypertension"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "reyes_senior_request.pdf", "fileType": "application/pdf", "fileSize": 210000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "reyes_birth_record.jpg", "fileType": "image/jpeg", "fileSize": 390000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "reyes_postal_id.jpg", "fileType": "image/jpeg", "fileSize": 280000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '2 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'MSWDO-2026-SD99182701',
    'pwd',
    'Approved',
    'Shen',
    'M.',
    'Delante',
    '1994-05-14',
    'Female',
    'Single',
    'Barangay Poblacion, Carmen, Cebu',
    '09436232143',
    'alotajennery@gmail.com',
    '{"applicationType": "New Applicant", "disabilityType": "Orthopedic / Physical Disability", "disabilityCause": "Congenital / Inborn", "educationalAttainment": "College Graduate", "employmentStatus": "Employed"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "shen_pwd_request.pdf", "fileType": "application/pdf", "fileSize": 195000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Verified"},
      {"key": "medical_cert", "title": "Medical certificate", "fileName": "doh_med_assessment.jpg", "fileType": "image/jpeg", "fileSize": 410000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", "status": "Verified"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "shen_philhealth_id.jpg", "fileType": "image/jpeg", "fileSize": 255000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Verified"}
    ]'::jsonb,
    NOW() - INTERVAL '5 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'MSWDO-2026-WW44918290',
    'women',
    'Pending',
    'Elena',
    'Santos',
    'Bautista',
    '1988-09-18',
    'Female',
    'Single',
    'Sitio Proper, Dawis Norte, Carmen, Cebu',
    '09175543210',
    'elena.bautista@gmail.com',
    '{"isSoloParent": "Yes", "numberOfChildren": "2", "occupation": "Self-Employed / Vendor", "placeOfBirth": "Carmen, Cebu", "educationalAttainment": "High School Graduate", "monthlyIncome": "8500"}'::jsonb,
    '[
      {"key": "request_form", "title": "Request form", "fileName": "bautista_solo_parent_req.pdf", "fileType": "application/pdf", "fileSize": 220000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", "status": "Pending"},
      {"key": "brgy_cert", "title": "Barangay certificate", "fileName": "dawis_norte_clearance.jpg", "fileType": "image/jpeg", "fileSize": 310000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", "status": "Pending"},
      {"key": "psa_birth_cert", "title": "PSA / NSO birth certificate", "fileName": "elena_birth_cert.jpg", "fileType": "image/jpeg", "fileSize": 360000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", "status": "Pending"},
      {"key": "valid_id", "title": "Valid government ID", "fileName": "bautista_national_id.jpg", "fileType": "image/jpeg", "fileSize": 270000, "previewUrl": "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", "status": "Pending"}
    ]'::jsonb,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO UPDATE SET
  reference_number = EXCLUDED.reference_number,
  status = EXCLUDED.status,
  category_details = EXCLUDED.category_details,
  documents = EXCLUDED.documents;
