import React, { useState, useMemo } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  UserX,
  Search,
  Users,
  UserCheck,
  UserMinus,
  RotateCcw,
  X,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"

/* ─────────────────────────────────────────────
   Seed data — applicant accounts
───────────────────────────────────────────── */
const INITIAL_APPLICANTS = [
  {
    id: "MSWDO-97172",
    name: "Shen Delante",
    category: "Person with Disability (PWD)",
    status: "Active",
  },
  {
    id: "MSWDO-87656",
    name: "Neil Delante",
    category: "Youth",
    status: "Active",
  },
  {
    id: "MSWDO-80714",
    name: "applicant one",
    category: "Women",
    status: "Active",
  },
]

const CATEGORIES = [
  "Youth",
  "Senior Citizen",
  "Person with Disability (PWD)",
  "Women",
  "Solo Parent",
  "General",
]

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
      Terminated
    </span>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function SuperAdminTerminationPage() {
  const [applicants, setApplicants] = useState(INITIAL_APPLICANTS)
  const [history, setHistory]       = useState([])

  // Filters
  const [search, setSearch]           = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter]     = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  /* ── Derived stats ── */
  const totalAccounts      = applicants.length
  const activeAccounts     = applicants.filter((a) => a.status === "Active").length
  const terminatedAccounts = applicants.filter((a) => a.status === "Terminated").length

  /* ── Filtered list ── */
  const q = search.toLowerCase()
  const filtered = useMemo(() =>
    applicants.filter((a) => {
      const matchSearch   = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
      const matchCategory = !categoryFilter || a.category === categoryFilter
      const matchStatus   = !statusFilter   || a.status   === statusFilter
      return matchSearch && matchCategory && matchStatus
    }),
    [applicants, q, categoryFilter, statusFilter]
  )

  const totalPages  = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed   = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  /* ── Handlers ── */
  const handleToggle = (id) => {
    setApplicants((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const newStatus = a.status === "Active" ? "Terminated" : "Active"
        const action    = newStatus === "Terminated" ? "Terminated" : "Restored"
        setHistory((h) => [
          {
            id: `${id}-${Date.now()}`,
            name: a.name,
            memberId: a.id,
            action,
            timestamp: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
          },
          ...h,
        ].slice(0, 8))
        return { ...a, status: newStatus }
      })
    )
    setCurrentPage(1)
  }

  return (
    <SuperAdminUserLayout activeTab="termination">
      <div className="space-y-4">

        {/* ── Page header ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold">
              <UserX className="size-3.5" />
              Account Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Termination
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Terminate active accounts or restore previously terminated applicants.
          </p>
        </div>

        {/* ── Stat cards (3) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Applicant accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{totalAccounts}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Within assigned sectors</p>
              </div>
              <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{activeAccounts}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Currently eligible for access</p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Terminated accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{terminatedAccounts}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Can be restored when appropriate</p>
              </div>
              <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <UserMinus className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Account filters</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Find an applicant account before changing its access status.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  placeholder="Search name, ID, or email…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setCurrentPage(1) }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ── Applicant table ── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Applicant Status
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              Terminate active accounts or restore previously terminated applicants.
            </span>
          </h2>
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Applicant</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                          No applicants match the current filters.
                        </td>
                      </tr>
                    ) : displayed.map((a) => (
                      <tr key={a.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{a.id}</p>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">{a.category}</td>
                        <td className="py-3.5 px-4"><StatusBadge status={a.status} /></td>
                        <td className="py-3.5 px-4 text-right">
                          {a.status === "Active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-[5px] text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              onClick={() => handleToggle(a.id)}
                            >
                              Terminate
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-[5px] text-xs h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1"
                              onClick={() => handleToggle(a.id)}
                            >
                              <RotateCcw className="size-3" />
                              Restore
                            </Button>
                          )}
                        </td>
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
              itemLabel="applicants"
            />
          </Card>
        </div>

        {/* ── Recent Status History ── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Recent Status History</h2>
          <p className="text-[11px] text-muted-foreground mb-2">The eight most recent termination and restoration updates.</p>
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <div className="size-9 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Clock className="size-4.5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">No status history yet</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Termination and restoration events will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                        h.action === "Terminated"
                          ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {h.action === "Terminated"
                          ? <UserMinus className="size-3.5" />
                          : <RotateCcw className="size-3.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{h.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{h.memberId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-semibold ${
                          h.action === "Terminated" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {h.action}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{h.timestamp}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminTerminationPage
