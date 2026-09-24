import React from "react"
import {
  UserPlus,
  HeartHandshake,
  FileSpreadsheet,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Megaphone,
} from "lucide-react"
import { useRouter } from "@/routes/RouterContext"
import { useAuth } from "@/hooks/useAuth"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"

export function QuickActionsCard() {
  const { navigate } = useRouter()
  const { role } = useAuth()
  const { canEdit, canView } = useStaffPermissions()
  const isStaff = role === "admin_staff" || role === "inventory_staff"
  const prefix = isStaff ? "/dashboard/admin-staff" : "/dashboard/super-admin"

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
      path: `${prefix}/benefits`,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60",
      accentBorder: "hover:border-emerald-400/80 dark:hover:border-emerald-500",
      pill: "Disbursement",
    },
    {
      title: "Generate report",
      subtitle: "Filter, print, or export records",
      icon: FileSpreadsheet,
      path: `${prefix}/reports`,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/60",
      accentBorder: "hover:border-purple-400/80 dark:hover:border-purple-500",
      pill: "Analytics",
    },
    isStaff
      ? {
          title: "Announcements",
          subtitle: "View municipal bulletins & notices",
          icon: Megaphone,
          path: `${prefix}/announcements`,
          color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/60",
          accentBorder: "hover:border-amber-400/80 dark:hover:border-amber-500",
          pill: "Bulletins",
        }
      : {
          title: "Manage staff access",
          subtitle: "Accounts, roles, and categories",
          icon: ShieldCheck,
          path: `${prefix}/user-management`,
          color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/60",
          accentBorder: "hover:border-amber-400/80 dark:hover:border-amber-500",
          pill: "Security",
        },
  ]

  const visibleActions = actions.filter((act) => {
    if (act.title === "New applicant" && isStaff && !canEdit) return false
    return true
  })

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
              Direct access to common municipal workflow tasks
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {visibleActions.map((act, idx) => {
          const Icon = act.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(act.path)}
              className={`group flex items-start gap-3 p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-all text-left cursor-pointer shadow-2xs ${act.accentBorder}`}
            >
              <div
                className={`size-8 rounded-[5px] border flex items-center justify-center shrink-0 mt-0.5 ${act.color}`}
              >
                <Icon className="size-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {act.title}
                  </span>
                  <ArrowUpRight className="size-3 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {act.subtitle}
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-[3px]">
                  {act.pill}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActionsCard
