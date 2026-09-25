import React, { useState, useMemo, useEffect, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  BarChart3,
  Search,
  X,
  Download,
  Printer,
  FileText,
  Users,
  Coins,
  ClipboardList,
  RefreshCw,
  Loader2,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  MapPin,
  Calendar,
  Check,
  Layers,
  ChevronRight,
  Building2,
  Info,
  Sparkles,
  Table as TableIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import { getApplications } from "@/services/applicationService"
import { getMembers } from "@/services/memberService"
import { getBenefitClaims, getBenefitPrograms } from "@/services/benefitService"

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const REPORT_TYPES = [
  { key: "applications", label: "Applications" },
  { key: "members", label: "Members" },
  { key: "claims", label: "Benefit Claims" },
  { key: "programs", label: "Benefit Programs" },
]

/* ─────────────────────────────────────────────
   Helpers & Row Normalizers (With Raw Attached)
───────────────────────────────────────────── */
function calculateAge(dobString) {
  if (!dobString) return "—"
  const bDate = new Date(dobString)
  if (isNaN(bDate.getTime())) return "—"
  const today = new Date()
  let age = today.getFullYear() - bDate.getFullYear()
  const m = today.getMonth() - bDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
    age--
  }
  return age >= 0 ? `${age} yrs` : "—"
}

