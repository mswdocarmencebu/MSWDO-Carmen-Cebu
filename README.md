<div align="center">

  <img src="public/carmen_lgu_logo.png" alt="Carmen LGU - MSWDO Official Logo" width="140" style="margin-bottom: 12px;" />

  # MSWDO
  ### Municipal Social Welfare and Development Office • Carmen LGU

  <p align="center">
    A robust, role-segregated social welfare assistance tracking and citizen services platform built with modern web technologies, PostgreSQL Row-Level Security, and dedicated role consoles.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/pnpm-9.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Supabase-GoTrue_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Framer_Motion-12.0-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Security-RLS_Enforced-dc2626?style=for-the-badge&logo=shield" alt="RLS Security" />
  </p>

</div>

---

## 📚 Documentation Suite

MSWDO Carmen maintains structured project and role documentation following a formal numbering convention:

| ID | Document | Summary |
| :---: | :--- | :--- |
| **`00`** | **[Project Overview](docs/00_PROJECT_OVERVIEW.md)** | Architectural pillars, technology stack, directory organization, and security handling. |
| **`001`** | **[Roles & Permissions Overview](docs/001_ROLES_AND_PERMISSIONS.md)** | Multi-tier RBAC matrix, credentials, dedicated role tables (`super_admin_users`, `admin_staff_users`, `applicant_users`), and RLS policies. |
| **`ARCH`** | **[Architecture & Conventions](docs/ARCHITECTURE_AND_CONVENTIONS.md)** | Coding standards, PascalCase vs camelCase conventions, React Context for Auth, Redux Toolkit, and hook-first principles. |
| **`SEED`** | **[Database & Seed Data Guide](docs/SEED_DATA.md)** | Instructions for executing `supabase/seed.sql` to initialize schema, RLS, and default role records. |
| **`zz`** | **[Archives & Legacy Resolutions](docs/zz_ARCHIVES.md)** | Technical history of decommissioned modules and critical bug fixes. |

---

## 🗂️ Project Directory Structure

```
react-supabase-template/
├── docs/                                  # Project & Architecture Documentation
│   ├── 00_PROJECT_OVERVIEW.md             # Core system overview & pillars
│   ├── 001_ROLES_AND_PERMISSIONS.md       # Multi-tier RBAC & credentials
│   ├── ARCHITECTURE_AND_CONVENTIONS.md    # Frontend architectural standards
│   ├── README.md                          # Documentation index
│   ├── SEED_DATA.md                       # Supabase SQL setup guide
│   └── zz_ARCHIVES.md                     # Legacy archives & bug resolution log
├── public/                                # Static assets
│   ├── carmen_lgu_logo.png                # Official Carmen LGU / MSWDO brand logo
│   ├── favicon.svg                        # Browser tab icon
│   └── icons.svg                          # Vector sprite sheet
├── src/
│   ├── components/
│   │   ├── common/                        # Global shared application components
│   │   │   ├── AuthLoadingScreen.jsx      # Full-screen branded auth transition
│   │   │   ├── SignOutDialog.jsx          # Portal-based signout confirmation
│   │   │   └── UserMenuDropdown.jsx       # Header identity & credentials menu
│   │   ├── features/auth/                 # Authentication cards & showcase panels
│   │   │   ├── AuthCard.jsx
│   │   │   ├── AuthShowcase.jsx           # Animated brand welcome showcase
│   │   │   └── LoginForm.jsx              # Dual email/alias sign-in form
│   │   └── ui/                            # Reusable atomic UI primitives
│   │       ├── Button.jsx                 # Styled button with variants
│   │       ├── Card.jsx                   # Glassmorphic container card
│   │       ├── Input.jsx                  # Standardized form input field
│   │       └── Select.jsx                 # Dropdown selection primitive
│   ├── context/
│   │   └── AuthContext.jsx                # Session state, role resolving & transition bridge
│   ├── hooks/
│   │   ├── useAuth.js                     # Unified hook for auth state & methods
│   │   ├── useSidebar.js                  # Sidebar collapse & mobile drawer toggle
│   │   └── useUserRole.js                 # Role badge, label & permission checkers
│   ├── layouts/                           # Role-segregated layout consoles
│   │   ├── super_admin_user/              # Super Admin layout, header & sidebar
│   │   ├── admin_staff/                   # Admin Staff layout, header & sidebar
│   │   └── applicant_user/                # Applicant User layout, header & sidebar
│   ├── pages/                             # Role consoles and global views
│   │   ├── super_admin_user/              # Super Admin dashboard
│   │   ├── admin_staff/                   # Admin Staff beneficiary intake dashboard
│   │   ├── applicant_user/                # Citizen applicant custody & request dashboard
│   │   ├── DashboardPage.jsx              # Dynamic role-dispatching router page
│   │   ├── ForgotPasswordPage.jsx         # Credential recovery interface
│   │   ├── LoginPage.jsx                  # Primary authentication interface (/signin)
│   │   └── ProfileSettingsPage.jsx        # Identity, RBAC credentials & preferences (/profile)
│   ├── redux/                             # Global client state management (RTK)
│   ├── routes/                            # Navigation & route guards
│   │   ├── AppRoutes.jsx                  # Route registry & layout hierarchy
│   │   └── ProtectedRoute.jsx             # Session & role-matching guard
│   ├── services/
│   │   └── supabaseClient.js              # Initialized Supabase client instance
│   ├── App.jsx                            # Root component with AuthLoadingScreen
│   ├── index.css                          # Design tokens, theme variables & Tailwind
│   └── main.jsx                           # React DOM mount point
└── supabase/
    └── seed.sql                           # Idempotent DB schema, RLS policies & seed data
```

---

## 👥 Seed Credentials & Role Tiers

Institutional Master Password: **`Password123!`**

| Role Code | Role Name & Representative | Email / Login Alias | Accent Branding | Dedicated Table |
| :--- | :--- | :--- | :---: | :--- |
| **`super_admin_user`** | **Alex Rivera**<br>Executive Super Admin | `super.admin@mswdo.carmen.gov.ph`<br>`super.admin` | `Crimson Red` | `public.super_admin_users` |
| **`admin_staff`** | **Sarah Chen**<br>Lead Intake Officer | `admin.staff@mswdo.carmen.gov.ph`<br>`admin.staff` | `Cobalt Blue` | `public.admin_staff_users` |
| **`applicant_user`** | **Michael Torres**<br>Citizen Beneficiary | `applicant.user@mswdo.carmen.gov.ph`<br>`applicant.user` | `Emerald Green` | `public.applicant_users` |

---

## ⚡ Key Platform Highlights

1. **Dedicated Table Architecture**: Base user identity resides in `public.users`, while role-specific operational fields are segregated into dedicated tables (`public.super_admin_users`, `public.admin_staff_users`, `public.applicant_users`).
2. **Non-Recursive RLS**: Row-Level Security leverages `public.get_auth_user_role()`, a `SECURITY DEFINER` function with a fixed `search_path = public` that eliminates policy recursion.
3. **Adaptive Collapsible Sidebar**: Dynamic centered logo scaling (`h-14` open, `h-9` rail), official Lucide icons, and a floating hover/focus overlay in collapsed mode that avoids page reflows.
