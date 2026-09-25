-- ==============================================================================
-- MSWDO CARMEN: CONTENT MANAGEMENT SYSTEM (CMS) TABLE & STORAGE MIGRATION
-- Creates public.cms_content table for managing portal text, showcases,
-- public services directory, FAQs, downloadable forms, and asset storage.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create public.cms_content table
CREATE TABLE IF NOT EXISTS public.cms_content (
  id TEXT PRIMARY KEY,                       -- e.g. 'hero', 'services', 'faqs', 'documents', 'settings'
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Structured data (items list, extra fields, metadata)
  image_url TEXT,                            -- Direct URL or Supabase storage public URL
  storage_path TEXT,                         -- Storage bucket file path if uploaded
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_cms_content_is_published ON public.cms_content(is_published);
CREATE INDEX IF NOT EXISTS idx_cms_content_updated_at ON public.cms_content(updated_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- Public read access: Anyone (authenticated or anonymous citizens) can read published CMS content
DROP POLICY IF EXISTS "Allow public read access to cms_content" ON public.cms_content;
CREATE POLICY "Allow public read access to cms_content"
  ON public.cms_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin/Staff write access: Authenticated users can insert, update, delete
DROP POLICY IF EXISTS "Allow authenticated users to insert cms_content" ON public.cms_content;
CREATE POLICY "Allow authenticated users to insert cms_content"
  ON public.cms_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update cms_content" ON public.cms_content;
CREATE POLICY "Allow authenticated users to update cms_content"
  ON public.cms_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete cms_content" ON public.cms_content;
CREATE POLICY "Allow authenticated users to delete cms_content"
  ON public.cms_content
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Seed initial default sections so the CMS has rich, production-ready starting data
INSERT INTO public.cms_content (id, title, subtitle, image_url, data, is_published, updated_by_name)
VALUES
  (
    'hero',
    'Social welfare support, made easier to access.',
    'Apply for programs, monitor requests, and receive assistance updates through one secure municipal portal.',
    '/mswdo-community-hero-portrait.png',
    jsonb_build_object(
      'municipalTitle', 'MSWDO Carmen, Cebu 6005',
      'officeName', 'Municipal Social Welfare and Development Office',
      'guidanceNote', 'Residents of Carmen, Cebu may submit applications for Senior Citizen IDs, PWD welfare, Solo Parent subsidies, and youth assistance directly online.',
      'ctaText', 'Apply for Welfare Assistance',
      'ctaLink', '/apply',
      'trackCtaText', 'Track Application Status',
      'trackCtaLink', '/track',
      'liveBadgeText', 'Live on Citizen Portal'
    ),
    true,
    'System Initializer'
  ),
  (
    'services',
    'Municipal Social Welfare Services Directory',
    'Explore social welfare programs, assistance packages, and eligibility criteria offered by Carmen MSWDO.',
    NULL,
    jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object(
          'id', 'srv-1',
          'title', 'Senior Citizen Social Protection & OSCA Services',
          'category', 'Senior Citizen',
          'description', 'Issuance of Senior Citizen Identification Card, purchase booklet for medicines and groceries, local social pension screening, and centenarian cash gifts.',
          'eligibility', 'Filipino citizen, at least 60 years old, permanent resident of Carmen, Cebu.',
          'requirements', jsonb_build_array('PSA Birth Certificate or Voter Certificate', '1x1 ID Photos (2 pcs)', 'Barangay Certificate of Residency'),
          'isActive', true,
          'icon', 'HeartHandshake'
        ),
        jsonb_build_object(
          'id', 'srv-2',
          'title', 'Persons with Disability (PWD) Welfare & Support',
          'category', 'Person with Disability (PWD)',
          'description', 'Registration and issuance of PWD ID cards, assistive mobility devices (wheelchairs, crutches), special livelihood assistance, and medical rehabilitation referrals.',
          'eligibility', 'Resident of Carmen with physical, mental, intellectual, or sensory impairments.',
          'requirements', jsonb_build_array('Medical Evaluation Certificate from licensed physician', 'Barangay Certificate of Indigency', 'Valid Government ID or Birth Certificate'),
          'isActive', true,
          'icon', 'Accessibility'
        ),
        jsonb_build_object(
          'id', 'srv-3',
          'title', 'Youth & Student Educational Welfare Grant',
          'category', 'Youth',
          'description', 'Special financial educational assistance for indigent students, skills training referrals, youth organization accreditation, and anti-delinquency guidance counseling.',
          'eligibility', 'Enrolled youth/student aged 15-30 residing in Carmen whose family income falls below poverty threshold.',
          'requirements', jsonb_build_array('Certificate of Enrollment / COR', 'Valid Student ID', 'Barangay Certificate of Indigency'),
          'isActive', true,
          'icon', 'GraduationCap'
        ),
        jsonb_build_object(
          'id', 'srv-4',
          'title', 'Solo Parents Welfare & Women Empowerment',
          'category', 'Women',
          'description', 'Issuance of Solo Parent Identification Card (under RA 11861), monthly welfare subsidies, crisis intervention, psychosocial support, and livelihood capital assistance.',
          'eligibility', 'Solo parent residing in Carmen with sole parental custody over dependent children.',
          'requirements', jsonb_build_array('Solo Parent Sworn Affidavit', 'Birth Certificates of Dependents', 'Barangay Certificate of Solo Parent Status'),
          'isActive', true,
          'icon', 'Users'
        ),
        jsonb_build_object(
          'id', 'srv-5',
          'title', 'Assistance to Individuals in Crisis Situations (AICS)',
          'category', 'General',
          'description', 'Immediate emergency cash or voucher grants for hospital bills, medicine purchases, burial costs, and transportation assistance for stranded constituents.',
          'eligibility', 'Any Carmen constituent in verified acute economic distress or bereavement.',
          'requirements', jsonb_build_array('Hospital Bill / Doctor Prescription or Death Certificate', 'Barangay Indigency Certificate', 'Valid Government ID'),
          'isActive', true,
          'icon', 'HeartHandshake'
        )
      )
    ),
    true,
    'System Initializer'
  ),
  (
    'faqs',
    'Citizen Help Center & Frequently Asked Questions',
    'Clear answers to common questions regarding applications, requirements, claiming schedules, and citizen benefits.',
    NULL,
    jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object(
          'id', 'faq-1',
          'question', 'Who is eligible to apply for MSWDO welfare programs in Carmen?',
          'category', 'General',
          'answer', 'All bonafide residents of Carmen, Cebu who belong to vulnerable sectors (Senior Citizens aged 60+, Persons with Disability, Solo Parents, indigent students, or families in crisis) are eligible to apply.',
          'order', 1
        ),
        jsonb_build_object(
          'id', 'faq-2',
          'question', 'How long does the online application evaluation take?',
          'category', 'Application',
          'answer', 'Standard application review takes 3 to 5 business days upon digital submission of all complete required documents. You can track your real-time status online using your reference number.',
          'order', 2
        ),
        jsonb_build_object(
          'id', 'faq-3',
          'question', 'What happens if my application is marked "Needs correction"?',
          'category', 'Application',
          'answer', 'If an uploaded requirement is blurry or missing, caseworkers will flag the specific document. You can open the Track Application page or sign into your applicant portal to upload the replacement file immediately.',
          'order', 3
        ),
        jsonb_build_object(
          'id', 'faq-4',
          'question', 'How are approved financial and medical subsidies disbursed?',
          'category', 'Benefits',
          'answer', 'Approved assistance can be claimed directly at the MSWDO Office at the Carmen Municipal Hall during scheduled payout dates, or through designated municipal cash disbursement partners.',
          'order', 4
        ),
        jsonb_build_object(
          'id', 'faq-5',
          'question', 'Can I track my application without signing in?',
          'category', 'General',
          'answer', 'Yes! Simply navigate to the "Track Application" page and input your Application Reference Number (e.g., MSWDO-2026-XXXXX) to check current verification progress.',
          'order', 5
        )
      )
    ),
    true,
    'System Initializer'
  ),
  (
    'documents',
    'Downloadable Municipal Application Forms & Checklists',
    'Official MSWDO printable forms, sworn statements, and requirement checklists for citizen download.',
    NULL,
    jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object(
          'id', 'doc-1',
          'title', 'General Intake & Social Welfare Application Form',
          'code', 'MSWDO-FORM-001',
          'category', 'General',
          'fileSize', '184 KB',
          'format', 'PDF',
          'url', 'https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg',
          'description', 'Primary application sheet required for all new walk-in and indigent assistance intakes.'
        ),
        jsonb_build_object(
          'id', 'doc-2',
          'title', 'Senior Citizen (OSCA) Member Registration Sheet',
          'code', 'MSWDO-OSCA-02',
          'category', 'Senior Citizen',
          'fileSize', '142 KB',
          'format', 'PDF',
          'url', 'https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg',
          'description', 'Registration form for Senior Citizen ID issuance, discount booklet, and social pension enrollment.'
        ),
        jsonb_build_object(
          'id', 'doc-3',
          'title', 'PWD Disability Medical Evaluation & Intake Sheet',
          'code', 'MSWDO-PWD-03',
          'category', 'Person with Disability (PWD)',
          'fileSize', '210 KB',
          'format', 'PDF',
          'url', 'https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg',
          'description', 'Official assessment form to be completed by attending physician for PWD ID eligibility.'
        ),
        jsonb_build_object(
          'id', 'doc-4',
          'title', 'Solo Parent Sworn Affidavit & Family Background Sheet',
          'code', 'MSWDO-SOLO-04',
          'category', 'Women',
          'fileSize', '165 KB',
          'format', 'PDF',
          'url', 'https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg',
          'description', 'Notarized sworn affidavit of solo parenthood under Republic Act No. 11861.'
        ),
        jsonb_build_object(
          'id', 'doc-5',
          'title', 'Social Case Study Assessment Request Template',
          'code', 'MSWDO-SCS-05',
          'category', 'General',
          'fileSize', '198 KB',
          'format', 'PDF',
          'url', 'https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg',
          'description', 'Template for hospital social services, medical charity, and educational sponsorship requests.'
        )
      )
    ),
    true,
    'System Initializer'
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_url = COALESCE(public.cms_content.image_url, EXCLUDED.image_url),
  data = EXCLUDED.data,
  updated_at = NOW();

-- 5. Storage Bucket setup for cms-assets (if supported)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public read access
DROP POLICY IF EXISTS "Public can view cms assets" ON storage.objects;
CREATE POLICY "Public can view cms assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('cms-assets', 'application-documents'));

-- Storage RLS: Authenticated write access
DROP POLICY IF EXISTS "Authenticated can upload cms assets" ON storage.objects;
CREATE POLICY "Authenticated can upload cms assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('cms-assets', 'application-documents'));
