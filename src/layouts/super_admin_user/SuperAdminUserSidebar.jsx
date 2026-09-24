import React, { useState } from "react"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  HeartHandshake,
  UserX,
  Megaphone,
  Settings,
  LayoutTemplate,
  ArrowUpNarrowWide,
  ChevronLeft,
  SquareActivity,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { SignOutDialog } from "@/components/common/SignOutDialog"

export function SuperAdminUserSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeNav,
  onSelectNav,
}) {
  const location = useLocation()
  const { profile, user, signOut } = useAuth()
  const { navigate } = useRouter()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = !isCollapsed || isHovered || isMobileOpen
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Super Admin"

  // Exactly matching the requested Super Admin page list
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard/super-admin",
      icon: LayoutDashboard,
    },
    {
      id: "members",
      label: "Members",
      path: "/dashboard/super-admin/members",
      icon: Users,
    },
    {
      id: "applications",
      label: "Applications",
      path: "/dashboard/super-admin/applications",
      icon: ClipboardList,
    },
    {
      id: "benefits",
      label: "Benefit Programs",
      path: "/dashboard/super-admin/benefits",
      icon: HeartHandshake,
    },
    {
      id: "termination",
      label: "Termination",
      path: "/dashboard/super-admin/termination",
      icon: UserX,
    },
    {
      id: "audit",
      label: "Audit & Monitoring",
      path: "/dashboard/super-admin/audit",
      icon: SquareActivity,
    },
    {
      id: "announcements",
      label: "Announcements",
      path: "/dashboard/super-admin/announcements",
      icon: Megaphone,
    },
    {
      id: "reports",
      label: "Reports",
      path: "/dashboard/super-admin/reports",
      icon: ArrowUpNarrowWide,
    },
    {
      id: "system",
      label: "System",
      path: "/dashboard/super-admin/system",
      icon: Settings,
    },
    {
      id: "cms",
      label: "CMS",
      path: "/dashboard/super-admin/cms",
      icon: LayoutTemplate,
    },
    {
      id: "user-management",
      label: "User Management",
      path: "/dashboard/super-admin/user-management",
      icon: Users,
    },
  ]

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutModal(false)
    navigate("/signin")
  }

  return (
    <aside
      onMouseEnter={() => {
        if (isCollapsed) setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => {
        if (isCollapsed) setIsHovered(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsHovered(false)
        }
      }}
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 ease-in-out ${isExpanded ? "lg:w-64" : "lg:w-20"
        } ${isCollapsed && isHovered
          ? "shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          : ""
        } ${isMobileOpen
          ? "translate-x-0 w-72 shadow-2xl"
          : "-translate-x-full lg:translate-x-0"
        }`}
    >
      {/* Brand Header: Logo + MSWDO */}
      <div className={`h-16 relative flex items-center border-b border-zinc-200/80 dark:border-zinc-800 transition-all duration-300 shrink-0 bg-white dark:bg-zinc-900 px-4 ${isExpanded ? "justify-start" : "justify-center"}`}>
        <div className={`flex items-center ${isExpanded ? "gap-3" : "justify-center"}`}>
          <img
            src="/carmen_lgu_logo.png"
            alt="Carmen LGU Logo"
            className="size-10 object-contain drop-shadow-xs shrink-0 select-none"
          />

          {isExpanded && (
            <div className="flex flex-col justify-center select-none">
              <span className="text-lg font-black tracking-wider text-zinc-900 dark:text-zinc-50 font-heading leading-tight">
                MSWDO
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
                Carmen, Cebu
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeNav
            ? activeNav === item.id
            : item.id === "dashboard"
              ? location.pathname === "/dashboard/super-admin" || location.pathname === "/dashboard"
              : location.pathname === item.path || location.pathname.startsWith(item.path + "/")

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectNav?.(item.id)
                navigate(item.path)
                onCloseMobile?.()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[5px] text-xs font-medium transition-colors cursor-pointer text-left ${isActive
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                } ${!isExpanded ? "justify-center px-2" : ""}`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
              {isExpanded && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-[3px] border tracking-wider shrink-0 ${isActive
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1 shrink-0">
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Open Sidebar" : "Collapse Sidebar"}
          className={`hidden lg:flex w-full items-center gap-2 p-2 rounded-[5px] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${!isExpanded ? "justify-center" : "justify-start"
            }`}
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="size-4 shrink-0" />
              {isExpanded && <span>Open Sidebar</span>}
            </>
          ) : (
            <>
              <ChevronLeft className="size-4 shrink-0" />
              {isExpanded && <span>Collapse Sidebar</span>}
            </>
          )}
        </button>


        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSignOutModal(true)}
          className={`w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[5px] cursor-pointer ${!isExpanded ? "justify-center px-0" : ""
            }`}
        >
          <LogOut className="size-4 shrink-0" />
          {isExpanded && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <SignOutDialog
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isSigningOut}
      />
    </aside>
  )
}

export default SuperAdminUserSidebar
