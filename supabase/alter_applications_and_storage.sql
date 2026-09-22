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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 4. RPC Function: Approve application and provision applicant user account with default credentials
CREATE OR REPLACE FUNCTION public.approve_application_and_create_user(
  p_application_id UUID,
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
  -- A. Fetch target pre-application
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application record not found');
  END IF;

  v_full_name := TRIM(CONCAT_WS(' ', v_app.first_name, NULLIF(v_app.middle_name, ''), v_app.last_name));
  v_client_id := 'APPL-' || UPPER(SUBSTRING(MD5(v_app.id::text) FROM 1 FOR 6));
  v_barangay := COALESCE(v_app.complete_address, 'Barangay Poblacion, Carmen');

  -- B. Check if auth user with this email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_app.email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_hashed_password := crypt(p_temp_password, gen_salt('bf'));

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
      jsonb_build_object('full_name', v_full_name, 'role', 'applicant_user', 'barangay', v_barangay),
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

    -- Upsert in public.applicant_users
    INSERT INTO public.applicant_users (user_id, barangay, category, client_id)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category,
      client_id = EXCLUDED.client_id;
  ELSE
    -- User already exists: ensure applicant_users profile is configured
    INSERT INTO public.applicant_users (user_id, barangay, category, client_id)
    VALUES (v_user_id, v_barangay, INITCAP(v_app.category) || ' Welfare Beneficiary', v_client_id)
    ON CONFLICT (user_id) DO UPDATE SET
      category = EXCLUDED.category;
  END IF;

  -- C. Update application status to Approved
  UPDATE public.applications
  SET
    status = 'Approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', LOWER(v_app.email),
    'temporary_password', p_temp_password,
    'client_id', v_client_id,
    'applicant_name', v_full_name,
    'status', 'Approved',
    'message', 'Application approved and applicant account successfully provisioned. Default credentials dispatched.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

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
