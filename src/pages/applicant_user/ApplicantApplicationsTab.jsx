import React, { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Copy,
  Check,
  MapPin,
  Mail,
  HeartHandshake,
  FileCheck2,
  Search,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"

export function ApplicantApplicationsTab({
  profile,
  intakeApp,
  claims = [],
  documents = [],
  sectorLabel,
  clientId,
  userEmail,
  onNavigateTab,
  onOpenApplyModal,
  onViewCaseDetails,
}) {
  const [copiedClientId, setCopiedClientId] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState("all")

  const [searchParams, setSearchParams] = useSearchParams()
  const [tableSearch, setTableSearch] = useState(searchParams.get("search") || "")
  const handledRef = useRef(null)

  useEffect(() => {
    const q = searchParams.get("search") || ""
    if (q) {
      setTableSearch(q)
    }
  }, [searchParams])

  const handleCopyClientId = () => {
    if (!clientId) return
    navigator.clipboard.writeText(clientId)
    setCopiedClientId(true)
    setTimeout(() => setCopiedClientId(false), 2000)
  }

  // Calculate document statistics
  const verifiedDocsCount = documents.filter((d) => (d.status || "").toLowerCase() === "verified").length
  const totalDocsCount = documents.length

  const applicantName =
    profile?.full_name ||
    (intakeApp?.first_name ? `${intakeApp.first_name} ${intakeApp.last_name || ""}`.trim() : "Citizen Beneficiary")

  const applicantAddress =
    intakeApp?.complete_address || profile?.roleDetails?.barangay || "Carmen, Cebu"

  const intakeRef = intakeApp?.reference_number || "MSWDO-INTAKE"

  // Consolidate applications & claims
  const allApplications = useMemo(() => [
    ...(intakeApp
      ? [
          {
            id: intakeApp.id || "intake-01",
            caseId: intakeApp.reference_number || "APP-INTAKE-01",
            type: "Intake Enrollment",
            program: `${sectorLabel} Intake & Registration`,
            dateApplied: intakeApp.submitted_at
              ? new Date(intakeApp.submitted_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently Approved",
            amountRequested: "LGU ID & Sector Subsidies",
            officer: "MSWDO Casework Officer",
            status: intakeApp.status || "Approved",
            badgeClass:
              (intakeApp.status || "").toLowerCase() === "approved"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                : (intakeApp.status || "").toLowerCase() === "needs correction"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
            notes: intakeApp.review_notes || "Initial beneficiary enrollment verified and processed.",
            appointmentDate: intakeApp.appointment_date,
            isOriginalIntake: true,
            rawItem: intakeApp,
          },
        ]
      : []),
    ...claims.map((claim) => ({
      id: claim.id || claim.claimNumber,
      caseId: claim.claimNumber || claim.id,
      type: "Welfare Subsidy Claim",
      program: claim.benefit || claim.benefit_name || "Municipal Welfare Subsidy",
      dateApplied: claim.date || (claim.created_at ? new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"),
      amountRequested: claim.amount || "₱1,000.00",
      officer: "Carmen MSWDO Staff",
      status: claim.status || "Pending",
      badgeClass:
        claim.status === "Processed" || claim.status === "Approved"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
          : claim.status === "Cancelled" || claim.status === "Rejected"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
      notes: claim.remarks || "Assistance evaluation in progress.",
      releaseMethod: claim.releaseMethod || claim.release_method,
      referenceNo: claim.referenceNo || claim.reference_no,
      isOriginalIntake: false,
      rawItem: claim,
    })),
  ], [intakeApp, claims, sectorLabel])

  // Automatically open case details if clicked from a notification (only once per ref)
  useEffect(() => {
    const ref = searchParams.get("ref") || searchParams.get("reference")
    if (!ref || typeof onViewCaseDetails !== "function") return

    const cleanRef = ref.trim().toLowerCase()
    if (handledRef.current === cleanRef) return

    if (allApplications.length > 0) {
      const match = allApplications.find(
        (item) =>
          String(item.caseId || "").toLowerCase() === cleanRef ||
          String(item.id || "").toLowerCase() === cleanRef
      )
      if (match) {
        handledRef.current = cleanRef
        onViewCaseDetails(match)
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete("ref")
        nextParams.delete("reference")
        setSearchParams(nextParams, { replace: true })
      } else {
        handledRef.current = cleanRef
        setTableSearch(ref)
      }
    }
  }, [searchParams, allApplications, onViewCaseDetails, setSearchParams])

  const filteredApplications = allApplications.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ||
      (item.status || "").toLowerCase() === statusFilter.toLowerCase()

    if (!matchesStatus) return false

    if (!tableSearch.trim()) return true
    const q = tableSearch.toLowerCase()
    return (
      (item.caseId || "").toLowerCase().includes(q) ||
      (item.program || "").toLowerCase().includes(q) ||
      (item.amountRequested || "").toLowerCase().includes(q) ||
      (item.officer || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredApplications.length / rowsPerPage) || 1
  const displayedApplications = filteredApplications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Quick stats without any redundancy
  const summaryStats = [
    {
      label: "Total Cases",
      value: allApplications.length,
      subtext: `${claims.length} claims • 1 intake`,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
    },
    {
      label: "Verified Documents",
      value: `${verifiedDocsCount} / ${totalDocsCount || 4}`,
      subtext: "Authenticated by MSWDO",
      icon: FileCheck2,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-900",
    },
    {
      label: "Intake Reference",
      value: intakeRef,
      subtext: intakeApp?.status || "Approved",
      icon: ShieldCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
      isMono: true,
    },
    {
      label: "Registry Status",
      value: "Enrolled",
      subtext: "Eligible for LGU benefits",
      icon: CheckCircle2,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Sleek, Unified Beneficiary Header Bar (Replaces huge redundant hero + credentials card) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity & Badges */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {applicantName}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <HeartHandshake className="size-3" />
                {sectorLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono">
                {clientId}
                <button
                  type="button"
                  onClick={handleCopyClientId}
                  title="Copy Client ID"
                  className="hover:text-blue-600 cursor-pointer ml-0.5"
                >
                  {copiedClientId ? <Check className="size-3 text-blue-600" /> : <Copy className="size-3" />}
                </button>
              </span>
            </div>

            {/* Compact details row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                {applicantAddress}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                {userEmail}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="brand"
              onClick={onOpenApplyModal}
              className="rounded-[5px] text-xs font-semibold gap-1.5 shadow-sm cursor-pointer h-9 px-3.5"
            >
              <Plus className="size-3.5" />
              Request Assistance
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab("tracking")}
              className="rounded-[5px] text-xs font-medium gap-1.5 cursor-pointer h-9 px-3.5 border-zinc-300 dark:border-zinc-700"
            >
              <Clock className="size-3.5" />
              Track Status
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Clean, Non-Redundant Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] p-3.5 shadow-2xs flex items-center justify-between"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground block truncate">
                  {stat.label}
                </span>
                <span
                  className={`text-base sm:text-lg font-bold text-foreground block truncate ${
                    stat.isMono ? "font-mono text-sm sm:text-base" : ""
                  }`}
                >
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {stat.subtext}
                </span>
              </div>
              <div
                className={`size-9 rounded-[5px] border flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}
              >
                <Icon className="size-4.5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Applications & Assistance Cases Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Welfare Assistance Programs & Cases</h3>
              <p className="text-xs text-muted-foreground">Track ongoing evaluations and granted municipal welfare benefits</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Search input in table */}
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter cases..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-7 pr-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-foreground outline-none focus:border-blue-500 w-32 sm:w-44"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-[5px] p-0.5 text-xs">
                {["all", "approved", "pending"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st)
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-[4px] capitalize cursor-pointer transition-colors ${
                      statusFilter === st
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-y border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Case Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Program / Service</th>
                  <th className="py-2.5 px-3 font-semibold">Date Filed</th>
                  <th className="py-2.5 px-3 font-semibold">Assistance / Support</th>
                  <th className="py-2.5 px-3 font-semibold">Caseworker</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {displayedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center px-4">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                        <div className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground/60">
                          <FileText className="size-4" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">No applications found</p>
                        <p className="text-[11px] text-muted-foreground">
                          {tableSearch || statusFilter !== "all"
                            ? "No cases match your search query or filter selection."
                            : "You have not filed any assistance claims yet."}
                        </p>
                        {(tableSearch || statusFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setTableSearch("")
                              setStatusFilter("all")
                              setCurrentPage(1)
                            }}
                            className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedApplications.map((app, idx) => (
                    <tr key={app.id || idx} className="hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-foreground">{app.caseId}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{app.program}</td>
                      <td className="py-3 px-3 text-muted-foreground">{app.dateApplied}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{app.amountRequested}</td>
                      <td className="py-3 px-3 text-muted-foreground">{app.officer}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border ${app.badgeClass}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCaseDetails(app)}
                          className="h-7 text-[11px] px-2.5 rounded-[4px] gap-1 cursor-pointer border-zinc-300 dark:border-zinc-700 hover:border-blue-600 text-foreground hover:text-blue-600"
                        >
                          <Eye className="size-3" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApplications.length}
            pageSize={rowsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setRowsPerPage(newSize)
              setCurrentPage(1)
            }}
            itemLabel="applications"
            className="px-0 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-transparent"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default ApplicantApplicationsTab
