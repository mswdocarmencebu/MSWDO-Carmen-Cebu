import React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

/**
 * ProtectedRoute component for standard react-router-dom guarding.
 * Checks authentication status and optional role-based access permissions.
 */
export function ProtectedRoute({ allowedRoles = null, children }) {
  const { isAuthenticated, loading, role, profile, user } = useAuth()
  const location = useLocation()

  // During auth initialization, render the branded loading screen
  if (loading) {
    return (
      <AuthLoadingScreen
        message="Verifying session..."
        submessage="Connecting to MSWDO security portal..."
      />
    )
  }

  // Not authenticated -> redirect to signin default route
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // Check if user is required to set their permanent password on first login
  const isApplicant = role === "applicant_user" || role === "end_user"
  const isStaff =
    role === "admin_staff" ||
    role === "super_admin_user" ||
    role === "itsd" ||
    role === "inventory_staff"

  // Centrally rely on profile.must_change_password resolved by AuthContext.
  // Never bypass with raw roleDetails columns which may be desynchronized due to RLS.
  const mustChangePassword = Boolean(profile?.must_change_password)

  const isApplicantSetupRoute =
    location.pathname === "/set-password" || location.pathname === "/first-time-setup"
  const isStaffSetupRoute =
    location.pathname === "/staff/update-password" || location.pathname === "/update-password"

  // 1. Force applicant with temporary password to complete applicant password setup
  if (isApplicant && mustChangePassword && !isApplicantSetupRoute) {
    return <Navigate to="/set-password" replace />
  }

  // 2. If applicant already completed setup, redirect to applicant dashboard
  if (isApplicant && !mustChangePassword && isApplicantSetupRoute) {
    return <Navigate to="/dashboard/applicant" replace />
  }

  // 3. Force staff with temporary password to complete staff password update
  if (isStaff && mustChangePassword && !isStaffSetupRoute) {
    return <Navigate to="/staff/update-password" replace />
  }

  // 4. If staff already completed setup, redirect to staff dashboard
  if (isStaff && !mustChangePassword && isStaffSetupRoute) {
    return <Navigate to="/dashboard" replace />
  }

  // 5. Cross-role route guards for setup pages
  if (!isApplicant && isApplicantSetupRoute) {
    return <Navigate to="/dashboard" replace />
  }
  if (!isStaff && isStaffSetupRoute) {
    return <Navigate to="/dashboard" replace />
  }

  // Check role authorization if allowedRoles are specified
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
