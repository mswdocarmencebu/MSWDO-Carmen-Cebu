import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { SuperAdminUserDashboardPage } from "./super_admin_user/SuperAdminUserDashboardPage"
import { AdminStaffDashboardPage } from "./admin_staff/AdminStaffDashboardPage"
import { ApplicantUserDashboardPage } from "./applicant_user/ApplicantUserDashboardPage"

export function DashboardPage() {
  const { role } = useAuth()

  // Route to the role-specific dashboard page
  switch (role) {
    case "super_admin_user":
    case "itsd":
      return <SuperAdminUserDashboardPage />
    case "admin_staff":
    case "inventory_staff":
      return <AdminStaffDashboardPage />
    case "applicant_user":
    case "end_user":
    default:
      return <ApplicantUserDashboardPage />
  }
}

export default DashboardPage
