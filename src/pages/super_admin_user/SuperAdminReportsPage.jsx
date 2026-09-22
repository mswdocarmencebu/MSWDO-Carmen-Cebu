import React, { useState, useMemo, useEffect, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  BarChart3, Search, X, Download, Printer,
  FileText, Users, Coins, ClipboardList, RefreshCw, Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"
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

function normalizeClaim(c) {
  return {
    date:     c.date || c.created_at || "—",
    name:     `${c.memberName || c.member_name || "—"} — ${c.benefit || c.benefit_name || ""}`,
    category: c.sector || c.category || "—",
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
  /* ── Raw data from Supabase ── */
  const [applications, setApplications] = useState([])
  const [members,      setMembers]      = useState([])
  const [claims,       setClaims]       = useState([])
  const [programs,     setPrograms]     = useState([])
  const [loading,      setLoading]      = useState(true)

  /* ── UI state ── */
  const [reportType,      setReportType]      = useState("applications")
  const [search,          setSearch]          = useState("")
  const [categoryFilter,  setCategoryFilter]  = useState("")
  const [statusFilter,    setStatusFilter]    = useState("")
  const [fromDate,        setFromDate]        = useState("")
  const [toDate,          setToDate]          = useState("")
  const [currentPage,     setCurrentPage]     = useState(1)
  const [rowsPerPage,     setRowsPerPage]     = useState(15)

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

  /* ── Stat cards ── */
  const totalApps    = applications.length
  const totalMembers = members.length
  const totalClaims  = claims.length
  const releasedAmt  = claims
    .filter((c) => (c.status || "").toLowerCase() === "processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  /* ── Normalize active source ── */
  const source = useMemo(() => {
    switch (reportType) {
      case "applications": return applications.map(normalizeApplication)
      case "members":      return members.map(normalizeMember)
      case "claims":       return claims.map(normalizeClaim)
      case "programs":     return programs.map(normalizeProgram)
      default:             return []
    }
  }, [reportType, applications, members, claims, programs])

  /* ── Unique statuses for filter dropdown ── */
  const availableStatuses = useMemo(() =>
    [...new Set(source.map((r) => r.status).filter(Boolean))].sort(),
    [source]
  )

  /* ── Unique categories for filter dropdown ── */
  const availableCategories = useMemo(() =>
    [...new Set(source.map((r) => r.category).filter(Boolean))].sort(),
    [source]
  )

  /* ── Filter ── */
  const q = search.toLowerCase()
  const filtered = useMemo(() =>
    source.filter((r) => {
      const matchSearch   = !q || r.name.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q)
      const matchCategory = !categoryFilter || r.category === categoryFilter
      const matchStatus   = !statusFilter   || r.status   === statusFilter
      // Date comparison — try to parse "Sep 22, 2026" or ISO dates
      const logDate = new Date(r.date)
      const matchFrom = !fromDate || isNaN(logDate) || logDate >= new Date(fromDate)
      const matchTo   = !toDate   || isNaN(logDate) || logDate <= new Date(toDate + "T23:59:59")
      return matchSearch && matchCategory && matchStatus && matchFrom && matchTo
    }),
    [source, q, categoryFilter, statusFilter, fromDate, toDate]
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
    a.download = `mswdo-report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

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
            { label: "Applications",    value: totalApps,    icon: FileText,      color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" },
            { label: "Members",         value: totalMembers, icon: Users,         color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" },
            { label: "Benefit Claims",  value: totalClaims,  icon: ClipboardList, color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" },
            {
              label: "Released Amount",
              value: loading ? "—" : `₱${releasedAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              icon: Coins,
              color: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
              mono: true,
            },
          ].map((s) => (
            <Card key={s.label} className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
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

        {/* ── Filter card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Report filters</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Choose a report type, then narrow by category, status, date range, or keyword.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">

              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage() }}
                  placeholder="Search by name or reference…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button onClick={() => { setSearch(""); resetPage() }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Report type */}
              <select
                value={reportType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
              >
                {REPORT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>

              {/* Category — populated from actual data */}
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Status — populated from actual data */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); resetPage() }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Statuses</option>
                {availableStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Date from */}
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); resetPage() }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />

              {/* Date to */}
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); resetPage() }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Data table ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{activeLabel}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {loading ? "Loading records…" : `${filtered.length} record${filtered.length !== 1 ? "s" : ""} match the current filters`}
              </p>
            </div>
          </div>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
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
                    ) : displayed.map((r, i) => (
                      <tr key={`${r.ref}-${i}`} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{r.date}</td>
                        <td className="py-3 px-4 font-semibold text-foreground max-w-[260px] truncate">{r.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{r.category || "—"}</td>
                        <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{r.ref}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-foreground">{r.amount || "—"}</td>
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

export default SuperAdminReportsPage
