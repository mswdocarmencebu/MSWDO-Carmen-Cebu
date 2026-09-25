import React, { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  User,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { verifyResetToken, completePasswordReset } from "@/services/authResetService"

export function ResetPasswordPage() {
  const { navigate } = useRouter()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [userInfo, setUserInfo] = useState(null)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [verificationError, setVerificationError] = useState(null)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // 1. Parse token and email from query params, hash params, or Supabase recovery session
  useEffect(() => {
    let isMounted = true

    const initVerification = async () => {
      setIsVerifying(true)
      setVerificationError(null)

      let paramEmail = searchParams.get("email") || ""
      let paramToken = searchParams.get("token") || ""

      // Check hash params (e.g. from native Supabase reset redirect: #access_token=...&type=recovery)
      if (window.location.hash) {
        const hashStr = window.location.hash.replace(/^#/, "")
        const hashParams = new URLSearchParams(hashStr)
        if (!paramEmail && hashParams.get("email")) {
          paramEmail = hashParams.get("email")
        }
        if (!paramToken && (hashParams.get("token") || hashParams.get("access_token"))) {
          paramToken = hashParams.get("token") || hashParams.get("access_token")
        }
      }

      // Check active Supabase session (e.g., if Supabase client auto-exchanged recovery tokens)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          if (!paramEmail) paramEmail = user.email
          if (!paramToken) paramToken = "supabase_session"
        }
      } catch (_) {}

      // Listen for PASSWORD_RECOVERY auth event if triggered
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return
        if (event === "PASSWORD_RECOVERY" || session?.user) {
          if (session?.user?.email) {
            setEmail(session.user.email)
            setTokenValid(true)
            setUserInfo({
              name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
              email: session.user.email,
              role: session.user.user_metadata?.role || "Registered User",
            })
            setIsVerifying(false)
          }
        }
      })

      if (!paramEmail && !paramToken) {
        if (isMounted) {
          setTokenValid(false)
          setVerificationError("No recovery token or email detected. Please request a new password reset link.")
          setIsVerifying(false)
        }
        return () => authListener?.subscription?.unsubscribe()
      }

      setEmail(paramEmail)
      setToken(paramToken)

      // Verify token with service
      const verifyRes = await verifyResetToken(paramEmail, paramToken)

      if (!isMounted) return

      if (verifyRes.valid) {
        setTokenValid(true)
        setUserInfo({
          name: verifyRes.name || paramEmail.split("@")[0],
          email: verifyRes.email || paramEmail,
          role: verifyRes.role || "Registered Account",
        })
      } else {
        setTokenValid(false)
        setVerificationError(verifyRes.error || "The reset link is invalid or has expired.")
      }

      setIsVerifying(false)

      return () => authListener?.subscription?.unsubscribe()
    }

    initVerification()

    return () => {
      isMounted = false
    }
  }, [searchParams])

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
  const canSubmit = isStrengthValid && isMatch && !isSubmitting && tokenValid

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
      const res = await completePasswordReset({
        email,
        newPassword,
        token,
      })

      setSuccessMessage(res.message || "Password updated successfully! Redirecting to sign in...")

      // Redirect to /signin with success parameter so LoginForm shows confirmation
      setTimeout(() => {
        navigate(`/signin?reset=success&email=${encodeURIComponent(email)}`, { replace: true })
      }, 1200)
    } catch (err) {
      console.error("[ResetPasswordPage] update error:", err)
      setErrorMessage(err.message || "Failed to update password. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Handle Cancel / Don't update password -> redirect back to sign in
  const handleCancel = () => {
    navigate("/signin")
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 text-foreground relative overflow-y-auto">
      {/* Background Accent Grid */}
      <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-60 dark:opacity-40" />

      {/* Centered Form Wrapper matching LoginForm & SetInitialPasswordPage */}
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

        {/* Card matching SetInitialPasswordPage `variant="blue-fade"` */}
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
              {/* Header Typography */}
              <div className="space-y-0.5">
                <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  create a new permanent password for your{" "}
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">MSWDO Account</span>
                </p>
              </div>

              {/* State 1: Verifying Recovery Token */}
              {isVerifying ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="size-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Verifying recovery link...
                  </p>
                  <p className="text-xs text-zinc-400">
                    Validating your registered account with MSWDO Carmen
                  </p>
                </div>
              ) : !tokenValid ? (
                /* State 2: Invalid or Expired Token */
                <div className="space-y-4 py-2">
                  <div className="rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 flex items-start gap-3 text-xs text-red-800 dark:text-red-300">
                    <ShieldAlert className="size-5 shrink-0 mt-0.5 text-red-600" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Invalid or Expired Link</p>
                      <p className="text-red-700 dark:text-red-400 leading-relaxed">
                        {verificationError ||
                          "This password reset link is invalid, expired, or has already been used."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      type="button"
                      variant="brand"
                      className="w-full h-10 rounded-[5px] text-sm font-semibold cursor-pointer"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Request New Reset Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 rounded-[5px] text-sm font-medium cursor-pointer"
                      onClick={handleCancel}
                    >
                      <ArrowLeft className="size-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                /* State 3: Valid Token — Show Password Reset Form */
                <>
                  {/* Account Identity Pill */}
                  <div className="p-3 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-[4px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                        <User className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate leading-tight">
                          {userInfo?.name || email.split("@")[0]}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5 font-mono">
                          {email}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-blue-900/40 px-2 py-0.5 rounded-[4px] border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap">
                      Registered
                    </span>
                  </div>

                  {/* Error & Success Feedback Banners */}
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
                        <div className="rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-xs">Password Updated Successfully</p>
                            <p className="font-medium text-[11px] leading-tight mt-0.5 text-emerald-700 dark:text-emerald-400">
                              {successMessage}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Reset Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* New Password Field */}
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
                          placeholder="Enter your new password"
                          autoComplete="new-password"
                          disabled={isSubmitting || Boolean(successMessage)}
                          className="w-full bg-transparent text-sm text-foreground outline-none py-1 placeholder:text-zinc-400/60"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors shrink-0"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
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
                          className={`size-3 shrink-0 ${
                            checks.minLength
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 whitespace-nowrap ${
                          checks.hasUpper ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-3 shrink-0 ${
                            checks.hasUpper
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 whitespace-nowrap ${
                          checks.hasLower ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-3 shrink-0 ${
                            checks.hasLower
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 whitespace-nowrap ${
                          checks.hasNumber ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-3 shrink-0 ${
                            checks.hasNumber
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                        <span>Number (0-9)</span>
                      </div>
                      <div
                        className={`col-span-2 flex items-center gap-1.5 whitespace-nowrap ${
                          checks.hasSpecial ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-zinc-400"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-3 shrink-0 ${
                            checks.hasSpecial
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
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
                          placeholder="Re-enter your new password"
                          autoComplete="new-password"
                          disabled={isSubmitting || Boolean(successMessage)}
                          className="w-full bg-transparent text-sm text-foreground outline-none py-1 placeholder:text-zinc-400/60"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors shrink-0"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Primary Action Button (Update Password) */}
                    <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }} className="pt-2">
                      <Button
                        type="submit"
                        variant="brand"
                        disabled={!canSubmit}
                        isLoading={isSubmitting}
                        className="w-full h-10 sm:h-10.5 text-sm font-semibold tracking-wide rounded-[5px] shadow-sm transition-all flex items-center justify-center text-center gap-2 cursor-pointer"
                      >
                        {!isSubmitting && <ShieldCheck className="size-4" />}
                        <span>{isSubmitting ? "Updating Password..." : "Update Password"}</span>
                      </Button>
                    </motion.div>

                    {/* Cancel & Return to Sign In (Requested: when dont updating password redirect to signin again to login) */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 inline-flex items-center gap-1.5 cursor-pointer text-[11px] transition-colors"
                      >
                        <ArrowLeft className="size-3" />
                        Cancel & Return to Sign In
                      </button>

                      <span className="text-[10px] text-zinc-400">
                        MSWDO Carmen Security
                      </span>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
