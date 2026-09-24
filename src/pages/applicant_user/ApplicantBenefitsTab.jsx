import React, { useState, useMemo } from "react"
import {
  HeartHandshake,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  ArrowRight,
  Award,
  Layers,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { isSectorMatch } from "@/services/applicationService"

export function ApplicantBenefitsTab({
  programs = [],
  claims = [],
  sectorLabel = "",
  clientId = "",
  applicantName = "",
  isApproved = true,
  intakeStatus = "",
  loading = false,
  onOpenApplyModal,
  onNavigateTab,
}) {
  const [searchTerm, setSearchTerm] = useState("")

  // Check if applicant is chosen/enrolled for any benefit
  const approvedOrChosenClaims = useMemo(() => {
    return claims.filter(
      (c) =>
        (c.status || "").toLowerCase() === "processed" ||
        (c.status || "").toLowerCase() === "approved" ||
        (c.status || "").toLowerCase() === "pending"
    )
  }, [claims])

  // Only programs that strictly match the applicant's approved sector are displayed
  // (e.g., if approved is Youth, ONLY Youth benefits will be displayed)
  const sectorPrograms = useMemo(() => {
    if (!sectorLabel) return programs
    return programs.filter((prog) => isSectorMatch(prog.sector, sectorLabel))
  }, [programs, sectorLabel])

  // Filtered programs by search query within the approved sector
  const filteredPrograms = useMemo(() => {
    return sectorPrograms.filter((prog) => {
      const q = searchTerm.toLowerCase().trim()
      if (!q) return true
      return (
        (prog.name || "").toLowerCase().includes(q) ||
        (prog.description || "").toLowerCase().includes(q) ||
        (prog.sector || "").toLowerCase().includes(q) ||
        (prog.code || "").toLowerCase().includes(q)
      )
    })
  }, [sectorPrograms, searchTerm])

  return (
    <div className="space-y-4">
      {/* Sleek Header & Approved Sector Indicator */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {sectorLabel ? `${sectorLabel} Welfare Programs & Benefits` : "Welfare Programs & Benefits"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active municipal grants and assistance services designated for registered {sectorLabel || "welfare"} beneficiaries.
          </p>
        </div>

        {/* Registered & Approved Sector Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 self-start md:self-auto">
          {isApproved ? (
            <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Clock className="size-3.5 text-amber-500" />
          )}
          <span>
            {isApproved ? `Approved Sector: ${sectorLabel}` : `Sector: ${sectorLabel} (${intakeStatus || "Pending Review"})`}
          </span>
        </div>
      </div>

      {/* Pending Approval Notice Banner (if applicant has not yet been approved) */}
      {!isApproved && (
        <div className="rounded-[5px] border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-[4px] bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Application Pending Approval
              </span>
              <p className="text-xs text-foreground">
                Your application for the <strong className="font-semibold">{sectorLabel}</strong> sector is currently under evaluation. Benefit applications will be unlocked once approved by MSWDO caseworkers.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab("applications")}
            className="h-8 text-xs font-medium shrink-0 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            Check Application Status
          </Button>
        </div>
      )}

      {/* Chosen / Enrolled Notice (Clean compact banner in blue theme) */}
      {approvedOrChosenClaims.length > 0 && (
        <div className="rounded-[5px] border border-blue-200 dark:border-blue-800/80 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/40 dark:from-blue-950/40 dark:via-zinc-900 dark:to-indigo-950/30 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-[4px] bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                Selected Beneficiary Notice
              </span>
              <p className="text-xs font-semibold text-foreground truncate">
                Enrolled for: {approvedOrChosenClaims.map((c) => c.benefit || c.benefit_name).join(", ")}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab("tracking")}
            className="h-8 text-xs font-medium gap-1.5 shrink-0 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Clock className="size-3.5" />
            View Tracking
          </Button>
        </div>
      )}

      {/* Controls: Sector Pill & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-blue-600 text-white shadow-xs inline-flex items-center gap-1.5">
            <Tag className="size-3" />
            {sectorLabel} Benefits ({sectorPrograms.length})
          </span>
          {approvedOrChosenClaims.length > 0 && (
            <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Enrolled: {approvedOrChosenClaims.length}
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${sectorLabel} programs...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[4px] text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground outline-none focus:border-blue-500 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Programs Cards Grid */}
      {loading ? (
        <div className="p-8 text-center space-y-2 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800">
          <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading active municipal programs...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-[5px] border border-dashed border-zinc-200 dark:border-zinc-800">
          <Layers className="size-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-semibold text-foreground">No {sectorLabel} Programs Found</p>
          <p className="text-[11px] text-muted-foreground">
            No welfare assistance programs are currently open matching your search for the {sectorLabel} sector.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPrograms.map((prog) => {
            const existingClaim = claims.find(
              (c) =>
                (c.benefit || c.benefit_name || "").toLowerCase() === (prog.name || "").toLowerCase()
            )

            return (
              <Card
                key={prog.id || prog.code}
                className="border rounded-[5px] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between border-blue-200/90 dark:border-blue-900/60 bg-white dark:bg-zinc-900"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                      {prog.code || "BEN-LGU"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Sparkles className="size-2.5 text-blue-600" />
                        {prog.sector} Grant
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {prog.description || "Municipal social welfare assistance program from Carmen LGU."}
                    </p>
                  </div>

                  {/* Requirements Note (if specified) */}
                  {prog.requirements && (
                    <div className="p-2 rounded-[4px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <FileCheck className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong className="text-foreground">Reqs:</strong> {prog.requirements}
                      </span>
                    </div>
                  )}

                  {/* Benefit Amount Pill */}
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-[4px] border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Grant Amount:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                      {prog.amount || "₱1,000.00"}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {existingClaim ? (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 text-xs">
                        <span className="text-muted-foreground text-[11px]">Applied Status:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {existingClaim.status || "Pending"}
                        </span>
                      </div>
                    ) : !isApproved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full rounded-[4px] text-xs font-medium gap-1.5 h-8 border-zinc-200 dark:border-zinc-800 text-muted-foreground opacity-70 cursor-not-allowed"
                      >
                        <Clock className="size-3.5" />
                        Pending Approval
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => onOpenApplyModal(prog)}
                        className="w-full rounded-[4px] text-xs font-semibold gap-1.5 cursor-pointer h-8 shadow-xs"
                      >
                        Apply for Benefit
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ApplicantBenefitsTab
