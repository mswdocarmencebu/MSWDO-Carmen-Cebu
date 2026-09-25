import React, { useState, useEffect, useRef, useMemo } from "react"
import { MapPin, ChevronDown, Check, X, Search } from "lucide-react"
import { CARMEN_CEBU_BARANGAYS } from "@/constants/carmenBarangays"

export function BarangayCombobox({
  value = "",
  onChange,
  error = "",
  id = "input-barangay",
  placeholder = "Search or select Carmen barangay (e.g. Poblacion, Dawis)...",
}) {
  const [query, setQuery] = useState(value || "")
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Synchronize internal query state with external value changes
  useEffect(() => {
    setQuery(value || "")
  }, [value])

  // Filter barangays by search query
  const filteredBarangays = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CARMEN_CEBU_BARANGAYS
    // Remove "barangay" or "brgy" prefix if user typed it
    const cleanQ = q.replace(/^(barangay|brgy\.?)\s*/i, "").trim()
    if (!cleanQ) return CARMEN_CEBU_BARANGAYS
    return CARMEN_CEBU_BARANGAYS.filter((b) => b.toLowerCase().includes(cleanQ))
  }, [query])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle item selection
  const handleSelect = (barangay) => {
    setQuery(barangay)
    onChange(barangay)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation()
    setQuery("")
    onChange("")
    setHighlightedIndex(0)
    inputRef.current?.focus()
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredBarangays.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredBarangays.length - 1
        )
      }
    } else if (e.key === "Enter") {
      if (isOpen && filteredBarangays.length > 0) {
        e.preventDefault()
        handleSelect(filteredBarangays[highlightedIndex] || filteredBarangays[0])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Highlight matching substring
  const renderHighlightedText = (text, highlight) => {
    const cleanHighlight = highlight.replace(/^(barangay|brgy\.?)\s*/i, "").trim()
    if (!cleanHighlight) return text

    const parts = text.split(new RegExp(`(${cleanHighlight})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === cleanHighlight.toLowerCase() ? (
        <span key={i} className="text-blue-600 dark:text-blue-400 font-extrabold underline decoration-blue-400">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
          <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
            // If the user clears the text, notify parent
            if (!e.target.value.trim()) {
              onChange("")
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-10 pl-9 pr-16 text-sm rounded-[5px] border ${
            error
              ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/20"
              : "border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          } text-foreground outline-none transition-colors`}
        />

        {/* Action icons right: clear & toggle */}
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev)
              inputRef.current?.focus()
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Toggle Carmen barangay list"
          >
            <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-in fade-in duration-100">
          {/* Header Note */}
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              Municipality of Carmen, Cebu (21 Barangays)
            </span>
            <span>
              {filteredBarangays.length} {filteredBarangays.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {/* List Options */}
          {filteredBarangays.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">No Carmen barangay matches &ldquo;{query}&rdquo;</p>
              <p className="text-[11px]">
                Please choose one of the 21 official barangays in Carmen, Cebu.
              </p>
            </div>
          ) : (
            <ul className="py-1">
              {filteredBarangays.map((barangay, index) => {
                const isSelected = value.toLowerCase() === barangay.toLowerCase()
                const isHighlighted = highlightedIndex === index

                return (
                  <li
                    key={barangay}
                    onClick={() => handleSelect(barangay)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin
                        className={`size-3.5 shrink-0 ${
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                        }`}
                      />
                      <span className="font-medium truncate">
                        Barangay {renderHighlightedText(barangay, query)}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default BarangayCombobox
