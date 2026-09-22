import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CancelApplicationModal({ isOpen, onClose, onConfirm }) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-app-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-[5px] shadow-2xl p-6 overflow-hidden z-10 my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="size-11 rounded-[5px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="size-5" />
            </div>

            <div className="flex-1 space-y-2 pr-4">
              <h3
                id="cancel-app-title"
                className="text-base font-bold text-foreground tracking-tight font-heading"
              >
                Cancel Application?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to cancel and exit your application process?
              </p>

              {/* Red Highlighted Warning */}
              <div className="p-3 rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>
                  Your progress will not be saved once you confirm.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[5px] text-xs font-medium cursor-pointer h-9 px-4"
            >
              No, Continue Application
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              className="rounded-[5px] text-xs font-semibold cursor-pointer h-9 px-4 bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              Yes, Cancel Application
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CancelApplicationModal
