import React, { useState, useEffect, useMemo } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Users,
  UserCheck,
  Archive,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  ChevronDown,
  User,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Link2,
  CheckCircle2,
  X,
  Trash2,
  Loader2,
} from "lucide-react"
import { MemberDetailModal } from "@/components/features/members"
import { DataTablePagination, HighlightText, UserAvatar } from "@/components/common"
import { getMembers, deleteMember } from "@/services/memberService"
import { useRouter } from "@/routes/RouterContext"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import { Button } from "@/components/ui/button"
export function SuperAdminMembersPage() {
  const { location, navigate } = useRouter()
  const {
    canView,
    canEdit,
    canDelete,
    filterByAllowedCategory,
    hasFullAccess,
    allowedCategories,
    position,
  } = useStaffPermissions()

  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [recordFilter, setRecordFilter] = useState("current")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch real members on mount & refresh
  const lastFetchRef = React.useRef(0)

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const data = await getMembers()
      setMembers(Array.isArray(data) ? data : [])
      lastFetchRef.current = Date.now()
    } catch (err) {
      console.error("Failed to load members:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()

    // Re-fetch on window focus only if data is stale (> 60 s old).
    // Do NOT listen to "storage" — avatar writes fire storage events and would
    // cause a full Supabase re-fetch on every avatar resolution.
    const handleFocus = () => {
      if (Date.now() - lastFetchRef.current > 60_000) loadMembers()
    }
    window.addEventListener("focus", handleFocus)

    // Listen to real-time user terminations to update Member status instantly
    const handleTerminationSync = (e) => {
      const detail = e.detail
      if (detail?.email || detail?.userId) {
        setMembers((prev) =>
          prev.map((mem) => {
            const matches =
              (detail.email && mem.email?.toLowerCase() === detail.email.toLowerCase()) ||
              (detail.userId && (mem.userId === detail.userId || mem.id === detail.userId)) ||
              (detail.applicationId && (mem.applicationId === detail.applicationId || mem.id === detail.applicationId))
            if (matches) {
              const newStatus = detail.action === "Terminated" ? "Terminated" : "Active"
              return {
                ...mem,
                status: newStatus,
                isTerminated: detail.action === "Terminated",
                isArchived: detail.action === "Terminated",
              }
            }
            return mem
          })
        )
      }
      loadMembers()
    }
    window.addEventListener("mswdo_user_terminations_changed", handleTerminationSync)
    window.addEventListener("application_status_updated", handleTerminationSync)
    window.addEventListener("mswdo_members_changed", handleTerminationSync)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("mswdo_user_terminations_changed", handleTerminationSync)
      window.removeEventListener("application_status_updated", handleTerminationSync)
      window.removeEventListener("mswdo_members_changed", handleTerminationSync)
    }
  }, [])

  // Sync with URL query parameter from global search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearchQuery(searchParam)
      setCurrentPage(1)
    }
  }, [location.search])

  const handleOpenModal = (member) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMember(null)
  }

  const handleMemberUpdated = (updatedMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id || m.memberId === updatedMember.memberId ? updatedMember : m))
    )
    setSelectedMember(updatedMember)
    showToast(`Member profile for "${updatedMember.name}" has been updated.`)
  }

  const handleMemberArchived = (archivedMemberId) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === archivedMemberId || m.memberId === archivedMemberId
          ? { ...m, status: "Archived", isArchived: true }
          : m
      )
    )
    setIsModalOpen(false)
    setSelectedMember(null)
    showToast("Member successfully archived to archives vault.")
  }

  const handlePromptDelete = (member) => {
    setMemberToDelete(member)
  }

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return
    setIsDeleting(true)
    try {
      await deleteMember(memberToDelete)
      setMembers((prev) =>
        prev.filter((m) => m.id !== memberToDelete.id && m.memberId !== memberToDelete.memberId)
      )
      if (
        selectedMember &&
        (selectedMember.id === memberToDelete.id || selectedMember.memberId === memberToDelete.memberId)
      ) {
        setIsModalOpen(false)
        setSelectedMember(null)
      }
      showToast(`Member record for "${memberToDelete.name}" has been permanently deleted.`)
      setMemberToDelete(null)
    } catch (err) {
      console.error("Delete member error:", err)
      showToast("Failed to delete member. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const showToast = (msg) => {
    setFeedbackMessage(msg)
    setTimeout(() => setFeedbackMessage(null), 3500)
  }

  // Scope members by staff's allowed category access
  const scopedMembers = useMemo(() => {
    return filterByAllowedCategory(members, (m) => m.category)
  }, [members, filterByAllowedCategory])

  // Filter records based on controls
  const filteredMembers = useMemo(() => {
    return scopedMembers.filter((member) => {
      // 1. Record Filter (current vs all vs archived)
      if (recordFilter === "current") {
        if (
          member.isArchived ||
          member.status?.toLowerCase() === "archived" ||
          member.status?.toLowerCase() === "terminated" ||
          member.isTerminated ||
          member.status?.toLowerCase() === "needs correction" ||
          member.status?.toLowerCase() === "rejected"
        )
          return false
      } else if (recordFilter === "archived") {
        const isArchivedOrTerm =
          member.isArchived ||
          member.status?.toLowerCase() === "archived" ||
          member.status?.toLowerCase() === "terminated" ||
          member.isTerminated
        if (!isArchivedOrTerm) return false
      }

      // 2. Search Query
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        member.name?.toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q) ||
        member.memberId?.toLowerCase().includes(q) ||
        member.contact?.toLowerCase().includes(q) ||
        member.address?.toLowerCase().includes(q) ||
        member.uid?.toLowerCase().includes(q)

      // 3. Category Filter
      const matchesCategory =
        categoryFilter === "all" ||
        member.category?.toLowerCase().includes(categoryFilter.toLowerCase())

      // 4. Status Filter
      const matchesStatus =
        statusFilter === "all" ||
        member.status?.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter.toLowerCase() === "terminated" && member.isTerminated)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [scopedMembers, recordFilter, searchQuery, categoryFilter, statusFilter])

  // Metric stat card counts
  const currentMembersCount = scopedMembers.filter(
    (m) =>
      !m.isArchived &&
      m.status !== "Archived" &&
      m.status !== "Needs correction" &&
      m.status !== "Rejected"
  ).length
  const activeMembersCount = scopedMembers.filter((m) => !m.isArchived && m.status === "Active").length
  const inactiveOrArchivedCount = scopedMembers.filter((m) => m.isArchived || m.status === "Inactive" || m.status === "Archived").length
  const needsAttentionCount = scopedMembers.filter((m) => m.missingFiles || m.hasDuplicates).length

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage) || 1
  const displayedMembers = filteredMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  if (!canView) {
    return (
      <SuperAdminUserLayout activeTab="members">
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-2xs">
          <div className="size-12 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-900/50">
            <Users className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            You do not have view permissions for the Members Registry. Please contact your Super Administrator.
          </p>
        </div>
      </SuperAdminUserLayout>
    )
  }

  return (
    <SuperAdminUserLayout activeTab="members">
      <div className="space-y-4">
        {/* Toast Feedback Notice */}
        {feedbackMessage && (
          <div className="p-3 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-emerald-200 text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top 4 Dynamic Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. CURRENT MEMBERS */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                CURRENT MEMBERS
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : currentMembersCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Enrolled welfare beneficiaries
              </p>
            </div>
            <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="size-5" />
            </div>
          </div>

          {/* 2. ACTIVE */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                ACTIVE
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : activeMembersCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eligible active beneficiaries
              </p>
            </div>
            <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="size-5" />
            </div>
          </div>

          {/* 3. INACTIVE / ARCHIVED */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                INACTIVE / ARCHIVED
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : inactiveOrArchivedCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Archived &amp; inactive records
              </p>
            </div>
            <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
              <Archive className="size-5" />
            </div>
          </div>

          {/* 4. NEEDS ATTENTION */}
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                NEEDS ATTENTION
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : needsAttentionCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Missing files or linked duplicates
              </p>
            </div>
            <div className="size-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="size-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 sm:p-3 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search member name, ID, email, contact, or address…"
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

            {/* Dropdown 1: All categories */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-auto appearance-none pl-3 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">
                  {!hasFullAccess && allowedCategories.length === 1 ? `Category: ${allowedCategories[0]}` : "All allowed categories"}
                </option>
                {(hasFullAccess
                  ? [
                    { value: "general", label: "General" },
                    { value: "pwd", label: "Person with Disability (PWD)" },
                    { value: "women", label: "Women's Welfare" },
                    { value: "youth", label: "Youth" },
                    { value: "senior", label: "Senior Citizens" },
                  ]
                  : allowedCategories.map((c) => ({ value: c.toLowerCase(), label: c }))
                ).map((opt, idx) => (
                  <option key={`cat-opt-${opt.value}-${idx}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Dropdown 2: All statuses */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-auto appearance-none pl-3 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Dropdown 3: Current records */}
            <div className="relative">
              <select
                value={recordFilter}
                onChange={(e) => {
                  setRecordFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-auto appearance-none pl-3 pr-8 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="current">Current records</option>
                <option value="all">All records</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadMembers}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Refresh Members"
            >
              <RotateCw className={`size-3 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Member Registry Table Card */}
        <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          {/* Card Table Header */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
                <span>Member registry</span>
                {recordFilter === "archived" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    Archived Records
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {filteredMembers.length} records match the current view
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 rounded-[5px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-foreground outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-muted-foreground border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-[10px]">
                    MEMBER
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    MEMBER ID
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    CATEGORY
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    CONTACT
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    STATUS
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    UPDATED
                  </th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                    ACTION
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="size-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        <span className="text-xs">Loading beneficiaries...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Users className="size-8 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-xs font-semibold text-foreground">No member records found</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          {recordFilter === "archived"
                            ? "There are no archived beneficiary records in the archives vault."
                            : "Approved applications automatically appear here as registered members."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedMembers.map((member, idx) => (
                    <tr
                      key={`mem-row-${member.id || member.memberId || "row"}-${idx}`}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Member Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={member}
                            avatarUrl={member.avatarUrl}
                            initials={member.initials}
                            name={member.name}
                            email={member.email}
                            size="size-8"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                              <span><HighlightText text={member.name} highlight={searchQuery} /></span>
                              {member.applicationId && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900" title="Approved applicant enrolled">
                                  Approved
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              <HighlightText text={member.email} highlight={searchQuery} />
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Member ID */}
                      <td className="py-3 px-3 font-mono text-[11px] text-foreground font-semibold">
                        <HighlightText text={member.memberId} highlight={searchQuery} />
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-foreground font-medium">
                        <HighlightText text={member.category} highlight={searchQuery} />
                      </td>

                      {/* Contact & Warning badge if missing files / duplicate */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-xs text-foreground font-mono">
                            <HighlightText text={member.contact} highlight={searchQuery} />
                          </p>
                          {member.hasDuplicates && (
                            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Link2 className="size-2.5" />
                              Linked duplicate
                            </span>
                          )}
                          {member.missingFiles && !member.hasDuplicates && (
                            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              <AlertTriangle className="size-2.5" />
                              {member.missingFilesCount} required files missing
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            member.status === "Terminated" || member.isTerminated
                              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                              : member.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : member.status === "Archived" || member.isArchived
                                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          <HighlightText text={member.status === "Terminated" || member.isTerminated ? "Terminated" : member.status} highlight={searchQuery} />
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-3 text-muted-foreground text-[11px] font-mono">
                        {member.updated}
                      </td>

                      {/* Action: View & Manage */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(member)}
                            className="h-7 px-2.5 rounded-[5px] text-xs font-semibold gap-1 cursor-pointer bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          >
                            <User className="size-3" />
                            <span>View</span>
                          </Button>
                          {(member.status === "Terminated" || member.isTerminated) && (canEdit || canDelete) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigate(`/dashboard/termination?tab=status&search=${encodeURIComponent(member.name || member.email || member.memberId || "")}`)
                              }}
                              className="h-7 px-2 rounded-[5px] text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1"
                              title="Go to Termination to reinstate"
                            >
                              <RotateCw className="size-3" />
                              <span className="hidden sm:inline">Unterminate</span>
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePromptDelete(member)}
                              className="h-7 w-7 p-0 rounded-[5px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              aria-label={`Delete member ${member.name}`}
                              title="Delete member permanently"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
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
            totalItems={filteredMembers.length}
            pageSize={rowsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setRowsPerPage(newSize)
              setCurrentPage(1)
            }}
            itemLabel="records"
          />
        </div>
      </div>

      {/* Member Full Details Modal with View, Edit, Print, Link Duplicate, and Archive */}
      <MemberDetailModal
        member={selectedMember}
        allMembers={scopedMembers}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMemberUpdated={handleMemberUpdated}
        onMemberArchived={handleMemberArchived}
        onRefresh={loadMembers}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={handlePromptDelete}
      />

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
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
                    Delete Member
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Permanent record removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setMemberToDelete(null)}
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
                    Are you sure you want to permanently delete the beneficiary member record for{" "}
                    <strong className="font-semibold text-foreground underline decoration-red-400">
                      {memberToDelete.name}
                    </strong>
                    ? This member will be permanently erased from the registry.
                  </p>
                </div>
              </div>

              {/* Member details summary card */}
              <div className="p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Member Name:</span>
                  <span className="font-semibold text-foreground">{memberToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Member ID:</span>
                  <span className="font-mono text-[11px] text-foreground font-semibold">{memberToDelete.memberId || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Sector / Category:</span>
                  <span className="font-medium text-foreground">{memberToDelete.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Current Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-foreground">
                    {memberToDelete.status}
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
                onClick={() => setMemberToDelete(null)}
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
                    <span>Delete Member Permanently</span>
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

export default SuperAdminMembersPage
