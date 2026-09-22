import React from "react"
import { Info, AlertCircle } from "lucide-react"

export function ApplyNoticeAlert({ validationError }) {
  return (
    <div className="space-y-3">
      {/* Informational Notice Alert (From Reference Screenshot) */}
      <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[5px] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs sm:text-sm shadow-2xs">
        <Info className="size-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="leading-snug">
          Complete all required fields and upload clear copies of the required documents.
        </p>
      </div>

      {/* Validation Banner if any error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-medium">
          <AlertCircle className="size-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}

export default ApplyNoticeAlert
