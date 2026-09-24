import React, { useState, useMemo, useEffect, useCallback } from "react"
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
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldAlert,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import {
  getApplications,
  updateApplicationStatus,
} from "@/services/applicationService"

const HISTORY_STORAGE_KEY = "mswdo_termination_history"

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (status === "Active" || status === "Approved") {
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
  const { location } = useRouter()
  const {
    canView,
    canEdit,
    canApprove,
    canDelete,
    filterByAllowedCategory,
    isCategoryAllowed,
    hasFullAccess,
    allowedCategories,
    position,
  } = useStaffPermissions()

  const [activeTab, setActiveTab]       = useState("status") // "status" | "history"
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading]       = useState(true)
  const [updatingId, setUpdatingId]     = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Status History
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Filters
  const [search, setSearch]                 = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter]     = useState("")

  // Pagination for Applicant Status Tab
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Pagination for Status History Tab
  const [historyPage, setHistoryPage] = useState(1)
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10)

  // Sync with URL query parameter from global search or deep links
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get("tab")
    if (tabParam === "status" || tabParam === "history") {
      setActiveTab(tabParam)
    }
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearch(searchParam)
      setCurrentPage(1)
      setHistoryPage(1)
    }
  }, [location.search])

  /* ── Load dynamic applications data ── */
  const loadApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const apps = await getApplications()
      if (Array.isArray(apps)) {
        setApplications(apps)
      }
    } catch (err) {
      console.warn("Could not load applications for termination:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApplications()

    const handleSync = () => loadApplications()
    window.addEventListener("focus", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("focus", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [loadApplications])

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  /* ── Scoped applications by staff allowed categories ── */
  const scopedApplications = useMemo(() => {
    return filterByAllowedCategory(applications, (app) => app.sector || app.category || app.program)
  }, [applications, filterByAllowedCategory])

  /* ── Map applications to applicant accounts ── */
  const applicantAccounts = useMemo(() => {
    return scopedApplications.map((app) => {
      const refId = app.reference || app.reference_number || app.id
      const isTerminated = app.status === "Terminated"
      return {
        rawId: app.id,
        id: refId,
        name: app.name || `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Applicant",
        email: app.email || "",
        category: app.sector || app.category || "General",
        status: isTerminated ? "Terminated" : "Active",
        originalStatus: app.status,
      }
    })
  }, [scopedApplications])

  /* ── Derived categories from live data ── */
  const availableCategories = useMemo(() => {
    const cats = new Set(applicantAccounts.map((a) => a.category).filter(Boolean))
    return Array.from(cats).filter((c) => isCategoryAllowed(c)).sort()
  }, [applicantAccounts, isCategoryAllowed])

  /* ── Derived stats ── */
  const totalAccounts      = applicantAccounts.length
  const activeAccounts     = applicantAccounts.filter((a) => a.status === "Active").length
  const terminatedAccounts = applicantAccounts.filter((a) => a.status === "Terminated").length

  /* ── Filtered list ── */
  const q = search.toLowerCase().trim()
  const filtered = useMemo(() =>
    applicantAccounts.filter((a) => {
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      const matchCategory = !categoryFilter || a.category === categoryFilter
      const matchStatus   = !statusFilter   || a.status   === statusFilter
      return matchSearch && matchCategory && matchStatus
    }),
    [applicantAccounts, q, categoryFilter, statusFilter]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  /* ── Toggle Terminate / Restore ── */
  const handleToggle = async (account) => {
    const isCurrentlyActive = account.status === "Active"
    const nextStatus = isCurrentlyActive ? "Terminated" : "Approved"
    const actionLabel = isCurrentlyActive ? "Terminated" : "Restored"
    const targetId = account.rawId || account.id

    setUpdatingId(account.id)
    try {
      // 1. Persist to database & storage
      await updateApplicationStatus(targetId, nextStatus)

      // 2. Update local state
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === account.rawId || app.reference === account.id) {
            return { ...app, status: nextStatus }
          }
          return app
        })
      )

      // 3. Record history log
      const newEntry = {
        id: `${account.id}-${Date.now()}`,
        name: account.name,
        memberId: account.id,
        category: account.category,
        action: actionLabel,
        timestamp: new Date().toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      }

      setHistory((prev) => {
        const next = [newEntry, ...prev].slice(0, 100)
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
        } catch {}
        return next
      })

      showToast(`Applicant "${account.name}" has been ${actionLabel.toLowerCase()}.`)
    } catch (err) {
      console.error("Status toggle error:", err)
      showToast(`Failed to update status for "${account.name}".`, "error")
    } finally {
      setUpdatingId(null)
    }
  }

  /* ── Clear history handler ── */
  const handleClearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch {}
    showToast("Status history log cleared.")
  }

  /* ── Scoped History ── */
  const scopedHistory = useMemo(() => {
    if (hasFullAccess) return history
    return history.filter((h) => {
      if (h.category && isCategoryAllowed(h.category)) return true
      const app = applications.find(
        (a) =>
          (a.reference && h.memberId && a.reference === h.memberId) ||
          (a.id && h.memberId && a.id === h.memberId) ||
          (a.name && h.name && a.name.toLowerCase() === h.name.toLowerCase())
      )
      if (app && isCategoryAllowed(app.sector || app.category)) return true
      return !allowedCategories || allowedCategories.length === 0
    })
  }, [history, applications, hasFullAccess, isCategoryAllowed, allowedCategories])

  /* ── Filtered History with search ── */
  const filteredHistory = useMemo(() => {
    if (!q) return scopedHistory
    return scopedHistory.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.memberId?.toLowerCase().includes(q) ||
        h.action?.toLowerCase().includes(q)
    )
  }, [scopedHistory, q])

  const totalHistoryPages = Math.ceil(filteredHistory.length / historyRowsPerPage) || 1
  const displayedHistory = filteredHistory.slice(
    (historyPage - 1) * historyRowsPerPage,
    historyPage * historyRowsPerPage
  )

  /* ── Permission Guard ── */
  if (!canView) {
    return (
      <SuperAdminUserLayout activeTab="termination">
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="size-14 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 border border-red-200 dark:border-red-900">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-heading">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Your staff account does not have permission to view account terminations.
            Please contact an administrator if you require access.
          </p>
        </div>
      </SuperAdminUserLayout>
    )
  }

  return (
    <SuperAdminUserLayout activeTab="termination">
      <div className="space-y-4">

        {/* ── Toast notification ── */}
        {toastMessage && (
          <div
            className={`p-3 rounded-[5px] text-xs flex items-center justify-between border shadow-2xs transition-all ${
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold">
                <UserX className="size-3.5" />
                Account Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Termination
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Terminate active accounts or restore previously terminated applicants based on application records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
              disabled={isLoading}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Stat cards (3) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            onClick={() => {
              setActiveTab("status")
              setStatusFilter("")
              setCurrentPage(1)
            }}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Applicant accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : totalAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">From registered applications</p>
              </div>
              <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => {
              setActiveTab("status")
              setStatusFilter("Active")
              setCurrentPage(1)
            }}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : activeAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Currently eligible for access</p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => {
              setActiveTab("status")
              setStatusFilter("Terminated")
              setCurrentPage(1)
            }}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-red-400 dark:hover:border-red-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Terminated accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : terminatedAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Can be restored when appropriate</p>
              </div>
              <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <UserMinus className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabbed records card (Matches Benefits Page Tab UI) ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">

          {/* Tab bar + search & filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-3 pb-0 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("status")
                  setCurrentPage(1)
                }}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "status"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Application status
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "status"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {isLoading ? "..." : filtered.length}
                </span>
                {activeTab === "status" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("history")
                  setHistoryPage(1)
                }}
                className={`relative pb-3 px-1 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "history"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Status history
                <span
                  className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === "history"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {filteredHistory.length}
                </span>
                {activeTab === "history" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Search + filter controls right aligned */}
            <div className="flex items-center gap-2 pb-2.5 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                    setHistoryPage(1)
                  }}
                  placeholder={
                    activeTab === "status"
                      ? "Search name, ID, or email…"
                      : "Search history log…"
                  }
                  className="w-44 sm:w-56 pl-7 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("")
                      setCurrentPage(1)
                      setHistoryPage(1)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {activeTab === "status" && (
                <>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active ({activeAccounts})</option>
                    <option value="Terminated">Terminated ({terminatedAccounts})</option>
                  </select>
                </>
              )}

              {activeTab === "history" && history.length > 0 && canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className="rounded-[5px] text-xs h-7 px-2.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:border-red-800 cursor-pointer gap-1"
                  title="Clear history log"
                >
                  <Trash2 className="size-3" />
                  Clear log
                </Button>
              )}
            </div>
          </div>

          {/* ── Tab 1: Application Status Table ── */}
          {activeTab === "status" && (
            <>
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-xs text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              Loading applicant records from applications…
                            </div>
                          </td>
                        </tr>
                      ) : displayed.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                            No applicants match the current filters.
                          </td>
                        </tr>
                      ) : (
                        displayed.map((a) => {
                          const isProcessing = updatingId === a.id
                          return (
                            <tr key={a.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-foreground">
                                  <HighlightText text={a.name} highlight={search} />
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    <HighlightText text={a.id} highlight={search} />
                                  </span>
                                  {a.email && (
                                    <span className="text-[11px] text-muted-foreground/80">
                                      • <HighlightText text={a.email} highlight={search} />
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground">
                                <HighlightText text={a.category} highlight={search} />
                              </td>
                              <td className="py-3.5 px-4"><StatusBadge status={a.status} /></td>
                              <td className="py-3.5 px-4 text-right">
                                {(canEdit || canApprove) ? (
                                  a.status === "Active" ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isProcessing}
                                      className="rounded-[5px] text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer gap-1"
                                      onClick={() => handleToggle(a)}
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                      ) : (
                                        <UserMinus className="size-3" />
                                      )}
                                      Terminate
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isProcessing}
                                      className="rounded-[5px] text-xs h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1"
                                      onClick={() => handleToggle(a)}
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="size-3" />
                                      )}
                                      Restore
                                    </Button>
                                  )
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
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
                onPageSizeChange={(n) => { setRowsPerPage(n); setCurrentPage(1) }}
                itemLabel="applicants"
              />
            </>
          )}

          {/* ── Tab 2: Status History ── */}
          {activeTab === "history" && (
            <>
              <CardContent className="p-0">
                {displayedHistory.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-center">
                    <div className="size-9 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Clock className="size-4.5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {search ? "No matching history records" : "No status history yet"}
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      {search
                        ? `No events match "${search}". Try checking your query or clearing the search.`
                        : "Account termination and restoration events will automatically be logged here."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {displayedHistory.map((h) => (
                      <li key={h.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          h.action === "Terminated"
                            ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {h.action === "Terminated"
                            ? <UserMinus className="size-4" />
                            : <RotateCcw className="size-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            <HighlightText text={h.name} highlight={search} />
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            <HighlightText text={h.memberId} highlight={search} />
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                            h.action === "Terminated"
                              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          }`}>
                            <HighlightText text={h.action} highlight={search} />
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{h.timestamp}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              {filteredHistory.length > 0 && (
                <DataTablePagination
                  currentPage={historyPage}
                  totalPages={totalHistoryPages}
                  totalItems={filteredHistory.length}
                  pageSize={historyRowsPerPage}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={(n) => { setHistoryRowsPerPage(n); setHistoryPage(1) }}
                  itemLabel="events"
                />
              )}
            </>
          )}
        </Card>

      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminTerminationPage
