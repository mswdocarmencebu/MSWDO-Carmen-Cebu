import React, { useState, useMemo } from "react"
import {
  Megaphone,
  Pin,
  Calendar,
  Search,
  User,
  Bell,
  Sparkles,
  Info,
  CheckCircle2,
  Tag,
  Building,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ApplicantAnnouncementsTab({
  announcements = [],
  loading = false,
  sectorLabel = "",
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [audienceFilter, setAudienceFilter] = useState("all")

  const audiences = [
    { id: "all", label: "All Announcements" },
    { id: "pinned", label: "Pinned Updates" },
    { id: "sector", label: `My Sector (${sectorLabel || "Beneficiary"})` },
  ]

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        (ann.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ann.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ann.authorName || "").toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (audienceFilter === "pinned") return ann.pinned
      if (audienceFilter === "sector") {
        const auds = (ann.audience || []).map((a) => a.toLowerCase())
        const userSec = (sectorLabel || "").toLowerCase()
        return (
          auds.some((a) => a.includes("all") || a.includes("beneficiar") || a.includes("public")) ||
          auds.some((a) => userSec.includes(a))
        )
      }
      return true
    })
  }, [announcements, searchTerm, audienceFilter, sectorLabel])

  const pinnedCount = announcements.filter((a) => a.pinned).length

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[5px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 shrink-0">
            <Megaphone className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Official Bulletins & Announcements</h2>
            <p className="text-xs text-muted-foreground">
              Public advisories, payout schedules, and updates from Carmen MSWDO & LGU Administration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
          <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>MSWDO Carmen Bulletin</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Audience Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {audiences.map((aud) => (
            <button
              key={aud.id}
              onClick={() => setAudienceFilter(aud.id)}
              className={`px-3 py-1.5 rounded-[5px] text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                audienceFilter === aud.id
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-100"
              }`}
            >
              {aud.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bulletins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[5px] text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground outline-none focus:border-blue-500 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800">
          <div className="size-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Fetching official announcements from Carmen LGU server...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-[5px] border border-dashed border-zinc-200 dark:border-zinc-800">
          <Bell className="size-10 text-muted-foreground/40 mx-auto" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">No Bulletins or Notices Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-0.5">
              There are currently no active announcements matching your query. Check back soon for payout dates and advisories.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAnnouncements.map((ann) => {
            const isPinned = ann.pinned

            return (
              <Card
                key={ann.id || ann.code}
                className={`border rounded-[5px] shadow-2xs hover:shadow-xs transition-all bg-white dark:bg-zinc-900 ${
                  isPinned
                    ? "border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-500/20"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Top Bar: Pinned Badge & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          <Pin className="size-3 text-amber-700" />
                          Pinned Notice
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                        {ann.code || "ANN-LGU"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {ann.createdAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="size-3.5" />
                        {ann.authorName || "Super Admin"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {ann.message}
                    </p>
                  </div>

                  {/* Target Audience Chips */}
                  {Array.isArray(ann.audience) && ann.audience.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                        Audience:
                      </span>
                      {ann.audience.map((aud, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        >
                          {aud}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ApplicantAnnouncementsTab
