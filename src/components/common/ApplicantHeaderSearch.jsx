import React, { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "@/routes/RouterContext"
import { useAuth } from "@/hooks/useAuth"
import { searchApplicantPortal } from "@/services/applicantSearchService"
import { HighlightText } from "./HighlightText"
import {
  Search,
  X,
  Loader2,
  FileText,
  HeartHandshake,
  FileCheck2,
  Megaphone,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react"

const MODULE_ICONS = {
  applications: FileText,
  services: HeartHandshake,
  documents: FileCheck2,
  announcements: Megaphone,
  support: HelpCircle,
}

const BADGE_STYLES = {
  success: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  danger: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  primary: "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  muted: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
}

const CATEGORY_NAMES = {
  all: "All",
  applications: "Applications",
  services: "Programs",
  documents: "Documents",
  announcements: "Bulletins",
  support: "Helpdesk",
}

export function ApplicantHeaderSearch({ placeholder = "Search programs, applications, documents..." }) {
  const { navigate } = useRouter()
  const { profile, user } = useAuth()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchData, setSearchData] = useState({ query: "", total: 0, groups: [] })
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const applicantContext = {
    email: profile?.email || user?.email || "",
    clientId: profile?.roleDetails?.client_id || "",
    applicantName: profile?.full_name || "",
  }

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setSearchData({ query: "", total: 0, groups: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(() => {
      searchApplicantPortal(query, applicantContext)
        .then((res) => {
          startTransition(() => {
            setSearchData(res)
            setSelectedIndex(-1)
          })
        })
        .catch((err) => {
          console.error("Applicant global search error:", err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 220)

    return () => clearTimeout(timeoutId)
  }, [query, applicantContext.email, applicantContext.clientId])

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
        navigate(`/dashboard/applicant/applications?search=${encodeURIComponent(query.trim())}`)
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

      {/* Floating Dropdown Results Menu */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 sm:left-auto sm:right-0 w-full sm:w-[460px] md:w-[500px] max-w-[calc(100vw-2rem)] mt-2 z-50 rounded-[6px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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

            {/* Category Filter Chips */}
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
                {searchData.groups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveCategory(group.key)}
                    className={`px-2 py-0.5 rounded-[4px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      activeCategory === group.key
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {CATEGORY_NAMES[group.key] || group.label} ({group.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {searchData.total === 0 && !isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Search className="size-6 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">No matches found for "{query}"</p>
                <p>Try searching for a program name, reference code, document, or topic.</p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const Icon = MODULE_ICONS[group.key] || FileText

                return (
                  <div key={group.key} className="p-1.5">
                    {/* Group Header */}
                    <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3 text-blue-600 dark:text-blue-400" />
                        <span>{group.label}</span>
                      </div>
                      <span>{group.count}</span>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const globalIndex = flatItems.findIndex((fi) => fi.id === item.id)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectResult(item)}
                            className={`group flex items-center justify-between gap-3 px-2.5 py-2 rounded-[4px] transition-colors cursor-pointer text-left ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/30"
                                : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-semibold text-foreground truncate">
                                  <HighlightText text={item.title} highlight={query} />
                                </h5>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      BADGE_STYLES[item.badgeType] || BADGE_STYLES.muted
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                <HighlightText text={item.subtitle} highlight={query} />
                              </p>
                              {item.description && (
                                <p className="text-[10px] text-muted-foreground/80 truncate">
                                  <HighlightText text={item.description} highlight={query} />
                                </p>
                              )}
                            </div>

                            <ArrowRight className="size-3.5 text-muted-foreground/50 group-hover:text-blue-600 transition-colors shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
              <span>↑↓ to navigate</span>
              <span>•</span>
              <span>↵ to select</span>
              <span>•</span>
              <span>esc to close</span>
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              MSWDO Carmen Portal
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantHeaderSearch
