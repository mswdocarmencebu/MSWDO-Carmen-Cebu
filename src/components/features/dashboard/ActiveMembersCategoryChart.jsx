import React, { useState, useMemo } from "react"
import { Users, ExternalLink } from "lucide-react"
import { useRouter } from "@/routes/RouterContext"

export function ActiveMembersCategoryChart({ members = [] }) {
  const { navigate } = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("PWD")

  // Compute live counts and percentages from members
  const { categories, totalActive } = useMemo(() => {
    const activeMembers = Array.isArray(members)
      ? members.filter(
          (m) =>
            (m.status || "").toLowerCase() === "active" ||
            (!m.status && !m.isArchived && (m.status || "").toLowerCase() !== "archived")
        )
      : []

    const total = activeMembers.length

    const seniorsCount = activeMembers.filter((m) =>
      (m.category || "").toLowerCase().includes("senior")
    ).length

    const pwdCount = activeMembers.filter(
      (m) =>
        (m.category || "").toLowerCase().includes("pwd") ||
        (m.category || "").toLowerCase().includes("disability")
    ).length

    const womenCount = activeMembers.filter((m) =>
      (m.category || "").toLowerCase().includes("women")
    ).length

    const youthCount = activeMembers.filter((m) =>
      (m.category || "").toLowerCase().includes("youth")
    ).length

    const cats = [
      {
        id: "seniors",
        name: "Senior Citizens",
        count: seniorsCount,
        percentage: total > 0 ? Math.round((seniorsCount / total) * 100) : 0,
        color: "#2563eb",
        trackClass: "bg-blue-600",
      },
      {
        id: "pwd",
        name: "PWD",
        count: pwdCount,
        percentage: total > 0 ? Math.round((pwdCount / total) * 100) : 0,
        color: "#10b981",
        trackClass: "bg-emerald-500",
      },
      {
        id: "women",
        name: "Women",
        count: womenCount,
        percentage: total > 0 ? Math.round((womenCount / total) * 100) : 0,
        color: "#8b5cf6",
        trackClass: "bg-purple-500",
      },
      {
        id: "youth",
        name: "Youth",
        count: youthCount,
        percentage: total > 0 ? Math.round((youthCount / total) * 100) : 0,
        color: "#f59e0b",
        trackClass: "bg-amber-500",
      },
    ]

    return { categories: cats, totalActive: total }
  }, [members])

  const activeItem = categories.find((c) => c.name === selectedCategory) || categories[1]

  // Donut geometry: r = 46, circumference = 2 * PI * 46 = 289.026
  const r = 46
  const circumference = 2 * Math.PI * r
  const gap = totalActive > 1 ? 4 : 0

  // Calculate svg donut segments with accumulated offsets
  const segments = useMemo(() => {
    if (totalActive === 0) return []

    let accumulatedOffset = 0
    return categories
      .filter((c) => c.count > 0)
      .map((cat) => {
        const sliceLength = (cat.count / totalActive) * circumference
        const strokeDasharray = `${Math.max(0, sliceLength - gap)} ${circumference - Math.max(0, sliceLength - gap)}`
        const strokeDashoffset = -accumulatedOffset
        accumulatedOffset += sliceLength

        return {
          ...cat,
          strokeDasharray,
          strokeDashoffset,
        }
      })
  }, [categories, totalActive, circumference, gap])

  return (
    <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <Users className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-heading">
              Active members by category
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Current active beneficiary records ({totalActive} total)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/super-admin/members")}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <span>View members</span>
          <ExternalLink className="size-3" />
        </button>
      </div>

      {/* Donut Chart Visual */}
      <div className="relative flex items-center justify-center py-2">
        <svg viewBox="0 0 140 140" className="size-32 sm:size-36 -rotate-90 select-none">
          {/* Background Ring */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="14"
            className="text-zinc-100 dark:text-zinc-800"
          />

          {/* Dynamic Category Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.id}
              cx="70"
              cy="70"
              r={r}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={selectedCategory === seg.name ? "16" : "14"}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              className="cursor-pointer hover:opacity-85 transition-all"
              onClick={() => setSelectedCategory(seg.name)}
            />
          ))}
        </svg>

        {/* Center Label in Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-foreground font-heading leading-tight">
            {activeItem.count}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center max-w-[80px] truncate">
            {activeItem.name}
          </span>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div className="space-y-2.5 pt-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`rounded-[5px] p-2 transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="text-foreground font-semibold">{cat.name}</span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {cat.count} ({cat.percentage}%)
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500`}
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.percentage > 0 ? cat.color : "transparent",
                  }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default ActiveMembersCategoryChart
