# 001 - Roles and Permissions Overview

## 1. System Role Hierarchy

MSWDO Carmen uses an enterprise Role-Based Access Control (RBAC) architecture. Every authenticated identity is partitioned into one of three primary tiers, backed by dedicated PostgreSQL database tables and dedicated React layout consoles.

```
                               ┌──────────────────────┐
                               │   Supabase GoTrue    │
                               │     (auth.users)     │
                               └──────────┬───────────┘
                                          │ 1:1
                               ┌──────────▼───────────┐
                               │     public.users     │
                               │ (Base Identity & Role│
                               └──────────┬───────────┘
                ┌──────────────────────────┼──────────────────────────┐
                │ 1:1                      │ 1:1                      │ 1:1
     ┌──────────▼──────────┐    ┌──────────▼──────────┐    ┌──────────▼──────────┐
     │public.super_admin_  │    │  public.admin_      │    │  public.applicant_  │
     │       users         │    │   staff_users       │    │       users         │
     │ Executive Oversight │    │ Intake & Evaluation │    │ Citizens & Clients  │
     └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 2. Role Specifications & Seed Accounts

All default accounts use the institutional master password: **`Password123!`**

### 2.1. Super Admin User (`super_admin_user`)
- **Role Code**: `super_admin_user`
- **Branding & Accent**: Crimson Red (`bg-red-700`, `text-red-500`, red aura glows)
- **Primary Mission**: Executive oversight, statutory welfare policy, staff authorization, program fund allocation, and security auditing.
- **Dedicated Table**: `public.super_admin_users`
- **Default Seed User**:
  - **Full Name**: Alex Rivera (Super Admin)
  - **Email**: `super.admin@mswdo.carmen.gov.ph`
  - **Login Alias**: `super.admin`
  - **Password**: `Password123!`
  - **Admin Level**: `Executive Lead Admin`
  - **Office**: `MSWDO Executive Office - Carmen LGU`
  - **Can Manage Users**: `true`
- **Layout & Routing**:
  - Layout: [`src/layouts/super_admin_user/SuperAdminUserLayout.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/super_admin_user/SuperAdminUserLayout.jsx)
  - Sidebar: [`src/layouts/super_admin_user/SuperAdminUserSidebar.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/super_admin_user/SuperAdminUserSidebar.jsx)
  - Console: [`src/pages/super_admin_user/SuperAdminUserDashboardPage.jsx`](file:///c:/Users/admin/react-supabase-template/src/pages/super_admin_user/SuperAdminUserDashboardPage.jsx)

---

### 2.2. Admin Staff (`admin_staff`)
- **Role Code**: `admin_staff`
- **Branding & Accent**: Cobalt Blue (`bg-blue-700`, `text-blue-500`, blue badge rings)
- **Primary Mission**: Beneficiary intake, documentary evaluation, AICS and calamity assistance assessment, and barangay relief coordination.
- **Dedicated Table**: `public.admin_staff_users`
- **Default Seed User**:
  - **Full Name**: Sarah Chen (Admin Staff)
  - **Email**: `admin.staff@mswdo.carmen.gov.ph`
  - **Login Alias**: `admin.staff`
  - **Password**: `Password123!`
  - **Staff Tier**: `Lead Welfare Evaluator`
  - **Assigned Cluster**: `Central Carmen Intake Bay 4`
  - **Badge Number**: `MSWDO-0042`
- **Layout & Routing**:
  - Layout: [`src/layouts/admin_staff/AdminStaffLayout.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/admin_staff/AdminStaffLayout.jsx)
  - Sidebar: [`src/layouts/admin_staff/AdminStaffSidebar.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/admin_staff/AdminStaffSidebar.jsx)
  - Console: [`src/pages/admin_staff/AdminStaffDashboardPage.jsx`](file:///c:/Users/admin/react-supabase-template/src/pages/admin_staff/AdminStaffDashboardPage.jsx)

---

### 2.3. Applicant User (`applicant_user`)
- **Role Code**: `applicant_user`
- **Branding & Accent**: Emerald Green (`bg-emerald-700`, `text-emerald-500`, green highlights)
- **Primary Mission**: Social welfare program application, requirement document upload, application progress tracking, and citizen inquiries.
- **Dedicated Table**: `public.applicant_users`
- **Default Seed User**:
  - **Full Name**: Michael Torres (Applicant)
  - **Email**: `applicant.user@mswdo.carmen.gov.ph`
  - **Login Alias**: `applicant.user`
  - **Password**: `Password123!`
  - **Barangay**: `Barangay Poblacion, Carmen`
  - **Client ID**: `CLNT-7719`
  - **Category**: `Social Welfare Beneficiary`
- **Layout & Routing**:
  - Layout: [`src/layouts/applicant_user/ApplicantUserLayout.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/applicant_user/ApplicantUserLayout.jsx)
  - Sidebar: [`src/layouts/applicant_user/ApplicantUserSidebar.jsx`](file:///c:/Users/admin/react-supabase-template/src/layouts/applicant_user/ApplicantUserSidebar.jsx)
  - Console: [`src/pages/applicant_user/ApplicantUserDashboardPage.jsx`](file:///c:/Users/admin/react-supabase-template/src/pages/applicant_user/ApplicantUserDashboardPage.jsx)

---

## 3. RBAC Permissions Matrix

| Operational Capability | Super Admin (`super_admin_user`) | Admin Staff (`admin_staff`) | Applicant User (`applicant_user`) |
| :--- | :---: | :---: | :---: |
| **System Security & Audit Telemetry** | Full Read/Write | None | None |
| **Manage Staff Accounts & Permissions** | Full Read/Write | None | None |
| **Welfare Programs & Fund Allocations** | Full Read/Write | Read Only | None |
| **Beneficiary Intake & Case Management** | Full Read/Write | Full Read/Write | Read Only (Self Records) |
| **Documentary Requirement Verification** | Full Read/Write | Full Read/Write | Upload / View Self |
| **Barangay Cluster Assessment & Dispatch** | Review & Authorize | Execute & Record | None |
| **Assistance Application Submission** | Authorize | Intake & Process | Create & Track |
| **Self Profile & Credentials Management** | Manage Self | Manage Self | Manage Self |

---

## 4. PostgreSQL Database Schema & Dedicated Tables

### 4.1. Base Table (`public.users`)
```sql
CREATE TYPE user_role AS ENUM ('super_admin_user', 'admin_staff', 'applicant_user');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'applicant_user'::user_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2. Super Admin Table (`public.super_admin_users`)
```sql
CREATE TABLE public.super_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  admin_level TEXT NOT NULL DEFAULT 'Executive Super Admin',
  office_assignment TEXT DEFAULT 'MSWDO Executive Office - Carmen LGU',
  clearance_scope TEXT DEFAULT 'Statutory Welfare Programs & System Vault',
  can_manage_users BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3. Admin Staff Table (`public.admin_staff_users`)
```sql
CREATE TABLE public.admin_staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  staff_tier TEXT NOT NULL DEFAULT 'Lead Intake Officer',
  assigned_cluster TEXT DEFAULT 'Carmen North & South Barangay Clusters',
  badge_number TEXT DEFAULT 'MSWDO-STF-014',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4. Applicant Users Table (`public.applicant_users`)
```sql
CREATE TABLE public.applicant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  barangay TEXT NOT NULL DEFAULT 'Barangay Poblacion, Carmen',
  category TEXT DEFAULT 'Citizen Applicant / Beneficiary',
  client_id TEXT DEFAULT 'APPL-9024',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Row-Level Security (RLS) Implementation

To ensure data confidentiality without recursive policy locks:
1. **Helper Function (`public.get_auth_user_role`)**:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_auth_user_role()
   RETURNS user_role AS $$
     SELECT role FROM public.users WHERE id = auth.uid();
   $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
   ```
   *Note: Using `SECURITY DEFINER` with fixed `search_path = public` prevents infinite recursion loops when RLS policies query the `public.users` table.*

2. **Access Policies**:
   - **`public.users`**: Each user reads their own record (`auth.uid() = id`). Super admins can view all users (`get_auth_user_role() = 'super_admin_user'`).
   - **Dedicated Tables**: Each user can read their own specific role record (`auth.uid() = user_id`). Super admins maintain elevated visibility over all role tables.

---

## 6. Client-Side Session & Role Lifecycle

1. **Authentication Resolving (`AuthContext.jsx`)**:
   - `supabase.auth.onAuthStateChange` triggers upon sign-in.
   - Reads base record from `public.users`.
   - Concurrently fetches role-specific properties from `public.super_admin_users`, `public.admin_staff_users`, or `public.applicant_users` using `.maybeSingle()`.
   - Merges properties into `userProfile` and caches in state.
2. **Role Helper Hook (`useUserRole.js`)**:
   - Provides boolean flags: `isSuperAdminUser`, `isAdminStaff`, `isApplicantUser`.
   - Returns badge styles and localized role labels.
3. **Route Protection (`ProtectedRoute.jsx`)**:
   - Guards authenticated routes.
   - Checks if active role matches `allowedRoles`.
   - Automatically redirects unauthorized role attempts to the correct role dashboard.
4. **Profile & Credentials Interface (`/profile`, `/settings`)**:
   - Centralized in [`src/pages/ProfileSettingsPage.jsx`](file:///c:/Users/admin/react-supabase-template/src/pages/ProfileSettingsPage.jsx).
   - Exposes Identity info, raw database credentials/tokens, and interface preferences.
