import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  Bell,
  CheckCircle2,
  FileText,
  HeartHandshake,
  AlertCircle,
  Clock,
  CheckCheck,
  ChevronDown,
  Layers,
  X,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import {
  getNotifications,
  fetchLiveNotificationsFromSupabase,
  subscribeToLiveNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  filterNotificationsForUser,
  NOTIFICATIONS_EVENT,
} from "@/services/notificationService"

// Helper for relative timestamps
function formatTimeAgo(dateString) {
  if (!dateString) return "Recently"
  const date = new Date(dateString)
  const now = new Date()
  const diffInSec = Math.floor((now - date) / 1000)

  if (diffInSec < 60) return "Just now"
  const diffInMin = Math.floor(diffInSec / 60)
  if (diffInMin < 60) return `${diffInMin}m ago`
  const diffInHours = Math.floor(diffInMin / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotificationsDropdown() {
  const { role, profile, user } = useAuth()
  const { navigate } = useRouter()
  const permissions = useStaffPermissions()

  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState("all") // "all" | "unread"
  const [notifications, setNotifications] = useState([])
  const [visibleCount, setVisibleCount] = useState(5) // Lazy loading page size
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const dropdownRef = useRef(null)

  // Load and filter notifications
  const reloadNotifications = useCallback(() => {
    const raw = getNotifications()
    const userFiltered = filterNotificationsForUser(raw, { role, profile, user }, permissions)
    setNotifications(userFiltered)
  }, [role, profile, user, permissions])

  useEffect(() => {
    reloadNotifications()

    // 1. Fetch latest notifications from Supabase
    fetchLiveNotificationsFromSupabase().then(() => {
      reloadNotifications()
    })

    // 2. Listen to real-time notification events & cross-tab storage updates
    const handleUpdate = () => {
      reloadNotifications()
    }

    window.addEventListener(NOTIFICATIONS_EVENT, handleUpdate)
    window.addEventListener("storage", handleUpdate)
    window.addEventListener("application_status_updated", handleUpdate)

    // 3. Supabase Realtime Channel Subscription
    const unsubscribe = subscribeToLiveNotifications(() => {
      reloadNotifications()
    })

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, handleUpdate)
      window.removeEventListener("storage", handleUpdate)
      window.removeEventListener("application_status_updated", handleUpdate)
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [reloadNotifications])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Reset lazy-loading count whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(5)
    }
  }, [isOpen])

  // Count unread notifications
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // Filtered notifications list (All vs Unread)
  const activeList = useMemo(() => {
    if (filterType === "unread") {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }, [notifications, filterType])

  // Lazy loaded slice
  const visibleNotifications = useMemo(() => {
    return activeList.slice(0, visibleCount)
  }, [activeList, visibleCount])

  const hasMore = activeList.length > visibleCount

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5)
      setIsLoadingMore(false)
    }, 200)
  }

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id, user?.id)
    reloadNotifications()
    setIsOpen(false)

    const isSuperAdmin = role === "super_admin_user" || role === "itsd"
    const isStaff = role === "admin_staff" || role === "inventory_staff"
    const isApplicant = role === "applicant_user" || role === "end_user"

    let targetUrl = notif.link || ""

    // 1. Application-related notifications
    if (
      notif.type === "application_submitted" ||
      notif.type === "application_approved" ||
      notif.type === "document_correction"
    ) {
      const refQuery = notif.reference ? `?ref=${encodeURIComponent(notif.reference)}` : ""
      if (isSuperAdmin) {
        targetUrl = `/dashboard/super-admin/applications${refQuery}`
      } else if (isStaff) {
        targetUrl = `/dashboard/admin-staff/applications${refQuery}`
      } else {
        targetUrl = `/dashboard/applicant/applications${refQuery}`
      }
    }
    // 2. Benefit-related notifications
    else if (
      notif.type === "benefit_submitted" ||
      notif.type === "benefit_processed"
    ) {
      const refQuery = notif.reference ? `?ref=${encodeURIComponent(notif.reference)}` : ""
      if (isSuperAdmin) {
        targetUrl = `/dashboard/super-admin/benefits${refQuery}`
      } else if (isStaff) {
        targetUrl = `/dashboard/admin-staff/benefits${refQuery}`
      } else {
        targetUrl = `/dashboard/applicant/benefits${refQuery}`
      }
    }
    // 3. Fallback or generic routes
    else if (targetUrl) {
      if (targetUrl.startsWith("/dashboard/applications")) {
        const query = notif.reference ? `?ref=${encodeURIComponent(notif.reference)}` : ""
        targetUrl = isSuperAdmin
          ? `/dashboard/super-admin/applications${query}`
          : isStaff
          ? `/dashboard/admin-staff/applications${query}`
          : `/dashboard/applicant/applications${query}`
      } else if (targetUrl.startsWith("/dashboard/benefits")) {
        const query = notif.reference ? `?ref=${encodeURIComponent(notif.reference)}` : ""
        targetUrl = isSuperAdmin
          ? `/dashboard/super-admin/benefits${query}`
          : isStaff
          ? `/dashboard/admin-staff/benefits${query}`
          : `/dashboard/applicant/benefits${query}`
      }
    }

    if (targetUrl) {
      navigate(targetUrl)
    }
  }

  const handleMarkAllRead = () => {
    const activeIds = activeList.map((n) => n.id)
    markAllNotificationsAsRead(activeIds, user?.id)
    reloadNotifications()
  }

  // Get icon by notification type
  const renderNotificationIcon = (type) => {
    switch (type) {
      case "application_submitted":
        return <FileText className="size-4 text-blue-600 dark:text-blue-400" />
      case "application_approved":
        return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
      case "document_correction":
        return <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
      case "benefit_submitted":
      case "benefit_processed":
        return <HeartHandshake className="size-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Bell className="size-4 text-zinc-600 dark:text-zinc-400" />
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button with RED indicator and count */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="size-4.5" />

        {/* RED NOTIFICATION INDICATOR & COUNT (Applied to all roles) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-xs leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[6px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="size-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => {
                setFilterType("all")
                setVisibleCount(5)
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType("unread")
                setVisibleCount(5)
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
                filterType === "unread"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List (Lazy Loaded to prevent overwhelming) */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {activeList.length === 0 ? (
              <div className="p-8 text-center space-y-1.5">
                <div className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground/60 mx-auto">
                  <Bell className="size-4.5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No Notifications</p>
                <p className="text-[11px] text-muted-foreground">
                  {filterType === "unread"
                    ? "You are all caught up on all notices."
                    : "No notifications found for your account."}
                </p>
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                    !notif.isRead
                      ? "bg-blue-50/30 dark:bg-blue-950/20"
                      : "bg-white dark:bg-zinc-900"
                  }`}
                >
                  {/* Icon badge */}
                  <div className="size-8 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center shrink-0 mt-0.5">
                    {renderNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4
                        className={`text-xs font-bold leading-tight truncate ${
                          !notif.isRead ? "text-foreground" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      {notif.sector && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {notif.sector}
                        </span>
                      )}
                      {notif.reference && (
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {notif.reference}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread Red Dot */}
                  {!notif.isRead && (
                    <span className="size-2 rounded-full bg-rose-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}

            {/* Lazy Load Trigger Button (Appears if too many datas) */}
            {hasMore && (
              <div className="p-2.5 text-center bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-1.5 px-3 rounded-[4px] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition-colors border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center gap-1.5"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="size-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      <span>
                        Load more ({activeList.length - visibleCount} remaining)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsDropdown
