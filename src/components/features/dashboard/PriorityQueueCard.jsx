import React from "react"
import { ChevronRight, FileText, HeartHandshake } from "lucide-react"
import { useRouter } from "@/routes/RouterContext"

export function PriorityQueueCard({
  reviewCount = 0,
  openClaimsCount = 0,
  releasedValue = 0,
  processedClaimsCount = 0,
  approvalRate = "0%",
  reviewedApplicationsCount = 0,
}) {
  const { navigate } = useRouter()
  const totalOpen = reviewCount + openClaimsCount

  const formatCurrency = (val) => {
    if (!val || val === 0) return "₱0"
    if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `₱${(val / 1000).toFixed(0)}K`
    return `₱${val.toLocaleString()}`
  }

  return (
    <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-foreground font-heading">
            Priority queue
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Items that may need staff attention
          </p>
        </div>

        <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
          {totalOpen} open
        </span>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard/super-admin/applications")}
          className="w-full flex items-center justify-between p-2.5 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-start gap-2.5">
            <div className="size-7.5 rounded-[5px] bg-blue-100/70 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Review {reviewCount} application{reviewCount === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pending and resubmitted records
              </p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/super-admin/benefits")}
          className="w-full flex items-center justify-between p-2.5 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-start gap-2.5">
            <div className="size-7.5 rounded-[5px] bg-indigo-100/70 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
              <HeartHandshake className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Process {openClaimsCount} open benefit claim{openClaimsCount === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Open benefit queue
              </p>
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
        </button>
      </div>

      {/* Financial & Decision Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <div className="p-2.5 rounded-[5px] bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Released assistance
          </p>
          <p className="text-base sm:text-lg font-bold text-foreground font-heading mt-0.5">
            {formatCurrency(releasedValue)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Across {processedClaimsCount} processed claim{processedClaimsCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="p-2.5 rounded-[5px] bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Decision approval rate
          </p>
          <p className="text-base sm:text-lg font-bold text-foreground font-heading mt-0.5">
            {approvalRate}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Based on {reviewedApplicationsCount} reviewed application{reviewedApplicationsCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  )
}
export default PriorityQueueCard
