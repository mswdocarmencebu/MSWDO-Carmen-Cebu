import React from "react"
import { Menu, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UserMenuDropdown, GlobalHeaderSearch, NotificationsDropdown } from "@/components/common"

const TITLE_MAP = {
  dashboard: "Executive Dashboard",
  members: "Members Directory",
  applications: "Program Applications",
  benefits: "Benefits & Assistance",
  termination: "Termination Management",
  audit: "Audit & Monitoring",
  announcements: "Announcements & Bulletins",
  reports: "Analytics & Reports",
  system: "System Settings",
  cms: "Content Management (CMS)",
  "user-management": "User & Role Management",
}

export function SuperAdminUserHeader({ onToggleMobile, activeTitle = "dashboard" }) {
  const { profile, role } = useAuth()
  const resolvedTitle = TITLE_MAP[activeTitle] || activeTitle || "Portal"

  const isStaff = role === "admin_staff" || role === "inventory_staff"
  const staffPosition = profile?.roleDetails?.position || profile?.position
  const badgeLabel = isStaff ? (staffPosition ? `Staff (${staffPosition})` : "Staff") : "Super Admin"
  const subtitle = isStaff
    ? "MSWDO Carmen • Beneficiary Processing & Case Intake"
    : "MSWDO Carmen • Executive Master Administration & Oversight"

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Drawer Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-[5px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="size-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            {resolvedTitle}
          </h2>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Tools */}
      <div className="flex items-center gap-3">
        {/* Global Search across all modules */}
        <div className="hidden sm:block">
          <GlobalHeaderSearch placeholder="Search applications, members, benefits..." />
        </div>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Role Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[5px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-900">
          <ShieldCheck className="size-3.5" />
          {badgeLabel}
        </span>

        {/* User Dropdown Menu */}
        <UserMenuDropdown />
      </div>
    </header>
  )
}

export default SuperAdminUserHeader
