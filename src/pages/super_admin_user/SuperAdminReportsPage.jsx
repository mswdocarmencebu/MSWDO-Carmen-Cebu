import React, { useState, useMemo, useEffect, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  BarChart3, Search, X, Download, Printer,
  FileText, Users, Coins, ClipboardList, RefreshCw, Loader2,
  ShieldAlert,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import { getApplications }             from "@/services/applicationService"
import { getMembers }                  from "@/services/memberService"
import { getBenefitClaims, getBenefitPrograms } from "@/services/benefitService"

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const REPORT_TYPES = [
  { key: "applications", label: "Applications" },
  { key: "members",      label: "Members"       },
  { key: "claims",       label: "Benefit Claims" },
  { key: "programs",     label: "Benefit Programs" },
]

const ALL_CATEGORIES = [
  "Youth",
  "Senior Citizen",
  "Person with Disability (PWD)",
  "Women",
  "Women's Welfare",
  "Solo Parent",
  "General",
  "PWD",
]

/* ─────────────────────────────────────────────
   Row normalizers — each returns a uniform shape:
   { date, name, category, status, ref, amount }
───────────────────────────────────────────── */
function normalizeApplication(a) {
  return {
    date:     a.submitted || a.created_at || "—",
    name:     a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim(),
    category: a.sector || a.category || "—",
    status:   a.status || "Pending",
    ref:      a.reference || a.reference_number || "—",
    amount:   null,
  }
}

function normalizeMember(m) {
  return {
    date:     m.updated || m.created_at || "—",
    name:     m.name || m.full_name || "—",
    category: m.category || "—",
    status:   m.status || "Active",
    ref:      m.memberId || m.member_id || "—",
    amount:   null,
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
    date:     c.date || c.created_at || "—",
    name:     `${c.memberName || c.member_name || "—"} — ${c.benefit || c.benefit_name || ""}`,
    category: cat || "—",
    status:   c.status || "Pending",
    ref:      c.claimNumber || c.claim_number || "—",
    amount:   c.amount || null,
  }
}

function normalizeProgram(p) {
  return {
    date:     p.createdAt || p.created_at || "—",
    name:     p.name || "—",
    category: p.sector || "—",
    status:   p.status || "Active",
    ref:      p.code || p.id || "—",
    amount:   p.amount || null,
  }
}

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Pending:    "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Approved:   "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Rejected:   "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    Active:     "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Inactive:   "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    Processed:  "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Cancelled:  "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    Resubmitted:"bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "Needs correction": "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${map[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function SuperAdminReportsPage() {
  const {
    canView,
    filterByAllowedCategory,
    isCategoryAllowed,
    hasFullAccess,
    allowedCategories,
    position,
  } = useStaffPermissions()

  /* ── Raw data from Supabase ── */
  const [applications, setApplications] = useState([])
  const [members,      setMembers]      = useState([])
  const [claims,       setClaims]       = useState([])
  const [programs,     setPrograms]     = useState([])
  const [loading,      setLoading]      = useState(true)

  const { location } = useRouter()

  /* ── UI state ── */
  const [reportType,      setReportType]      = useState("applications")
  const [activeTab,       setActiveTab]       = useState("pending") // "pending" | "approved" | "rejected" | "all"
  const [search,          setSearch]          = useState("")
  const [categoryFilter,  setCategoryFilter]  = useState("")
  const [statusFilter,    setStatusFilter]    = useState("")
  const [fromDate,        setFromDate]        = useState("")
  const [toDate,          setToDate]          = useState("")
  const [currentPage,     setCurrentPage]     = useState(1)
  const [rowsPerPage,     setRowsPerPage]     = useState(15)

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
    const [apps, mems, clms, progs] = await Promise.all([
      getApplications(),
      getMembers(),
      getBenefitClaims(),
      getBenefitPrograms(),
    ])
    setApplications(Array.isArray(apps)  ? apps  : [])
    setMembers(     Array.isArray(mems)  ? mems  : [])
    setClaims(      Array.isArray(clms)  ? clms  : [])
    setPrograms(    Array.isArray(progs) ? progs : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

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

  /* ── Stat cards (derived from scoped data) ── */
  const totalApps    = scopedApps.length
  const totalMembers = scopedMembers.length
  const totalClaims  = scopedClaims.length
  const releasedAmt  = scopedClaims
    .filter((c) => (c.status || "").toLowerCase() === "processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  /* ── Normalize and scope active source ── */
  const source = useMemo(() => {
    let raw = []
    switch (reportType) {
      case "applications": raw = applications.map(normalizeApplication); break
      case "members":      raw = members.map(normalizeMember); break
      case "claims":       raw = claims.map((c) => normalizeClaim(c, programs, members)); break
      case "programs":     raw = programs.map(normalizeProgram); break
      default:             raw = []
    }
    return filterByAllowedCategory(raw, (r) => r.category)
  }, [reportType, applications, members, claims, programs, filterByAllowedCategory])

  /* ── Status Tab Counts ── */
  const pendingCount = useMemo(() =>
    source.filter((r) =>
      ["pending", "resubmitted", "needs correction", "for review", "under review"].includes(
        (r.status || "").toLowerCase().trim()
      )
    ).length,
    [source]
  )

  const approvedCount = useMemo(() =>
    source.filter((r) =>
      ["approved", "active", "processed", "verified"].includes(
        (r.status || "").toLowerCase().trim()
      )
    ).length,
    [source]
  )

  const rejectedCount = useMemo(() =>
    source.filter((r) =>
      ["rejected", "terminated", "inactive", "cancelled", "denied"].includes(
        (r.status || "").toLowerCase().trim()
      )
    ).length,
    [source]
  )

  const totalSourceCount = source.length

  /* ── Unique statuses for filter dropdown ── */
  const availableStatuses = useMemo(() =>
    [...new Set(source.map((r) => r.status).filter(Boolean))].sort(),
    [source]
  )

  /* ── Unique categories for filter dropdown ── */
  const availableCategories = useMemo(() =>
    [...new Set(source.map((r) => r.category).filter(Boolean))].filter((c) => c !== "—" && isCategoryAllowed(c)).sort(),
    [source, isCategoryAllowed]
  )

  /* ── Filter ── */
  const q = search.toLowerCase().trim()
  const filtered = useMemo(() =>
    source.filter((r) => {
      const matchSearch =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.ref?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)

      const matchCategory = !categoryFilter || r.category === categoryFilter

      const s = (r.status || "").toLowerCase().trim()
      let matchesTab = true
      if (activeTab === "pending") {
        matchesTab = ["pending", "resubmitted", "needs correction", "for review", "under review"].includes(s)
      } else if (activeTab === "approved") {
        matchesTab = ["approved", "active", "processed", "verified"].includes(s)
      } else if (activeTab === "rejected") {
        matchesTab = ["rejected", "terminated", "inactive", "cancelled", "denied"].includes(s)
      }

      const matchStatus = !statusFilter || r.status === statusFilter

      // Date comparison — try to parse "Sep 22, 2026" or ISO dates
      const logDate = new Date(r.date)
      const matchFrom = !fromDate || isNaN(logDate) || logDate >= new Date(fromDate)
      const matchTo   = !toDate   || isNaN(logDate) || logDate <= new Date(toDate + "T23:59:59")
      return matchSearch && matchesTab && matchCategory && matchStatus && matchFrom && matchTo
    }),
    [source, q, activeTab, categoryFilter, statusFilter, fromDate, toDate]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const activeLabel = REPORT_TYPES.find((t) => t.key === reportType)?.label ?? "Records"

  const resetPage = () => setCurrentPage(1)

  const handleTypeChange = (v) => {
    setReportType(v)
    setCategoryFilter("")
    setStatusFilter("")
    setSearch("")
    resetPage()
  }

  /* ── Export CSV ── */
  const handleExportCSV = () => {
    const headers = ["Date", "Name / Title", "Category", "Status", "Reference", "Amount"]
    const rows = filtered.map((r) => [
      r.date, r.name, r.category, r.status, r.ref, r.amount || "—",
    ])
    const csv  = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `mswdo-report-${reportType}-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <SuperAdminUserLayout activeTab="reports">
      <div className="space-y-4">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <BarChart3 className="size-3.5" />
                Data Reports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">Reports</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Generate, review, and export municipal social welfare data.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading} className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8">
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8">
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button variant="brand" size="sm" onClick={handleExportCSV} className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8">
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Applications",    value: totalApps,    icon: FileText,      color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400", type: "applications" },
            { label: "Members",         value: totalMembers, icon: Users,         color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400", type: "members" },
            { label: "Benefit Claims",  value: totalClaims,  icon: ClipboardList, color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400", type: "claims" },
            {
              label: "Released Amount",
              value: loading ? "—" : `₱${releasedAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
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
                  <p className={`font-bold text-foreground font-heading mt-0.5 ${s.mono ? "text-lg" : "text-2xl"}`}>
                    {loading
                      ? <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      : s.value}
                  </p>
                </div>
                <div className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabbed records card (Matches Benefits & Applications Tab UI) ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          {/* Row 1: Tab bar + Search & Report Type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-3 pb-0 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-0 overflow-x-auto no-scrollbar shrink-0">
              {/* Pending Tab */}
              <button
                type="button"
                onClick={() => { setActiveTab("pending"); resetPage(); }}
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
                onClick={() => { setActiveTab("approved"); resetPage(); }}
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
                onClick={() => { setActiveTab("rejected"); resetPage(); }}
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

              {/* All records Tab */}
              <button
                type="button"
                onClick={() => { setActiveTab("all"); resetPage(); }}
                className={`relative pb-3 px-1 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
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
            </div>

            {/* Top row controls: Search + Report type selector */}
            <div className="flex items-center gap-2 pb-2.5 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                  placeholder="Search name, ref…"
                  className="w-40 sm:w-52 pl-7 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); resetPage(); }}
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
                  <option key={t.key} value={t.key}>{t.label}</option>
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
                onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
                className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded-[5px] border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] text-muted-foreground font-medium">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
                  title="From date"
                  className="text-[11px] bg-transparent text-foreground outline-none cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground font-medium">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); resetPage(); }}
                  title="To date"
                  className="text-[11px] bg-transparent text-foreground outline-none cursor-pointer"
                />
              </div>

              {(search || categoryFilter || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategoryFilter(""); setFromDate(""); setToDate(""); resetPage(); }}
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
                  Showing <strong className="text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "record" : "records"}
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
                      <tr key={`${r.ref}-${i}`} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{r.date}</td>
                        <td className="py-3 px-4 font-semibold text-foreground max-w-[260px] truncate">
                          <HighlightText text={r.name} highlight={search} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <HighlightText text={r.category || "—"} highlight={search} />
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                          <HighlightText text={r.ref} highlight={search} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-foreground">{r.amount || "—"}</td>
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
            onPageSizeChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }}
            itemLabel="records"
          />
        </Card>

      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminReportsPage
