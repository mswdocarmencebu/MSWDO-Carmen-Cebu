import React, { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "@/routes/RouterContext"
import { useAuth } from "@/hooks/useAuth"
import { searchAllModules } from "@/services/globalSearchService"
import { HighlightText } from "./HighlightText"
import {
  Search,
  X,
  Loader2,
  ClipboardList,
  Users,
  Gift,
  UserX,
  Megaphone,
  Shield,
  History,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react"

const MODULE_ICONS = {
  applications: ClipboardList,
  members: Users,
  benefits: Gift,
  termination: UserX,
  announcements: Megaphone,
  "user-management": Shield,
  audit: History,
}

const BADGE_STYLES = {
  success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  danger: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  primary: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  info: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  muted: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  neutral: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
}

const SHORT_CATEGORY_NAMES = {
  all: "All",
  applications: "Applications",
  members: "Members",
  benefits: "Benefits",
  termination: "Termination",
  announcements: "Announcements",
  "user-management": "Users",
  audit: "Audit",
}

export function GlobalHeaderSearch({ placeholder = "Search records, users, benefits..." }) {
  const { navigate } = useRouter()
  const { role } = useAuth()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchData, setSearchData] = useState({ query: "", total: 0, groups: [] })
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setSearchData({ query: "", total: 0, groups: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(() => {
      searchAllModules(query, role)
        .then((res) => {
          startTransition(() => {
            setSearchData(res)
            setSelectedIndex(-1)
          })
        })
        .catch((err) => {
          console.error("Global search error:", err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 220)

    return () => clearTimeout(timeoutId)
  }, [query, role])

  // Global hotkey: Ctrl+K or Cmd+K or "/" to focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter groups by active category
  const filteredGroups = activeCategory === "all"
    ? searchData.groups
    : searchData.groups.filter((g) => g.key === activeCategory)

  // Flatten items for arrow key navigation
  const flatItems = filteredGroups.flatMap((g) => g.items)

  const handleSelectResult = (item) => {
    setIsOpen(false)
    if (item?.url) {
      navigate(item.url)
    }
  }

  const handleKeyDown = (e) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault()
        // Default navigate to applications or members search
        const base = role === "admin_staff" ? "/dashboard/admin-staff" : "/dashboard/super-admin"
        navigate(`${base}/applications?search=${encodeURIComponent(query.trim())}`)
        setIsOpen(false)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && flatItems[selectedIndex]) {
        handleSelectResult(flatItems[selectedIndex])
      } else if (flatItems[0]) {
        handleSelectResult(flatItems[0])
      }
    }
  }

  const handleClear = () => {
    setQuery("")
    setSearchData({ query: "", total: 0, groups: [] })
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
      {/* Search Input Box */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800/90 border transition-all duration-150 ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
            : "border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
        }`}
      >
        <Search className="size-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
        />

        {isLoading ? (
          <Loader2 className="size-3.5 text-blue-600 animate-spin shrink-0" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 text-muted-foreground hover:text-foreground rounded-[3px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="size-3" />
          </button>
        ) : (
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/70 bg-zinc-200/70 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-[3px] border border-zinc-300/50 dark:border-zinc-600/50">
            <span>⌘</span>K
          </kbd>
        )}
      </div>

      {/* Floating Dropdown Results Menu - Clean Original Compact Length */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 sm:left-auto sm:right-0 w-full sm:w-[450px] md:w-[480px] max-w-[calc(100vw-2rem)] mt-2 z-50 rounded-[6px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header Bar */}
          <div className="px-3.5 py-2.5 bg-zinc-50/90 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
              <span>Results for</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold max-w-[130px] sm:max-w-[160px] truncate">
                "{query}"
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                {searchData.total}
              </span>
            </div>

            {/* Category Filter Chips - One-Word Labels */}
            {searchData.groups.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto text-[10px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`px-2 py-0.5 rounded-[4px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    activeCategory === "all"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({searchData.total})
                </button>
                {searchData.groups.map((grp) => {
                  const shortName = SHORT_CATEGORY_NAMES[grp.key] || grp.name.split(" ")[0]
                  return (
                    <button
                      key={grp.key}
                      type="button"
                      onClick={() => setActiveCategory(grp.key)}
                      className={`px-2 py-0.5 rounded-[4px] font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                        activeCategory === grp.key
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{shortName}</span>
                      <span className="opacity-75">({grp.count})</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Body Results List */}
          <div className="max-h-[65vh] sm:max-h-[420px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1.5">
            {isLoading && searchData.total === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center text-muted-foreground">
                <Loader2 className="size-6 text-blue-600 animate-spin" />
                <p className="text-xs font-medium">Searching across all MSWDO modules...</p>
              </div>
            ) : searchData.total === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="text-sm font-bold text-foreground">No matching records found</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  No matches found for <span className="font-semibold text-foreground">"{query}"</span> in
                  Applications, Members, Benefits, Announcements, or System Records.
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const IconComponent = MODULE_ICONS[group.key] || ClipboardList

                return (
                  <div key={group.key} className="py-2 first:pt-0">
                    {/* Group Subheader */}
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[4px] mb-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className="size-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-foreground/90 font-heading">{group.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {group.count}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false)
                          navigate(group.viewAllUrl)
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        view all module records <ArrowRight className="size-3" />
                      </button>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const globalIndex = flatItems.indexOf(item)
                        const isSelected = globalIndex === selectedIndex
                        const badgeStyle = BADGE_STYLES[item.badgeType] || BADGE_STYLES.neutral

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectResult(item)}
                            className={`group px-3.5 py-2.5 rounded-[6px] flex items-center justify-between gap-4 cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50/90 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 shadow-2xs"
                                : "hover:bg-zinc-100/90 dark:hover:bg-zinc-800/70 border border-transparent"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                  <HighlightText text={item.title} highlight={query} />
                                </span>
                                {item.badge && (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border shrink-0 ${badgeStyle}`}
                                  >
                                    <HighlightText text={item.badge} highlight={query} />
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground flex-wrap">
                                {item.subtitle && (
                                  <span className="font-mono text-[11px] font-medium text-foreground/80 shrink-0">
                                    <HighlightText text={item.subtitle} highlight={query} />
                                  </span>
                                )}
                                {item.subtitle && item.description && (
                                  <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
                                )}
                                {item.description && (
                                  <span className="truncate">
                                    <HighlightText text={item.description} highlight={query} />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-muted-foreground/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors">
                              <span className="text-[11px] font-semibold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                              </span>
                              <CornerDownLeft className="size-3.5" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Dropdown Footer Navigation Shortcut Help */}
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1">Use <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">↑</kbd> and <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">↓</kbd> keys to navigate</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">Enter</kbd> to view</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded font-mono text-[10px]">Esc</kbd> to close</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalHeaderSearch
