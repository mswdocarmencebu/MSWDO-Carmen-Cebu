import React from "react"
import { ShieldCheck, CheckCircle2, Lock, FileText } from "lucide-react"

export function ApplyHeroBanner() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0b1528 0%, #0d2856 50%, #153e7e 100%)",
      }}
      className="relative overflow-hidden rounded-[5px] text-white p-4 sm:p-6 shadow-md border border-slate-700/50 bg-[#0d2856]"
    >
      {/* Subtle background radial accents */}
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-black/40 backdrop-blur-md text-sky-200 border border-white/20 text-xs font-semibold shadow-xs">
          <ShieldCheck className="size-3.5 text-sky-300" />
          OFFICIAL ONLINE SERVICE
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading leading-tight text-white drop-shadow-xs">
          Apply for MSWDO assistance
        </h2>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow-xs">
          Complete your application in three guided steps. You can review every detail before securely submitting your documents.
        </p>

        {/* Pill Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-medium text-slate-100">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Guided application
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-medium text-slate-100">
            <Lock className="size-3 text-sky-400" />
            Secure document upload
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-medium text-slate-100">
            <FileText className="size-3 text-indigo-300" />
            Reference after submission
          </span>
        </div>
      </div>
    </div>
  )
}

export default ApplyHeroBanner
