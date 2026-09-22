# MSWDO Carmen Documentation Index

Welcome to the Municipal Social Welfare and Development Office (**MSWDO**) Carmen documentation repository. Follow the indexed guides below to understand the project architecture, security specifications, role hierarchy, and legacy archives.

---

## 📚 Documentation Index

| ID / File | Document Title | Description |
| :--- | :--- | :--- |
| **[`00`](./00_PROJECT_OVERVIEW.md)** | **[MSWDO Project Overview](./00_PROJECT_OVERVIEW.md)** | Core architectural pillars, technology stack, directory organization, and high-level design systems. |
| **[`001`](./001_ROLES_AND_PERMISSIONS.md)** | **[Roles and Permissions Overview](./001_ROLES_AND_PERMISSIONS.md)** | Detailed specifications for `super_admin_user`, `admin_staff`, and `applicant_user` roles, credentials, dedicated PostgreSQL tables, and the RBAC matrix. |
| **`ARCH`** | **[Architecture & Conventions Guide](./ARCHITECTURE_AND_CONVENTIONS.md)** | PascalCase/camelCase file naming standards, React Context auth, global state rules, and hook-first design principles. |
| **`SEED`** | **[Dedicated Role Tables & Seed Data Guide](./SEED_DATA.md)** | Database seed instructions, default accounts, and execution steps for `supabase/seed.sql`. |
| **[`zz`](./zz_ARCHIVES.md)** | **[Archives & Legacy Resolutions](./zz_ARCHIVES.md)** | Record of decommissioned workflows and solutions to critical bugs. |

---

## 🚀 Quick Reference: Seed Credentials

Institutional Master Password: **`Password123!`**

| Role Code | Role Name | Seed Email / Alias | Accent Color | Dedicated Table |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin_user`** | Super Admin User | `super.admin@mswdo.carmen.gov.ph` (`super.admin`) | Crimson Red | `public.super_admin_users` |
| **`admin_staff`** | Admin Staff | `admin.staff@mswdo.carmen.gov.ph` (`admin.staff`) | Cobalt Blue | `public.admin_staff_users` |
| **`applicant_user`** | Applicant User | `applicant.user@mswdo.carmen.gov.ph` (`applicant.user`) | Emerald Green | `public.applicant_users` |
