import React, { useState, useMemo, useEffect, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Activity,
  Search,
  ClipboardList,
  CalendarClock,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  Download,
  Loader2,
  Laptop,
  CheckCircle2,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"
import { getAuditLogs, getLoginUsers } from "@/services/auditService"

/* ─────────────────────────────────────────────
   Action badge colors
───────────────────────────────────────────── */
const ACTION_COLORS = {
  "User Logged In":                   "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "User Logged Out":                  "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  "Approval Email Sent":              "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "Member Account Created":           "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Member Category Assigned":         "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  "Application Approved":             "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Application Appointment Scheduled":"bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "Document Verified":                "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  "CMS Content Published":            "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Announcement Published":           "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Announcement Unpublished":         "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  "Member Profile Printed":           "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  "Member Profile Updated":           "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Application Submitted":            "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "Application Rejected":             "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "Application Resubmitted":          "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "Status Correction Requested":      "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Document Uploaded":                "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  "Benefit Claim Processed":          "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Benefit Claim Submitted":          "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  "Member Terminated":                "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "Member Restored":                  "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

function ActionBadge({ action }) {
  const cls = ACTION_COLORS[action] ?? "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border whitespace-nowrap ${cls}`}>
      {action}
    </span>
  )
}

function RoleBadge({ role }) {
  if (role === "super_admin_user" || role === "itsd") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        <ShieldCheck className="size-3" />
        Super Admin
      </span>
    )
  }
  if (role === "admin_staff" || role === "inventory_staff") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
        <UserCheck className="size-3" />
        Staff
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
      <Users className="size-3" />
      Applicant
    </span>
  )
}

