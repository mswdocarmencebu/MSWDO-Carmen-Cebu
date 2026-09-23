import { getApplications } from "./applicationService"
import { getMembers } from "./memberService"
import { getBenefitPrograms, getBenefitClaims } from "./benefitService"
import { getAnnouncements } from "./announcementService"
import { getStaffUsers } from "./userService"
import { getAuditLogs } from "./auditService"

/**
 * Normalizes string for fuzzy / tokenized search matching
 */
function matchesQuery(value, tokens) {
  if (!value) return false
  const str = String(value).toLowerCase()
  return tokens.every((token) => str.includes(token))
}

function matchesAnyToken(value, tokens) {
  if (!value) return false
  const str = String(value).toLowerCase()
  return tokens.some((token) => str.includes(token))
}

/**
 * Searches across all administrative and operational modules.
 * Returns structured search results grouped by module with counts and direct deep-link URLs.
 *
 * @param {string} rawQuery
 * @param {string} role - "super_admin" | "admin_staff"
 * @returns {Promise<{ query: string, total: number, groups: Array }>}
 */
export async function searchAllModules(rawQuery, role = "super_admin") {
  const query = (rawQuery || "").trim()
  if (!query || query.length < 1) {
    return { query: "", total: 0, groups: [] }
  }

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const isStaff = role === "admin_staff" || role === "inventory_staff"
  const basePrefix = isStaff ? "/dashboard/admin-staff" : "/dashboard/super-admin"

  // Concurrently fetch modules safely without throwing
  const [
    appsResult,
    membersResult,
    programsResult,
    claimsResult,
    announcementsResult,
    staffResult,
    auditResult,
  ] = await Promise.allSettled([
    getApplications(),
    getMembers(),
    getBenefitPrograms(),
    getBenefitClaims(),
    getAnnouncements(),
    !isStaff ? getStaffUsers() : Promise.resolve([]),
    getAuditLogs(),
  ])

  const applications = appsResult.status === "fulfilled" && Array.isArray(appsResult.value) ? appsResult.value : []
  const members = membersResult.status === "fulfilled" && Array.isArray(membersResult.value) ? membersResult.value : []
  const programs = programsResult.status === "fulfilled" && Array.isArray(programsResult.value) ? programsResult.value : []
  const claims = claimsResult.status === "fulfilled" && Array.isArray(claimsResult.value) ? claimsResult.value : []
  const announcements = announcementsResult.status === "fulfilled" && Array.isArray(announcementsResult.value) ? announcementsResult.value : []
  const staffUsers = staffResult.status === "fulfilled" && Array.isArray(staffResult.value) ? staffResult.value : []
  const auditLogs = auditResult.status === "fulfilled" && Array.isArray(auditResult.value) ? auditResult.value : []

  /* ─────────────────────────────────────────────────────────────
     1. APPLICATIONS
  ───────────────────────────────────────────────────────────── */
  const matchingApps = applications.filter((app) => {
    return (
      matchesAnyToken(app.name, tokens) ||
      matchesAnyToken(app.reference, tokens) ||
      matchesAnyToken(app.reference_number, tokens) ||
      matchesAnyToken(app.email, tokens) ||
      matchesAnyToken(app.sector, tokens) ||
      matchesAnyToken(app.contact, tokens) ||
      matchesAnyToken(app.address, tokens) ||
      matchesAnyToken(app.status, tokens)
    )
  }).slice(0, 8).map((app) => ({
    id: app.id || app.reference,
    module: "Applications",
    moduleKey: "applications",
    title: app.name || "Applicant",
    subtitle: app.reference || app.reference_number || app.id,
    description: `${app.sector || "General"} • ${app.address || "Carmen, Cebu"}`,
    badge: app.status || "Pending",
    badgeType: app.status?.toLowerCase() === "approved" ? "success" : app.status?.toLowerCase() === "rejected" ? "danger" : "warning",
    url: `${basePrefix}/applications?search=${encodeURIComponent(query)}`,
  }))

  /* ─────────────────────────────────────────────────────────────
     2. MEMBERS / BENEFICIARIES
  ───────────────────────────────────────────────────────────── */
  const matchingMembers = members.filter((m) => {
    return (
      matchesAnyToken(m.name, tokens) ||
      matchesAnyToken(m.memberId, tokens) ||
      matchesAnyToken(m.email, tokens) ||
      matchesAnyToken(m.category, tokens) ||
      matchesAnyToken(m.contact, tokens) ||
      matchesAnyToken(m.barangay, tokens) ||
      matchesAnyToken(m.address, tokens) ||
      matchesAnyToken(m.status, tokens)
    )
  }).slice(0, 8).map((m) => ({
    id: m.id || m.memberId,
    module: "Members",
    moduleKey: "members",
    title: m.name || "Member",
    subtitle: m.memberId || "Registered Member",
    description: `${m.category || "General"} • ${m.barangay || m.address || "Carmen"}`,
    badge: m.status || "Active",
    badgeType: m.status?.toLowerCase() === "active" ? "success" : "muted",
    url: `${basePrefix}/members?search=${encodeURIComponent(query)}`,
  }))

  /* ─────────────────────────────────────────────────────────────
     3. BENEFITS & ASSISTANCE (Programs & Claims)
  ───────────────────────────────────────────────────────────── */
  const matchingPrograms = programs.filter((p) => {
    return (
      matchesAnyToken(p.name, tokens) ||
      matchesAnyToken(p.code, tokens) ||
      matchesAnyToken(p.sector, tokens) ||
      matchesAnyToken(p.description, tokens) ||
      matchesAnyToken(p.amount, tokens)
    )
  }).slice(0, 5).map((p) => ({
    id: p.id || p.code,
    module: "Benefits",
    moduleKey: "benefits",
    title: p.name,
    subtitle: p.code || "Program",
    description: `${p.sector || "Welfare"} Assistance • ${p.amount || ""}`,
    badge: p.status || "Active",
    badgeType: "primary",
    url: `${basePrefix}/benefits?search=${encodeURIComponent(query)}`,
  }))

  const matchingClaims = claims.filter((c) => {
    return (
      matchesAnyToken(c.memberName, tokens) ||
      matchesAnyToken(c.claimNumber, tokens) ||
      matchesAnyToken(c.benefit, tokens) ||
      matchesAnyToken(c.amount, tokens) ||
      matchesAnyToken(c.status, tokens)
    )
  }).slice(0, 5).map((c) => ({
    id: c.id || c.claimNumber,
    module: "Benefits",
    moduleKey: "benefits",
    title: c.memberName || "Beneficiary Claim",
    subtitle: `${c.claimNumber || "Claim"} • ${c.benefit}`,
    description: `${c.releaseMethod || "Disbursement"} • ${c.amount}`,
    badge: c.status || "Released",
    badgeType: c.status?.toLowerCase() === "released" || c.status?.toLowerCase() === "approved" ? "success" : "warning",
    url: `${basePrefix}/benefits?search=${encodeURIComponent(query)}`,
  }))

  const combinedBenefits = [...matchingPrograms, ...matchingClaims].slice(0, 8)

  /* ─────────────────────────────────────────────────────────────
     4. TERMINATION MANAGEMENT
  ───────────────────────────────────────────────────────────── */
  const matchingTerminations = applications.filter((app) => {
    const isTerminated = app.status === "Terminated" || app.status === "Inactive"
    const matchesText =
      matchesAnyToken(app.name, tokens) ||
      matchesAnyToken(app.reference, tokens) ||
      matchesAnyToken(app.terminationReason, tokens)

    return (isTerminated && matchesText) || (matchesText && (query.toLowerCase().includes("term") || query.toLowerCase().includes("inactive")))
  }).slice(0, 5).map((t) => ({
    id: t.id || t.reference,
    module: "Termination",
    moduleKey: "termination",
    title: t.name,
    subtitle: t.reference || t.id,
    description: `${t.sector || "Citizen"} • Status: ${t.status || "Terminated"}`,
    badge: t.status || "Terminated",
    badgeType: "danger",
    url: `${basePrefix}/termination?search=${encodeURIComponent(query)}`,
  }))

  /* ─────────────────────────────────────────────────────────────
     5. ANNOUNCEMENTS & BULLETINS
  ───────────────────────────────────────────────────────────── */
  const matchingAnnouncements = announcements.filter((a) => {
    return (
      matchesAnyToken(a.title, tokens) ||
      matchesAnyToken(a.message, tokens) ||
      matchesAnyToken(a.authorName, tokens) ||
      (Array.isArray(a.audience) && a.audience.some((aud) => matchesAnyToken(aud, tokens)))
    )
  }).slice(0, 6).map((a) => ({
    id: a.id || a.code,
    module: "Announcements",
    moduleKey: "announcements",
    title: a.title,
    subtitle: a.createdAt || "Bulletin",
    description: a.message ? `${a.message.slice(0, 75)}...` : "Official MSWDO announcement",
    badge: a.status || "Published",
    badgeType: "info",
    url: `${basePrefix}/announcements?search=${encodeURIComponent(query)}`,
  }))

  /* ─────────────────────────────────────────────────────────────
     6. USER MANAGEMENT (STAFF USERS)
  ───────────────────────────────────────────────────────────── */
  const matchingStaff = staffUsers.filter((u) => {
    return (
      matchesAnyToken(u.name, tokens) ||
      matchesAnyToken(u.email, tokens) ||
      matchesAnyToken(u.role, tokens) ||
      matchesAnyToken(u.position, tokens) ||
      matchesAnyToken(u.idNumber, tokens)
    )
  }).slice(0, 6).map((u) => ({
    id: u.userId || u.staffId,
    module: "User Management",
    moduleKey: "user-management",
    title: u.name,
    subtitle: u.email,
    description: `${u.role || "Admin Staff"} • ${u.position || "Staff"}`,
    badge: u.isActive ? "Active" : "Inactive",
    badgeType: u.isActive ? "success" : "muted",
    url: `/dashboard/super-admin/user-management?search=${encodeURIComponent(query)}`,
  }))

  /* ─────────────────────────────────────────────────────────────
     7. AUDIT & MONITORING
  ───────────────────────────────────────────────────────────── */
  const matchingAudit = auditLogs.filter((log) => {
    return (
      matchesAnyToken(log.action, tokens) ||
      matchesAnyToken(log.member, tokens) ||
      matchesAnyToken(log.staff, tokens) ||
      matchesAnyToken(log.details, tokens) ||
      matchesAnyToken(log.category, tokens)
    )
  }).slice(0, 6).map((log) => ({
    id: log.id,
    module: "Audit & Monitoring",
    moduleKey: "audit",
    title: log.action || "Activity Log",
    subtitle: log.date || "Audit Record",
    description: `${log.staff || "System"}: ${log.details?.slice(0, 70) || "Recorded activity."}`,
    badge: log.category || "Audit",
    badgeType: "neutral",
    url: `${basePrefix}/audit?search=${encodeURIComponent(query)}`,
  }))

  // Assemble groups with matches
  const groups = []

  if (matchingApps.length > 0) {
    groups.push({
      name: "Applications",
      key: "applications",
      count: matchingApps.length,
      viewAllUrl: `${basePrefix}/applications?search=${encodeURIComponent(query)}`,
      items: matchingApps,
    })
  }

  if (matchingMembers.length > 0) {
    groups.push({
      name: "Members Directory",
      key: "members",
      count: matchingMembers.length,
      viewAllUrl: `${basePrefix}/members?search=${encodeURIComponent(query)}`,
      items: matchingMembers,
    })
  }

  if (combinedBenefits.length > 0) {
    groups.push({
      name: "Benefits & Assistance",
      key: "benefits",
      count: combinedBenefits.length,
      viewAllUrl: `${basePrefix}/benefits?search=${encodeURIComponent(query)}`,
      items: combinedBenefits,
    })
  }

  if (matchingTerminations.length > 0) {
    groups.push({
      name: "Terminations",
      key: "termination",
      count: matchingTerminations.length,
      viewAllUrl: `${basePrefix}/termination?search=${encodeURIComponent(query)}`,
      items: matchingTerminations,
    })
  }

  if (matchingAnnouncements.length > 0) {
    groups.push({
      name: "Announcements",
      key: "announcements",
      count: matchingAnnouncements.length,
      viewAllUrl: `${basePrefix}/announcements?search=${encodeURIComponent(query)}`,
      items: matchingAnnouncements,
    })
  }

  if (!isStaff && matchingStaff.length > 0) {
    groups.push({
      name: "User & Role Management",
      key: "user-management",
      count: matchingStaff.length,
      viewAllUrl: `/dashboard/super-admin/user-management?search=${encodeURIComponent(query)}`,
      items: matchingStaff,
    })
  }

  if (matchingAudit.length > 0) {
    groups.push({
      name: "Audit & Monitoring",
      key: "audit",
      count: matchingAudit.length,
      viewAllUrl: `${basePrefix}/audit?search=${encodeURIComponent(query)}`,
      items: matchingAudit,
    })
  }

  const total = groups.reduce((acc, g) => acc + g.items.length, 0)

  return {
    query,
    total,
    groups,
  }
}
