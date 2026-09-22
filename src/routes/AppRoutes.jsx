import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ProtectedRoute } from "./ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { ApplyPage } from "@/pages/ApplyPage"
import { TrackApplicationPage } from "@/pages/TrackApplicationPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { DashboardPage } from "@/pages/DashboardPage"
import {
  SuperAdminUserDashboardPage,
  SuperAdminMembersPage,
  SuperAdminApplicationsPage,
  SuperAdminBenefitsPage,
  SuperAdminTerminationPage,
  SuperAdminAuditPage,
  SuperAdminAnnouncementsPage,
  SuperAdminReportsPage,
  SuperAdminSystemPage,
  SuperAdminCmsPage,
  SuperAdminUserManagementPage,
} from "@/pages/super_admin_user"
import { AdminStaffDashboardPage } from "@/pages/admin_staff/AdminStaffDashboardPage"
import { ApplicantUserDashboardPage } from "@/pages/applicant_user/ApplicantUserDashboardPage"
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

/**
 * Public route wrapper that redirects authenticated users to their dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <AuthLoadingScreen
        message="Loading MSWDO Portal..."
        submessage="Connecting to secure database..."
      />
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRoutes() {
  const location = useLocation()

  return (
    <div className="w-full min-h-screen">
      <Routes location={location}>
        {/* Primary Authentication Route: /signin */}
        <Route
          path="/signin"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        {/* Aliases redirecting to /signin */}
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<Navigate to="/signin" replace />} />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Public Citizen Application Route: /apply */}
        <Route path="/apply" element={<ApplyPage />} />

        {/* Public Application Tracking Route: /track */}
        <Route path="/track" element={<TrackApplicationPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes using standard react-router-dom ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          {/* Automatic role-dispatching dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ========================================================= */}
          {/* Super Admin User Routes (11 Dedicated Modules)            */}
          {/* ========================================================= */}
          {/* 1. Dashboard */}
          <Route
            path="/dashboard/super-admin"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminUserDashboardPage />
              </ProtectedRoute>
            }
          />
          {/* 2. Members */}
          <Route
            path="/dashboard/super-admin/members"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminMembersPage />
              </ProtectedRoute>
            }
          />
          {/* 3. Applications */}
          <Route
            path="/dashboard/super-admin/applications"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          {/* 4. Benefits */}
          <Route
            path="/dashboard/super-admin/benefits"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminBenefitsPage />
              </ProtectedRoute>
            }
          />
          {/* 5. Termination */}
          <Route
            path="/dashboard/super-admin/termination"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminTerminationPage />
              </ProtectedRoute>
            }
          />
          {/* 6. Audit & Monitoring */}
          <Route
            path="/dashboard/super-admin/audit"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminAuditPage />
              </ProtectedRoute>
            }
          />
          {/* 7. Announcements */}
          <Route
            path="/dashboard/super-admin/announcements"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminAnnouncementsPage />
              </ProtectedRoute>
            }
          />
          {/* 8. Reports */}
          <Route
            path="/dashboard/super-admin/reports"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminReportsPage />
              </ProtectedRoute>
            }
          />
          {/* 9. System */}
          <Route
            path="/dashboard/super-admin/system"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminSystemPage />
              </ProtectedRoute>
            }
          />
          {/* 10. CMS (SA) */}
          <Route
            path="/dashboard/super-admin/cms"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminCmsPage />
              </ProtectedRoute>
            }
          />
          {/* 11. User Management (SA) */}
          <Route
            path="/dashboard/super-admin/user-management"
            element={
              <ProtectedRoute allowedRoles={["super_admin_user", "itsd"]}>
                <SuperAdminUserManagementPage />
              </ProtectedRoute>
            }
          />
          {/* User management route alias */}
          <Route
            path="/dashboard/super-admin/users"
            element={<Navigate to="/dashboard/super-admin/user-management" replace />}
          />
          {/* Legacy route alias */}
          <Route path="/dashboard/itsd" element={<Navigate to="/dashboard/super-admin" replace />} />

          {/* ========================================================= */}
          {/* Admin Staff Route                                         */}
          {/* ========================================================= */}
          <Route
            path="/dashboard/admin-staff"
            element={
              <ProtectedRoute allowedRoles={["admin_staff", "inventory_staff"]}>
                <AdminStaffDashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route alias */}
          <Route path="/dashboard/inventory" element={<Navigate to="/dashboard/admin-staff" replace />} />

          {/* ========================================================= */}
          {/* Applicant User Route                                      */}
          {/* ========================================================= */}
          <Route
            path="/dashboard/applicant"
            element={
              <ProtectedRoute allowedRoles={["applicant_user", "end_user"]}>
                <ApplicantUserDashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route alias */}
          <Route path="/dashboard/user" element={<Navigate to="/dashboard/applicant" replace />} />

          {/* User Profile, Credentials & Settings Page */}
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default AppRoutes
