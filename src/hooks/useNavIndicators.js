import { useState, useEffect, useCallback } from "react"
import { getNotifications, NOTIFICATIONS_EVENT } from "@/services/notificationService"
import { getApplications } from "@/services/applicationService"
import { getBenefitClaims } from "@/services/benefitService"
import { getAnnouncements, ANNOUNCEMENTS_EVENT } from "@/services/announcementService"
import { useAuth } from "./useAuth"

/**
 * Hook providing dynamic alert & notification indicators for the navigation panel.
 * Updates in real-time across tabs and actions.
 */
export function useNavIndicators() {
  const { role, profile, user } = useAuth()
  const isSuperAdmin = role === "super_admin_user" || role === "itsd"
  const isStaff = role === "admin_staff" || role === "inventory_staff"
  const isApplicant = role === "applicant_user" || role === "end_user"

  const [indicators, setIndicators] = useState({
    applications: null, // e.g. "3" or dot
    benefits: null,
    announcements: null,
    audit: null,
    support: null,
  })

  const computeIndicators = useCallback(async () => {
    try {
      // 1. Applications Indicator (Pending applications)
      let pendingAppsCount = 0
      try {
        const apps = await getApplications()
        if (Array.isArray(apps)) {
          if (isApplicant) {
            const userEmail = (profile?.email || user?.email || "").toLowerCase()
            const myApps = apps.filter(
              (a) => (a.email && a.email.toLowerCase() === userEmail) || (user?.id && a.userId === user.id)
            )
            const needsAction = myApps.filter(
              (a) => a.status === "Action Required" || a.status === "Resubmission Requested" || a.status === "Pending"
            ).length
            pendingAppsCount = needsAction
          } else {
            pendingAppsCount = apps.filter(
              (a) => a.status === "Pending" || a.status === "Under Review"
            ).length
          }
        }
      } catch (_) {}

      // 2. Announcements Indicator (Reflects active published announcements)
      let announcementsCount = 0
      try {
        const annList = await getAnnouncements()
        if (Array.isArray(annList)) {
          const published = annList.filter((a) => a.status === "Published")
          if (isApplicant) {
            const userSector = (profile?.sector || profile?.applicant_type || "").toLowerCase()
            const relevant = published.filter((a) => {
              if (
                !a.audience ||
                a.audience.length === 0 ||
                a.audience.some((aud) => aud.toLowerCase().includes("all"))
              ) {
                return true
              }
              if (
                userSector &&
                a.audience.some(
                  (aud) =>
                    aud.toLowerCase().includes(userSector) ||
                    userSector.includes(aud.toLowerCase())
                )
              ) {
                return true
              }
              return false
            })
            announcementsCount = relevant.length
          } else {
            announcementsCount = published.length
          }
        }
      } catch (_) {}

      // 3. Benefits / Claims Indicator (Pending claims)
      let pendingClaimsCount = 0
      if (!isApplicant) {
        try {
          const claims = await getBenefitClaims()
          if (Array.isArray(claims)) {
            pendingClaimsCount = claims.filter((c) => c.status === "Pending").length
          }
        } catch (_) {}
      }

      setIndicators({
        applications: pendingAppsCount > 0 ? (pendingAppsCount > 9 ? "9+" : String(pendingAppsCount)) : null,
        benefits: pendingClaimsCount > 0 ? (pendingClaimsCount > 9 ? "9+" : String(pendingClaimsCount)) : null,
        announcements: announcementsCount > 0 ? (announcementsCount > 9 ? "9+" : String(announcementsCount)) : null,
        audit: isSuperAdmin ? null : null,
        support: null,
      })
    } catch (err) {
      console.warn("Failed to compute nav indicators:", err)
    }
  }, [role, profile, user, isSuperAdmin, isStaff, isApplicant])

  useEffect(() => {
    computeIndicators()

    const handleSync = () => computeIndicators()
    window.addEventListener(NOTIFICATIONS_EVENT, handleSync)
    window.addEventListener(ANNOUNCEMENTS_EVENT, handleSync)
    window.addEventListener("application_status_updated", handleSync)
    window.addEventListener("mswdo_user_terminations_changed", handleSync)
    window.addEventListener("storage", handleSync)

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, handleSync)
      window.removeEventListener(ANNOUNCEMENTS_EVENT, handleSync)
      window.removeEventListener("application_status_updated", handleSync)
      window.removeEventListener("mswdo_user_terminations_changed", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [computeIndicators])

  return indicators
}

export default useNavIndicators
