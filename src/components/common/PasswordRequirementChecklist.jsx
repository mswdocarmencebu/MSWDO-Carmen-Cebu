import React from "react"
import { CheckCircle2 } from "lucide-react"

export const DEFAULT_PASSWORD_CHECKS = {
  minLength: false,
  hasUpper: false,
  hasLower: false,
  hasNumber: false,
  hasSpecial: false,
}

export function validatePasswordCriteria(password = "") {
  const p = String(password || "")
  const minLength = p.length >= 8
  const hasUpper = /[A-Z]/.test(p)
  const hasLower = /[a-z]/.test(p)
  const hasNumber = /[0-9]/.test(p)
  const hasSpecial = /[^A-Za-z0-9]/.test(p)

  const passedCount = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  let strength = {
    score: passedCount,
    text: "Weak",
    barClass: "bg-red-500",
    width: "20%",
  }

  if (passedCount <= 2) {
    strength = { score: passedCount, text: "Weak", barClass: "bg-red-500", width: "25%" }
  } else if (passedCount <= 4) {
    strength = { score: passedCount, text: "Moderate", barClass: "bg-amber-500", width: "65%" }
  } else {
    strength = { score: 5, text: "Strong", barClass: "bg-emerald-500", width: "100%" }
  }

  return {
    checks: { minLength, hasUpper, hasLower, hasNumber, hasSpecial },
    isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
    passedCount,
    strength,
  }
}

/**
 * Unified Password Requirement UI Component
 * Used across:
 * - ProfileSettingsPage (All roles)
 * - ResetPasswordPage (Public / Applicants / Staff)
 * - SetInitialPasswordPage (New users)
 * - StaffUpdatePasswordPage (First-time staff login)
 */
export function PasswordRequirementChecklist({
  password = "",
  checks: externalChecks = null,
  strength: externalStrength = null,
  showStrength = true,
  className = "",
}) {
  const computed = validatePasswordCriteria(password)
  const checks = externalChecks || computed.checks
  const strength = externalStrength || computed.strength

  const criteria = [
    { key: "minLength", label: "8+ characters" },
    { key: "hasUpper", label: "Uppercase letter (A-Z)" },
    { key: "hasLower", label: "Lowercase letter (a-z)" },
    { key: "hasNumber", label: "Number (0-9)" },
    { key: "hasSpecial", label: "Special symbol (!@#$%^&*)" },
  ]

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Strength indicator (shown when typing) */}
      {showStrength && password.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Password strength</span>
            <span className={`font-semibold ${strength.barClass.replace("bg-", "text-")}`}>
              {strength.text}
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.barClass} transition-all duration-300 rounded-full`}
              style={{ width: strength.width }}
            />
          </div>
        </div>
      )}

      {/* Checklist Card */}
      <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
        <p className="text-[11px] font-semibold text-foreground mb-2 flex items-center justify-between">
          <span>Password requirements</span>
          <span className="text-[10px] font-normal text-muted-foreground">
            {Object.values(checks).filter(Boolean).length}/5 met
          </span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {criteria.map(({ key, label }) => {
            const passed = Boolean(checks[key])
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                  passed
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {passed ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="size-3.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />
                )}
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PasswordRequirementChecklist
