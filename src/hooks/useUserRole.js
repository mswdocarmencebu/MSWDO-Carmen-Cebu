import { useMemo } from "react"
import { useAuth } from "./useAuth"

/**
 * Custom hook to encapsulate role-based styling, metadata, and permissions.
 */
export function useUserRole() {
  const { role, profile, user } = useAuth()

  const roleConfig = useMemo(() => {
    switch (role) {
      case "super_admin_user":
      case "itsd":
        return {
          id: "super_admin_user",
          displayName: "Super Admin User",
          badgeLabel: "Super Admin",
          colorTheme: "blue",
          badgeClass: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900",
          gradientClass: "from-blue-600 via-sky-600 to-indigo-700",
          headerSub: "MSWDO Carmen • Executive Master Administration & Security",
          subRole: profile?.roleDetails?.admin_level || "Super Administrator",
        }
      case "admin_staff":
      case "inventory_staff":
        return {
          id: "admin_staff",
          displayName: "Admin Staff",
          badgeLabel: "Admin Staff",
          colorTheme: "blue",
          badgeClass: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900",
          gradientClass: "from-blue-700 to-indigo-600",
          headerSub: "MSWDO Carmen • Beneficiary Processing & Case Intake",
          subRole: profile?.roleDetails?.staff_tier || profile?.roleDetails?.inventory_tier || "Case Officer",
        }
      case "applicant_user":
      case "end_user":
      default:
        return {
          id: "applicant_user",
          displayName: "Applicant User",
          badgeLabel: "Applicant User",
          colorTheme: "emerald",
          badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900",
          gradientClass: "from-emerald-700 to-teal-600",
          headerSub: "MSWDO Carmen • Assistance & Welfare Services Portal",
          subRole: profile?.roleDetails?.barangay || profile?.roleDetails?.department || "Citizen Client",
        }
    }
  }, [role, profile])

  const userDisplayName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  }, [profile, user])

  const isSuperAdmin = role === "super_admin_user" || role === "itsd"
  const isAdmin = role === "admin_staff" || role === "inventory_staff"
  const isApplicant = role === "applicant_user" || role === "end_user"

  return {
    role,
    roleConfig,
    userDisplayName,
    isSuperAdminUser: isSuperAdmin,
    isAdminStaff: isAdmin,
    isApplicantUser: isApplicant,
    // Backwards compatibility aliases
    isITSD: isSuperAdmin,
    isInventoryStaff: isAdmin,
    isEndUser: isApplicant,
    roleDetails: profile?.roleDetails || null,
  }
}

export default useUserRole
