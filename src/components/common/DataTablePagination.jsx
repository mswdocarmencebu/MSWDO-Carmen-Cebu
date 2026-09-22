import React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

/**
 * Reusable Global Table Pagination Component
 * Displays overall counts, page size switcher, previous/next buttons, and numbered page pills with ellipses.
 */
export function DataTablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "records",
  className = "",
}) {
  if (totalItems <= 0 && totalPages <= 1) {
    return null
  }

  // Calculate slice bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages))
  const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const to = Math.min(safeCurrentPage * pageSize, totalItems)

  // Generate page list with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages]
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      totalPages,
    ]
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`p-3.5 sm:p-4 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white dark:bg-zinc-900 select-none ${className}`}
    >
      {/* Left: Overall Range Count & Optional Page Size */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-muted-foreground font-medium">
          Showing <span className="font-semibold text-foreground">{from}</span>–
          <span className="font-semibold text-foreground">{to}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span>{" "}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-muted-foreground ml-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-0.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Numbered Page Navigation with Ellipses */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          className="size-8 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Page Numbers & Ellipses */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="size-8 flex items-center justify-center text-muted-foreground"
              >
                <MoreHorizontal className="size-4" />
              </span>
            )
          }

          const isCurrent = page === currentPage
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange && onPageChange(page)}
              className={`size-8 rounded-[5px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                isCurrent
                  ? "bg-blue-600 text-white border border-blue-600 shadow-2xs font-bold"
                  : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              {page}
            </button>
          )
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          className="size-8 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default DataTablePagination
