# 00 - MSWDO Carmen Project Overview

## 1. Executive Summary

**MSWDO Carmen** (Municipal Social Welfare and Development Office • Local Government Unit of Carmen) is an enterprise-grade citizen welfare services and assistance management platform. Built on modern web standards with React 19, Vite, and Supabase, MSWDO provides role-segregated consoles for Executive Super Administrators, Admin Staff intake evaluators, and citizen Applicant Users.

---

## 2. Core Architectural Pillars

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MSWDO CARMEN APPLICATION                           │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ PRIMARY ENTRY ROUTE           │ /signin (strict, no public self-registration)│
├───────────────────────────────┼──────────────────────────────────────────────┤
│ AUTH & RBAC BACKEND           │ Supabase Auth (GoTrue) + PostgreSQL RLS      │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ ROLE DATA TABLES              │ public.users, super_admin_users,             │
│                               │ admin_staff_users, applicant_users           │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ ROLE-SEPARATED DIRECTORIES    │ src/layouts/{role}/ & src/pages/{role}/      │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ DESIGN SYSTEM                 │ Rounded-[5px] tokens, Dark/Light glass,      │
│                               │ Tailwind CSS, Framer Motion micro-animations │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

### 2.1. Strict Seeded Authentication
- **No Self-Registration**: Public self-registration has been decommissioned. Accounts are provisioned and authorized by executive administrators via database seeds (`supabase/seed.sql`).
- **Primary Auth Route**: `/signin`. Legacy paths (`/login`, `/signup`, `/`) redirect automatically to `/signin` or `/dashboard`.
- **Username / Alias Login**: Accepts both canonical email (`super.admin@mswdo.carmen.gov.ph`) and username alias (`super.admin`).

### 2.2. Dedicated Role-Based Layouts & Consoles
Rather than a shared monolithic dashboard, MSWDO Carmen separates layouts and pages by role into isolated module trees:
- `src/layouts/super_admin_user/` & `src/pages/super_admin_user/` (Super Admin Console - Crimson Red Theme)
- `src/layouts/admin_staff/` & `src/pages/admin_staff/` (Admin Staff Intake Console - Cobalt Blue Theme)
- `src/layouts/applicant_user/` & `src/pages/applicant_user/` (Applicant User Portal - Emerald Green Theme)

### 2.3. Clean Unified Navigation & Collapsible Rail
- **Streamlined Sidebar**: Displays primary welfare management and application links cleanly.
- **Dynamic Centered Logo**: Features the official Carmen LGU / MSWDO logo (`carmen_lgu_logo.png`), enlarging to `h-14` when open and condensing to `h-9` in rail mode.
- **Hover/Focus Full Overlay**: In collapsed desktop rail mode (`w-20`), hovering or focusing expands the sidebar as an elevated `w-64` overlay over the dashboard without triggering page layout reflows.
- **Toggle State**: Displays **"Open Sidebar"** when collapsed and **"Collapse Sidebar"** when expanded.

---

## 3. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite 6 | Fast SPA rendering, tree-shaking, fast HMR |
| **Package Manager** | pnpm (v9+) | Fast, disk-efficient dependency resolution and strict lockfile |
| **Routing** | React Router DOM v6 | Protected routing (`ProtectedRoute.jsx`), role guards |
| **Styling** | Tailwind CSS v4 | Curated color system, atomic tokens, `rounded-[5px]` |
| **Animations** | Framer Motion | Smooth dialog entry/exits, layout overlays, progress bars |
| **Icons** | Lucide React | Clean, recognizable system icons |
| **Backend / DB** | Supabase (PostgreSQL 15) | Real-time database, Row-Level Security (RLS) policies |
| **Auth Provider** | Supabase GoTrue | Encrypted JWT tokens, password hashing, user metadata |

### 3.1. Package Management & Execution (pnpm)
This project standardizes on **`pnpm`** exclusively for deterministic dependency management, caching, and build commands:
- Install packages: `pnpm install`
- Launch local development: `pnpm dev`
- Compile production bundle: `pnpm build`
- Preview production build: `pnpm preview`

---

## 4. Key Directory Structure

```
react-supabase-template/
├── docs/                                # Project documentation
│   ├── 00_PROJECT_OVERVIEW.md           # This document
│   ├── 001_ROLES_AND_PERMISSIONS.md     # Detailed RBAC and user tiers
│   ├── ARCHITECTURE_AND_CONVENTIONS.md  # Coding rules & patterns
│   ├── SEED_DATA.md                     # Database seed guide
│   └── zz_ARCHIVES.md                   # Legacy archives & bug resolution history
├── public/
│   ├── carmen_lgu_logo.png              # Official Carmen LGU logo
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/                      # Shared global components
│   │   │   ├── AuthLoadingScreen.jsx    # Full-screen branded loading screen
│   │   │   ├── SignOutDialog.jsx        # Portal-rendered sign-out confirmation
│   │   │   └── UserMenuDropdown.jsx     # Header profile & credentials dropdown
│   │   ├── features/auth/               # Auth cards & showcase
│   │   └── ui/                          # Button, Input, Card, Select
│   ├── context/
│   │   └── AuthContext.jsx              # Supabase session, role resolving, isAuthenticating
│   ├── hooks/
│   │   ├── useAuth.js                   # Hook for session, profile, and auth methods
│   │   ├── useSidebar.js                # Desktop collapse & mobile drawer state
│   │   └── useUserRole.js               # Role badges and display helper
│   ├── layouts/
│   │   ├── super_admin_user/            # Super Admin Layout, Header, and Sidebar
│   │   ├── admin_staff/                 # Admin Staff Layout, Header, and Sidebar
│   │   └── applicant_user/              # Applicant User Layout, Header, and Sidebar
│   ├── pages/
│   │   ├── super_admin_user/            # Super Admin role dashboard
│   │   ├── admin_staff/                 # Admin Staff intake dashboard
│   │   ├── applicant_user/              # Applicant User portal dashboard
│   │   ├── LoginPage.jsx                # /signin primary page
│   │   ├── ForgotPasswordPage.jsx       # Password recovery page
│   │   ├── DashboardPage.jsx            # Dynamic role-dispatching dashboard
│   │   └── ProfileSettingsPage.jsx      # /profile & /settings credentials portal
│   └── routes/
│       ├── AppRoutes.jsx                # Route hierarchy and navigation paths
│       └── ProtectedRoute.jsx           # Guard checking authentication & role clearance
└── supabase/
    └── seed.sql                         # Complete database schema, RLS, and seed data
```

---

## 5. Security & Session Handling

1. **Row Level Security (RLS)**:
   All database tables enforce strict RLS. Role determination is performed via `public.get_auth_user_role()`, a `SECURITY DEFINER` function that bypasses recursive RLS queries on `public.users`.
2. **Sign-Out Confirmation**:
   Sign out triggers a full-screen confirmation dialog ([`SignOutDialog.jsx`](file:///c:/Users/admin/react-supabase-template/src/components/common/SignOutDialog.jsx)) mounted directly to `document.body` via React Portals to prevent any sidebar clipping. Confirming terminates the session and safely redirects to `/signin`.
3. **Seamless Transition Loading**:
   During credential verification and route change, the root-level [`AuthLoadingScreen.jsx`](file:///c:/Users/admin/react-supabase-template/src/components/common/AuthLoadingScreen.jsx) ensures zero blank screens or layout flashes.
