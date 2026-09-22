import React, { useState, useEffect } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  UserX,
  HeartHandshake,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ApplicationActivityChart,
  ActiveMembersCategoryChart,
  RecentActivityFeed,
  PriorityQueueCard,
  QuickActionsCard,
} from "@/components/features/dashboard"
import { getApplications } from "@/services/applicationService"
import { getMembers, getArchives } from "@/services/memberService"
import { getBenefitClaims } from "@/services/benefitService"

export function SuperAdminUserDashboardPage() {
  const { profile } = useAuth()
  const { navigate } = useRouter()
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "Tuesday, September 22, 2026",
    time: "Updated 11:23 PM",
  })

  // Live operational data
  const [applications, setApplications] = useState([])
  const [members, setMembers] = useState([])
  const [archives, setArchives] = useState([])
  const [claims, setClaims] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const [appsData, membersData, archivesData, claimsData] = await Promise.all([
        getApplications().catch(() => []),
        getMembers().catch(() => []),
        getArchives().catch(() => []),
        getBenefitClaims().catch(() => []),
      ])

      if (Array.isArray(appsData)) setApplications(appsData)
      if (Array.isArray(membersData)) setMembers(membersData)
      if (Array.isArray(archivesData)) setArchives(archivesData)
      if (Array.isArray(claimsData)) setClaims(claimsData)
    } catch (err) {
      console.warn("Could not load dashboard live data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    try {
      const now = new Date()
      const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const formattedTime = `Updated ${now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`
      setCurrentDateTime({ date: formattedDate, time: formattedTime })
    } catch {
      // Fallback
    }

    loadDashboardData()

    const handleSync = () => loadDashboardData()
    window.addEventListener("focus", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("focus", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [])

  // Derived metrics from live data
  const totalApplications = applications.length
  const approvedAppsCount = applications.filter((a) => a.status === "Approved").length
  const rejectedAppsCount = applications.filter((a) => a.status === "Rejected").length
  const decidedAppsCount = approvedAppsCount + rejectedAppsCount

  const approvalRatePercent =
    decidedAppsCount > 0
      ? Math.round((approvedAppsCount / decidedAppsCount) * 100)
      : totalApplications > 0 && approvedAppsCount > 0
      ? Math.round((approvedAppsCount / totalApplications) * 100)
      : 0
  const approvalRateDisplay = `${approvalRatePercent}%`

  const reviewQueueCount = applications.filter(
    (a) => a.status === "Pending" || a.status === "Resubmitted" || a.status === "Needs correction"
  ).length

  const activeMembersCount = members.filter(
    (m) =>
      (m.status || "").toLowerCase() === "active" ||
      (!m.status && !m.isArchived && (m.status || "").toLowerCase() !== "archived")
  ).length

  const inactiveArchivedCount =
    members.filter(
      (m) =>
        (m.status || "").toLowerCase() === "inactive" ||
        (m.status || "").toLowerCase() === "archived" ||
        m.isArchived
    ).length + archives.length

  const openClaimsCount = claims.filter((c) => c.status === "Pending").length
  const processedClaimsCount = claims.filter((c) => c.status === "Processed").length
  const releasedValue = claims
    .filter((c) => c.status === "Processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  const totalPriorityOpen = reviewQueueCount + openClaimsCount

  const statCards = [
    {
      value: String(totalApplications),
      label: "Total Applications",
      sublabel: "Visible application records",
      icon: ClipboardList,
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60",
    },
    {
      badge: `${approvalRateDisplay} approval`,
      value: String(approvedAppsCount),
      label: "Approved Members",
      sublabel: "Verified member records",
      icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60",
    },
    {
      value: String(reviewQueueCount),
      label: "Application Review Queue",
      sublabel: "Pending or resubmitted for review",
      icon: Clock,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60",
    },
    {
      value: String(activeMembersCount),
      label: "Active Members",
      sublabel: "Currently active beneficiaries",
      icon: Users,
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60",
    },
    {
      value: String(inactiveArchivedCount),
      label: "Inactive / Terminated",
      sublabel: "Archived & inactive records",
      icon: UserX,
      accent: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
    },
    {
      value: String(openClaimsCount),
      label: "Open Benefit Claims",
      sublabel: "Awaiting final processing",
      icon: HeartHandshake,
      accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/60",
    },
  ]

  return (
    <SuperAdminUserLayout activeTab="dashboard">
      <div className="space-y-4">
        {/* Top Header: Municipal Service Overview + Date/Time */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Municipal service overview
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Super"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor applications, member services, and benefit activity from one clear operational view.
            </p>
          </div>

          <div className="flex flex-col sm:items-end text-xs shrink-0">
            <span className="font-semibold text-foreground text-xs">
              {currentDateTime.date}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentDateTime.time}
            </span>
          </div>
        </div>

        {/* Today's Priority Card */}
        <div className="rounded-[5px] border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-zinc-900 dark:to-zinc-900 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Title & Badge */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground font-heading">
                  Today’s priority
                </h2>
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {totalPriorityOpen} open
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Work requiring staff attention
              </p>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              <div className="flex items-center gap-2.5">
                {/* Applications to review */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs">
                  <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 font-heading">
                    {reviewQueueCount}
                  </span>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-foreground">
                      Applications
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      to review
                    </p>
                  </div>
                </div>

                {/* Open Benefit Claims */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs">
                  <span className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 font-heading">
                    {openClaimsCount}
                  </span>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-foreground">
                      Benefit claims
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      open
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => navigate("/dashboard/super-admin/applications")}
                  className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8 px-3"
                >
                  <span>Review queue</span>
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/super-admin/reports")}
                  className="rounded-[5px] text-xs gap-1.5 cursor-pointer bg-white dark:bg-zinc-800 h-8 px-3"
                >
                  <FileSpreadsheet className="size-3.5" />
                  <span>Open reports</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Operational Stat Cards: 3 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="relative rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Top Row: Icon & Optional Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`size-8 rounded-[5px] border flex items-center justify-center shrink-0 ${stat.accent}`}
                  >
                    <Icon className="size-4" />
                  </div>

                  {stat.badge && (
                    <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                      {stat.badge}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {stat.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stat.sublabel}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Dashboard Two-Column Grid: Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column (8 cols): Application Activity Chart & Recent Activity Feed */}
          <div className="lg:col-span-8 space-y-4">
            <ApplicationActivityChart applications={applications} />
            <RecentActivityFeed
              applications={applications}
              members={members}
              claims={claims}
            />
          </div>

          {/* Right Column (4 cols): Active Members Category Chart & Priority Queue */}
          <div className="lg:col-span-4 space-y-4">
            <ActiveMembersCategoryChart members={members} />
            <PriorityQueueCard
              reviewCount={reviewQueueCount}
              openClaimsCount={openClaimsCount}
              releasedValue={releasedValue}
              processedClaimsCount={processedClaimsCount}
              approvalRate={approvalRateDisplay}
              reviewedApplicationsCount={decidedAppsCount}
            />
          </div>
        </div>

        {/* Full-width Horizontal Quick Actions Section Below */}
        <div className="w-full">
          <QuickActionsCard />
        </div>
      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminUserDashboardPage
