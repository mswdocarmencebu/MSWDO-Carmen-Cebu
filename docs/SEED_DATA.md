# Supabase Dedicated Role Tables & Seed Data Guide

This database schema organizes each role into its own dedicated table linked to the base `public.users` record:
- **`public.users`**: Base user entity (1:1 with `auth.users`).
- **`public.super_admin_users`**: Dedicated table for Executive Social Welfare Administrators.
- **`public.admin_staff_users`**: Dedicated table for Intake Officers, Evaluators & Caseworkers.
- **`public.applicant_users`**: Dedicated table for Citizens, Clients & Welfare Assistance Applicants.

---

## 👥 Seed Accounts & Table Mappings

All accounts use the password: **`Password123!`**

| Role | Email | Name | Dedicated Table | Role-Specific Fields |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin_user`** | `super.admin@mswdo.carmen.gov.ph` | Alex Rivera (Super Admin) | `public.super_admin_users` | `admin_level: 'Executive Lead Admin'`, `office_assignment: 'MSWDO Executive Office - Carmen LGU'`, `can_manage_users: TRUE` |
| **`admin_staff`** | `admin.staff@mswdo.carmen.gov.ph` | Sarah Chen (Admin Staff) | `public.admin_staff_users` | `staff_tier: 'Lead Welfare Evaluator'`, `assigned_cluster: 'Central Carmen Intake Bay 4'`, `badge_number: 'MSWDO-0042'` |
| **`applicant_user`** | `applicant.user@mswdo.carmen.gov.ph` | Michael Torres (Applicant) | `public.applicant_users` | `barangay: 'Barangay Poblacion, Carmen'`, `client_id: 'CLNT-7719'`, `category: 'Social Welfare Beneficiary'` |

---

## 🗄️ Database Architecture

```
auth.users (Supabase Auth)
     │
     ▼ (1:1 cascade)
public.users (id, email, full_name, role)
     ├── (1:1) ──► public.super_admin_users (user_id, admin_level, office_assignment, clearance_scope, can_manage_users)
     ├── (1:1) ──► public.admin_staff_users (user_id, staff_tier, assigned_cluster, badge_number)
     └── (1:1) ──► public.applicant_users (user_id, barangay, category, client_id)
```

---

## 🚀 How to Run the Seed Script

1. Open your **[Supabase Dashboard](https://app.supabase.com/)**.
2. Go to **SQL Editor** -> **New query**.
3. Copy all of [`supabase/seed.sql`](file:///c:/Users/admin/react-supabase-template/supabase/seed.sql) and paste it into the editor.
4. Click **Run**.

The script will automatically create the tables, apply RLS security policies, attach the auto-provisioning trigger (`handle_new_user`), and seed all 3 test accounts into their respective role tables.