function formatDateForExcel(dateString) {
  if (!dateString || dateString === "—") return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return String(dateString)
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function normalizeApplication(a) {
  return {
    date: a.submitted || a.created_at || "—",
    name: a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim(),
    category: a.sector || a.category || "—",
    status: a.status || "Pending",
    ref: a.reference || a.reference_number || a.id || "—",
    amount: null,
    raw: a,
  }
}

function normalizeMember(m) {
  return {
    date: m.updated || m.created_at || "—",
    name: m.name || m.full_name || "—",
    category: m.category || m.sector || "—",
    status: m.status || "Active",
    ref: m.memberId || m.member_id || m.id || "—",
    amount: null,
    raw: m,
  }
}

function normalizeClaim(c, programs = [], members = []) {
  let cat = c.sector || c.category
  if (!cat || cat === "—") {
    const prog = programs.find(
      (p) =>
        (p.name && c.benefit && p.name.toLowerCase() === c.benefit.toLowerCase()) ||
        (p.code && c.programCode && p.code === c.programCode)
    )
    if (prog) cat = prog.sector
  }
  if (!cat || cat === "—") {
    const mem = members.find(
      (m) =>
        (m.memberId && c.memberId && m.memberId === c.memberId) ||
        (m.name && c.memberName && m.name.toLowerCase() === c.memberName.toLowerCase())
    )
    if (mem) cat = mem.category
  }
  return {
    date: c.date || c.created_at || "—",
    name: `${c.memberName || c.member_name || "—"} — ${c.benefit || c.benefit_name || ""}`,
    category: cat || "—",
    status: c.status || "Pending",
    ref: c.claimNumber || c.claim_number || c.id || "—",
    amount: c.amount || null,
    raw: c,
  }
}

function normalizeProgram(p) {
  return {
    date: p.createdAt || p.created_at || "—",
    name: p.name || "—",
    category: p.sector || "—",
    status: p.status || "Active",
    ref: p.code || p.id || "—",
    amount: p.amount || null,
    raw: p,
  }
}

/* ─────────────────────────────────────────────
   Extract Comprehensive Details for Excel
───────────────────────────────────────────── */
function getComprehensiveHeadersAndRows(records, reportType) {
  if (reportType === "applications") {
    const headers = [
      "Reference Number",
      "Submitted Date",
      "Applicant Full Name",
      "First Name",
      "Middle Name",
      "Last Name",
      "Sector / Category",
      "Application Status",
      "Gender",
      "Date of Birth",
      "Age",
      "Civil Status",
      "Contact Number",
      "Email Address",
      "Barangay (Carmen, Cebu)",
      "Complete Address",
      "Target Program / Assistance",
      "Sector Specific Details",
      "Uploaded Documents Count",
      "Uploaded Documents List",
      "Remarks / Notes",
    ]

    const rows = records.map((r) => {
      const raw = r.raw || {}
      const cd = raw.categoryDetails || {}
      const specificDetails = [
        cd.disabilityType && `Disability: ${cd.disabilityType}`,
        cd.schoolName && `School: ${cd.schoolName}`,
        cd.educationalAttainment && `Education: ${cd.educationalAttainment}`,
        cd.targetAssistance && `Assistance: ${cd.targetAssistance}`,
        cd.pension && `Pension: ${cd.pension}`,
        cd.livingArrangement && `Living: ${cd.livingArrangement}`,
        cd.numberOfChildren && `Children: ${cd.numberOfChildren}`,
        cd.occupation && `Occupation: ${cd.occupation}`,
      ]
        .filter(Boolean)
        .join(" | ") || "—"

      const docsList = Array.isArray(raw.documents)
        ? raw.documents.map((d) => d.name || d.fileName || d.key).join(", ")
        : "—"

      const bMatch = (raw.address || raw.complete_address || raw.completeAddress || "").match(
        /Barangay\s+([^,]+)/i
      )
      const barangay = raw.barangay || (bMatch ? bMatch[1].trim() : "Carmen, Cebu")

      return [
        r.ref,
        formatDateForExcel(r.date),
        r.name,
        raw.first_name || raw.firstName || "—",
        raw.middle_name || raw.middleName || "—",
        raw.last_name || raw.lastName || "—",
        r.category,
        r.status,
        raw.gender || "—",
        raw.birthDate || raw.birth_date || raw.dob || "—",
        calculateAge(raw.birthDate || raw.birth_date || raw.dob),
        raw.civilStatus || raw.civil_status || "—",
        raw.contact || raw.contact_number || raw.contactNumber || "—",
        raw.email || "—",
        barangay,
        raw.address || raw.complete_address || raw.completeAddress || "—",
        cd.targetAssistance || raw.program || "—",
        specificDetails,
        Array.isArray(raw.documents) ? raw.documents.length : 0,
        docsList,
        raw.remarks || raw.notes || "—",
      ]
    })

    return { headers, rows }
  }

  if (reportType === "members") {
    const headers = [
      "Member ID",
      "Full Name",
      "Sector / Category",
      "Membership Status",
      "Date Registered / Updated",
      "Gender",
      "Date of Birth",
      "Age",
      "Civil Status",
      "Occupation",
      "Contact Number",
      "Email Address",
      "Barangay (Carmen, Cebu)",
      "Complete Address",
      "Sector Specific Details",
      "Registration Method",
      "Verified Documents Count",
    ]

    const rows = records.map((r) => {
      const raw = r.raw || {}
      const cd = raw.categoryDetails || {}
      const specificDetails = [
        cd.disabilityType && `Disability: ${cd.disabilityType}`,
        cd.disabilityCause && `Cause: ${cd.disabilityCause}`,
        cd.educationalAttainment && `Education: ${cd.educationalAttainment}`,
        cd.employmentStatus && `Employment: ${cd.employmentStatus}`,
      ]
        .filter(Boolean)
        .join(" | ") || "—"

      return [
        r.ref,
        r.name,
        r.category,
        r.status,
        formatDateForExcel(r.date),
        raw.gender || "—",
        raw.birthDate || raw.birth_date || "—",
        calculateAge(raw.birthDate || raw.birth_date),
        raw.civilStatus || raw.civil_status || "—",
        raw.occupation || "—",
        raw.contact || raw.phone || raw.contact_number || "—",
        raw.email || "—",
        raw.barangay || "—",
        raw.address || raw.complete_address || "—",
        specificDetails,
        raw.sourceApplication || "Online Registration",
        Array.isArray(raw.documents) ? raw.documents.length : 0,
      ]
    })

    return { headers, rows }
  }

  if (reportType === "claims") {
    const headers = [
      "Claim Voucher Number",
      "Date Filed",
      "Member ID",
      "Beneficiary Name",
      "Sector / Category",
      "Benefit Program Title",
      "Program Code",
      "Disbursement Amount",
      "Claim Status",
      "Release Method",
      "Voucher / Check Number",
      "Caseworker Remarks",
    ]

    const rows = records.map((r) => {
      const raw = r.raw || {}
      return [
        r.ref,
        formatDateForExcel(r.date),
        raw.memberId || raw.member_id || "—",
        raw.memberName || raw.member_name || r.name.split("—")[0].trim(),
        r.category,
        raw.benefit || raw.benefit_name || "—",
        raw.programCode || raw.program_code || "—",
        r.amount || raw.amount || "—",
        r.status,
        raw.releaseMethod || raw.release_method || "Cash",
        raw.referenceNo || raw.voucher_no || "—",
        raw.remarks || raw.notes || "—",
      ]
    })

    return { headers, rows }
  }

  // Programs
  const headers = [
    "Program Code",
    "Program Name / Title",
    "Target Sector",
    "Grant / Budget Amount",
    "Program Status",
    "Program Description",
    "Mandatory Eligibility & Requirements",
    "Date Established",
  ]

  const rows = records.map((r) => {
    const raw = r.raw || {}
    return [
      r.ref,
      r.name,
      r.category,
      r.amount || raw.amount || "—",
      r.status,
      raw.description || "—",
      raw.requirements || "—",
      formatDateForExcel(r.date),
    ]
  })

  return { headers, rows }
}

/* ─────────────────────────────────────────────
   Build Formatted Excel HTML (.xls)
   Opens in Microsoft Excel with complete UI styling,
   categorized sections, KPI cards, and full details.
───────────────────────────────────────────── */
function generateExcelHtml({ records, reportType, activeTab, categoryFilter }) {
  const { headers, rows } = getComprehensiveHeadersAndRows(records, reportType)

  // Categorize records by sector
  const groupedBySector = records.reduce((acc, r, idx) => {
    const cat = r.category || "General"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ norm: r, fullRow: rows[idx] })
    return acc
  }, {})

  // Sector breakdown stats
  const sectorCounts = records.reduce((acc, r) => {
    const cat = r.category || "General"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  // Status breakdown stats
  const statusCounts = records.reduce((acc, r) => {
    const st = r.status || "Unknown"
    acc[st] = (acc[st] || 0) + 1
    return acc
  }, {})

  const dateStr = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = new Date().toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>MSWDO ${reportType.toUpperCase()}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; }
    .title-banner { background-color: #1e3a8a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 38px; vertical-align: middle; }
    .subtitle-banner { background-color: #2563eb; color: #ffffff; font-size: 11pt; text-align: center; height: 26px; vertical-align: middle; }
    .meta-label { font-weight: bold; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 10pt; padding: 6px; }
    .meta-val { background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 10pt; padding: 6px; }
    .kpi-header { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; padding: 6px; font-size: 11pt; }
    .kpi-cell { background-color: #f8fafc; text-align: center; font-weight: bold; border: 1px solid #cbd5e1; }
    .sector-header { background-color: #1e40af; color: #ffffff; font-size: 12pt; font-weight: bold; padding: 8px 12px; }
    .table-header { background-color: #334155; color: #ffffff; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #94a3b8; font-size: 10pt; white-space: nowrap; }
    .data-cell { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10pt; vertical-align: middle; }
    .zebra { background-color: #f8fafc; }
    .status-approved { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; border: 1px solid #bbf7d0; }
    .status-pending { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fecaca; }
  </style>
</head>
<body>
  <!-- Header Banner Block -->
  <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
    <tr>
      <td colspan="${headers.length}" class="title-banner">
        MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE (MSWDO)
      </td>
    </tr>
    <tr>
      <td colspan="${headers.length}" class="subtitle-banner">
        Municipality of Carmen, Province of Cebu 6005 &bull; Official Categorized Report &amp; Data Records
      </td>
    </tr>
    <tr><td colspan="${headers.length}" style="height: 10px;"></td></tr>
    <tr>
      <td class="meta-label">Report Category:</td>
      <td class="meta-val" colspan="2"><strong>${reportType.toUpperCase()}</strong></td>
      <td class="meta-label">Status Tab Scope:</td>
      <td class="meta-val" colspan="2"><strong>${activeTab.toUpperCase()}</strong></td>
      <td class="meta-label">Export Date &amp; Time:</td>
      <td class="meta-val" colspan="${Math.max(1, headers.length - 7)}">${dateStr} at ${timeStr}</td>
    </tr>
    <tr>
      <td class="meta-label">Total Records:</td>
      <td class="meta-val" colspan="2"><strong>${records.length} Records</strong></td>
      <td class="meta-label">Sector Filter:</td>
      <td class="meta-val" colspan="2">${categoryFilter || "All Municipal Sectors"}</td>
      <td class="meta-label">Administrative Authority:</td>
      <td class="meta-val" colspan="${Math.max(1, headers.length - 7)}">Carmen Local Government Unit (LGU)</td>
    </tr>
    <tr><td colspan="${headers.length}" style="height: 14px;"></td></tr>
  </table>

  <!-- Categorized Summary KPI Table -->
  <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td colspan="${Math.max(1, Object.keys(sectorCounts).length)}" class="kpi-header">CATEGORIZED SECTOR DISTRIBUTION</td>
      <td colspan="3" class="kpi-header">STATUS TOTALS</td>
    </tr>
    <tr>
      ${Object.entries(sectorCounts).map(([sec]) => `
        <td class="meta-label" style="text-align: center;">${sec}</td>
      `).join("")}
      <td class="meta-label" style="text-align: center; color: #166534;">Approved / Active</td>
      <td class="meta-label" style="text-align: center; color: #92400e;">Pending / Review</td>
      <td class="meta-label" style="text-align: center; color: #991b1b;">Rejected / Cancelled</td>
    </tr>
    <tr>
      ${Object.entries(sectorCounts).map(([_, count]) => `
        <td class="kpi-cell" style="font-size: 13pt; color: #1e3a8a; padding: 8px;">${count}</td>
      `).join("")}
      <td class="kpi-cell" style="font-size: 13pt; color: #166534; padding: 8px;">${statusCounts["Approved"] || statusCounts["Active"] || 0}</td>
      <td class="kpi-cell" style="font-size: 13pt; color: #92400e; padding: 8px;">${statusCounts["Pending"] || 0}</td>
      <td class="kpi-cell" style="font-size: 13pt; color: #991b1b; padding: 8px;">${statusCounts["Rejected"] || statusCounts["Cancelled"] || 0}</td>
    </tr>
  </table>
  <br/>

  <!-- Categorized Tables by Sector -->
  ${Object.entries(groupedBySector).map(([sectorName, items]) => `
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 28px;">
      <tr>
        <td colspan="${headers.length}" class="sector-header">
          SECTOR: ${sectorName.toUpperCase()} &mdash; (${items.length} ${items.length === 1 ? 'Record' : 'Records'})
        </td>
      </tr>
      <tr>
        ${headers.map((h) => `<th class="table-header">${h}</th>`).join("")}
      </tr>
      ${items.map(({ fullRow }, rIdx) => `
        <tr class="${rIdx % 2 === 1 ? 'zebra' : ''}">
          ${fullRow.map((cell, cIdx) => {
            let cellStyle = "data-cell"
            const str = String(cell || "—")
            if (headers[cIdx].includes("Status")) {
              const lower = str.toLowerCase()
              if (lower.includes("approved") || lower.includes("active") || lower.includes("processed")) {
                cellStyle += " status-approved"
              } else if (lower.includes("pending") || lower.includes("review")) {
                cellStyle += " status-pending"
              } else if (lower.includes("rejected") || lower.includes("cancelled")) {
                cellStyle += " status-rejected"
              }
            }
            return `<td class="${cellStyle}">${str}</td>`
          }).join("")}
        </tr>
      `).join("")}
    </table>
  `).join("")}

</body>
</html>
  `
}

/* ─────────────────────────────────────────────
   Status Badge Component
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Pending:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Approved:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Rejected:
      "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    Active:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Inactive:
      "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    Processed:
      "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Cancelled:
      "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    Resubmitted:
      "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "Needs correction":
      "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
        map[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"
      }`}
    >
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Export & Categorized Data Preview Modal (Bounded)
───────────────────────────────────────────── */
function ExportReportModal({
  isOpen,
  onClose,
  reportType,
  activeTab,
  categoryFilter,
  records,
  onDownloadExcel,
  onDownloadCsv,
  isExporting,
}) {
  const [includeHeaderBlock, setIncludeHeaderBlock] = useState(true)

  if (!isOpen) return null

  // Extract comprehensive columns and rows
  const { headers, rows } = getComprehensiveHeadersAndRows(records, reportType)

  // Categorized breakdown by Sector
  const sectorBreakdown = records.reduce((acc, r) => {
    const cat = r.category || "General"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  // Categorized breakdown by Status
  const statusBreakdown = records.reduce((acc, r) => {
    const st = r.status || "Unknown"
    acc[st] = (acc[st] || 0) + 1
    return acc
  }, {})

  const excelFilename = `mswdo-carmen-${reportType}-${activeTab}-${new Date()
    .toISOString()
    .slice(0, 10)}.xls`
  const csvFilename = `mswdo-carmen-${reportType}-${activeTab}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/20 shrink-0">
          <div className="size-10 rounded-[5px] bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileSpreadsheet className="size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground font-heading">
                Export Categorized Report to Excel
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                {reportType} · {activeTab}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Municipal Social Welfare and Development Office (MSWDO) · Carmen, Cebu 6005
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Card 1: Categorized Summary Breakdown */}
          <div className="p-4 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-blue-600" />
                Categorized Records Breakdown
              </h4>
              <span className="text-xs font-semibold text-foreground font-mono">
                Total: {records.length} {records.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            {/* Sector Breakdown Pills */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground font-medium">Categorized by Municipal Sector:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(sectorBreakdown).map(([sector, count]) => (
                  <span
                    key={sector}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground"
                  >
                    <span>{sector}:</span>
                    <strong className="text-blue-600 dark:text-blue-400">{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
              <p className="text-[11px] text-muted-foreground font-medium">Categorized by Status:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(statusBreakdown).map(([st, count]) => (
                  <span
                    key={st}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground"
                  >
                    <span>{st}:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Comprehensive Details List */}
          <div className="p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                All Detailed Information Included in Excel
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {headers.length} Columns
              </span>
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              Every detail from applicant profiles, contact information, local Carmen barangays, sector criteria, and remarks will be displayed in the Excel spreadsheet:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {headers.map((h) => (
                <span
                  key={h}
                  className="px-2 py-0.5 rounded-[3px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-[11px] font-mono font-medium text-blue-700 dark:text-blue-300"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Live Preview Table (First 5 records) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Eye className="size-3.5 text-blue-600" />
                Live Data Preview (First {Math.min(5, rows.length)} rows)
              </h4>
              <span className="text-[11px] text-muted-foreground">Horizontal scroll enabled</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-[5px] overflow-x-auto max-h-48 bg-zinc-50/50 dark:bg-zinc-900">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-b border-zinc-200 dark:border-zinc-700 sticky top-0">
                  <tr>
                    {headers.slice(0, 8).map((h) => (
                      <th key={h} className="py-2 px-3 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    {headers.length > 8 && (
                      <th className="py-2 px-3 font-semibold text-muted-foreground">
                        +{headers.length - 8} more columns…
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-white dark:hover:bg-zinc-800/60">
                      {row.slice(0, 8).map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 whitespace-nowrap max-w-[160px] truncate text-foreground">
                          {String(cell || "—")}
                        </td>
                      ))}
                      {headers.length > 8 && (
                        <td className="py-2 px-3 text-muted-foreground italic whitespace-nowrap">
                          {row[8] || "—"}…
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Export Format Guidance Note */}
          <div className="p-3.5 rounded-[5px] bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs space-y-1">
            <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-blue-600" />
              Categorized Excel Workbook (.xls)
            </p>
            <p className="text-blue-800/90 dark:text-blue-300/80 text-[11.5px] leading-relaxed">
              Opens directly in Microsoft Excel with formatted municipal headers, KPI summary cards, distinct categorized sector tables, auto-sized columns (no <code className="font-mono">###</code> date errors), and color-coded status badges.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-muted-foreground font-mono">
            {records.length} rows ready to download
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDownloadCsv({ includeHeaderBlock })}
              disabled={isExporting || records.length === 0}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
            >
              <Download className="size-3.5" />
              Download CSV (.csv)
            </Button>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onDownloadExcel}
              disabled={isExporting || records.length === 0}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5 shadow-xs"
            >
              {isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-3.5" />
              )}
              Download Styled Excel (.xls)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────── */
export function SuperAdminReportsPage() {
  const {
    canView,
    filterByAllowedCategory,
    isCategoryAllowed,
    hasFullAccess,
    allowedCategories,
  } = useStaffPermissions()

  /* ── Raw data from Supabase ── */
  const [applications, setApplications] = useState([])
  const [members, setMembers] = useState([])
  const [claims, setClaims] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)

  const { location } = useRouter()

  /* ── UI state ── */
  const [reportType, setReportType] = useState("applications")
  const [activeTab, setActiveTab] = useState("all") // "all" | "pending" | "approved" | "rejected"
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // Modals & Feedback State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Sync with URL query parameter from global search or deep links
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get("tab")
    if (["pending", "approved", "rejected", "all"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearch(searchParam)
      setCurrentPage(1)
    }
    const typeParam = params.get("type")
    if (REPORT_TYPES.some((t) => t.key === typeParam)) {
      setReportType(typeParam)
    }
  }, [location.search])

  /* ── Load all data ── */
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [apps, mems, clms, progs] = await Promise.all([
        getApplications(),
        getMembers(),
        getBenefitClaims(),
        getBenefitPrograms(),
      ])
      setApplications(Array.isArray(apps) ? apps : [])
      setMembers(Array.isArray(mems) ? mems : [])
      setClaims(Array.isArray(clms) ? clms : [])
      setPrograms(Array.isArray(progs) ? progs : [])
    } catch (err) {
      console.error("Error loading reports data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  /* ── Scoped raw datasets by staff allowed category ── */
  const scopedApps = useMemo(() => {
    return filterByAllowedCategory(applications, (a) => a.sector || a.category || a.program)
  }, [applications, filterByAllowedCategory])

  const scopedMembers = useMemo(() => {
    return filterByAllowedCategory(members, (m) => m.category || m.sector)
  }, [members, filterByAllowedCategory])

  const scopedPrograms = useMemo(() => {
    return filterByAllowedCategory(programs, (p) => p.sector)
  }, [programs, filterByAllowedCategory])

  const scopedClaims = useMemo(() => {
    if (hasFullAccess) return claims
    return claims.filter((c) => {
      if (c.sector && isCategoryAllowed(c.sector)) return true
      if (c.category && isCategoryAllowed(c.category)) return true
      const prog = programs.find(
        (p) =>
          (p.name && c.benefit && p.name.toLowerCase() === c.benefit.toLowerCase()) ||
          (p.code && c.programCode && p.code === c.programCode)
      )
      if (prog && isCategoryAllowed(prog.sector)) return true
      const mem = members.find(
        (m) =>
          (m.memberId && c.memberId && m.memberId === c.memberId) ||
          (m.name && c.memberName && m.name.toLowerCase() === c.memberName.toLowerCase())
      )
      if (mem && isCategoryAllowed(mem.category)) return true
      return !allowedCategories || allowedCategories.length === 0
    })
  }, [claims, programs, members, hasFullAccess, isCategoryAllowed, allowedCategories])

  /* ── Stat cards ── */
  const totalApps = scopedApps.length
  const totalMembers = scopedMembers.length
  const totalClaims = scopedClaims.length
  const releasedAmt = scopedClaims
    .filter((c) => (c.status || "").toLowerCase() === "processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  /* ── Normalize and scope active source ── */
  const source = useMemo(() => {
    let raw = []
    switch (reportType) {
      case "applications":
        raw = applications.map(normalizeApplication)
        break
      case "members":
        raw = members.map(normalizeMember)
        break
      case "claims":
        raw = claims.map((c) => normalizeClaim(c, programs, members))
        break
      case "programs":
        raw = programs.map(normalizeProgram)
        break
      default:
        raw = []
    }
    return filterByAllowedCategory(raw, (r) => r.category)
  }, [reportType, applications, members, claims, programs, filterByAllowedCategory])

  /* ── Status Tab Counts ── */
  const pendingCount = useMemo(
    () =>
      source.filter((r) =>
        ["pending", "resubmitted", "needs correction", "for review", "under review"].includes(
          (r.status || "").toLowerCase().trim()
        )
      ).length,
    [source]
  )

  const approvedCount = useMemo(
    () =>
      source.filter((r) =>
        ["approved", "active", "processed", "verified"].includes(
          (r.status || "").toLowerCase().trim()
        )
      ).length,
    [source]
  )

  const rejectedCount = useMemo(
    () =>
      source.filter((r) =>
        ["rejected", "terminated", "inactive", "cancelled", "denied"].includes(
          (r.status || "").toLowerCase().trim()
        )
      ).length,
    [source]
  )

  const totalSourceCount = source.length

  /* ── Unique categories for filter dropdown & distribution ── */
  const availableCategories = useMemo(
    () =>
      [...new Set(source.map((r) => r.category).filter(Boolean))]
        .filter((c) => c !== "—" && isCategoryAllowed(c))
        .sort(),
    [source, isCategoryAllowed]
  )

  /* ── Live Categorized Sector Breakdown ── */
  const categorizedSectorCounts = useMemo(() => {
    const counts = {}
    source.forEach((r) => {
      const cat = r.category || "General"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [source])

  /* ── Filter ── */
  const q = search.toLowerCase().trim()
  const filtered = useMemo(
    () =>
      source.filter((r) => {
        const matchSearch =
          !q ||
          r.name?.toLowerCase().includes(q) ||
          r.ref?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q)

        const matchCategory = !categoryFilter || r.category === categoryFilter

        // Tab status filtering
        let matchTab = true
        const s = (r.status || "").toLowerCase().trim()
        if (activeTab === "pending") {
          matchTab = ["pending", "resubmitted", "needs correction", "for review", "under review"].includes(s)
        } else if (activeTab === "approved") {
          matchTab = ["approved", "active", "processed", "verified"].includes(s)
        } else if (activeTab === "rejected") {
          matchTab = ["rejected", "terminated", "inactive", "cancelled", "denied"].includes(s)
        }

        // Date range filtering
        let matchDate = true
        if (fromDate || toDate) {
          const rowDate = new Date(r.date)
          if (!isNaN(rowDate.getTime())) {
            if (fromDate && rowDate < new Date(fromDate)) matchDate = false
            if (toDate && rowDate > new Date(toDate + "T23:59:59")) matchDate = false
          }
        }

        return matchSearch && matchCategory && matchTab && matchDate
      }),
    [source, q, categoryFilter, activeTab, fromDate, toDate]
  )

  /* ── Pagination ── */
  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const resetPage = () => setCurrentPage(1)

  const handleTypeChange = (key) => {
    setReportType(key)
    setCategoryFilter("")
    setSearch("")
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  /* ── 1. Export Formatted Excel Workbook (.xls) with Categorized Sections & Styles ── */
  const handleDownloadExcel = () => {
    setIsExporting(true)
    try {
      const excelHtml = generateExcelHtml({
        records: filtered,
        reportType,
        activeTab,
        categoryFilter,
      })

      const blob = new Blob([excelHtml], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mswdo-carmen-${reportType}-${activeTab}-${new Date()
        .toISOString()
        .slice(0, 10)}.xls`
      a.click()
      URL.revokeObjectURL(url)

      setIsExportModalOpen(false)
      showToast(
        `Successfully exported ${filtered.length} detailed ${reportType} records to formatted Excel workbook.`
      )
    } catch (err) {
      console.error("Excel export error:", err)
      showToast(`Export failed: ${err.message}`, "error")
    } finally {
      setIsExporting(false)
    }
  }

  /* ── 2. Export Comprehensive CSV (.csv) with UTF-8 BOM ── */
  const handleDownloadCsv = ({ includeHeaderBlock = true } = {}) => {
    setIsExporting(true)
    try {
      const { headers, rows } = getComprehensiveHeadersAndRows(filtered, reportType)

      const escapeCell = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`

      const metadataHeader = []
      if (includeHeaderBlock) {
        metadataHeader.push(
          ["MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE (MSWDO) - MUNICIPALITY OF CARMEN, CEBU"],
          [`OFFICIAL COMPREHENSIVE DATA REPORT: ${reportType.toUpperCase()}`],
          ["Export Generated At", new Date().toLocaleString("en-PH")],
          ["Data Scope / Status Tab", activeTab.toUpperCase()],
          ["Sector / Category Filter", categoryFilter || "All Sectors"],
          ["Search Query Filter", search || "None"],
          ["Total Exported Records", String(filtered.length)],
          ["Administrative Authority", "Local Government Unit of Carmen, Province of Cebu 6005"],
          []
        )
      }

      const metaLines = metadataHeader.map((line) => line.map(escapeCell).join(","))
      const headerLine = headers.map(escapeCell).join(",")
      const dataLines = rows.map((row) => row.map(escapeCell).join(","))

      const allLines =
        metaLines.length > 0
          ? [...metaLines, headerLine, ...dataLines]
          : [headerLine, ...dataLines]

      // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens accents and Peso signs correctly
      const csvContent = "\uFEFF" + allLines.join("\r\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mswdo-carmen-${reportType}-${activeTab}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setIsExportModalOpen(false)
      showToast(
        `Successfully exported ${filtered.length} detailed ${reportType} records to CSV file.`
      )
    } catch (err) {
      console.error("Export error:", err)
      showToast(`Export failed: ${err.message}`, "error")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => window.print()

  /* ─────────────────────────────────────────
     Permission Guard
  ───────────────────────────────────────── */
  if (!canView) {
    return (
      <SuperAdminUserLayout activeTab="reports">
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="size-14 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 border border-red-200 dark:border-red-900">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-heading">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Your staff account does not have permission to view municipal reports.
            Please contact an administrator if you require access.
          </p>
        </div>
      </SuperAdminUserLayout>
    )
  }

  const activeLabel = REPORT_TYPES.find((t) => t.key === reportType)?.label || "Records"

  return (
    <SuperAdminUserLayout activeTab="reports">
      <div className="space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between p-3.5 rounded-[5px] border text-xs shadow-xs animate-in fade-in duration-200 ${
              toastMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200"
                : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "error" ? (
                <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <BarChart3 className="size-3.5" />
                Municipal Welfare Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Reports
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Review, filter in categorized view, and export full comprehensive municipal records to Excel.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={loading}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8 shadow-xs"
            >
              <FileSpreadsheet className="size-3.5" />
              Export Excel / CSV
            </Button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Applications",
              value: totalApps,
              icon: FileText,
              color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
              type: "applications",
            },
            {
              label: "Members",
              value: totalMembers,
              icon: Users,
              color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
              type: "members",
            },
            {
              label: "Benefit Claims",
              value: totalClaims,
              icon: ClipboardList,
              color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
              type: "claims",
            },
            {
              label: "Released Amount",
              value: loading
                ? "—"
                : `₱${releasedAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              icon: Coins,
              color: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
              mono: true,
              type: "claims",
            },
          ].map((s) => (
            <Card
              key={s.label}
              onClick={() => handleTypeChange(s.type)}
              className={`rounded-[5px] border bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-600 ${
                reportType === s.type
                  ? "border-blue-500/80 dark:border-blue-500/80 ring-1 ring-blue-500/30"
                  : "border-zinc-200/90 dark:border-zinc-800"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p
                    className={`font-bold text-foreground font-heading mt-0.5 ${
                      s.mono ? "text-lg" : "text-2xl"
                    }`}
                  >
                    {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : s.value}
                  </p>
                </div>
                <div className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Categorized Sector Distribution Bar ── */}
        <div className="p-3 rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Layers className="size-3.5 text-blue-600" />
              Categorized Sectors:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("")
                resetPage()
              }}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer border ${
                !categoryFilter
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-50 dark:bg-zinc-800/60 text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:text-foreground"
              }`}
            >
              All Sectors ({source.length})
            </button>

            {availableCategories.map((c) => {
              const count = categorizedSectorCounts[c] || 0
              const isSelected = categoryFilter === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(isSelected ? "" : c)
                    resetPage()
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-zinc-50 dark:bg-zinc-800/60 text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:text-foreground"
                  }`}
                >
                  {c} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tabbed records card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          {/* Row 1: Tab bar + Search & Report Type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-3 pb-0 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-0 overflow-x-auto no-scrollbar shrink-0">
              {/* All records Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all")
                  resetPage()
                }}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "all"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All records
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "all"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {loading ? "..." : totalSourceCount}
                </span>
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>

              {/* Pending Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("pending")
                  resetPage()
                }}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "pending"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "pending"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {loading ? "..." : pendingCount}
                </span>
                {activeTab === "pending" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>

              {/* Approved Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("approved")
                  resetPage()
                }}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "approved"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "approved"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {loading ? "..." : approvedCount}
                </span>
                {activeTab === "approved" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>

              {/* Rejected Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("rejected")
                  resetPage()
                }}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "rejected"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rejected
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "rejected"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {loading ? "..." : rejectedCount}
                </span>
                {activeTab === "rejected" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Top row controls: Search + Report type selector */}
            <div className="flex items-center gap-2 pb-2.5 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    resetPage()
                  }}
                  placeholder="Search name, ref, details…"
                  className="w-40 sm:w-52 pl-7 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("")
                      resetPage()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <select
                value={reportType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Secondary filter bar (Category, Date range, Reset) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">Filter by:</span>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  resetPage()
                }}
                className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded-[5px] border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] text-muted-foreground font-medium">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    resetPage()
                  }}
                  title="From date"
                  className="text-[11px] bg-transparent text-foreground outline-none cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground font-medium">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    resetPage()
                  }}
                  title="To date"
                  className="text-[11px] bg-transparent text-foreground outline-none cursor-pointer"
                />
              </div>

              {(search || categoryFilter || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("")
                    setCategoryFilter("")
                    setFromDate("")
                    setToDate("")
                    resetPage()
                  }}
                  className="px-2 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors"
                  title="Reset filters"
                >
                  <X className="size-3" />
                  <span className="text-[11px]">Reset</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground font-medium shrink-0">
              {loading ? (
                "Loading records…"
              ) : (
                <span>
                  Showing <strong className="text-foreground">{filtered.length}</strong>{" "}
                  {filtered.length === 1 ? "record" : "records"}
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 font-semibold">Name / Title</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Reference</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading {activeLabel.toLowerCase()}…
                        </div>
                      </td>
                    </tr>
                  ) : displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                        No {activeTab !== "all" ? `${activeTab} ` : ""}records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((r, i) => (
                      <tr
                        key={`${r.ref}-${i}`}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{r.date}</td>
                        <td className="py-3 px-4 font-semibold text-foreground max-w-[260px] truncate">
                          <HighlightText text={r.name} highlight={search} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <HighlightText text={r.category || "—"} highlight={search} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                          <HighlightText text={r.ref} highlight={search} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                          {r.amount || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={rowsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(n) => {
              setRowsPerPage(n)
              setCurrentPage(1)
            }}
            itemLabel="records"
          />
        </Card>
      </div>

      {/* Export Report Modal with Categorized Information & Full Details */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportType={reportType}
        activeTab={activeTab}
        categoryFilter={categoryFilter}
        records={filtered}
        onDownloadExcel={handleDownloadExcel}
        onDownloadCsv={handleDownloadCsv}
        isExporting={isExporting}
      />
    </SuperAdminUserLayout>
  )
}

export default SuperAdminReportsPage
