import React from "react"
import {
  UserPlus,
  HeartHandshake,
  FileSpreadsheet,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { useRouter } from "@/routes/RouterContext"

export function QuickActionsCard() {
  const { navigate } = useRouter()

  const actions = [
    {
      title: "New applicant",
      subtitle: "Start an assisted application",
      icon: UserPlus,
      path: "/apply",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/80 dark:border-blue-900/60",
      accentBorder: "hover:border-blue-400/80 dark:hover:border-blue-500",
      pill: "Intake",
    },
    {
      title: "Manage benefits",
      subtitle: "Programs and claim processing",
      icon: HeartHandshake,
      path: "/dashboard/super-admin/benefits",
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60",
      accentBorder: "hover:border-emerald-400/80 dark:hover:border-emerald-500",
      pill: "Disbursement",
    },
    {
      title: "Generate report",
      subtitle: "Filter, print, or export records",
      icon: FileSpreadsheet,
      path: "/dashboard/super-admin/reports",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/60",
      accentBorder: "hover:border-purple-400/80 dark:hover:border-purple-500",
      pill: "Analytics",
    },
    {
      title: "Manage staff access",
      subtitle: "Accounts, roles, and categories",
      icon: ShieldCheck,
      path: "/dashboard/super-admin/user-management",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/60",
      accentBorder: "hover:border-amber-400/80 dark:hover:border-amber-500",
      pill: "Security",
    },
  ]

  return (
    <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-heading">
              Quick actions
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Jump into common service workflows
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal 4-Column Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act, i) => {
          const Icon = act.icon
          return (
            <button
              key={i}
              type="button"
              onClick={() => navigate(act.path)}
              className={`rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 p-3 transition-all text-left group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${act.accentBorder}`}
            >
              {/* Top Row: Icon + Pill + Hover Arrow */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`size-8 rounded-[5px] border flex items-center justify-center shrink-0 ${act.color}`}
                >
                  <Icon className="size-4" />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-700/60 text-muted-foreground">
                    {act.pill}
                  </span>
                  <div className="size-6 rounded-[4px] flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="mt-3">
                <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {act.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {act.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
