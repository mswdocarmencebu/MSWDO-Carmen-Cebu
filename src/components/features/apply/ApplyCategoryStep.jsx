import React from "react"
import { motion } from "framer-motion"
import { FileText, Check, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ApplyCategoryStep({
  categories,
  selectedCategory,
  onSelectCategory,
  onContinue,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header in Card */}
          <div className="text-center space-y-2">
            <div className="size-11 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200/60 dark:border-blue-900/50 shadow-2xs">
              <FileText className="size-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-foreground">
              Who is this application for?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Choose the service category that best matches the applicant.
            </p>
          </div>

          {/* 4 Service Category Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`p-4 sm:p-5 rounded-[5px] border transition-all cursor-pointer text-left flex items-start gap-4 select-none relative group ${
                    isSelected
                      ? "bg-white dark:bg-zinc-900 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-950/5 ring-2 ring-blue-600/20"
                      : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200/90 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800/80 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
                  }`}
                >
                  <div
                    className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 border ${cat.iconBg}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm sm:text-base font-bold transition-colors ${
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                        }`}
                      >
                        {cat.title}
                      </h4>
                      {isSelected && (
                        <span className="size-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="size-3 stroke-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {cat.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Action: Solid Royal Blue Button */}
          <div className="pt-4 flex justify-end border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onContinue}
              className="h-10 sm:h-10.5 px-6 text-sm font-semibold rounded-[5px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              Continue
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ApplyCategoryStep
