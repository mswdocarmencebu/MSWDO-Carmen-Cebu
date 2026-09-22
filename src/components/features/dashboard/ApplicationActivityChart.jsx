import React, { useState, useMemo } from "react"
import { BarChart3, FileSpreadsheet } from "lucide-react"
import { useRouter } from "@/routes/RouterContext"

export function ApplicationActivityChart({ applications = [] }) {
  const { navigate } = useRouter()
  const [timeRange, setTimeRange] = useState("6m") // '6m' | '12m'
  const [activeMonthIndex, setActiveMonthIndex] = useState(null)

  // Compute month buckets dynamically
  const monthsData = useMemo(() => {
    const monthCount = timeRange === "12m" ? 12 : 6
    const result = []
    const now = new Date()

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const shortMonth = d.toLocaleDateString("en-US", { month: "short" })
      const fullMonth = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      const year = d.getFullYear()

      result.push({
        key: monthYear,
        label: i === monthCount - 1 || d.getMonth() === 0 ? `${shortMonth}\n${year}` : shortMonth,
        display: fullMonth,
        submitted: 0,
        approved: 0,
        rejected: 0,
      })
    }

    // Populate counts from applications
    if (Array.isArray(applications)) {
      applications.forEach((app) => {
        const rawDate = app.submitted_at || app.created_at || app.submitted
        let appDate = null

        if (rawDate) {
          const parsed = new Date(rawDate)
          if (!isNaN(parsed.getTime())) {
            appDate = parsed
          }
        }

        // If date could not be parsed, default to current month
        if (!appDate) {
          appDate = now
        }

        const appKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, "0")}`
        const bucket = result.find((m) => m.key === appKey)

        if (bucket) {
          bucket.submitted += 1
          if (app.status === "Approved") bucket.approved += 1
          if (app.status === "Rejected") bucket.rejected += 1
        }
      })
    }

    return result
  }, [applications, timeRange])

  // Select active month (default to last month)
  const currentMonthIdx = monthsData.length - 1
  const effectiveIndex =
    activeMonthIndex !== null && activeMonthIndex < monthsData.length
      ? activeMonthIndex
      : currentMonthIdx
  const activeMonth = monthsData[effectiveIndex] || monthsData[currentMonthIdx]

  // Totals & Busiest Month
  const totalSubmitted = monthsData.reduce((acc, m) => acc + m.submitted, 0)
  const totalDecisions = monthsData.reduce((acc, m) => acc + m.approved + m.rejected, 0)
  const busiestMonthItem = [...monthsData].sort((a, b) => b.submitted - a.submitted)[0]
  const busiestMonthDisplay =
    busiestMonthItem && busiestMonthItem.submitted > 0 ? busiestMonthItem.display : "None"

  // Chart coordinate calculation
  const chartHeight = 140
  const zeroY = 160
  const maxInBuckets = Math.max(
    ...monthsData.map((m) => Math.max(m.submitted, m.approved, m.rejected)),
    0
  )
  const maxValue = Math.max(4, Math.ceil(maxInBuckets * 1.25))

  const getY = (val) => zeroY - (val / maxValue) * chartHeight
  const getBarHeight = (val) => Math.max(0, (val / maxValue) * chartHeight)

  const isTwelve = timeRange === "12m"
  const barWidth = isTwelve ? 7 : 11
  const slotWidth = isTwelve ? 44 : 85
  const startOffset = isTwelve ? 62 : 85

  return (
    <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-heading">
              Application activity
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Applications received and decisions recorded by month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 6 months / 12 months toggle */}
          <div className="flex items-center p-0.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
            <button
              type="button"
              onClick={() => {
                setTimeRange("6m")
                setActiveMonthIndex(null)
              }}
              className={`px-2.5 py-0.5 rounded-[4px] font-medium transition-colors cursor-pointer text-xs ${
                timeRange === "6m"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              6 months
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange("12m")
                setActiveMonthIndex(null)
              }}
              className={`px-2.5 py-0.5 rounded-[4px] font-medium transition-colors cursor-pointer text-xs ${
                timeRange === "12m"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              12 months
            </button>
          </div>

          {/* Reports button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/super-admin/reports")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Mini Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-[5px] p-2.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            SUBMITTED
          </p>
          <p className="text-lg sm:text-xl font-bold text-foreground font-heading mt-0.5">
            {totalSubmitted}
          </p>
        </div>

        <div className="rounded-[5px] p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            DECISIONS
          </p>
          <p className="text-lg sm:text-xl font-bold text-foreground font-heading mt-0.5">
            {totalDecisions}
          </p>
        </div>

        <div className="rounded-[5px] p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            BUSIEST MONTH
          </p>
          <p className="text-sm sm:text-base font-bold text-foreground font-heading mt-0.5 truncate">
            {busiestMonthDisplay}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 600 200"
          className="w-full h-48 sm:h-56 min-w-[480px] text-zinc-400 dark:text-zinc-600 select-none"
        >
          {/* Y Axis Gridlines and Labels */}
          {[
            { val: maxValue, y: getY(maxValue) },
            { val: Math.round(maxValue * 0.75), y: getY(maxValue * 0.75) },
            { val: Math.round(maxValue * 0.5), y: getY(maxValue * 0.5) },
            { val: Math.round(maxValue * 0.25), y: getY(maxValue * 0.25) },
            { val: 0, y: getY(0) },
          ].map(({ val, y }, idx) => (
            <g key={idx}>
              <line
                x1="45"
                y1={y}
                x2="590"
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray={val === 0 ? "none" : "3 3"}
                className="opacity-30 dark:opacity-20"
              />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                className="text-[11px] fill-muted-foreground font-sans font-medium"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Grouped Bars per Month */}
          {monthsData.map((item, idx) => {
            const groupX = startOffset + idx * slotWidth
            const isHovered = effectiveIndex === idx

            const subHeight = getBarHeight(item.submitted)
            const appHeight = getBarHeight(item.approved)
            const rejHeight = getBarHeight(item.rejected)

            const subX = isTwelve ? groupX - 10 : groupX - 18
            const appX = isTwelve ? groupX - 2 : groupX - 5
            const rejX = isTwelve ? groupX + 6 : groupX + 8

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onClick={() => setActiveMonthIndex(idx)}
              >
                {/* Background hover highlight zone */}
                <rect
                  x={groupX - (isTwelve ? 18 : 25)}
                  y={15}
                  width={isTwelve ? 36 : 50}
                  height={150}
                  fill="transparent"
                  className={isHovered ? "fill-blue-500/10 dark:fill-blue-400/10" : "hover:fill-zinc-500/5"}
                  rx="3"
                />

                {/* Submitted Bar (Blue) */}
                {item.submitted > 0 && (
                  <rect
                    x={subX}
                    y={getY(item.submitted)}
                    width={barWidth}
                    height={subHeight}
                    rx="2"
                    fill="#2563eb"
                    className="transition-all hover:brightness-110"
                  />
                )}

                {/* Approved Bar (Green) */}
                {item.approved > 0 && (
                  <rect
                    x={appX}
                    y={getY(item.approved)}
                    width={barWidth}
                    height={appHeight}
                    rx="2"
                    fill="#10b981"
                    className="transition-all hover:brightness-110"
                  />
                )}

                {/* Rejected Bar (Red) */}
                {item.rejected > 0 && (
                  <rect
                    x={rejX}
                    y={getY(item.rejected)}
                    width={barWidth}
                    height={rejHeight}
                    rx="2"
                    fill="#ef4444"
                    className="transition-all hover:brightness-110"
                  />
                )}

                {/* Month X-Axis Label */}
                <text
                  x={groupX}
                  y={180}
                  textAnchor="middle"
                  className={`text-[10px] sm:text-[11px] font-sans transition-colors ${
                    isHovered
                      ? "fill-foreground font-bold"
                      : "fill-muted-foreground font-medium"
                  }`}
                >
                  {item.label.includes("\n") ? (
                    <>
                      <tspan x={groupX} dy="0">
                        {item.label.split("\n")[0]}
                      </tspan>
                      <tspan x={groupX} dy="11">
                        {item.label.split("\n")[1]}
                      </tspan>
                    </>
                  ) : (
                    item.label
                  )}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Chart Footer: Legend + Monthly Summary Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-600 shrink-0"></span>
            <span className="text-muted-foreground font-medium">Submitted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-muted-foreground font-medium">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500 shrink-0"></span>
            <span className="text-muted-foreground font-medium">Rejected</span>
          </div>
        </div>

        {/* Selected Month Summary Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs">
          <span className="font-bold text-foreground">{activeMonth.display}</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {activeMonth.submitted} submitted
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {activeMonth.approved} approved
          </span>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {activeMonth.rejected} rejected
          </span>
        </div>
      </div>
    </div>
  )
}
export default ApplicationActivityChart
