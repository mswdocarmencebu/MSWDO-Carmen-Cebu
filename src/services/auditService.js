import { supabase } from "@/lib/supabaseClient"
import { getApplications } from "./applicationService"
import { getMembers } from "./memberService"
import { getBenefitClaims } from "./benefitService"

const AUDIT_STORAGE_KEY = "mswdo_audit_logs"

/**
 * Normalizes user agent into a readable client description (e.g. "Chrome on Windows")
 */
export function getClientInfo() {
  if (typeof window === "undefined" || !navigator) return "Web Browser"
  const ua = navigator.userAgent
  let browser = "Web Browser"
  let os = "Desktop"

  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"

  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  else if (ua.includes("Linux")) os = "Linux"

  return `${browser} on ${os}`
}

/**
 * Record an audit log entry in Supabase and local cache
 */
export async function recordAuditLog({
  action,
  category = "General",
  details = "",
  user_id = null,
  user_name = null,
  user_email = null,
  role = null,
  record_id = null,
  ip_address = null,
  user_agent = null,
}) {
  const clientInfo = user_agent || getClientInfo()
  const timestamp = new Date().toISOString()

  const payload = {
    action,
    category,
    details,
    user_id,
    user_name: user_name || user_email || "System User",
    user_email,
    role: role || "staff",
    record_id,
    ip_address: ip_address || "127.0.0.1 (Local LGU Network)",
    user_agent: clientInfo,
    created_at: timestamp,
  }

  // 1. Save to local storage cache
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || "[]")
    const updated = [
      { id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...payload },
      ...existing,
    ].slice(0, 300)
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn("Could not cache audit log in localStorage:", err)
  }

  // 2. Persist to Supabase if table exists
  try {
    const { data, error } = await supabase.from("audit_logs").insert([payload]).select().maybeSingle()
    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn("Could not insert audit_log to Supabase:", err.message)
  }

  return payload
}

/**
 * Helper to record user login specifically
 */
export async function recordUserLogin(user, profile) {
  if (!user) return
  const role = profile?.role || user.user_metadata?.role || "applicant_user"
  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

  return recordAuditLog({
    action: "User Logged In",
    category: "Authentication",
    details: `${userName} (${role}) signed into the portal.`,
    user_id: user.id,
    user_name: userName,
    user_email: user.email,
    role,
    record_id: user.id,
  })
}

/**
 * Helper to record user logout
 */
export async function recordUserLogout(user, profile) {
  if (!user) return
  const role = profile?.role || "applicant_user"
  const userName = profile?.full_name || user.email?.split("@")[0] || "User"

  return recordAuditLog({
    action: "User Logged Out",
    category: "Authentication",
    details: `${userName} signed out of the portal session.`,
    user_id: user.id,
    user_name: userName,
    user_email: user.email,
    role,
    record_id: user.id,
  })
}

/**
 * Retrieve all registered users and their session / login status
 */
export async function getLoginUsers() {
  let dbUsers = []

  // 1. Fetch from public.users
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      dbUsers = data
    }
  } catch (err) {
    console.warn("Could not fetch users from Supabase:", err.message)
  }

  // 2. Fetch audit logs to determine last login and session state
  const auditLogs = await getAuditLogs()
  const now = new Date().getTime()

  // Map users with login history
  const mappedUsers = dbUsers.map((u) => {
    const userLogs = auditLogs.filter(
      (l) => l.user_email?.toLowerCase() === u.email?.toLowerCase() || l.user_id === u.id
    )
    const loginLogs = userLogs.filter((l) => l.action.toLowerCase().includes("login") || l.action.toLowerCase().includes("logged in"))
    const lastLoginEntry = loginLogs[0] || null

    let lastLoginTime = lastLoginEntry ? new Date(lastLoginEntry.created_at || lastLoginEntry.date) : null
    let isOnline = false
    if (lastLoginTime && !isNaN(lastLoginTime.getTime())) {
      const diffMinutes = (now - lastLoginTime.getTime()) / (1000 * 60)
      // If logged in within last 45 minutes and no logout since then
      const lastLogout = userLogs.find((l) => l.action.toLowerCase().includes("logged out"))
      const logoutTime = lastLogout ? new Date(lastLogout.created_at || lastLogout.date).getTime() : 0
      isOnline = diffMinutes < 45 && logoutTime <= lastLoginTime.getTime()
    }

    let roleLabel = "Applicant"
    if (u.role === "super_admin_user" || u.role === "itsd") roleLabel = "Super Admin"
    else if (u.role === "admin_staff" || u.role === "inventory_staff") roleLabel = "Staff"

    return {
      id: u.id,
      name: u.full_name || u.email?.split("@")[0] || "User",
      email: u.email,
      role: u.role,
      roleLabel,
      createdAt: u.created_at
        ? new Date(u.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—",
      lastLogin: lastLoginTime && !isNaN(lastLoginTime.getTime())
        ? lastLoginTime.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
        : "Never logged in",
      lastLoginRaw: lastLoginTime || new Date(u.created_at || 0),
      isOnline,
      loginCount: loginLogs.length,
      clientInfo: lastLoginEntry?.user_agent || "Web Client",
      ipAddress: lastLoginEntry?.ip_address || "127.0.0.1 (Local LGU Network)",
    }
  })

  return mappedUsers
}

