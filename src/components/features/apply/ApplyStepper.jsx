import React from "react"
import { Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ApplyStepper({ step = 1 }) {
  const steps = [
    { number: 1, label: "CATEGORY" },
    { number: 2, label: "DETAILS" },
    { number: 3, label: "DOCUMENTS" },
  ]

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "Choose your program"
      case 2:
        return "Tell us about the applicant"
      case 3:
        return "Upload required documents"
      default:
        return ""
    }
  }

  return (
    <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-[10px] tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
              APPLICATION PROGRESS
            </span>
            <h3 className="font-bold text-sm text-foreground">
              Step {step} of 3
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {getStepSubtitle()}
          </span>
        </div>

        {/* Stepper Container */}
        <div className="relative py-2 px-6 sm:px-12 max-w-xl mx-auto select-none [--stepper-track:#cbd5e1] dark:[--stepper-track:#3f3f46] [--stepper-circle-bg:#ffffff] dark:[--stepper-circle-bg:#18181b] [--stepper-border:#cbd5e1] dark:[--stepper-border:#3f3f46] [--stepper-inactive-text:#64748b] dark:[--stepper-inactive-text:#a1a1aa]">
          <div className="relative flex items-start justify-between w-full">
            {/* Base Continuous Horizontal Track Line - Always Guaranteed Visible */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "18px",
                left: "-16px",
                right: "-16px",
                transform: "translateY(-50%)",
                height: "2px",
                backgroundColor: "var(--stepper-track)",
                zIndex: 0,
              }}
            >
              {/* Active Progress Blue Fill Line */}
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{
                  backgroundColor: "#2563eb",
                  height: "100%",
                  width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
                }}
              />
            </div>

            {/* 3 Step Nodes on top of the track line */}
            {steps.map((s) => {
              const isCompleted = step > s.number
              const isActive = step === s.number
              const isPastOrCurrent = step >= s.number

              return (
                <div
                  key={s.number}
                  className="relative flex flex-col items-center"
                  style={{ zIndex: 1 }}
                >
                  {/* Step Circle */}
                  <div
                    className="size-9 rounded-full flex items-center justify-center text-sm font-bold transition-all select-none"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9999px",
                      backgroundColor: isPastOrCurrent ? "#2563eb" : "var(--stepper-circle-bg)",
                      color: isPastOrCurrent ? "#ffffff" : "var(--stepper-inactive-text)",
                      border: isPastOrCurrent ? "2px solid #2563eb" : "2px solid var(--stepper-border)",
                      boxShadow: isActive ? "0 0 0 5px rgba(37, 99, 235, 0.2)" : "none",
                    }}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : (
                      <span>{s.number}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className="mt-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase"
                    style={{
                      color: isPastOrCurrent ? "#2563eb" : "var(--stepper-inactive-text)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApplyStepper
