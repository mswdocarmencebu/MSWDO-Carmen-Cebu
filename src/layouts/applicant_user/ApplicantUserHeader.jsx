import React from "react"
import { Menu, HeartHandshake, HelpCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { UserMenuDropdown, ApplicantHeaderSearch, NotificationsDropdown } from "@/components/common"

export function ApplicantUserHeader({ onToggleMobile, activeTitle = "My Applications" }) {
  const { profile, user } = useAuth()
  const { navigate } = useRouter()
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Applicant User"

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 md:px-8 flex items-center justify-between gap-3">
      {/* Left: Mobile Drawer Trigger & Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-[5px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="size-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-foreground capitalize">
            {activeTitle}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            MSWDO Carmen • Assistance & Services Portal
          </p>
        </div>
      </div>

      {/* Right Header Tools */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Applicant Global Search */}
        <ApplicantHeaderSearch placeholder="Search records, benefits..." />

        {/* Support Help Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/applicant/support")}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors shrink-0"
          title="MSWDO Carmen Helpdesk"
        >
          <HelpCircle className="size-3.5" />
          <span>Helpdesk</span>
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Role Badge - Protected with whitespace-nowrap and shrink-0 */}
        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
          <HeartHandshake className="size-3.5" />
          Applicant User
        </span>

        {/* User Dropdown Menu */}
        <div className="shrink-0">
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  )
}

export default ApplicantUserHeader
