import React from "react"
import { useRouter } from "@/routes/RouterContext"

export function ApplyHeader({ onCancel }) {
  const { navigate } = useRouter()

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate("/signin")
    }
  }

  return (
    <header className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Municipal Branding */}
        <div className="flex items-center gap-3">
          <img
            src="/carmen_lgu_logo.png"
            alt="Carmen LGU Logo"
            className="size-10 object-contain drop-shadow-xs shrink-0 select-none"
          />
          <div className="text-left">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading leading-tight">
              MSWDO Carmen
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Municipal Social Welfare and Development Office
            </p>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancelClick}
          className="text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer px-3 py-1.5 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
        >
          Cancel application
        </button>
      </div>
    </header>
  )
}

export default ApplyHeader
