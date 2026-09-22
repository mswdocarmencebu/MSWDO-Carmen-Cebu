import React, { useState, useMemo } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Activity,
  Search,
  ClipboardList,
  CalendarClock,
  Users,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DataTablePagination } from "@/components/common"

/* ─────────────────────────────────────────────
   Seed data — 59 activity records
───────────────────────────────────────────── */
const ACTION_COLORS = {
  "Approval Email Sent":              "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "Member Account Created":           "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Member Category Assigned":         "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  "Application Approved":             "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Application Appointment Scheduled":"bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "Document Verified":                "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  "CMS Content Published":            "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Announcement Published":           "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Announcement Unpublished":         "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  "Member Profile Printed":           "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  "Member Profile Updated":           "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Application Submitted":            "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "Application Rejected":             "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "Application Resubmitted":          "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "Status Correction Requested":      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Document Uploaded":                "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  "Benefit Claim Processed":          "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Member Terminated":                "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "Member Restored":                  "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

const AUDIT_LOGS = [
  { id:"LOG-001", date:"Sep 10, 2026, 6:01 PM", action:"Approval Email Sent",               category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Login credentials emailed to alotajennery@gmail.com" },
  { id:"LOG-002", date:"Sep 10, 2026, 6:01 PM", action:"Member Account Created",             category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Firebase account created for Shen Delante" },
  { id:"LOG-003", date:"Sep 10, 2026, 6:01 PM", action:"Member Category Assigned",           category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Assigned to Person with Disability (PWD) program" },
  { id:"LOG-004", date:"Sep 10, 2026, 6:01 PM", action:"Application Approved",               category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Application approved and member record created (Ref: MSWDO-97172)" },
  { id:"LOG-005", date:"Sep 10, 2026, 6:00 PM", action:"Application Appointment Scheduled",  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"pqo3cxJHDPxmeeb3zUw6",           staff:"Super Admin",              details:"Home Visit on Sep 11, 2026, 9:00 AM · Home visit · home" },
  { id:"LOG-006", date:"Sep 10, 2026, 5:59 PM", action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"pqo3cxJHDPxmeeb3zUw6",           staff:"Super Admin",              details:"Voter verification / certificate" },
  { id:"LOG-007", date:"Sep 10, 2026, 5:59 PM", action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"pqo3cxJHDPxmeeb3zUw6",           staff:"Super Admin",              details:"Valid government ID" },
  { id:"LOG-008", date:"Sep 10, 2026, 5:59 PM", action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"pqo3cxJHDPxmeeb3zUw6",           staff:"Super Admin",              details:"Medical certificate" },
  { id:"LOG-009", date:"Sep 10, 2026, 5:59 PM", action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"pqo3cxJHDPxmeeb3zUw6",           staff:"Super Admin",              details:"Request form" },
  { id:"LOG-010", date:"Sep 4, 2026, 11:17 PM",  action:"CMS Content Published",              category:"General",                      member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"Published public portal content" },
  { id:"LOG-011", date:"Sep 4, 2026, 11:16 PM",  action:"Announcement Published",             category:"Youth",                        member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"Hugaw ko limpyuhan ko" },
  { id:"LOG-012", date:"Sep 4, 2026, 11:16 PM",  action:"Announcement Unpublished",           category:"Youth",                        member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"Hugaw ko limpyuhan ko" },
  { id:"LOG-013", date:"Sep 4, 2026, 11:14 PM",  action:"Member Profile Printed",             category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Member Profile Printed for MSWDO-87656." },
  { id:"LOG-014", date:"Sep 4, 2026, 11:14 PM",  action:"Member Profile Updated",             category:"Youth",                        member:"Neil M DelanteSSS",staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Updated: Last Name" },
  { id:"LOG-015", date:"Sep 4, 2026, 11:13 PM",  action:"Member Profile Updated",             category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Updated: Last Name" },
  { id:"LOG-016", date:"Sep 4, 2026, 10:55 PM",  action:"Document Uploaded",                  category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Uploaded: Birth certificate" },
  { id:"LOG-017", date:"Sep 4, 2026, 10:50 PM",  action:"Application Appointment Scheduled",  category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"In-office appointment on Sep 5, 2026, 10:00 AM" },
  { id:"LOG-018", date:"Sep 4, 2026, 10:45 PM",  action:"Document Verified",                  category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Birth certificate" },
  { id:"LOG-019", date:"Sep 4, 2026, 10:44 PM",  action:"Document Verified",                  category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Barangay certificate of indigency" },
  { id:"LOG-020", date:"Sep 4, 2026, 10:43 PM",  action:"Application Approved",               category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Application approved and member record created (Ref: MSWDO-87656)" },
  { id:"LOG-021", date:"Sep 4, 2026, 10:40 PM",  action:"Approval Email Sent",                category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Login credentials emailed to neilmolinadelante@gmail.com" },
  { id:"LOG-022", date:"Sep 4, 2026, 10:38 PM",  action:"Member Account Created",             category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Firebase account created for Neil M Delante" },
  { id:"LOG-023", date:"Sep 4, 2026, 10:35 PM",  action:"Member Category Assigned",           category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Assigned to Youth program" },
  { id:"LOG-024", date:"Sep 3, 2026, 9:10 PM",   action:"Application Submitted",              category:"Youth",                        member:"Neil M Delante",   staffId:"applicant",                       staff:"Applicant Portal",         details:"New application submitted by Neil M Delante" },
  { id:"LOG-025", date:"Sep 3, 2026, 9:05 PM",   action:"Application Submitted",              category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"applicant",                       staff:"Applicant Portal",         details:"New application submitted by Shen Delante" },
  { id:"LOG-026", date:"Sep 3, 2026, 8:55 PM",   action:"Status Correction Requested",        category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Correction requested on submitted documents" },
  { id:"LOG-027", date:"Sep 3, 2026, 8:50 PM",   action:"Application Resubmitted",            category:"Youth",                        member:"Neil M Delante",   staffId:"applicant",                       staff:"Applicant Portal",         details:"Application resubmitted after correction" },
  { id:"LOG-028", date:"Sep 3, 2026, 8:40 PM",   action:"Document Uploaded",                  category:"Youth",                        member:"Neil M Delante",   staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: Valid government ID" },
  { id:"LOG-029", date:"Sep 3, 2026, 8:35 PM",   action:"Document Uploaded",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: PWD ID card" },
  { id:"LOG-030", date:"Sep 2, 2026, 7:20 PM",   action:"Application Rejected",               category:"General",                      member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Application rejected — incomplete documents" },
  { id:"LOG-031", date:"Sep 2, 2026, 7:15 PM",   action:"Document Verified",                  category:"General",                      member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Verified: Barangay clearance" },
  { id:"LOG-032", date:"Sep 2, 2026, 7:10 PM",   action:"Document Uploaded",                  category:"General",                      member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: Barangay clearance" },
  { id:"LOG-033", date:"Sep 2, 2026, 6:55 PM",   action:"Application Submitted",              category:"General",                      member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"New application submitted" },
  { id:"LOG-034", date:"Sep 1, 2026, 5:30 PM",   action:"Benefit Claim Processed",            category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Ayuda Sa Kabataan ₱1,000.00 released via Cash (Ref: VCH-2026-001)" },
  { id:"LOG-035", date:"Sep 1, 2026, 5:20 PM",   action:"Member Profile Updated",             category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Updated: Contact number" },
  { id:"LOG-036", date:"Sep 1, 2026, 5:10 PM",   action:"Member Profile Printed",             category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Member Profile Printed for MSWDO-97172." },
  { id:"LOG-037", date:"Aug 31, 2026, 4:00 PM",  action:"Announcement Published",             category:"Youth",                        member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"September youth program schedule announcement" },
  { id:"LOG-038", date:"Aug 31, 2026, 3:55 PM",  action:"CMS Content Published",              category:"General",                      member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"Updated FAQ page on public portal" },
  { id:"LOG-039", date:"Aug 30, 2026, 2:45 PM",  action:"Application Appointment Scheduled",  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"In-office appointment on Sep 1, 2026, 2:00 PM" },
  { id:"LOG-040", date:"Aug 30, 2026, 2:30 PM",  action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"PWD ID card" },
  { id:"LOG-041", date:"Aug 30, 2026, 2:25 PM",  action:"Document Verified",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Medical certificate from attending physician" },
  { id:"LOG-042", date:"Aug 30, 2026, 2:20 PM",  action:"Document Uploaded",                  category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: Medical certificate" },
  { id:"LOG-043", date:"Aug 29, 2026, 1:10 PM",  action:"Application Submitted",              category:"Youth",                        member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"New application submitted" },
  { id:"LOG-044", date:"Aug 29, 2026, 1:05 PM",  action:"Document Uploaded",                  category:"Youth",                        member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: School enrollment form" },
  { id:"LOG-045", date:"Aug 28, 2026, 11:50 AM", action:"Application Rejected",               category:"Youth",                        member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Rejected — applicant exceeded age threshold" },
  { id:"LOG-046", date:"Aug 28, 2026, 11:40 AM", action:"Status Correction Requested",        category:"Youth",                        member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Correction requested — invalid address" },
  { id:"LOG-047", date:"Aug 27, 2026, 10:30 AM", action:"Benefit Claim Processed",            category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"PWD medical subsidy ₱500.00 released via Cash" },
  { id:"LOG-048", date:"Aug 27, 2026, 10:20 AM", action:"Member Profile Updated",             category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Updated: Home address" },
  { id:"LOG-049", date:"Aug 26, 2026, 9:15 AM",  action:"Application Resubmitted",            category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Resubmitted with corrected documents" },
  { id:"LOG-050", date:"Aug 26, 2026, 9:00 AM",  action:"Status Correction Requested",        category:"Person with Disability (PWD)", member:"Shen Delante",    staffId:"GGQjvSpd4VXFXy1HGIA7dWjaLlG3", staff:"Super Admin",              details:"Correction requested — missing medical certificate signature" },
  { id:"LOG-051", date:"Aug 25, 2026, 8:45 AM",  action:"Document Uploaded",                  category:"General",                      member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"Uploaded: Income certificate" },
  { id:"LOG-052", date:"Aug 25, 2026, 8:30 AM",  action:"Application Submitted",              category:"General",                      member:"System record",    staffId:"applicant",                       staff:"Applicant Portal",         details:"New application submitted" },
  { id:"LOG-053", date:"Aug 24, 2026, 7:10 PM",  action:"Announcement Unpublished",           category:"General",                      member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"August general assistance announcement unpublished" },
  { id:"LOG-054", date:"Aug 24, 2026, 7:00 PM",  action:"Announcement Published",             category:"General",                      member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"August general assistance announcement" },
  { id:"LOG-055", date:"Aug 23, 2026, 6:00 PM",  action:"Member Terminated",                  category:"Youth",                        member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Account terminated — aged out of program" },
  { id:"LOG-056", date:"Aug 23, 2026, 5:55 PM",  action:"Member Restored",                    category:"Youth",                        member:"System record",    staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Account restored — reinstatement approved" },
  { id:"LOG-057", date:"Aug 22, 2026, 4:30 PM",  action:"CMS Content Published",              category:"General",                      member:"System record",    staffId:"super-01@mswdo.gov.ph",           staff:"super-01@mswdo.gov.ph",    details:"Updated services page on public portal" },
  { id:"LOG-058", date:"Aug 22, 2026, 4:20 PM",  action:"Member Profile Printed",             category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Member Profile Printed for MSWDO-87656." },
  { id:"LOG-059", date:"Aug 22, 2026, 4:15 PM",  action:"Document Verified",                  category:"Youth",                        member:"Neil M Delante",   staffId:"01khCa4ESkRvWFEiXRTVqEtzQIb2",   staff:"super-01@mswdo.gov.ph",    details:"Verified: Valid government ID (second submission)" },
]

const ALL_ACTIONS   = [...new Set(AUDIT_LOGS.map((l) => l.action))].sort()
const ALL_CATEGORIES = [...new Set(AUDIT_LOGS.map((l) => l.category))].sort()

/* ─────────────────────────────────────────────
   Action badge
───────────────────────────────────────────── */
function ActionBadge({ action }) {
  const cls = ACTION_COLORS[action] ?? "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border whitespace-nowrap ${cls}`}>
      {action}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function SuperAdminAuditPage() {
  const [search, setSearch]               = useState("")
  const [actionFilter, setActionFilter]   = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [fromDate, setFromDate]           = useState("")
  const [toDate, setToDate]               = useState("")
  const [currentPage, setCurrentPage]     = useState(1)
  const [rowsPerPage, setRowsPerPage]     = useState(15)

  /* ── Derived stats ── */
  const today = new Date().toDateString()
  const activityToday   = AUDIT_LOGS.filter((l) => new Date(l.date).toDateString() === today).length
  const uniqueStaff     = new Set(AUDIT_LOGS.map((l) => l.staff)).size

  /* ── Filtered logs ── */
  const q = search.toLowerCase()
  const filtered = useMemo(() =>
    AUDIT_LOGS.filter((l) => {
      const matchSearch   = !q || l.action.toLowerCase().includes(q) || l.member.toLowerCase().includes(q) || l.staff.toLowerCase().includes(q) || l.details.toLowerCase().includes(q)
      const matchAction   = !actionFilter   || l.action   === actionFilter
      const matchCategory = !categoryFilter || l.category === categoryFilter
      const logDate = new Date(l.date)
      const matchFrom = !fromDate || logDate >= new Date(fromDate)
      const matchTo   = !toDate   || logDate <= new Date(toDate + "T23:59:59")
      return matchSearch && matchAction && matchCategory && matchFrom && matchTo
    }),
    [q, actionFilter, categoryFilter, fromDate, toDate]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const resetFilters = () => {
    setSearch(""); setActionFilter(""); setCategoryFilter(""); setFromDate(""); setToDate("")
    setCurrentPage(1)
  }

  return (
    <SuperAdminUserLayout activeTab="audit">
      <div className="space-y-4">

        {/* ── Page header ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
              <Activity className="size-3.5" />
              Activity Log
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Audit &amp; Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Chronological staff actions across the categories you can access.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Recorded activities</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{AUDIT_LOGS.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Visible in your access scope</p>
              </div>
              <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ClipboardList className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Activity today</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{activityToday}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Actions recorded today</p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CalendarClock className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Staff represented</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{uniqueStaff}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Unique staff in this log</p>
              </div>
              <div className="size-10 rounded-[5px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Audit filters</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Search activity details or narrow the log by action, sector, and date.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  placeholder="Search actions, members, or staff…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setCurrentPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Action */}
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Actions</option>
                {ALL_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* From date */}
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />

              {/* To date */}
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />

              {/* Clear */}
              {(search || actionFilter || categoryFilter || fromDate || toDate) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="size-3.5" /> Clear
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Activity table ── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Activity Records
            <span className="ml-2 text-xs font-normal text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </h2>
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">Member / Record</th>
                      <th className="py-3 px-4 font-semibold">Staff</th>
                      <th className="py-3 px-4 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                          No activity records match the current filters.
                        </td>
                      </tr>
                    ) : displayed.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{l.date}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <ActionBadge action={l.action} />
                            <p className="text-[11px] text-muted-foreground">{l.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground">{l.member}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5 break-all max-w-[140px]">{l.staffId}</p>
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">{l.staff}</td>
                        <td className="py-3 px-4 text-muted-foreground max-w-xs">{l.details}</td>
                      </tr>
                    ))}
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
              onPageSizeChange={(n) => { setRowsPerPage(n); setCurrentPage(1) }}
              itemLabel="records"
            />
          </Card>
        </div>

      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminAuditPage
