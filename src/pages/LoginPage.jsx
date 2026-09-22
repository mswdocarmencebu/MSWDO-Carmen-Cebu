import React from "react"
import { AuthShowcase } from "@/components/features/auth/AuthShowcase"
import { LoginForm } from "@/components/features/auth/LoginForm"

export function LoginPage() {
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      {/* Left Column: Full-Bleed Hero Showcase (Completely non-scrollable on left half) */}
      <section
        aria-label="System Branding"
        className="hidden lg:block lg:w-1/2 xl:w-[50%] h-screen overflow-hidden select-none relative overscroll-none"
      >
        <AuthShowcase />
      </section>

      {/* Right Column: Centered Authentication Form */}
      <section
        aria-label="Authentication Form"
        className="w-full lg:w-1/2 xl:w-[50%] h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-6 overflow-y-auto relative z-20"
      >
        {/* Subtle Background Grid Accent on right side */}
        <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-60 dark:opacity-40" />

        {/* Mobile / Tablet Header: Only Logo + Municipal Titles (Shown only on < lg) */}
        <div className="lg:hidden relative z-10 w-full max-w-md mx-auto mb-4">
          <div className="flex items-center gap-3 justify-center py-2">
            <img
              src="/carmen_lgu_logo.png"
              alt="Carmen LGU Logo"
              className="size-13 object-contain drop-shadow-sm shrink-0 select-none"
            />
            <div className="space-y-0.5 text-left">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading leading-tight">
                MSWDO Carmen
              </h1>
              <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-snug">
                Municipal Social Welfare and Development Office
              </p>
            </div>
          </div>
        </div>

        {/* Centered Login Card */}
        <div className="relative z-10 w-full max-w-md sm:max-w-lg my-auto">
          <LoginForm />
        </div>
      </section>
    </div>
  )
}

export default LoginPage
