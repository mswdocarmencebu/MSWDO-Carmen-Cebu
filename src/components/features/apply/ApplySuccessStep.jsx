import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Sparkles, Copy, Check, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "@/routes/RouterContext"

export function ApplySuccessStep({
  activeCategoryObj,
  basicInfo,
  referenceNumber,
  copiedRef,
  onCopyReference,
}) {
  const { navigate } = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -14 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <Card className="rounded-[5px] bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xl shadow-blue-950/5">
        <CardContent className="p-6 sm:p-10 text-center space-y-6">
          <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[5px] bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/60 dark:border-emerald-800">
              <Sparkles className="size-3 text-emerald-600" />
              Intake Registered Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Application Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your application for <strong className="text-foreground">{activeCategoryObj.title}</strong> has been transmitted to the Carmen MSWDO intake queue.
            </p>
          </div>

          {/* Reference Code Box */}
          <div className="max-w-md mx-auto p-4 sm:p-5 rounded-[5px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Your Tracking Reference Number
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                {referenceNumber}
              </span>
              <button
                type="button"
                onClick={onCopyReference}
                className="p-2 rounded-[5px] border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Copy Reference"
              >
                {copiedRef ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Keep this reference safe. You can check your application progress using this number.
            </p>
          </div>

          {/* Credentials Delivery Notice */}
          <div className="max-w-md mx-auto p-4 rounded-[5px] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 text-left flex items-start gap-3 shadow-2xs">
            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="size-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-blue-950 dark:text-blue-200">
                Account Credentials Notice
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Once your application is reviewed and approved by MSWDO staff, your <strong className="text-foreground">default login credentials</strong> (temporary password and account access instructions) will be sent automatically to:
              </p>
              <p className="font-semibold text-blue-700 dark:text-blue-300 font-mono text-xs break-all pt-0.5">
                {basicInfo.email || "your registered email address"}
              </p>
            </div>
          </div>

          {/* Summary Info Table */}
          <div className="max-w-md mx-auto text-left text-xs bg-zinc-50 dark:bg-zinc-900/60 rounded-[5px] p-4 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800">
              <span className="text-muted-foreground">Applicant Name:</span>
              <span className="font-semibold text-foreground">
                {basicInfo.firstName} {basicInfo.middleName} {basicInfo.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800">
              <span className="text-muted-foreground">Program Category:</span>
              <span className="font-semibold text-foreground">{activeCategoryObj.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800">
              <span className="text-muted-foreground">Registered Email:</span>
              <span className="font-semibold text-foreground break-all">{basicInfo.email || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800">
              <span className="text-muted-foreground">Initial Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                Pending Staff Intake &amp; Validation
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Estimated Review:</span>
              <span className="font-semibold text-foreground">3 – 5 Working Days</span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/track?ref=${encodeURIComponent(referenceNumber)}`)}
              className="w-full sm:w-auto px-6 h-10.5 text-sm font-semibold rounded-[5px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-colors cursor-pointer"
            >
              Track Application Now
            </button>
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="w-full sm:w-auto px-5 h-10.5 text-sm font-semibold rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground transition-colors cursor-pointer"
            >
              Return to Sign In
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 h-10.5 text-sm font-medium rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground transition-colors cursor-pointer"
            >
              Print or Save Slip
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ApplySuccessStep
