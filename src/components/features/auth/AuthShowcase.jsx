import React from "react"
import { motion } from "framer-motion"
import {
  HeartHandshake,
  Users,
  Accessibility,
  GraduationCap,
} from "lucide-react"

export function AuthShowcase() {
  const sectors = [
    {
      label: "Senior Citizen",
      icon: HeartHandshake,
      color: "text-amber-300",
      bg: "bg-amber-400/20 border-amber-300/30",
    },
    {
      label: "PWD",
      icon: Accessibility,
      color: "text-sky-300",
      bg: "bg-sky-400/20 border-sky-300/30",
    },
    {
      label: "Youth",
      icon: GraduationCap,
      color: "text-indigo-300",
      bg: "bg-indigo-400/20 border-indigo-300/30",
    },
    {
      label: "Women",
      icon: Users,
      color: "text-rose-300",
      bg: "bg-rose-400/20 border-rose-300/30",
    },
  ]

  return (
    <div
      className="relative w-full h-screen flex flex-col justify-between overflow-hidden select-none overscroll-none"
      onWheel={(e) => {
        e.stopPropagation()
      }}
    >
      {/* Full Hero Image Background - Occupies 100% of left side with NO padding */}
      <img
        src="/mswdo-community-hero-portrait.png"
        alt="MSWDO Community Assistance"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
      />

      {/* Top Vignette Overlay for Crisp Header Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none h-36" />

      {/* Bottom Rich Gradient Overlay for Headline & Sector Cards */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 via-42% to-transparent pointer-events-none" />

      {/* Top Section: Municipal Branding */}
      <div className="relative z-10 p-5 sm:p-6 xl:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-full bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-sm flex items-center justify-center shrink-0">
            <img
              src="/carmen_lgu_logo.png"
              alt="Carmen LGU Logo"
              className="size-8.5 sm:size-9.5 object-contain drop-shadow"
            />
          </div>
          <div className="text-left space-y-0.5">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-heading leading-tight drop-shadow-sm">
              MSWDO Carmen, Cebu 6005
            </h1>
            <p className="text-xs sm:text-[13px] font-medium text-slate-200 drop-shadow-xs">
              Municipal Social Welfare and Development Office
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Headline, Description & Sector Badges */}
      <div className="relative z-10 p-5 sm:p-6 xl:p-8 space-y-3 sm:space-y-3.5">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl xl:text-[28px] font-extrabold tracking-tight text-white leading-tight drop-shadow-sm max-w-lg">
            Social welfare support,{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              made easier to access.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-snug max-w-md drop-shadow-xs">
            Apply for programs, monitor requests, and receive assistance updates through one secure municipal portal.
          </p>
        </div>

        {/* Dedicated Sector Badges */}
        <div className="pt-0.5">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300/80 mb-2">
            Dedicated Services For
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {sectors.map((sector, idx) => {
              const Icon = sector.icon
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-[5px] bg-black/45 hover:bg-black/60 backdrop-blur-md border border-white/15 transition-all text-white shadow-xs group cursor-default"
                >
                  <div
                    className={`size-6 rounded-[4px] ${sector.bg} border flex items-center justify-center shrink-0 ${sector.color}`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-white whitespace-nowrap">
                    {sector.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthShowcase
