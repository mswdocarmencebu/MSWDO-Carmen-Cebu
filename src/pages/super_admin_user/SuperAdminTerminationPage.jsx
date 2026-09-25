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
  Shield,
  FileText,
  BadgeAlert,
  Info,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import { useAuth } from "@/hooks/useAuth"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import { getApplications } from "@/services/applicationService"
import { getStaffUsers } from "@/services/userService"
import {
  terminateUser,
  unterminateUser,
  getTerminationHistory,
} from "@/services/terminationService"

const PRESET_TERMINATION_REASONS = [
  "Violation of municipal welfare program terms and guidelines",
  "Dual or conflicting benefit enrollment detected",
  "Disqualification or ineligibility verified by casework officer",
  "Administrative revocation by MSWDO Carmen executive order",
  "Voluntary cancellation or withdrawal requested by applicant",
  "Beneficiary deceased or relocated outside municipal jurisdiction",
  "Non-compliance with mandatory welfare case evaluation",
  "Other reason (specify below)",
]

const PRESET_UNTERMINATION_REASONS = [
  "Reinstated after formal appeal and committee re-evaluation",
  "Eligibility verified and compliance requirements fulfilled",
  "Administrative reinstatement authorized by MSWDO supervisor",
  "Identity verification cleared and documentation updated",
  "Other reason (specify below)",
]

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
  if (status === "Inactive") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
        Inactive
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
      Terminated
    </span>
  )
}

