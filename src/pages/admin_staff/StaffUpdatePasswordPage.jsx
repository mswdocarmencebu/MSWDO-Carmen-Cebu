import React, { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
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
  Building,
  UserCog,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { completeStaffPasswordSetup } from "@/services/userService"

export function StaffUpdatePasswordPage() {
  const { profile, user, signOut, markPasswordChanged } = useAuth()
  const { navigate } = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Staff details
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Staff Member"
  const position = profile?.roleDetails?.position || user?.user_metadata?.position || "Welfare Officer"
  const idNumber = profile?.roleDetails?.id_number || "STAFF"
  const email = profile?.email || user?.email || ""
  const isSuperAdmin = profile?.role === "super_admin_user" || profile?.role === "itsd"

  // If user already has real password / completed setup, redirect directly to dashboard
  useEffect(() => {
    if (profile && profile.must_change_password === false) {
      if (isSuperAdmin) {
        navigate("/dashboard/super-admin", { replace: true })
      } else {
        navigate("/dashboard/admin-staff", { replace: true })
      }
    }
  }, [profile, isSuperAdmin, navigate])

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
      await completeStaffPasswordSetup(newPassword)
      markPasswordChanged()
      setSuccessMessage("Password updated successfully! Entering staff portal...")

      setTimeout(() => {
        if (isSuperAdmin) {
          navigate("/dashboard/super-admin", { replace: true })
        } else {
          navigate("/dashboard/admin-staff", { replace: true })
        }
      }, 700)
    } catch (err) {
      console.error("Staff password setup error:", err)
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
      {/* Background Accent Grid */}
      <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-60 dark:opacity-40" />

      {/* Centered Form Wrapper */}
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
            alt="Municipality of Carmen Seal"
            className="w-12 h-12 object-contain rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white"
          />
          <div className="text-left">
            <h1 className="text-base font-bold text-foreground leading-tight tracking-tight">
              Municipality of Carmen
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              MSWDO Staff Management System
            </p>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Card Header */}
            <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-center relative">
              <div className="size-11 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2.5 shadow-xs">
                <KeyRound className="size-5.5" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                Set Your Permanent Staff Password
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Your account was provisioned with a temporary password. Establish your secure credentials to proceed.
              </p>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Authenticated Staff Identity Pill */}
              <div className="p-3.5 rounded-[5px] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-[4px] bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    <UserCog className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                    {position}
                  </span>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {idNumber}</p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-[5px] bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>New Permanent Password</span>
                    {newPassword && (
                      <span className={`text-[11px] font-semibold ${strengthLabel.color}`}>
                        Strength: {strengthLabel.text}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong password (min 8 characters)"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Password Strength Bar */}
                  {newPassword && (
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full transition-all duration-300 ${strengthLabel.barClass}`}
                        style={{ width: strengthLabel.width }}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Confirm Permanent Password</span>
                    {confirmPassword && (
                      <span
                        className={`text-[11px] font-semibold ${
                          isMatch ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {isMatch ? "✓ Passwords Match" : "✕ Does not match"}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your permanent password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist Requirements */}
                <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-[11px]">
                  <p className="font-semibold text-foreground text-xs mb-1">
                    Security Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className={checks.minLength ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {checks.minLength ? "✓" : "○"}
                      </span>
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={checks.hasUpper ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {checks.hasUpper ? "✓" : "○"}
                      </span>
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={checks.hasLower ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {checks.hasLower ? "✓" : "○"}
                      </span>
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={checks.hasNumber ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {checks.hasNumber ? "✓" : "○"}
                      </span>
                      <span>Number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className={checks.hasSpecial ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {checks.hasSpecial ? "✓" : "○"}
                      </span>
                      <span>Special symbol (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  variant="brand"
                  disabled={!canSubmit}
                  className="w-full rounded-[5px] text-xs font-semibold py-2.5 shadow-md cursor-pointer transition-all"
                >
                  <ShieldCheck className="size-4 mr-2" />
                  <span>{isSubmitting ? "Updating Password..." : "Update Password & Enter Portal"}</span>
                </Button>
              </form>

              {/* Bottom Signout link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <LogOut className="size-3" />
                  <span>Not you or need to log in as another user? Sign Out</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default StaffUpdatePasswordPage