export function SuperAdminAuditPage() {
  // Tab State: "logins" (User Login & Sessions) | "activities" (Operational Activity Log)
  const [activeTab, setActiveTab]         = useState("logins")
  const [loading, setLoading]             = useState(true)

  // Live Data
  const [auditLogs, setAuditLogs]         = useState([])
  const [loginUsers, setLoginUsers]       = useState([])

  // Activity Log Filters
  const [search, setSearch]               = useState("")
  const [actionFilter, setActionFilter]   = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [fromDate, setFromDate]           = useState("")
  const [toDate, setToDate]               = useState("")
  const [activityPage, setActivityPage]   = useState(1)
  const [activityRows, setActivityRows]   = useState(15)

  // Login Users Filters
  const [userSearch, setUserSearch]       = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("")
  const [userPage, setUserPage]           = useState(1)
  const [userRows, setUserRows]           = useState(10)

  // Load all live audit & login user data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [logs, users] = await Promise.all([
        getAuditLogs(),
        getLoginUsers(),
      ])
      setAuditLogs(Array.isArray(logs) ? logs : [])
      setLoginUsers(Array.isArray(users) ? users : [])
    } catch (err) {
      console.warn("Could not load audit data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener("focus", handleSync)
    window.addEventListener("storage", handleSync)
    return () => {
      window.removeEventListener("focus", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [loadData])

  /* ─────────────────────────────────────────────
     Derived Activity Log Data
  ───────────────────────────────────────────── */
  const todayStr = new Date().toDateString()
  const activityToday = auditLogs.filter((l) => new Date(l.created_at || l.date).toDateString() === todayStr).length
  const uniqueStaffCount = new Set(auditLogs.map((l) => l.staff).filter(Boolean)).size
  const loginEventsCount = auditLogs.filter((l) => l.action.includes("Login") || l.action.includes("Logged In")).length

  const availableActions = useMemo(() =>
    [...new Set(auditLogs.map((l) => l.action).filter(Boolean))].sort(),
    [auditLogs]
  )

  const availableCategories = useMemo(() =>
    [...new Set(auditLogs.map((l) => l.category).filter(Boolean))].sort(),
    [auditLogs]
  )

  const q = search.toLowerCase().trim()
  const filteredActivities = useMemo(() =>
    auditLogs.filter((l) => {
      const matchSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        (l.member && l.member.toLowerCase().includes(q)) ||
        (l.staff && l.staff.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
      const matchAction   = !actionFilter   || l.action   === actionFilter
      const matchCategory = !categoryFilter || l.category === categoryFilter
      const logDate = new Date(l.created_at || l.date)
      const matchFrom = !fromDate || isNaN(logDate) || logDate >= new Date(fromDate)
      const matchTo   = !toDate   || isNaN(logDate) || logDate <= new Date(toDate + "T23:59:59")
      return matchSearch && matchAction && matchCategory && matchFrom && matchTo
    }),
    [auditLogs, q, actionFilter, categoryFilter, fromDate, toDate]
  )

  const totalActivityPages = Math.ceil(filteredActivities.length / activityRows) || 1
  const displayedActivities = filteredActivities.slice(
    (activityPage - 1) * activityRows,
    activityPage * activityRows
  )

  /* ─────────────────────────────────────────────
     Derived Login Users Data
  ───────────────────────────────────────────── */
  const totalRegisteredUsers = loginUsers.length
  const onlineUsersCount = loginUsers.filter((u) => u.isOnline).length
  const staffUsersCount = loginUsers.filter((u) => u.role === "admin_staff" || u.role === "super_admin_user" || u.role === "itsd").length

  const uq = userSearch.toLowerCase().trim()
  const filteredUsers = useMemo(() =>
    loginUsers.filter((u) => {
      const matchSearch =
        !uq ||
        u.name.toLowerCase().includes(uq) ||
        u.email.toLowerCase().includes(uq)
      const matchRole =
        !userRoleFilter ||
        (userRoleFilter === "super_admin" && (u.role === "super_admin_user" || u.role === "itsd")) ||
        (userRoleFilter === "staff" && (u.role === "admin_staff" || u.role === "inventory_staff")) ||
        (userRoleFilter === "applicant" && (u.role === "applicant_user" || u.role === "end_user"))
      const matchStatus =
        !userStatusFilter ||
        (userStatusFilter === "online" && u.isOnline) ||
        (userStatusFilter === "offline" && !u.isOnline)
      return matchSearch && matchRole && matchStatus
    }),
    [loginUsers, uq, userRoleFilter, userStatusFilter]
  )

  const totalUserPages = Math.ceil(filteredUsers.length / userRows) || 1
  const displayedUsers = filteredUsers.slice(
    (userPage - 1) * userRows,
    userPage * userRows
  )

  /* ── Export CSV ── */
  const handleExportCSV = () => {
    if (activeTab === "logins") {
      const headers = ["User Name", "Email", "Role", "Last Login", "Status", "Client / Device", "IP Address"]
      const rows = filteredUsers.map((u) => [
        u.name, u.email, u.roleLabel, u.lastLogin, u.isOnline ? "Online" : "Offline", u.clientInfo, u.ipAddress
      ])
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
      downloadBlob(csv, `mswdo-login-users-${new Date().toISOString().slice(0, 10)}.csv`)
    } else {
      const headers = ["Timestamp", "Action", "Category", "Member / Record", "Staff / Operator", "Details"]
      const rows = filteredActivities.map((l) => [
        l.date, l.action, l.category, l.member, l.staff, l.details
      ])
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
      downloadBlob(csv, `mswdo-audit-activity-${new Date().toISOString().slice(0, 10)}.csv`)
    }
  }

  const downloadBlob = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SuperAdminUserLayout activeTab="audit">
      <div className="space-y-4">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Activity className="size-3.5" />
                Security &amp; Operational Monitoring
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Audit &amp; Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live tracking of login users, active sessions, and system operational activity records.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleExportCSV}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── View Switcher Tabs ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("logins")}
            className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "logins"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <LogIn className="size-3.5" />
            <span>Login Users &amp; Sessions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "logins" ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-foreground"
            }`}>
              {loginUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "activities"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <ClipboardList className="size-3.5" />
            <span>Operational Activity Records</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "activities" ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-foreground"
            }`}>
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: LOGIN USERS & SESSIONS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "logins" && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Registered Accounts", value: totalRegisteredUsers, icon: Users, color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" },
                { label: "Currently Online",    value: onlineUsersCount,     icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" },
                { label: "Staff & Admin Users", value: staffUsersCount,      icon: ShieldCheck, color: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" },
                { label: "Total Logins Recorded", value: loginEventsCount,   icon: LogIn, color: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400" },
              ].map((s) => (
                <Card key={s.label} className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                        {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : s.value}
                      </p>
                    </div>
                    <div className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 ${s.color}`}>
                      <s.icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter Card */}
            <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                      placeholder="Search users by name or email…"
                      className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
                    />
                    {userSearch && (
                      <button onClick={() => { setUserSearch(""); setUserPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="staff">Staff</option>
                    <option value="applicant">Applicant</option>
                  </select>

                  {/* Status filter */}
                  <select
                    value={userStatusFilter}
                    onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="online">Online Now</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Login Users Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Login Users &amp; Session Registry
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {loading ? "Loading users…" : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} registered`}
                  </span>
                </h2>
              </div>

              <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">User</th>
                          <th className="py-3 px-4 font-semibold">Role</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold whitespace-nowrap">Last Login</th>
                          <th className="py-3 px-4 font-semibold">Client / Device</th>
                          <th className="py-3 px-4 font-semibold">Network IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Loading user session records…
                              </div>
                            </td>
                          </tr>
                        ) : displayedUsers.length === 0 ? (
                          userSearch || userRoleFilter || userStatusFilter ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                                No users match the current filter criteria.
                              </td>
                            </tr>
                          ) : null
                        ) : (
                          displayedUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="relative">
                                    <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center uppercase">
                                      {u.name?.[0] || "U"}
                                    </div>
                                    <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                                      u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                                    }`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">{u.name}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <RoleBadge role={u.role} />
                              </td>
                              <td className="py-3.5 px-4">
                                {u.isOnline ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="size-3 text-muted-foreground/70" />
                                  {u.lastLogin}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Laptop className="size-3.5 text-muted-foreground/70 shrink-0" />
                                  <span className="truncate max-w-[180px]">{u.clientInfo}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                                {u.ipAddress}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <DataTablePagination
                  currentPage={userPage}
                  totalPages={totalUserPages}
                  totalItems={filteredUsers.length}
                  pageSize={userRows}
                  onPageChange={setUserPage}
                  onPageSizeChange={(n) => { setUserRows(n); setUserPage(1) }}
                  itemLabel="users"
                />
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: OPERATIONAL ACTIVITY RECORDS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "activities" && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Recorded activities</p>
                    <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                      {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : auditLogs.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Across all municipal operations</p>
                  </div>
                  <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ClipboardList className="size-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Activity today</p>
                    <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                      {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : activityToday}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Actions recorded today</p>
                  </div>
                  <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CalendarClock className="size-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Staff &amp; actors</p>
                    <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                      {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : uniqueStaffCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Unique operators in log</p>
                  </div>
                  <div className="size-10 rounded-[5px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Users className="size-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Card */}
            <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setActivityPage(1) }}
                      placeholder="Search actions, members, or staff…"
                      className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
                    />
                    {search && (
                      <button onClick={() => { setSearch(""); setActivityPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Action filter */}
                  <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setActivityPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Actions</option>
                    {availableActions.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>

                  {/* Category filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setActivityPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {/* Date range */}
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setActivityPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setActivityPage(1) }}
                    className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Activities Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Activity Trail
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {loading ? "Loading activities…" : `${filteredActivities.length} record${filteredActivities.length !== 1 ? "s" : ""}`}
                  </span>
                </h2>
              </div>

              <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold whitespace-nowrap">Date &amp; Time</th>
                          <th className="py-3 px-4 font-semibold">Action</th>
                          <th className="py-3 px-4 font-semibold whitespace-nowrap">Member / Target</th>
                          <th className="py-3 px-4 font-semibold">Staff / Actor</th>
                          <th className="py-3 px-4 font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Loading activity records…
                              </div>
                            </td>
                          </tr>
                        ) : displayedActivities.length === 0 ? (
                          search || actionFilter || categoryFilter || fromDate || toDate ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                                No activity records match the current filters.
                              </td>
                            </tr>
                          ) : null
                        ) : (
                          displayedActivities.map((l) => (
                            <tr key={l.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">{l.date}</td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <ActionBadge action={l.action} />
                                  <p className="text-[10px] text-muted-foreground">{l.category}</p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-foreground">{l.member}</p>
                                {l.staffId && (
                                  <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">{l.staffId}</p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-foreground font-medium">{l.staff}</td>
                              <td className="py-3.5 px-4 text-muted-foreground max-w-sm">{l.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <DataTablePagination
                  currentPage={activityPage}
                  totalPages={totalActivityPages}
                  totalItems={filteredActivities.length}
                  pageSize={activityRows}
                  onPageChange={setActivityPage}
                  onPageSizeChange={(n) => { setActivityRows(n); setActivityPage(1) }}
                  itemLabel="records"
                />
              </Card>
            </div>
          </div>
        )}

      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminAuditPage
