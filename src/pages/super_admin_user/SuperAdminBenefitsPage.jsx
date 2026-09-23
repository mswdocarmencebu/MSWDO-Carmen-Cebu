import React, { useState, useMemo, useEffect } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  HeartHandshake,
  Search,
  Plus,
  Coins,
  FileCheck2,
  ListChecks,
  AlertTriangle,
  X,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import {
  CreateBenefitProgramModal,
  ProcessBenefitClaimModal,
  ClaimDetailModal,
  EditBenefitProgramModal,
} from "@/components/features/benefits"
import {
  getBenefitPrograms,
  saveBenefitProgram,
  updateBenefitProgram,
  deleteBenefitProgram,
  getBenefitClaims,
  saveBenefitClaim,
  updateBenefitClaimStatus,
  deleteBenefitClaim,
  INITIAL_PROGRAMS,
  INITIAL_CLAIMS,
} from "@/services/benefitService"
import { getMembers } from "@/services/memberService"

/* ─────────────────────────────────────────────
   Status badge helper
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Active:    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Pending:   "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Processed: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Cancelled: "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    Rejected:  "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${map[status] ?? map.Cancelled}`}>
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function SuperAdminBenefitsPage() {
  const { location } = useRouter()
  const [programs, setPrograms] = useState([])
  const [claims, setClaims]     = useState([])
  const [members, setMembers]   = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [progs, clms, mems] = await Promise.all([
        getBenefitPrograms(),
        getBenefitClaims(),
        getMembers().catch(() => []),
      ])
      setPrograms(progs)
      setClaims(clms)
      setMembers(mems)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener("storage", handleSync)
    window.addEventListener("focus", handleSync)
    return () => {
      window.removeEventListener("storage", handleSync)
      window.removeEventListener("focus", handleSync)
    }
  }, [])

  // Sync with URL query parameter from global search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearch(searchParam)
      setProgPage(1)
      setClaimPage(1)
    }
  }, [location.search])

  // Modals
  const [isCreateOpen,  setIsCreateOpen]  = useState(false)
  const [isProcessOpen, setIsProcessOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [viewingClaim, setViewingClaim] = useState(null)

  // Delete confirmations: stores the program or claim to delete, or null
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteClaimConfirm, setDeleteClaimConfirm] = useState(null)

  // Search / filter
  const [search, setSearch]           = useState("")
  const [sectorFilter, setSectorFilter] = useState("")

  // Active tab
  const [activeTab, setActiveTab] = useState("programs")

  // Pagination — programs
  const [progPage, setProgPage]     = useState(1)
  const [progSize, setProgSize]     = useState(10)

  // Pagination — claims
  const [claimPage, setClaimPage]   = useState(1)
  const [claimSize, setClaimSize]   = useState(10)


  /* ── Derived stats ── */
  const totalPrograms   = programs.length
  const activePrograms  = programs.filter((p) => p.status === "Active").length
  const processedClaims = claims.filter((c) => c.status === "Processed").length
  const openRequests    = claims.filter((c) => c.status === "Pending").length
  const releasedValue   = claims
    .filter((c) => c.status === "Processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  /* ── Filtered data ── */
  const q = search.toLowerCase()
  const filteredPrograms = useMemo(() =>
    programs.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q)
      const matchSector = !sectorFilter || p.sector === sectorFilter
      return matchSearch && matchSector
    }),
    [programs, q, sectorFilter]
  )

  const filteredClaims = useMemo(() =>
    claims.filter((c) => {
      const matchSearch = !q ||
        c.memberName.toLowerCase().includes(q) ||
        c.memberId.toLowerCase().includes(q) ||
        c.benefit.toLowerCase().includes(q)
      const matchSector = !sectorFilter  // claims don't have sector; skip filter
      return matchSearch
    }),
    [claims, q]
  )

  /* ── Paginated slices ── */
  const totalProgPages  = Math.ceil(filteredPrograms.length / progSize) || 1
  const displayedProgs  = filteredPrograms.slice((progPage - 1) * progSize, progPage * progSize)

  const totalClaimPages = Math.ceil(filteredClaims.length / claimSize) || 1
  const displayedClaims = filteredClaims.slice((claimPage - 1) * claimSize, claimPage * claimSize)

  /* ── Handlers ── */
  const handleSaveProgram = async (newProg) => {
    const updated = await saveBenefitProgram(newProg)
    setPrograms(updated)
  }

  const handleUpdateProgram = async (updatedProg) => {
    const targetId = updatedProg.dbId || updatedProg.id || updatedProg.code
    // Instant optimistic update
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === targetId || p.dbId === targetId || p.code === targetId || p.id === updatedProg.id
          ? { ...p, ...updatedProg }
          : p
      )
    )
    setEditingProgram(null)
    const updated = await updateBenefitProgram(targetId, updatedProg)
    if (Array.isArray(updated) && updated.length > 0) {
      setPrograms(updated)
    }
  }

  const handleToggleProgramStatus = async (prog) => {
    const newStatus = prog.status === "Active" ? "Inactive" : "Active"
    const targetId = prog.dbId || prog.id || prog.code
    // Instant optimistic update
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === targetId || p.dbId === targetId || p.code === targetId || p.id === prog.id
          ? { ...p, status: newStatus }
          : p
      )
    )
    const updated = await updateBenefitProgram(targetId, {
      status: newStatus,
      dbId: prog.dbId,
      code: prog.code,
    })
    if (Array.isArray(updated) && updated.length > 0) {
      setPrograms(updated)
    }
  }

  const handleSaveClaim = async (newClaim) => {
    const updated = await saveBenefitClaim(newClaim)
    setClaims(updated)
  }

  const handleClaimAction = async (id, actionOrStatus) => {
    let newStatus = actionOrStatus
    if (actionOrStatus === "Process") newStatus = "Processed"
    else if (actionOrStatus === "Reject") newStatus = "Rejected"
    else if (actionOrStatus === "Cancel") newStatus = "Cancelled"

    const updated = await updateBenefitClaimStatus(id, newStatus)
    setClaims(updated)
    if (viewingClaim && (viewingClaim.id === id || viewingClaim.claimNumber === id)) {
      setViewingClaim((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  const handleDeleteClaim = async (claim) => {
    const claimId = typeof claim === "object" ? claim.claimNumber || claim.id : claim
    const dbId = typeof claim === "object" ? claim.dbId : null

    // Instant optimistic update: removes item immediately
    setClaims((prev) =>
      prev.filter(
        (c) =>
          c.id !== claimId &&
          c.claimNumber !== claimId &&
          c.dbId !== claimId &&
          (!dbId || c.dbId !== dbId)
      )
    )
    setDeleteClaimConfirm(null)
    if (
      viewingClaim &&
      (viewingClaim.id === claimId ||
        viewingClaim.claimNumber === claimId ||
        viewingClaim.dbId === dbId)
    ) {
      setViewingClaim(null)
    }

    const updated = await deleteBenefitClaim(claimId, dbId)
    if (Array.isArray(updated)) {
      setClaims(updated)
    }
  }

  const handleDeleteProgram = async (prog) => {
    const progId = typeof prog === "object" ? prog.code || prog.id : prog
    const dbId = typeof prog === "object" ? prog.dbId : null

    // Instant optimistic update
    setPrograms((prev) =>
      prev.filter(
        (p) =>
          p.id !== progId &&
          p.code !== progId &&
          p.dbId !== progId &&
          (!dbId || p.dbId !== dbId)
      )
    )
    setDeleteConfirm(null)

    const updated = await deleteBenefitProgram(progId, dbId)
    if (Array.isArray(updated)) {
      setPrograms(updated)
    }
  }

  const allSectors = [...new Set(programs.map((p) => p.sector))].sort()

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <SuperAdminUserLayout activeTab="benefits">
      <div className="space-y-4">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <HeartHandshake className="size-3.5" />
                Welfare Benefits
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Benefit programs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage welfare programs, process claims, and track disbursements for assigned sectors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer"
              onClick={() => setIsProcessOpen(true)}
            >
              <Coins className="size-3.5" />
              Process claim
            </Button>
            <Button
              variant="brand"
              size="sm"
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              Create program
            </Button>
          </div>
        </div>

        {/* ── Stat cards (3 per row) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Benefit programs */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Benefit programs</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{totalPrograms}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Programs in assigned sectors</p>
              </div>
              <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ListChecks className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Active programs */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active programs</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{activePrograms}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Available for processing</p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Claims processed */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Claims processed</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{processedClaims}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Completed disbursements</p>
              </div>
              <div className="size-10 rounded-[5px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Coins className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Open requests */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Open requests</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">{openRequests}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Needs staff attention</p>
              </div>
              <div className="size-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Released value */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs sm:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Released value</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  ₱{releasedValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total processed claim value</p>
              </div>
              <div className="size-10 rounded-[5px] bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Pending requests alert ── */}
        {openRequests > 0 && (
          <div className="flex items-start gap-3 p-3.5 rounded-[5px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
              <span className="font-semibold">{openRequests} {openRequests === 1 ? "request" : "requests"} waiting</span>{" "}
              for staff processing. Review the claims table below.
            </p>
          </div>
        )}

        {/* ── Tabbed records card ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">

          {/* Tab bar + search row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-3 pb-0 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs */}
            <div className="flex items-center gap-0">
              <button
                onClick={() => setActiveTab("programs")}
                className={`relative pb-3 px-1 mr-5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "programs"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Benefit programs
                <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeTab === "programs"
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}>
                  {filteredPrograms.length}
                </span>
                {activeTab === "programs" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("claims")}
                className={`relative pb-3 px-1 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "claims"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recent claims
                <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeTab === "claims"
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    : openRequests > 0
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}>
                  {filteredClaims.length}
                </span>
                {activeTab === "claims" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Search + sector filter */}
            <div className="flex items-center gap-2 pb-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setProgPage(1)
                    setClaimPage(1)
                  }}
                  placeholder="Search…"
                  className="w-44 pl-7 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setProgPage(1); setClaimPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {activeTab === "programs" && (
                <select
                  value={sectorFilter}
                  onChange={(e) => { setSectorFilter(e.target.value); setProgPage(1) }}
                  className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">All sectors</option>
                  {allSectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* ── Programs tab ── */}
          {activeTab === "programs" && (
            <>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Program</th>
                        <th className="py-3 px-4 font-semibold">Sector</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      {displayedProgs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            No programs match the current filters.
                          </td>
                        </tr>
                      ) : displayedProgs.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">
                              <HighlightText text={p.name} highlight={search} />
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              <HighlightText text={p.description} highlight={search} />
                            </p>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <HighlightText text={p.sector} highlight={search} />
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground font-mono">
                            <HighlightText text={p.amount} highlight={search} />
                          </td>
                          <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit program */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                onClick={() => setEditingProgram(p)}
                                title="Edit program"
                              >
                                <Pencil className="size-3.5" />
                              </Button>

                              {/* Toggle active / inactive */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-[5px] text-xs h-7 px-2.5 cursor-pointer font-medium ${
                                  p.status === "Active"
                                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                }`}
                                onClick={() => handleToggleProgramStatus(p)}
                              >
                                {p.status === "Active" ? "Deactivate" : "Activate"}
                              </Button>

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                onClick={() => setDeleteConfirm(p)}
                                title="Delete program"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <DataTablePagination
                currentPage={progPage}
                totalPages={totalProgPages}
                totalItems={filteredPrograms.length}
                pageSize={progSize}
                onPageChange={setProgPage}
                onPageSizeChange={(n) => { setProgSize(n); setProgPage(1) }}
                itemLabel="programs"
              />
            </>
          )}

          {/* ── Claims tab ── */}
          {activeTab === "claims" && (
            <>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Member</th>
                        <th className="py-3 px-4 font-semibold">Benefit</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Date / Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      {displayedClaims.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            No claims match the current filters.
                          </td>
                        </tr>
                      ) : displayedClaims.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">
                              <HighlightText text={c.memberName} highlight={search} />
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              <HighlightText text={c.memberId} highlight={search} />
                            </p>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <HighlightText text={c.benefit} highlight={search} />
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground font-mono">
                            <HighlightText text={c.amount} highlight={search} />
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-muted-foreground mb-1">{c.date}</p>
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status === "Pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-[5px] text-xs h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer font-semibold"
                                    onClick={() => handleClaimAction(c.id, "Process")}
                                  >
                                    Process
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-[5px] text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer font-semibold"
                                    onClick={() => handleClaimAction(c.id, "Reject")}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-[5px] text-xs h-7 px-2.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-semibold"
                                    onClick={() => handleClaimAction(c.id, "Cancel")}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {/* View Voucher Details */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                onClick={() => setViewingClaim(c)}
                                title="View claim voucher details"
                              >
                                <Eye className="size-3.5" />
                              </Button>

                              {/* Delete Claim Record */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                onClick={() => setDeleteClaimConfirm(c)}
                                title="Delete claim record"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <DataTablePagination
                currentPage={claimPage}
                totalPages={totalClaimPages}
                totalItems={filteredClaims.length}
                pageSize={claimSize}
                onPageChange={setClaimPage}
                onPageSizeChange={(n) => { setClaimSize(n); setClaimPage(1) }}
                itemLabel="claims"
              />
            </>
          )}
        </Card>
      </div>

      {/* ── Modals ── */}
      <CreateBenefitProgramModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveProgram}
      />

      <EditBenefitProgramModal
        isOpen={!!editingProgram}
        onClose={() => setEditingProgram(null)}
        onSave={handleUpdateProgram}
        program={editingProgram}
      />

      <ProcessBenefitClaimModal
        isOpen={isProcessOpen}
        onClose={() => setIsProcessOpen(false)}
        onSave={handleSaveClaim}
        programs={programs.filter((p) => p.status === "Active")}
        members={members}
      />

      <ClaimDetailModal
        isOpen={!!viewingClaim}
        onClose={() => setViewingClaim(null)}
        claim={viewingClaim}
        onUpdateStatus={(id, status) => handleClaimAction(id, status)}
        onDelete={(c) => setDeleteClaimConfirm(c)}
      />

      {/* ── Program Delete confirmation dialog ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-5 flex items-start gap-3">
              <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-sm font-bold text-foreground font-heading">
                  Delete program?
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{deleteConfirm.name}</span> will be permanently removed.
                  This action cannot be undone.
                </p>
                <div className="mt-2.5 p-2 rounded-[4px] bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 font-medium">
                  This will not be recovered once deleted!
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-[5px] text-xs h-8 cursor-pointer"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-[5px] text-xs h-8 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => handleDeleteProgram(deleteConfirm)}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Claim Delete confirmation dialog ── */}
      {deleteClaimConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-5 flex items-start gap-3">
              <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-sm font-bold text-foreground font-heading">
                  Delete claim record?
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Claim voucher <span className="font-semibold text-foreground font-mono">{deleteClaimConfirm.claimNumber || deleteClaimConfirm.id}</span> for <span className="font-semibold text-foreground">{deleteClaimConfirm.memberName}</span> will be permanently removed.
                </p>
                <div className="mt-2.5 p-2 rounded-[4px] bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 font-medium">
                  This will not be recovered once deleted!
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-[5px] text-xs h-8 cursor-pointer"
                onClick={() => setDeleteClaimConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-[5px] text-xs h-8 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => handleDeleteClaim(deleteClaimConfirm)}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminUserLayout>
  )
}

export default SuperAdminBenefitsPage
