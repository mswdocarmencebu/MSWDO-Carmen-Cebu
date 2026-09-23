import React, { useState, useEffect } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import { useRouter } from "@/routes/RouterContext"
import {
  ClipboardList,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus,
  Eye,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApplicationDetailModal } from "@/components/features/applications"
import { DataTablePagination, HighlightText } from "@/components/common"
import {
  getApplications,
  updateApplicationStatus,
  deleteApplication,
} from "@/services/applicationService"

export function SuperAdminApplicationsPage() {
  const { navigate, location } = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState(null)
  const [isDeleting, setIsDeleting]                   = useState(false)
  const [toastMessage, setToastMessage]               = useState(null)

  // Applications Data loaded dynamically
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadApplications = () => {
    getApplications()
      .then((apps) => {
        if (Array.isArray(apps)) {
          setApplications(apps)
        }
      })
      .catch((err) => {
        console.warn("Could not load applications:", err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setIsLoading(true)
    loadApplications()

    const handleRefresh = () => loadApplications()
    window.addEventListener("focus", handleRefresh)
    window.addEventListener("storage", handleRefresh)
    return () => {
      window.removeEventListener("focus", handleRefresh)
      window.removeEventListener("storage", handleRefresh)
    }
  }, [])

  // Sync with URL query parameter (e.g., from global search)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearchQuery(searchParam)
      setCurrentPage(1)
    }
  }, [location.search])

  const handleOpenModal = (app) => {
    setSelectedApplication(app)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedApplication(null)
  }

  const handleUpdateStatus = (appId, newStatus) => {
    // 1. Update state immediately
    setApplications((prev) =>
      prev.map((app) => (app.id === appId || app.reference === appId ? { ...app, status: newStatus } : app))
    )
    if (selectedApplication && (selectedApplication.id === appId || selectedApplication.reference === appId)) {
      setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    // 2. Persist in database & local registry
    updateApplicationStatus(appId, newStatus)
  }

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handlePromptDelete = (app) => {
    setApplicationToDelete(app)
  }

  const handleConfirmDelete = async () => {
    if (!applicationToDelete) return
    setIsDeleting(true)
    try {
      const targetId = applicationToDelete.id || applicationToDelete.reference
      await deleteApplication(targetId)

      setApplications((prev) =>
        prev.filter((a) => a.id !== applicationToDelete.id && a.reference !== applicationToDelete.reference)
      )

      if (
        selectedApplication &&
        (selectedApplication.id === applicationToDelete.id ||
          selectedApplication.reference === applicationToDelete.reference)
      ) {
        handleCloseModal()
      }

      showToast(`Application record for "${applicationToDelete.name}" has been permanently deleted.`, "success")
      setApplicationToDelete(null)
    } catch (err) {
      console.error("Deletion error:", err)
      showToast("Failed to delete application. Please try again.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.reference?.toLowerCase().includes(q) ||
      app.reference_number?.toLowerCase().includes(q) ||
      app.sector?.toLowerCase().includes(q) ||
      app.contact?.toLowerCase().includes(q) ||
      app.address?.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === "all" ||
      app.status?.toLowerCase() === statusFilter.toLowerCase()

    const matchesSector =
      sectorFilter === "all" ||
      app.sector?.toLowerCase().includes(sectorFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesSector
  })

  // Pagination (10 per page)
  const pageSize = 10
  const totalPages = Math.ceil(filteredApps.length / pageSize) || 1
  const displayedApps = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalCount = applications.length
  const pendingCount = applications.filter((a) => a.status === "Pending").length
  const resubmittedCount = applications.filter((a) => a.status === "Resubmitted").length
  const needsCorrectionCount = applications.filter((a) => a.status === "Needs correction").length
  const approvedCount = applications.filter((a) => a.status === "Approved").length
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length

  return (
    <SuperAdminUserLayout activeTab="applications">
      <div className="space-y-4">
        {/* Toast Notification Banner */}
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
                <XCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
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

        {/* Header: Title + Add Applicant */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
                Application Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review and process applicant registrations
              </p>
            </div>
          </div>

          <Button
            variant="brand"
            size="sm"
            onClick={() => navigate("/apply")}
            className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="size-3.5" />
            <span>Add Applicant</span>
          </Button>
        </div>

        {/* 6 Stat Metric Cards: 3 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. ALL APPLICATIONS */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                ALL APPLICATIONS
              </p>
              <div className="size-7 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ClipboardList className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : totalCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Within your assigned sectors
              </p>
            </div>
          </div>

          {/* 2. PENDING */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                PENDING
              </p>
              <div className="size-7 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : pendingCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                New applications
              </p>
            </div>
          </div>

          {/* 3. RESUBMITTED */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                RESUBMITTED
              </p>
              <div className="size-7 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <RotateCcw className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : resubmittedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ready for another review
              </p>
            </div>
          </div>

          {/* 4. NEEDS CORRECTION */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                NEEDS CORRECTION
              </p>
              <div className="size-7 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : needsCorrectionCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Waiting for applicant action
              </p>
            </div>
          </div>

          {/* 5. APPROVED */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                APPROVED
              </p>
              <div className="size-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : approvedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Accounts successfully created
              </p>
            </div>
          </div>

          {/* 6. REJECTED */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                REJECTED
              </p>
              <div className="size-7 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/60 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <XCircle className="size-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                {isLoading ? "..." : rejectedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Applications not approved
              </p>
            </div>
          </div>
        </div>

        {/* Find Applications Filter Box */}
        <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div>
            <h2 className="text-sm font-bold text-foreground font-heading">
              Find applications
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Search applicant records or narrow the list by status and sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Search applications
              </label>
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search name, email, contact, or reference"
                  className="w-full pl-9 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setCurrentPage(1)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-[3px] cursor-pointer"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Resubmitted">Resubmitted</option>
                  <option value="Needs correction">Needs correction</option>
                  <option value="Terminated">Terminated</option>
                </select>
                <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Sector Select */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Applicant sector
              </label>
              <div className="relative">
                <select
                  value={sectorFilter}
                  onChange={(e) => {
                    setSectorFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All sectors</option>
                  <option value="Youth">Youth</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                  <option value="Women">Women</option>
                </select>
                <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Queue Table Card */}
        <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          {/* Card Table Header */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground font-heading">
                Applicant queue
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Open an application to verify documents and record a decision.
              </p>
            </div>

            <span className="text-xs font-semibold text-muted-foreground">
              {filteredApps.length} records
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-muted-foreground border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    APPLICANT
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    SECTOR
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    SUBMITTED
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="size-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        <span>Loading applications from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ClipboardList className="size-8 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-xs font-semibold text-foreground">No applications found</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          {searchQuery || statusFilter !== "all" || sectorFilter !== "all"
                            ? "No applications found matching your criteria."
                            : "There are currently no pre-applications submitted in the portal."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedApps.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Applicant Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {app.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                              <span><HighlightText text={app.name} highlight={searchQuery} /></span>
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                              <span><HighlightText text={app.email} highlight={searchQuery} /></span>
                              {app.reference && (
                                <span className="font-mono text-[10px] text-muted-foreground/80">
                                  • <HighlightText text={app.reference} highlight={searchQuery} />
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-3 text-foreground font-medium">
                        <HighlightText text={app.sector} highlight={searchQuery} />
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-3 text-muted-foreground text-[11px] font-mono">
                        {app.submitted}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            app.status === "Approved"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : app.status === "Rejected" || app.status === "Terminated"
                              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          <HighlightText text={app.status} highlight={searchQuery} />
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(app)}
                            className="p-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-muted-foreground hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
                            aria-label={`View application for ${app.name}`}
                            title="View application details"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDelete(app)}
                            className="p-1.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-muted-foreground hover:text-red-600 hover:border-red-300 dark:hover:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            aria-label={`Delete application for ${app.name}`}
                            title="Delete application"
                          >
                            <Trash2 className="size-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Global Data Table Pagination */}
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApps.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="applications"
          />
        </div>
      </div>

      {/* Application Details Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handlePromptDelete}
      />

      {/* Delete Confirmation Modal */}
      {applicationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[5px] border border-red-200 dark:border-red-900/60 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-[5px] bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Delete Application
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Permanent record removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setApplicationToDelete(null)}
                disabled={isDeleting}
                className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Critical warning notice */}
              <div className="p-3 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/80 flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-800 dark:text-red-300">
                    This will not be recovered once deleted!
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed">
                    Are you sure you want to permanently delete the pre-application record for{" "}
                    <strong className="font-semibold text-foreground underline decoration-red-400">
                      {applicationToDelete.name}
                    </strong>
                    ? All submitted documentary files, status history, and any linked member entries will be permanently erased.
                  </p>
                </div>
              </div>

              {/* Applicant details summary card */}
              <div className="p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Applicant Name:</span>
                  <span className="font-semibold text-foreground">{applicationToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Reference No:</span>
                  <span className="font-mono text-[11px] text-foreground font-semibold">{applicationToDelete.reference || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Sector / Category:</span>
                  <span className="font-medium text-foreground">{applicationToDelete.sector}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Current Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-foreground">
                    {applicationToDelete.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setApplicationToDelete(null)}
                disabled={isDeleting}
                className="h-8 rounded-[5px] text-xs cursor-pointer border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="h-8 rounded-[5px] text-xs font-semibold cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-2xs gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete Application Permanently</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminUserLayout>
  )
}

export default SuperAdminApplicationsPage