function AccountTypeBadge({ type }) {
  const isStaff = type.includes("Staff") || type.includes("Admin")
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
        isStaff
          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      }`}
    >
      {type}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Terminate Confirmation Modal
───────────────────────────────────────────── */
function TerminateModal({ isOpen, onClose, target, onConfirm, isProcessing }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_TERMINATION_REASONS[0])
  const [customReason, setCustomReason] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(PRESET_TERMINATION_REASONS[0])
      setCustomReason("")
      setNotes("")
    }
  }, [isOpen])

  if (!isOpen || !target) return null

  const finalReason =
    selectedPreset === "Other reason (specify below)"
      ? customReason.trim() || "Administrative termination"
      : selectedPreset

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ reason: finalReason, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="size-10 rounded-[5px] bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <UserX className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground font-heading">Terminate User Account</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Revoke user portal access and record an official termination event.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Target Profile Card */}
          <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-start justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold text-foreground truncate">{target.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{target.email || target.id}</p>
              <div className="flex items-center gap-2 mt-1">
                <AccountTypeBadge type={target.accountType} />
                <span className="text-[10px] text-muted-foreground">{target.category}</span>
              </div>
            </div>
            <StatusBadge status={target.status} />
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-foreground">
              Termination Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-red-500 transition-colors cursor-pointer"
            >
              {PRESET_TERMINATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Field if "Other" is selected */}
          {selectedPreset === "Other reason (specify below)" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">Specify Reason</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific policy reason…"
                required
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}

          {/* Administrative Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-foreground">
              Official Notes / Case Remarks <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide case numbers, municipal resolutions, or audit notes for this termination…"
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-[11px] text-red-800 dark:text-red-300">
            <ShieldAlert className="size-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-xs leading-tight">Access will be blocked immediately</p>
              <p className="text-[10.5px] leading-relaxed text-red-700 dark:text-red-300">
                The user will be immediately logged out and forbidden from signing into the portal. This action will be permanently recorded in the official tracking audit log. You can unterminate this account later.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Terminating…
                </>
              ) : (
                <>
                  <UserX className="size-3.5" />
                  Terminate User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Unterminate / Reinstate Confirmation Modal
───────────────────────────────────────────── */
function UnterminateModal({ isOpen, onClose, target, onConfirm, isProcessing }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_UNTERMINATION_REASONS[0])
  const [customReason, setCustomReason] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(PRESET_UNTERMINATION_REASONS[0])
      setCustomReason("")
      setNotes("")
    }
  }, [isOpen])

  if (!isOpen || !target) return null

  const finalReason =
    selectedPreset === "Other reason (specify below)"
      ? customReason.trim() || "Reinstated by Admin"
      : selectedPreset

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ reason: finalReason, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="size-10 rounded-[5px] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <RotateCcw className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground font-heading">Unterminate User Account</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Restore active status and re-enable portal access for this user.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Target Profile Card */}
          <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-start justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold text-foreground truncate">{target.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{target.email || target.id}</p>
              <div className="flex items-center gap-2 mt-1">
                <AccountTypeBadge type={target.accountType} />
                <span className="text-[10px] text-muted-foreground">{target.category}</span>
              </div>
            </div>
            <StatusBadge status="Terminated" />
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-foreground">
              Reinstatement Reason <span className="text-emerald-500">*</span>
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {PRESET_UNTERMINATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Field if "Other" is selected */}
          {selectedPreset === "Other reason (specify below)" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">Specify Reason</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reinstatement reason…"
                required
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* Administrative Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-foreground">
              Official Reinstatement Notes <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide case resolution remarks or verification summary…"
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Reinstatement Notice */}
          <div className="p-3 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-xs leading-tight">Access will be fully restored</p>
              <p className="text-[10.5px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                The user account status will be restored to Active. The user will be permitted to sign into the portal immediately using their existing password.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Reinstating…
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  Unterminate &amp; Reinstate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Termination Page Component
───────────────────────────────────────────── */
export function SuperAdminTerminationPage() {
  const { location } = useRouter()
  const { user: currentAuthUser, profile: currentAuthProfile } = useAuth()
  const {
    canView,
    canEdit,
    canApprove,
    canDelete,
    filterByAllowedCategory,
    isCategoryAllowed,
    hasFullAccess,
    allowedCategories,
  } = useStaffPermissions()

  const [activeTab, setActiveTab]         = useState("status") // "status" | "history"
  const [applications, setApplications]   = useState([])
  const [staffUsers, setStaffUsers]       = useState([])
  const [history, setHistory]             = useState([])
  const [isLoading, setIsLoading]         = useState(true)
  const [toastMessage, setToastMessage]   = useState(null)

  // Modals state
  const [terminatingAccount, setTerminatingAccount]     = useState(null)
  const [unterminatingAccount, setUnterminatingAccount] = useState(null)
  const [isProcessingAction, setIsProcessingAction]     = useState(false)

  // Filters
  const [search, setSearch]                 = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter]     = useState("")

  // History Tab Filter
  const [historyActionFilter, setHistoryActionFilter] = useState("")

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

  /* ── Load dynamic data ── */
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [appsRes, staffRes, histRes] = await Promise.allSettled([
        getApplications(),
        getStaffUsers(),
        getTerminationHistory({ limit: 150 }),
      ])

      if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value)) {
        setApplications(appsRes.value)
      }
      if (staffRes.status === "fulfilled" && Array.isArray(staffRes.value)) {
        setStaffUsers(staffRes.value)
      }
      if (histRes.status === "fulfilled" && Array.isArray(histRes.value)) {
        setHistory(histRes.value)
      }
    } catch (err) {
      console.warn("Could not load termination data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    const handleSync = () => loadData()
    window.addEventListener("focus", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("focus", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [loadData])

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  /* ── Scoped applications by staff allowed categories ── */
  const scopedApplications = useMemo(() => {
    return filterByAllowedCategory(applications, (app) => app.sector || app.category || app.program)
  }, [applications, filterByAllowedCategory])

  /* ── Map all accounts (Applicants + Staff) ── */
  const allAccounts = useMemo(() => {
    // 1. Applicant accounts from applications
    const applicantAccounts = scopedApplications.map((app) => {
      const refId = app.reference || app.reference_number || app.id
      const isTerminated = app.status === "Terminated"
      return {
        rawId: app.id,
        id: refId,
        userId: app.user_id || null,
        name: app.name || `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Applicant",
        email: app.email || "",
        category: app.sector || app.category || "General",
        accountType: "Applicant",
        status: isTerminated ? "Terminated" : "Active",
        originalStatus: app.status,
      }
    })

    // 2. Staff accounts from getStaffUsers
    const staffAccounts = (staffUsers || []).map((staff) => {
      const isTerminated = staff.isTerminated || !staff.isActive
      return {
        rawId: staff.userId,
        id: staff.idNumber && staff.idNumber !== "—" ? staff.idNumber : `STF-${staff.userId?.slice(0, 6)}`,
        userId: staff.userId,
        name: staff.name || staff.email,
        email: staff.email || "",
        category: staff.position || "Staff",
        accountType: staff.position === "IT Staff" ? "Admin Staff" : "Staff",
        status: staff.isTerminated ? "Terminated" : staff.isActive ? "Active" : "Inactive",
        originalStatus: staff.isTerminated ? "Terminated" : "Active",
      }
    })

    return [...applicantAccounts, ...staffAccounts]
  }, [scopedApplications, staffUsers])

  /* ── Derived categories from live data ── */
  const availableCategories = useMemo(() => {
    const cats = new Set(allAccounts.map((a) => a.category).filter(Boolean))
    return Array.from(cats).filter((c) => isCategoryAllowed(c)).sort()
  }, [allAccounts, isCategoryAllowed])

  /* ── Derived stats ── */
  const totalAccounts      = allAccounts.length
  const activeAccounts     = allAccounts.filter((a) => a.status === "Active").length
  const terminatedAccounts = allAccounts.filter((a) => a.status === "Terminated").length

  /* ── Filtered list ── */
  const q = search.toLowerCase().trim()
  const filtered = useMemo(() =>
    allAccounts.filter((a) => {
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      const matchType     = !accountTypeFilter || a.accountType === accountTypeFilter
      const matchCategory = !categoryFilter    || a.category    === categoryFilter
      const matchStatus   = !statusFilter      || a.status      === statusFilter
      return matchSearch && matchType && matchCategory && matchStatus
    }),
    [allAccounts, q, accountTypeFilter, categoryFilter, statusFilter]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  /* ── Handle Terminate Submit ── */
  const handleConfirmTerminate = async ({ reason, notes }) => {
    if (!terminatingAccount) return
    setIsProcessingAction(true)

    try {
      await terminateUser({
        userId: terminatingAccount.userId,
        email: terminatingAccount.email,
        name: terminatingAccount.name,
        category: terminatingAccount.category,
        role: terminatingAccount.accountType,
        reason,
        notes,
        performedBy: currentAuthUser?.id,
        performedByName: currentAuthProfile?.full_name || currentAuthUser?.email || "Administrator",
        performedByRole: currentAuthProfile?.role === "super_admin_user" ? "Super Admin" : "Admin Staff",
        applicationId: terminatingAccount.rawId || terminatingAccount.id,
      })

      // Update state locally
      setApplications((prev) =>
        prev.map((app) =>
          app.id === terminatingAccount.rawId || app.reference === terminatingAccount.id
            ? { ...app, status: "Terminated" }
            : app
        )
      )
      setStaffUsers((prev) =>
        prev.map((stf) =>
          stf.userId === terminatingAccount.userId
            ? { ...stf, isTerminated: true, isActive: false }
            : stf
        )
      )

      showToast(`User "${terminatingAccount.name}" has been terminated and access is revoked.`)
      setTerminatingAccount(null)
      await loadData()
    } catch (err) {
      console.error("Terminate error:", err)
      showToast(`Failed to terminate account: ${err.message}`, "error")
    } finally {
      setIsProcessingAction(false)
    }
  }

  /* ── Handle Unterminate Submit ── */
  const handleConfirmUnterminate = async ({ reason, notes }) => {
    if (!unterminatingAccount) return
    setIsProcessingAction(true)

    try {
      await unterminateUser({
        userId: unterminatingAccount.userId,
        email: unterminatingAccount.email,
        name: unterminatingAccount.name,
        category: unterminatingAccount.category,
        role: unterminatingAccount.accountType,
        reason,
        notes,
        performedBy: currentAuthUser?.id,
        performedByName: currentAuthProfile?.full_name || currentAuthUser?.email || "Administrator",
        performedByRole: currentAuthProfile?.role === "super_admin_user" ? "Super Admin" : "Admin Staff",
        applicationId: unterminatingAccount.rawId || unterminatingAccount.id,
      })

      // Update state locally
      setApplications((prev) =>
        prev.map((app) =>
          app.id === unterminatingAccount.rawId || app.reference === unterminatingAccount.id
            ? { ...app, status: "Approved" }
            : app
        )
      )
      setStaffUsers((prev) =>
        prev.map((stf) =>
          stf.userId === unterminatingAccount.userId
            ? { ...stf, isTerminated: false, isActive: true }
            : stf
        )
      )

      showToast(`User "${unterminatingAccount.name}" has been reinstated and access is restored.`)
      setUnterminatingAccount(null)
      await loadData()
    } catch (err) {
      console.error("Unterminate error:", err)
      showToast(`Failed to reinstate account: ${err.message}`, "error")
    } finally {
      setIsProcessingAction(false)
    }
  }

  /* ── Scoped History ── */
  const scopedHistory = useMemo(() => {
    if (hasFullAccess) return history
    return history.filter((h) => {
      if (h.category && isCategoryAllowed(h.category)) return true
      return !allowedCategories || allowedCategories.length === 0
    })
  }, [history, hasFullAccess, isCategoryAllowed, allowedCategories])

  /* ── Filtered History with search and action ── */
  const filteredHistory = useMemo(() => {
    return scopedHistory.filter((h) => {
      const matchSearch =
        !q ||
        h.name?.toLowerCase().includes(q) ||
        h.memberId?.toLowerCase().includes(q) ||
        h.email?.toLowerCase().includes(q) ||
        h.action?.toLowerCase().includes(q) ||
        h.reason?.toLowerCase().includes(q) ||
        h.performedByName?.toLowerCase().includes(q)
      const matchAction = !historyActionFilter || h.action === historyActionFilter
      return matchSearch && matchAction
    })
  }, [scopedHistory, q, historyActionFilter])

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
              Manage account terminations and reinstatements across all users and applicants with audit tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
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
                <p className="text-xs text-muted-foreground font-medium">All User Accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : totalAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Applicants &amp; staff profiles</p>
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
                <p className="text-xs text-muted-foreground font-medium">Active Accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : activeAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Eligible for portal access</p>
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
                <p className="text-xs text-muted-foreground font-medium">Terminated Accounts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : terminatedAccounts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Access blocked · Can reinstate</p>
              </div>
              <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <UserMinus className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabbed records card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">

          {/* ── Tab bar header ── */}
          <div className="flex items-center justify-between px-4 pt-2.5 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("status")
                  setCurrentPage(1)
                }}
                className={`relative pb-2.5 px-2 mr-3 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "status"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Account status
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
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
                className={`relative pb-2.5 px-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "history"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Termination history
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
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
          </div>

          {/* ── Toolbar / Search & Filter row ── */}
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
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
                    ? "Search name, ID, email, sector…"
                    : "Search termination logs…"
                }
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
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

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeTab === "status" && (
                <>
                  <select
                    value={accountTypeFilter}
                    onChange={(e) => {
                      setAccountTypeFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Account Types</option>
                    <option value="Applicant">Applicants</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin Staff">Admin Staff</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Sectors</option>
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

                  {(accountTypeFilter || categoryFilter || statusFilter || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTypeFilter("")
                        setCategoryFilter("")
                        setStatusFilter("")
                        setSearch("")
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </>
              )}

              {activeTab === "history" && (
                <>
                  <select
                    value={historyActionFilter}
                    onChange={(e) => {
                      setHistoryActionFilter(e.target.value)
                      setHistoryPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Actions</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Unterminated">Unterminated (Reinstated)</option>
                  </select>

                  {(historyActionFilter || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryActionFilter("")
                        setSearch("")
                        setHistoryPage(1)
                      }}
                      className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Tab 1: Application & User Status Table ── */}
          {activeTab === "status" && (
            <>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">User Account</th>
                        <th className="py-3 px-4 font-semibold">Type</th>
                        <th className="py-3 px-4 font-semibold">Sector / Position</th>
                        <th className="py-3 px-4 font-semibold">Login Access</th>
                        <th className="py-3 px-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              Loading user and applicant account records…
                            </div>
                          </td>
                        </tr>
                      ) : displayed.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            No accounts match the current filters.
                          </td>
                        </tr>
                      ) : (
                        displayed.map((a) => {
                          const isTerminated = a.status === "Terminated"
                          return (
                            <tr
                              key={`${a.accountType}-${a.id}`}
                              className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                            >
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
                              <td className="py-3.5 px-4">
                                <AccountTypeBadge type={a.accountType} />
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground">
                                <HighlightText text={a.category} highlight={search} />
                              </td>
                              <td className="py-3.5 px-4">
                                <StatusBadge status={a.status} />
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {canEdit || canApprove ? (
                                  !isTerminated ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-[5px] text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer gap-1"
                                      onClick={() => setTerminatingAccount(a)}
                                    >
                                      <UserMinus className="size-3" />
                                      Terminate
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-[5px] text-xs h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1"
                                      onClick={() => setUnterminatingAccount(a)}
                                    >
                                      <RotateCcw className="size-3" />
                                      Unterminate
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
                onPageSizeChange={(n) => {
                  setRowsPerPage(n)
                  setCurrentPage(1)
                }}
                itemLabel="accounts"
              />
            </>
          )}

          {/* ── Tab 2: Status History (Tracking Table) ── */}
          {activeTab === "history" && (
            <>
              <CardContent className="p-0">
                {displayedHistory.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-center">
                    <div className="size-9 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Clock className="size-4.5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {search ? "No matching termination records" : "No termination history logged yet"}
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      {search
                        ? `No events match "${search}". Try checking your query or clearing the filter.`
                        : "Account termination and untermination events are recorded in the database and tracked here."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">User / Beneficiary</th>
                          <th className="py-3 px-4 font-semibold">Action</th>
                          <th className="py-3 px-4 font-semibold">Reason &amp; Notes</th>
                          <th className="py-3 px-4 font-semibold">Performed By</th>
                          <th className="py-3 px-4 font-semibold">Timestamp</th>
                          <th className="py-3 px-4 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                        {displayedHistory.map((h) => {
                          const isTerm = h.action === "Terminated"
                          const matchedAccount = allAccounts.find(
                            (a) =>
                              (h.userId && a.userId === h.userId) ||
                              (h.memberId && (a.id === h.memberId || a.rawId === h.memberId)) ||
                              (h.applicationId && (a.id === h.applicationId || a.rawId === h.applicationId)) ||
                              (h.email && a.email && a.email.toLowerCase() === h.email.toLowerCase())
                          )
                          const isCurrentlyTerminated = matchedAccount
                            ? matchedAccount.status === "Terminated"
                            : isTerm

                          return (
                            <tr key={h.id || `${h.userId}-${h.timestamp}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-foreground">
                                  <HighlightText text={h.name} highlight={search} />
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  <HighlightText text={h.email || h.memberId} highlight={search} />
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                                    isTerm
                                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  }`}
                                >
                                  {isTerm ? (
                                    <UserMinus className="size-3 mr-1" />
                                  ) : (
                                    <RotateCcw className="size-3 mr-1" />
                                  )}
                                  <HighlightText text={h.action} highlight={search} />
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <p className="text-foreground font-medium">
                                  <HighlightText text={h.reason} highlight={search} />
                                </p>
                                {h.notes && (
                                  <p className="text-[10.5px] text-muted-foreground truncate mt-0.5" title={h.notes}>
                                    Note: <HighlightText text={h.notes} highlight={search} />
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">
                                <p className="font-medium text-foreground text-[11px]">
                                  {h.performedByName || "Administrator"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {h.performedByRole || "Super Admin"}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                                {h.timestamp}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {canEdit || canApprove ? (
                                  isCurrentlyTerminated ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-[5px] text-xs h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1"
                                      onClick={() => {
                                        setUnterminatingAccount(
                                          matchedAccount || {
                                            userId: h.userId,
                                            email: h.email,
                                            name: h.name,
                                            category: h.category,
                                            accountType: h.role || "Applicant",
                                            id: h.memberId || h.userId,
                                            rawId: h.applicationId,
                                            status: "Terminated",
                                          }
                                        )
                                      }}
                                    >
                                      <RotateCcw className="size-3" />
                                      Unterminate
                                    </Button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="size-2.5" />
                                      Reinstated
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              {filteredHistory.length > 0 && (
                <DataTablePagination
                  currentPage={historyPage}
                  totalPages={totalHistoryPages}
                  totalItems={filteredHistory.length}
                  pageSize={historyRowsPerPage}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={(n) => {
                    setHistoryRowsPerPage(n)
                    setHistoryPage(1)
                  }}
                  itemLabel="events"
                />
              )}
            </>
          )}
        </Card>

      </div>

      {/* ── Modals ── */}
      <TerminateModal
        isOpen={Boolean(terminatingAccount)}
        onClose={() => setTerminatingAccount(null)}
        target={terminatingAccount}
        onConfirm={handleConfirmTerminate}
        isProcessing={isProcessingAction}
      />

      <UnterminateModal
        isOpen={Boolean(unterminatingAccount)}
        onClose={() => setUnterminatingAccount(null)}
        target={unterminatingAccount}
        onConfirm={handleConfirmUnterminate}
        isProcessing={isProcessingAction}
      />
    </SuperAdminUserLayout>
  )
}

export default SuperAdminTerminationPage
