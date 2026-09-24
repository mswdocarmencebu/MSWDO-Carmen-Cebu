import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  LogOut,
  User,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { completeInitialPasswordSetup } from "@/services/applicationService"

export function SetInitialPasswordPage() {
  const { profile, user, signOut, markPasswordChanged } = useAuth()
  const { navigate } = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Beneficiary details
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Beneficiary"
  const clientId = profile?.roleDetails?.client_id || "APPL-BENEFICIARY"
  const category = profile?.roleDetails?.category || "Citizen Beneficiary"

  // Live password validation
  const checks = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    }
  }, [newPassword])

  const passedChecksCount = Object.values(checks).filter(Boolean).length
  const isStrengthValid = passedChecksCount >= 4 && checks.minLength
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = isStrengthValid && isMatch && !isSubmitting

  const strengthLabel = useMemo(() => {
    if (!newPassword) return { text: "None", color: "text-zinc-400", width: "0%", barClass: "bg-zinc-200" }
    if (passedChecksCount <= 2) return { text: "Weak", color: "text-rose-500", width: "35%", barClass: "bg-rose-500" }
    if (passedChecksCount <= 4) return { text: "Good", color: "text-amber-500", width: "70%", barClass: "bg-amber-500" }
    return { text: "Strong", color: "text-blue-600 dark:text-blue-400", width: "100%", barClass: "bg-blue-600" }
  }, [newPassword, passedChecksCount])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!isStrengthValid) {
      setErrorMessage("Please fulfill the password security criteria below.")
      return
    }

    if (!isMatch) {
      setErrorMessage("Password confirmation does not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await completeInitialPasswordSetup(newPassword)
      markPasswordChanged()
      setSuccessMessage("Password updated successfully! Entering dashboard...")

      setTimeout(() => {
        navigate("/dashboard/applicant", { replace: true })
      }, 500)
    } catch (err) {
      console.error("Password setup error:", err)
      setErrorMessage(err.message || "Failed to update password. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/signin")
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 text-foreground relative overflow-y-auto">
      {/* Background Accent Grid (Identical to Login Page) */}
      <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-60 dark:opacity-40" />

      {/* Centered Form Wrapper matching LoginForm */}
      <div className="w-full max-w-md sm:max-w-lg mx-auto relative z-10 my-auto py-6">
        {/* Top Logo & Portal Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 justify-center mb-5"
        >
          <img
            src="https://uat.swu-som.com/carmen_lgu_logo.png"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = "/carmen_lgu_logo.png"
            }}
            alt="Carmen LGU Logo"
            className="size-12 object-contain drop-shadow-sm shrink-0 select-none"
          />
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading leading-tight">
              MSWDO Carmen
            </h1>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-snug">
              Municipal Social Welfare and Development Office
            </p>
          </div>
        </motion.div>

        {/* Card matching Login Page `variant="blue-fade"` */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card
            variant="blue-fade"
            className="w-full shadow-xl shadow-blue-950/5 rounded-[5px] overflow-hidden"
          >
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Header Typography (Matches Login) */}
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Set Password
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  to activate your <span className="text-zinc-600 dark:text-zinc-300 font-medium">MSWDO Beneficiary Portal</span>
                </p>
              </div>

              {/* Beneficiary Identity Bar */}
              <div className="p-3 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-[4px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                      {category}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-blue-900/40 px-2 py-0.5 rounded-[4px] border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap">
                  {clientId}
                </span>
              </div>

              {/* Error & Success Feedback Banners (Matches Login) */}
              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    key="error-banner"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-2.5 flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                      <div className="font-medium text-[11px] leading-tight">{errorMessage}</div>
                    </div>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    key="success-banner"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-2.5 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <div className="font-medium text-[11px] leading-tight">{successMessage}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* New Password Field (Underline Style matching Login) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 whitespace-nowrap">
                      <Lock className="size-3.5 text-zinc-500" />
                      New Password <span className="text-red-500 font-semibold">*</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                      Strength: <strong className={strengthLabel.color}>{strengthLabel.text}</strong>
                    </span>
                  </div>

                  <div
                    className={`relative flex items-center gap-2 pb-1.5 border-b transition-colors duration-150 ${
                      focusedField === "newPass" || newPassword
                        ? "border-blue-600 dark:border-blue-500"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <input
                      id="new-password-input"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onFocus={() => setFocusedField("newPass")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new permanent password"
                      autoComplete="new-password"
                      disabled={isSubmitting || Boolean(successMessage)}
                      className="w-full bg-transparent text-sm text-foreground outline-none py-1 placeholder:text-zinc-400/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors shrink-0"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Password Strength Progress Bar */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${strengthLabel.barClass}`}
                      style={{ width: strengthLabel.width }}
                    />
                  </div>
                </div>

                {/* Password Requirements Compact Chips */}
                <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-[5px] border border-blue-100 dark:border-blue-950/50 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap ${
                      checks.minLength ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`size-3 shrink-0 ${checks.minLength ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                    <span>8+ characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap ${
                      checks.hasUpper ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`size-3 shrink-0 ${checks.hasUpper ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap ${
                      checks.hasLower ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`size-3 shrink-0 ${checks.hasLower ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap ${
                      checks.hasNumber ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`size-3 shrink-0 ${checks.hasNumber ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                    <span>Number (0-9)</span>
                  </div>
                  <div
                    className={`col-span-2 flex items-center gap-1.5 whitespace-nowrap ${
                      checks.hasSpecial ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`size-3 shrink-0 ${checks.hasSpecial ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>

                {/* Confirm Password Field (Underline Style matching Login) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 whitespace-nowrap">
                      <KeyRound className="size-3.5 text-zinc-500" />
                      Confirm Password <span className="text-red-500 font-semibold">*</span>
                    </span>
                    {confirmPassword.length > 0 && (
                      <span
                        className={`text-[11px] font-medium whitespace-nowrap ${
                          isMatch ? "text-blue-600 dark:text-blue-400" : "text-rose-500"
                        }`}
                      >
                        {isMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative flex items-center gap-2 pb-1.5 border-b transition-colors duration-150 ${
                      focusedField === "confirmPass" || confirmPassword
                        ? confirmPassword.length > 0 && !isMatch
                          ? "border-rose-500"
                          : "border-blue-600 dark:border-blue-500"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onFocus={() => setFocusedField("confirmPass")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      disabled={isSubmitting || Boolean(successMessage)}
                      className="w-full bg-transparent text-sm text-foreground outline-none py-1 placeholder:text-zinc-400/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors shrink-0"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Action Button (Centered 'Update Password') */}
                <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }} className="pt-2">
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={!canSubmit}
                    isLoading={isSubmitting}
                    className="w-full h-10 sm:h-10.5 text-sm font-semibold tracking-wide rounded-[5px] shadow-sm transition-all flex items-center justify-center text-center gap-2"
                  >
                    {!isSubmitting && <ShieldCheck className="size-4" />}
                    <span>{isSubmitting ? "Updating Password..." : "Update Password"}</span>
                  </Button>
                </motion.div>

                {/* Footer Sign Out / Helper */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 inline-flex items-center gap-1.5 cursor-pointer text-[11px] transition-colors"
                  >
                    <LogOut className="size-3" />
                    Sign Out / Switch Account
                  </button>

                  <span className="text-[10px] text-zinc-400">
                    MSWDO Security
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default SetInitialPasswordPage