/**
 * Retrieve comprehensive dynamic activity records from Supabase audit logs + operational tables
 */
export async function getAuditLogs() {
  const combined = []

  // 1. Fetch from public.audit_logs table
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (!error && Array.isArray(data)) {
      data.forEach((l) => {
        combined.push({
          id: l.id,
          date: new Date(l.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          created_at: l.created_at,
          action: l.action,
          category: l.category || "General",
          member: l.user_name || l.user_email || "System Record",
          staff: l.user_name || l.role || "MSWDO Staff",
          staffId: l.user_email || l.user_id || "system",
          details: l.details || "System action logged.",
          user_agent: l.user_agent,
          ip_address: l.ip_address,
        })
      })
    }
  } catch (err) {
    console.warn("Could not query audit_logs table:", err.message)
  }

  // 2. Fetch from localStorage audit cache
  try {
    const cached = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || "[]")
    if (Array.isArray(cached)) {
      cached.forEach((c) => {
        if (!combined.some((item) => item.id === c.id)) {
          combined.push({
            id: c.id,
            date: new Date(c.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
            created_at: c.created_at,
            action: c.action,
            category: c.category || "General",
            member: c.user_name || c.user_email || "System Record",
            staff: c.user_name || c.role || "MSWDO Staff",
            staffId: c.user_email || c.user_id || "system",
            details: c.details || "Activity performed in portal.",
            user_agent: c.user_agent,
            ip_address: c.ip_address,
          })
        }
      })
    }
  } catch {}

  // 3. Derive real operational records from applications
  try {
    const apps = await getApplications()
    if (Array.isArray(apps)) {
      apps.forEach((a) => {
        // Application Submitted event
        if (a.submitted && a.submitted !== "—") {
          combined.push({
            id: `ACT-APP-SUB-${a.id}`,
            date: a.submitted,
            created_at: new Date(a.submitted).toISOString(),
            action: "Application Submitted",
            category: a.sector || "General",
            member: a.name,
            staff: "Applicant Portal",
            staffId: a.reference || a.id,
            details: `New ${a.sector || ""} application submitted by ${a.name} (Ref: ${a.reference})`,
          })
        }

        // Status specific event (Approved, Rejected, Needs correction, Terminated)
        if (a.status && a.status !== "Pending") {
          let actName = `Application ${a.status}`
          if (a.status === "Needs correction") actName = "Status Correction Requested"
          else if (a.status === "Terminated") actName = "Member Terminated"

          combined.push({
            id: `ACT-APP-STAT-${a.id}-${a.status}`,
            date: a.submitted,
            created_at: new Date(a.submitted).toISOString(),
            action: actName,
            category: a.sector || "General",
            member: a.name,
            staff: "MSWDO Officer",
            staffId: a.reference || a.id,
            details: `Application marked as "${a.status}" for ${a.name} (Ref: ${a.reference})`,
          })
        }
      })
    }
  } catch {}

  // 4. Derive operational records from benefit claims
  try {
    const claims = await getBenefitClaims()
    if (Array.isArray(claims)) {
      claims.forEach((c) => {
        combined.push({
          id: `ACT-CLM-${c.id || c.claimNumber}`,
          date: c.date || "Recent",
          created_at: new Date().toISOString(),
          action: c.status === "Processed" ? "Benefit Claim Processed" : "Benefit Claim Submitted",
          category: c.sector || "Welfare Assistance",
          member: c.memberName || "Beneficiary",
          staff: "Disbursement Officer",
          staffId: c.memberId || c.claimNumber,
          details: `${c.benefit || "Grant"} (${c.amount || "₱1,000"}) - ${c.status || "Pending"} via ${c.releaseMethod || "Cash"}`,
        })
      })
    }
  } catch {}

  // 5. Integrate termination history
  try {
    const termHistory = JSON.parse(localStorage.getItem("mswdo_termination_history") || "[]")
    if (Array.isArray(termHistory)) {
      termHistory.forEach((t) => {
        combined.push({
          id: `ACT-TERM-${t.id}`,
          date: t.timestamp || "Recent",
          created_at: new Date().toISOString(),
          action: t.action === "Terminated" ? "Member Terminated" : "Member Restored",
          category: "Account Control",
          member: t.name,
          staff: "Super Admin",
          staffId: t.memberId || "admin",
          details: `Account status for "${t.name}" updated to ${t.action}.`,
        })
      })
    }
  } catch {}

  // Sort by date descending
  return combined.sort((a, b) => {
    const timeA = new Date(a.created_at || a.date).getTime() || 0
    const timeB = new Date(b.created_at || b.date).getTime() || 0
    return timeB - timeA
  })
}
