import { fetchApplicantApplicationAndDocuments, getApplicantInquiries, getSectorLabel, isSectorMatch } from "./applicationService"
import { getBenefitPrograms, getBenefitClaims } from "./benefitService"
import { getAnnouncements } from "./announcementService"
import { getDocCategory } from "@/pages/applicant_user/ApplicantDocumentsTab"

function matchesAnyToken(value, tokens) {
  if (!value) return false
  const str = String(value).toLowerCase()
  return tokens.some((token) => str.includes(token))
}

/**
 * Searches across all applicant-accessible entities:
 * 1. Filed Applications & Intake Records
 * 2. Benefit Claims & Subsidies
 * 3. Welfare Programs Catalog (from Carmen Admin)
 * 4. Uploaded Documents & Requirements
 * 5. Official LGU Announcements
 * 6. Citizen Support & Helpdesk
 *
 * @param {string} rawQuery
 * @param {object} applicantContext - { email, clientId, applicantName }
 * @returns {Promise<{ query: string, total: number, groups: Array }>}
 */
export async function searchApplicantPortal(rawQuery, applicantContext = {}) {
  const query = (rawQuery || "").trim()
  if (!query || query.length < 1) {
    return { query: "", total: 0, groups: [] }
  }

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const { email = "", clientId = "", applicantName = "" } = applicantContext

  // Concurrently fetch datasets
  const [appRes, allPrograms, allClaims, allAnnouncements] = await Promise.all([
    fetchApplicantApplicationAndDocuments(email),
    getBenefitPrograms().catch(() => []),
    getBenefitClaims().catch(() => []),
    getAnnouncements().catch(() => []),
  ])

  const intakeApp = appRes?.application
  const documents = appRes?.documents || []
  const inquiries = getApplicantInquiries(email)

  // Filter claims belonging to this applicant
  const myClaims = (allClaims || []).filter((c) => {
    const mId = (c.memberId || c.member_id || "").toLowerCase()
    const mName = (c.memberName || c.member_name || "").toLowerCase()
    const cleanClient = clientId.toLowerCase()
    const cleanName = applicantName.toLowerCase()

    return (
      (cleanClient && mId === cleanClient) ||
      (mName && cleanName && (mName.includes(cleanName) || cleanName.includes(mName)))
    )
  })

  const groups = []

  /* ─────────────────────────────────────────────────────────────
     1. APPLICATIONS & INTAKE
  ───────────────────────────────────────────────────────────── */
  const applicationItems = []

  if (intakeApp) {
    const intakeMatches =
      matchesAnyToken(intakeApp.reference_number, tokens) ||
      matchesAnyToken(intakeApp.first_name, tokens) ||
      matchesAnyToken(intakeApp.last_name, tokens) ||
      matchesAnyToken(intakeApp.category, tokens) ||
      matchesAnyToken(intakeApp.status, tokens) ||
      matchesAnyToken(intakeApp.complete_address, tokens) ||
      matchesAnyToken("intake", tokens) ||
      matchesAnyToken("application", tokens) ||
      matchesAnyToken("enrollment", tokens)

    if (intakeMatches) {
      applicationItems.push({
        id: intakeApp.id || "intake-ref",
        module: "Applications",
        moduleKey: "applications",
        title: `${getSectorLabel(intakeApp.category)} Intake & Beneficiary Enrollment`,
        subtitle: intakeApp.reference_number || "Intake Record",
        description: `Status: ${intakeApp.status || "Approved"} • Address: ${intakeApp.complete_address || "Carmen, Cebu"}`,
        badge: intakeApp.status || "Approved",
        badgeType:
          (intakeApp.status || "").toLowerCase() === "approved" ? "success" : "warning",
        url: "/dashboard/applicant/applications",
      })
    }
  }

  // Add matching benefit claims
  myClaims.forEach((claim) => {
    const claimMatches =
      matchesAnyToken(claim.benefit || claim.benefit_name, tokens) ||
      matchesAnyToken(claim.claimNumber || claim.id, tokens) ||
      matchesAnyToken(claim.referenceNo || claim.reference_no, tokens) ||
      matchesAnyToken(claim.amount, tokens) ||
      matchesAnyToken(claim.status, tokens) ||
      matchesAnyToken(claim.remarks, tokens) ||
      matchesAnyToken("claim", tokens) ||
      matchesAnyToken("assistance", tokens)

    if (claimMatches) {
      applicationItems.push({
        id: claim.id || claim.claimNumber,
        module: "Applications",
        moduleKey: "applications",
        title: claim.benefit || claim.benefit_name || "Welfare Subsidy",
        subtitle: claim.claimNumber || claim.id,
        description: `Amount: ${claim.amount || "₱1,000.00"} • ${claim.date || "Recent"}`,
        badge: claim.status || "Pending",
        badgeType:
          claim.status === "Processed" || claim.status === "Approved"
            ? "success"
            : claim.status === "Cancelled"
            ? "danger"
            : "warning",
        url: "/dashboard/applicant/applications",
      })
    }
  })

  if (applicationItems.length > 0) {
    groups.push({
      key: "applications",
      label: "Applications & Cases",
      count: applicationItems.length,
      items: applicationItems.slice(0, 5),
    })
  }

  /* ─────────────────────────────────────────────────────────────
     2. WELFARE PROGRAMS & BENEFITS (from Carmen Admin)
  ───────────────────────────────────────────────────────────── */
  const userSector = intakeApp?.category
    ? getSectorLabel(intakeApp.category)
    : intakeApp?.sector || ""

  const matchingPrograms = (allPrograms || [])
    .filter((prog) => {
      if (userSector && !isSectorMatch(prog.sector, userSector)) {
        return false
      }
      return (
        matchesAnyToken(prog.name, tokens) ||
        matchesAnyToken(prog.code, tokens) ||
        matchesAnyToken(prog.sector, tokens) ||
        matchesAnyToken(prog.description, tokens) ||
        matchesAnyToken(prog.amount, tokens) ||
        matchesAnyToken(prog.requirements, tokens) ||
        matchesAnyToken("program", tokens) ||
        matchesAnyToken("grant", tokens) ||
        matchesAnyToken("ayuda", tokens) ||
        matchesAnyToken("benefit", tokens)
      )
    })
    .slice(0, 5)
    .map((prog) => ({
      id: prog.id || prog.code,
      module: "Benefits",
      moduleKey: "services",
      title: prog.name,
      subtitle: `${prog.code || "BEN-LGU"} • Sector: ${prog.sector}`,
      description: `Grant: ${prog.amount || "₱1,000.00"} • ${prog.description ? prog.description.slice(0, 60) + "..." : "Municipal Assistance"}`,
      badge: "Open for Application",
      badgeType: "primary",
      url: "/dashboard/applicant/services",
    }))

  if (matchingPrograms.length > 0) {
    groups.push({
      key: "services",
      label: "Programs & Grants",
      count: matchingPrograms.length,
      items: matchingPrograms,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     3. UPLOADED DOCUMENTS & REQUIREMENTS
  ───────────────────────────────────────────────────────────── */
  const matchingDocuments = (documents || [])
    .filter((doc) => {
      const name = doc.name || doc.title || ""
      const fName = doc.fileName || ""
      const cat = getDocCategory(doc)
      const st = doc.status || ""

      return (
        matchesAnyToken(name, tokens) ||
        matchesAnyToken(fName, tokens) ||
        matchesAnyToken(cat, tokens) ||
        matchesAnyToken(st, tokens) ||
        matchesAnyToken("document", tokens) ||
        matchesAnyToken("requirement", tokens) ||
        matchesAnyToken("id", tokens) ||
        matchesAnyToken("certificate", tokens)
      )
    })
    .slice(0, 5)
    .map((doc, idx) => ({
      id: doc.id || `doc-${idx}`,
      module: "Documents",
      moduleKey: "documents",
      title: doc.name || doc.title || "Submitted Requirement",
      subtitle: doc.fileName || "file.pdf",
      description: `Category: ${getDocCategory(doc)}`,
      badge: doc.status || "Verified",
      badgeType:
        (doc.status || "").toLowerCase() === "verified"
          ? "success"
          : (doc.status || "").toLowerCase() === "needs correction"
          ? "danger"
          : "warning",
      url: "/dashboard/applicant/documents",
    }))

  if (matchingDocuments.length > 0) {
    groups.push({
      key: "documents",
      label: "Uploaded Documents",
      count: matchingDocuments.length,
      items: matchingDocuments,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     4. OFFICIAL LGU ANNOUNCEMENTS
  ───────────────────────────────────────────────────────────── */
  const matchingAnnouncements = (allAnnouncements || [])
    .filter((ann) => {
      return (
        matchesAnyToken(ann.title, tokens) ||
        matchesAnyToken(ann.message, tokens) ||
        matchesAnyToken(ann.code, tokens) ||
        matchesAnyToken(ann.authorName, tokens) ||
        matchesAnyToken("announcement", tokens) ||
        matchesAnyToken("payout", tokens) ||
        matchesAnyToken("bulletin", tokens)
      )
    })
    .slice(0, 5)
    .map((ann) => ({
      id: ann.id || ann.code,
      module: "Announcements",
      moduleKey: "announcements",
      title: ann.title,
      subtitle: `${ann.code || "ANN"} • ${ann.createdAt || "Recent"}`,
      description: ann.message ? ann.message.slice(0, 65) + "..." : "MSWDO Carmen Bulletin",
      badge: ann.pinned ? "Pinned" : "Published",
      badgeType: ann.pinned ? "warning" : "muted",
      url: "/dashboard/applicant/announcements",
    }))

  if (matchingAnnouncements.length > 0) {
    groups.push({
      key: "announcements",
      label: "LGU Bulletins",
      count: matchingAnnouncements.length,
      items: matchingAnnouncements,
    })
  }

  /* ─────────────────────────────────────────────────────────────
     5. CITIZEN HELPDESK & INQUIRIES
  ───────────────────────────────────────────────────────────── */
  const matchingInquiries = (inquiries || [])
    .filter((inq) => {
      return (
        matchesAnyToken(inq.subject, tokens) ||
        matchesAnyToken(inq.message, tokens) ||
        matchesAnyToken(inq.ticketNumber, tokens) ||
        matchesAnyToken(inq.category, tokens) ||
        matchesAnyToken(inq.status, tokens) ||
        matchesAnyToken("help", tokens) ||
        matchesAnyToken("support", tokens) ||
        matchesAnyToken("inquiry", tokens)
      )
    })
    .slice(0, 4)
    .map((inq) => ({
      id: inq.id || inq.ticketNumber,
      module: "Support",
      moduleKey: "support",
      title: inq.subject || "Citizen Inquiry",
      subtitle: `Ticket: ${inq.ticketNumber} • ${inq.category}`,
      description: inq.message ? inq.message.slice(0, 60) + "..." : "Helpdesk Ticket",
      badge: inq.status || "Received",
      badgeType:
        inq.status === "Resolved"
          ? "success"
          : inq.status === "In Review"
          ? "warning"
          : "muted",
      url: "/dashboard/applicant/support",
    }))

  if (matchingInquiries.length > 0) {
    groups.push({
      key: "support",
      label: "Citizen Inquiries",
      count: matchingInquiries.length,
      items: matchingInquiries,
    })
  }

  const total = groups.reduce((acc, g) => acc + g.count, 0)
  return { query, total, groups }
}
