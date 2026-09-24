import React, { useState, useMemo } from "react"
import {
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Building,
  Check,
  Info,
  Search,
  Eye,
  X,
  Tag,
  ShieldCheck,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"

export function ApplicantTrackingTab({
  intakeApp,
  claims = [],
  sectorLabel = "",
  clientId = "",
  applicantName = "",
}) {
  // Consolidate trackable cases
  const trackableCases = useMemo(() => {
    const list = []

    if (intakeApp) {
      const isApproved = (intakeApp.status || "").toLowerCase() === "approved"
      list.push({
        id: intakeApp.id || "intake-case",
        type: "Intake Enrollment",
        category: sectorLabel || "Welfare Beneficiary",
        reference: intakeApp.reference_number || "REF-INTAKE-01",
        title: `${sectorLabel} Intake & Beneficiary Registration`,
        status: intakeApp.status || "Approved",
        date: intakeApp.submitted_at
          ? new Date(intakeApp.submitted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recently Filed",
        appointmentDate: intakeApp.appointment_date,
        caseworkerNotes:
          intakeApp.review_notes ||
          "Intake application verified complete. Beneficiary credential registered in MSWDO Carmen master list.",
        officer: "Social Welfare Officer II - MSWDO Carmen",
        isIntake: true,
        amount: "Official Sector Credential & Benefits",
      })
    }

    ;(claims || []).forEach((claim) => {
      list.push({
        id: claim.id || claim.claimNumber,
        type: "Benefit Claim",
        category: sectorLabel || "Welfare Beneficiary",
        reference: claim.claimNumber || claim.id,
        title: claim.benefit || claim.benefit_name || "Municipal Subsidy",
        status: claim.status || "Pending",
        date:
          claim.date ||
          (claim.created_at
            ? new Date(claim.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent"),
        amount: claim.amount || "₱1,000.00",
        releaseMethod: claim.releaseMethod || claim.release_method || "Cash Disbursement",
        referenceNo: claim.referenceNo || claim.reference_no || `VOUCHER-${claim.id?.slice?.(-4) || "001"}`,
        caseworkerNotes:
          claim.remarks || "Assistance evaluation in progress by Carmen MSWDO social worker.",
        officer: "Carmen Municipal Social Welfare Staff",
        isIntake: false,
      })
    })

    return list
  }, [intakeApp, claims, sectorLabel])

  // Table filtering and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Selected case for simple progress detail modal
  const [selectedCase, setSelectedCase] = useState(null)

  // Helper to compute stage details and step list
  const getStageInfo = (status, isIntake, caseItem) => {
    const s = (status || "").toLowerCase()

    if (s === "approved" || s === "processed" || s === "active") {
      return {
        stageIndex: 4,
        stepNumber: 5,
        totalSteps: 5,
        label: isIntake ? "ID & Benefits Active" : "Benefit Released / Ready",
        percent: 100,
        badgeClass:
          "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        steps: isIntake
          ? [
              { title: "Intake Submitted", desc: "Data received", date: caseItem.date || "Filed" },
              { title: "Document Verification", desc: "Checked complete", date: "Verified" },
              { title: "Casework Assessment", desc: "Sector validated", date: "Evaluated" },
              { title: "Municipal Approval", desc: "Voucher authorized", date: "Approved" },
              { title: "ID & Benefits Active", desc: "Ready at Carmen Hall", date: "Completed" },
            ]
          : [
              { title: "Request Filed", desc: "Registered in system", date: caseItem.date || "Filed" },
              { title: "Eligibility Check", desc: "Casework evaluation", date: "Verified" },
              { title: "Fund Allocation", desc: "Voucher issued", date: caseItem.referenceNo || "Allocated" },
              { title: "Approval Sign-off", desc: "Municipal authorization", date: "Approved" },
              { title: "Benefit Released", desc: caseItem.releaseMethod || "Disbursed", date: "Disbursed" },
            ],
      }
    }

    if (s === "needs correction") {
      return {
        stageIndex: 1,
        stepNumber: 2,
        totalSteps: 5,
        label: "Correction Required",
        percent: 30,
        badgeClass:
          "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        steps: isIntake
          ? [
              { title: "Intake Submitted", desc: "Data received", date: caseItem.date || "Filed" },
              { title: "Document Verification", desc: "Documents require re-upload", date: "Needs Action" },
              { title: "Casework Assessment", desc: "Pending revision", date: "Queued" },
              { title: "Municipal Approval", desc: "Pending review", date: "Pending" },
              { title: "ID & Benefits Active", desc: "Awaiting approval", date: "Pending" },
            ]
          : [
              { title: "Request Filed", desc: "Registered in system", date: caseItem.date || "Filed" },
              { title: "Eligibility Check", desc: "Review noted issues", date: "Needs Action" },
              { title: "Fund Allocation", desc: "Voucher pending", date: "Pending" },
              { title: "Approval Sign-off", desc: "Awaiting review", date: "Pending" },
              { title: "Benefit Released", desc: "Pending", date: "Pending" },
            ],
      }
    }

    if (s === "under review" || s === "resubmitted" || s === "evaluating") {
      return {
        stageIndex: 2,
        stepNumber: 3,
        totalSteps: 5,
        label: "Caseworker Assessment",
        percent: 60,
        badgeClass:
          "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        steps: isIntake
          ? [
              { title: "Intake Submitted", desc: "Data received", date: caseItem.date || "Filed" },
              { title: "Document Verification", desc: "Requirements verified", date: "Complete" },
              { title: "Casework Assessment", desc: "Evaluation underway", date: "In Progress" },
              { title: "Municipal Approval", desc: "Next stage", date: "Pending" },
              { title: "ID & Benefits Active", desc: "Pending approval", date: "Pending" },
            ]
          : [
              { title: "Request Filed", desc: "Registered in system", date: caseItem.date || "Filed" },
              { title: "Eligibility Check", desc: "Criteria verified", date: "Complete" },
              { title: "Fund Allocation", desc: "Processing subsidy voucher", date: "In Progress" },
              { title: "Approval Sign-off", desc: "Next stage", date: "Pending" },
              { title: "Benefit Released", desc: "Pending release", date: "Pending" },
            ],
      }
    }

    // Default Pending stage
    return {
      stageIndex: 1,
      stepNumber: 2,
      totalSteps: 5,
      label: "Document Verification",
      percent: 40,
      badgeClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      steps: isIntake
        ? [
            { title: "Intake Submitted", desc: "Data received", date: caseItem.date || "Filed" },
            { title: "Document Verification", desc: "Checking submitted proof", date: "In Progress" },
            { title: "Casework Assessment", desc: "Next stage", date: "Queued" },
            { title: "Municipal Approval", desc: "Pending", date: "Queued" },
            { title: "ID & Benefits Active", desc: "Pending", date: "Queued" },
          ]
        : [
            { title: "Request Filed", desc: "Registered in system", date: caseItem.date || "Filed" },
            { title: "Eligibility Check", desc: "Casework evaluation", date: "In Progress" },
            { title: "Fund Allocation", desc: "Pending evaluation", date: "Queued" },
            { title: "Approval Sign-off", desc: "Pending", date: "Queued" },
            { title: "Benefit Released", desc: "Pending", date: "Queued" },
          ],
    }
  }

  // Filtered cases
  const filteredCases = useMemo(() => {
    return trackableCases.filter((item) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.reference || "").toLowerCase().includes(q) ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.status || "").toLowerCase().includes(q) ||
        (item.date || "").toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (statusFilter === "all") return true
      const s = (item.status || "").toLowerCase()
      if (statusFilter === "approved") {
        return s === "approved" || s === "processed" || s === "active"
      }
      if (statusFilter === "pending") {
        return s !== "approved" && s !== "processed" && s !== "active"
      }
      return true
    })
  }, [trackableCases, searchTerm, statusFilter])

  // Pagination calculation
  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCases.slice(startIndex, startIndex + pageSize)
  }, [filteredCases, currentPage, pageSize])

  return (
    <div className="space-y-4">
      {/* Sleek Header & Overview Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">Process & Payout Tracking</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time lifecycle tracking for your municipal intake enrollment and welfare assistance claims.
          </p>
        </div>

        {/* Quick status count badges */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Tag className="size-3" />
            <span>Total Tracked: {trackableCases.length}</span>
          </div>
        </div>
      </div>

      {/* Tracking Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Controls: Search & Status Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Tracking Records</h3>
              <p className="text-xs text-muted-foreground">Select any case to inspect its live stage progression</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Search input in table */}
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter cases..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-7 pr-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-foreground outline-none focus:border-blue-500 w-36 sm:w-48"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-[5px] p-0.5 text-xs">
                {[
                  { id: "all", label: "All" },
                  { id: "approved", label: "Approved" },
                  { id: "pending", label: "In Progress" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setStatusFilter(st.id)
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-[4px] text-xs capitalize cursor-pointer transition-colors ${
                      statusFilter === st.id
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-y border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Case Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Service / Program</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Date Filed</th>
                  <th className="py-2.5 px-3 font-semibold">Lifecycle Progress</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center px-4">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                        <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground/60">
                          <Clock className="size-5" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">No Tracking Records Found</p>
                        <p className="text-[11px] text-muted-foreground">
                          {searchTerm || statusFilter !== "all"
                            ? "No cases match your filter criteria."
                            : "You do not have any submitted applications or claims to track yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((item) => {
                    const stage = getStageInfo(item.status, item.isIntake, item)

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedCase(item)}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                      >
                        {/* Reference No */}
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.reference}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {item.type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                          {item.date}
                        </td>

                        {/* Progress Bar & Stage Pill */}
                        <td className="py-3 px-3 min-w-44">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-foreground">
                                Step {stage.stepNumber} of {stage.totalSteps}
                              </span>
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {stage.percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all rounded-full"
                                style={{ width: `${stage.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {stage.label}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${stage.badgeClass}`}
                          >
                            <CheckCircle2 className="size-2.5" />
                            {item.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCase(item)}
                            className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-[4px] border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer shadow-2xs"
                          >
                            <Eye className="size-3" />
                            Track Progress
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > pageSize && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz)
                setCurrentPage(1)
              }}
              itemLabel="cases"
            />
          )}
        </CardContent>
      </Card>

      {/* ===================================================================== */}
      {/* SIMPLE PROGRESS TRACKING MODAL                                        */}
      {/* ===================================================================== */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="size-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">
                    Live Progress Tracking
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedCase.reference} • {selectedCase.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {(() => {
                const stage = getStageInfo(selectedCase.status, selectedCase.isIntake, selectedCase)

                return (
                  <>
                    {/* Summary Identity Card */}
                    <div className="p-3.5 rounded-[5px] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-900/60 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                            {selectedCase.reference}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">
                            {selectedCase.title}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border self-start sm:self-auto ${stage.badgeClass}`}
                        >
                          <CheckCircle2 className="size-3" />
                          {selectedCase.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1 border-t border-blue-200/60 dark:border-blue-900/50">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-blue-800 dark:text-blue-200">
                            Milestone Status: {stage.label}
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {stage.percent}% Completed
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${stage.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Simple 5-Step Visual Stepper */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                        Lifecycle Progression Steps
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {stage.steps.map((step, idx) => {
                          const isCompleted = idx <= stage.stageIndex
                          const isCurrent = idx === stage.stageIndex

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-[4px] border transition-all flex flex-col justify-between space-y-1.5 ${
                                isCurrent
                                  ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-2xs ring-1 ring-blue-500/20"
                                  : isCompleted
                                  ? "bg-zinc-50 dark:bg-zinc-800/40 border-blue-200 dark:border-blue-900/60"
                                  : "bg-zinc-50/40 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isCompleted
                                      ? "bg-blue-600 text-white"
                                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                                  }`}
                                >
                                  {isCompleted ? <Check className="size-3" /> : idx + 1}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {step.date}
                                </span>
                              </div>

                              <div>
                                <h5
                                  className={`text-xs font-bold leading-tight ${
                                    isCurrent ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                                  }`}
                                >
                                  {step.title}
                                </h5>
                                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Key Details Cards: Caseworker Remarks & Municipal Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Caseworker Remarks */}
                      <div className="p-3.5 rounded-[4px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <User className="size-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Caseworker Evaluation & Remarks</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed bg-white dark:bg-zinc-900 p-2.5 rounded-[4px] border border-zinc-200/60 dark:border-zinc-800">
                          "{selectedCase.caseworkerNotes}"
                        </p>
                        <div className="text-[11px] text-muted-foreground flex justify-between pt-0.5">
                          <span>Officer:</span>
                          <span className="font-medium text-foreground">{selectedCase.officer}</span>
                        </div>
                      </div>

                      {/* Municipal Hall Instructions */}
                      <div className="p-3.5 rounded-[4px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Release & Pick-up Instructions</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1 text-foreground">
                            <MapPin className="size-3 text-blue-600 shrink-0" />
                            Ground Floor, Carmen Municipal Hall, Poblacion, Carmen
                          </p>
                          <p className="flex items-center gap-1">
                            <Calendar className="size-3 text-blue-600 shrink-0" />
                            Hours: Mon–Fri 8:00 AM – 4:00 PM
                          </p>
                        </div>
                        <div className="pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[10px] text-muted-foreground">
                          Bring 1 Valid Government ID and quote reference <strong className="font-mono text-foreground">{selectedCase.reference}</strong>.
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCase(null)}
                className="h-8 rounded-[4px] text-xs font-medium cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantTrackingTab
