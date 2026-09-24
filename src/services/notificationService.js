import { supabase } from "@/lib/supabaseClient"

export const NOTIFICATIONS_STORAGE_KEY = "mswdo_live_notifications"
export const NOTIFICATIONS_EVENT = "mswdo_notifications_updated"

// Helper to test if a string is a valid PostgreSQL UUID
export function isUUID(str) {
  if (!str || typeof str !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

// Convert DB snake_case record to camelCase application object
export function mapDbRowToNotification(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title || "Notification",
    message: row.message || "",
    type: row.type || "system",
    sector: row.sector || "General",
    recipientRole: row.recipient_role || "all",
    recipientUserId: row.recipient_user_id || null,
    recipientEmail: row.recipient_email ? row.recipient_email.toLowerCase() : null,
    reference: row.reference || null,
    link: row.link || null,
    isRead: Boolean(row.is_read),
    readBy: Array.isArray(row.read_by) ? row.read_by : [],
    metadata: row.metadata || {},
    createdAt: row.created_at || new Date().toISOString(),
  }
}

// Initial seed notifications across sectors and roles for mock & offline fallback
export const DEFAULT_SEED_NOTIFICATIONS = [
  {
    id: "notif-seed-01",
    title: "New Youth Application",
    message: "Neil Delante submitted a new Youth intake application (MSWDO-2026-NR7FKNEAC2).",
    type: "application_submitted",
    sector: "Youth",
    recipientRole: "admin",
    recipientEmail: "nemo.delante@gmail.com",
    reference: "MSWDO-2026-NR7FKNEAC2",
    link: "/dashboard/applications",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-seed-02",
    title: "Benefit Claim Filed: Ayuda Sa Kabataan",
    message: "Neil M Delante requested financial subsidy for Ayuda Sa Kabataan (₱1,000.00).",
    type: "benefit_submitted",
    sector: "Youth",
    recipientRole: "admin",
    recipientEmail: "neilmolinadelante@gmail.com",
    reference: "CLM-001",
    link: "/dashboard/benefits",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "notif-seed-03",
    title: "New Senior Citizen Enrollment",
    message: "Maria Gomez Reyes submitted a Senior Citizen Pension enrollment (MSWDO-2026-SC20269921).",
    type: "application_submitted",
    sector: "Senior Citizen",
    recipientRole: "admin",
    recipientEmail: "mary.reyes@gmail.com",
    reference: "MSWDO-2026-SC20269921",
    link: "/dashboard/applications",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "notif-seed-04",
    title: "Application Approved",
    message: "Congratulations! Your Youth Intake application (MSWDO-2026-NR7FKNEAC2) has been approved by MSWDO Carmen.",
    type: "application_approved",
    sector: "Youth",
    recipientRole: "applicant",
    recipientEmail: "nemo.delante@gmail.com",
    reference: "MSWDO-2026-NR7FKNEAC2",
    link: "/dashboard/applicant/status",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "notif-seed-05",
    title: "Benefit Claim Processing",
    message: "Your benefit claim for Ayuda Sa Kabataan is currently in the fund allocation and voucher release stage.",
    type: "benefit_processed",
    sector: "Youth",
    recipientRole: "applicant",
    recipientEmail: "neilmolinadelante@gmail.com",
    reference: "CLM-001",
    link: "/dashboard/applicant/status",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "notif-seed-06",
    title: "New Solo Parent Registration",
    message: "Elena Santos Bautista submitted a Women's Welfare solo parent assistance application.",
    type: "application_submitted",
    sector: "Women's Welfare",
    recipientRole: "admin",
    recipientEmail: "elena.bautista@gmail.com",
    reference: "MSWDO-2026-WW44918290",
    link: "/dashboard/applications",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "notif-seed-07",
    title: "Disability Assessment Verified",
    message: "Shen M. Delante (PWD) medical evaluation authenticated by MSWDO health caseworker.",
    type: "application_approved",
    sector: "Person with Disability (PWD)",
    recipientRole: "admin",
    recipientEmail: "alotajennery@gmail.com",
    reference: "MSWDO-2026-SD99182701",
    link: "/dashboard/applications",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: "notif-seed-08",
    title: "ID & Assistance Ready for Pick-up",
    message: "Your PWD ID and municipal assistance voucher are authorized for pick-up at Carmen Municipal Hall.",
    type: "benefit_processed",
    sector: "Person with Disability (PWD)",
    recipientRole: "applicant",
    recipientEmail: "alotajennery@gmail.com",
    reference: "MSWDO-97172",
    link: "/dashboard/applicant/status",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
]

/**
 * Retrieve notifications from local cache (synchronous)
 */
export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_NOTIFICATIONS))
      return DEFAULT_SEED_NOTIFICATIONS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_SEED_NOTIFICATIONS
  } catch {
    return DEFAULT_SEED_NOTIFICATIONS
  }
}

/**
 * Fetch fresh notifications from Supabase, synchronizing with localStorage cache
 */
export async function fetchLiveNotificationsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && Array.isArray(data) && data.length > 0) {
      const dbNotifs = data.map(mapDbRowToNotification)
      // Merge with existing local seeds/notifications that might not be in DB yet
      const local = getNotifications()
      const dbIds = new Set(dbNotifs.map((n) => n.id))
      const combined = [...dbNotifs, ...local.filter((l) => !dbIds.has(l.id))]

      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(combined))
      } catch {}

      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: { source: "supabase" } }))
      return combined
    }
  } catch (err) {
    console.warn("Notice: Supabase notifications fetch notice:", err.message)
  }

  return getNotifications()
}

/**
 * Create a new notification and persist directly into Supabase (with localStorage fallback)
 */
export async function createNotification(notifData) {
  const localList = getNotifications()
  const tempId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const payload = {
    title: notifData.title || "MSWDO Notification",
    message: notifData.message || "",
    type: notifData.type || "system",
    sector: notifData.sector || "General",
    recipient_role: notifData.recipientRole || "all", // "admin" | "staff" | "applicant" | "all"
    recipient_user_id: notifData.recipientUserId || null,
    recipient_email: notifData.recipientEmail ? String(notifData.recipientEmail).trim().toLowerCase() : null,
    reference: notifData.reference || null,
    link: notifData.link || null,
    is_read: Boolean(notifData.isRead),
    read_by: [],
    metadata: notifData.metadata || {},
  }

  let dbSaved = null

  // 1. Insert into Supabase notifications table
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([payload])
      .select()
      .maybeSingle()

    if (!error && data) {
      dbSaved = mapDbRowToNotification(data)
    } else if (error) {
      console.warn("Could not insert notification into Supabase:", error.message)
    }
  } catch (err) {
    console.warn("Supabase notification insert exception:", err.message)
  }

  // Final unified notification object
  const finalNotif = dbSaved || {
    id: tempId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    sector: payload.sector,
    recipientRole: payload.recipient_role,
    recipientUserId: payload.recipient_user_id,
    recipientEmail: payload.recipient_email,
    reference: payload.reference,
    link: payload.link,
    isRead: payload.is_read,
    readBy: [],
    metadata: payload.metadata,
    createdAt: new Date().toISOString(),
  }

  // 2. Persist in localStorage for instant offline access and UI update
  try {
    const updated = [finalNotif, ...localList.filter((n) => n.id !== finalNotif.id)]
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn("Could not save notification to localStorage:", err)
  }

  // 3. Trigger live UI updates across components and windows
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: finalNotif }))
  window.dispatchEvent(new Event("storage"))

  return finalNotif
}

/**
 * Mark a single notification as read in Supabase & localStorage
 */
export async function markNotificationAsRead(id, currentUserId = null) {
  if (!id) return

  // Update in Supabase if id is a UUID
  if (isUUID(id)) {
    try {
      await supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    } catch (err) {
      console.warn("Could not update notification in Supabase:", err.message)
    }
  }

  // Update in localStorage
  const all = getNotifications()
  const updated = all.map((n) => (n.id === id ? { ...n, isRead: true } : n))
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: { id, read: true } }))
  window.dispatchEvent(new Event("storage"))
  return updated
}

/**
 * Mark a set or all notifications as read in Supabase & localStorage
 */
export async function markAllNotificationsAsRead(filterIds = null, currentUserId = null) {
  const all = getNotifications()
  const idSet = filterIds ? new Set(filterIds) : null

  // Collect UUIDs to update in Supabase
  const uuidList = (filterIds || all.map((n) => n.id)).filter(isUUID)
  if (uuidList.length > 0) {
    try {
      await supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .in("id", uuidList)
    } catch (err) {
      console.warn("Could not batch update notifications in Supabase:", err.message)
    }
  }

  const updated = all.map((n) => {
    if (!idSet || idSet.has(n.id)) {
      return { ...n, isRead: true }
    }
    return n
  })

  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: { allRead: true } }))
  window.dispatchEvent(new Event("storage"))
  return updated
}

/**
 * Remove a single notification from Supabase & localStorage
 */
export async function deleteNotification(id) {
  if (!id) return

  if (isUUID(id)) {
    try {
      await supabase.from("notifications").delete().eq("id", id)
    } catch (err) {
      console.warn("Could not delete notification from Supabase:", err.message)
    }
  }

  const all = getNotifications()
  const updated = all.filter((n) => n.id !== id)
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: { id, deleted: true } }))
  window.dispatchEvent(new Event("storage"))
  return updated
}

/**
 * Real-time channel listener for live incoming notifications across clients
 */
export function subscribeToLiveNotifications(onUpdate) {
  try {
    const channel = supabase
      .channel("public:notifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const mapped = mapDbRowToNotification(payload.new)
            const local = getNotifications()
            const exists = local.some((n) => n.id === mapped.id)
            if (!exists) {
              const updated = [mapped, ...local]
              try {
                localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
              } catch {}
            }
          }
          if (typeof onUpdate === "function") {
            onUpdate(payload)
          }
          window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: payload }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  } catch (err) {
    console.warn("Could not initialize Supabase Realtime channel for notifications:", err)
    return () => {}
  }
}

/**
 * Filters raw notification array for a specific logged-in user according to their role, email, and staff sector permissions
 */
export function filterNotificationsForUser(allNotifs = [], authState = {}, permissions = null) {
  const { role, profile, user } = authState
  const userEmail = (profile?.email || user?.email || "").toLowerCase()
  const userId = user?.id || profile?.id || null
  const isSuperAdmin = role === "super_admin_user" || role === "itsd"
  const isAdminStaff = role === "admin_staff" || role === "inventory_staff"
  const isApplicant = role === "applicant_user" || role === "end_user"

  // 1. Super Admin: full access to all admin, staff, and municipal notifications
  if (isSuperAdmin) {
    return allNotifs.filter(
      (n) => n.recipientRole === "admin" || n.recipientRole === "staff" || n.recipientRole === "all"
    )
  }

  // 2. Admin Staff: restricted to notifications permitted for admin/staff AND matching their sector access
  if (isAdminStaff) {
    return allNotifs.filter((n) => {
      // Must be intended for admin or staff or all
      if (n.recipientRole !== "admin" && n.recipientRole !== "staff" && n.recipientRole !== "all") {
        return false
      }

      // If notification has no sector or is General, staff can see it
      if (!n.sector || n.sector.toLowerCase() === "general" || n.sector.toLowerCase() === "all") {
        return true
      }

      // If permissions object with hasCategoryAccess is provided, strictly enforce sector access
      if (permissions && typeof permissions.hasCategoryAccess === "function") {
        return permissions.hasCategoryAccess(n.sector)
      }

      return true
    })
  }

  // 3. Applicant: only notifications addressed to this applicant's email/userId or broadcast to all applicants
  if (isApplicant) {
    return allNotifs.filter((n) => {
      if (n.recipientRole === "admin" || n.recipientRole === "staff") return false

      if (n.recipientUserId && userId) {
        if (n.recipientUserId === userId) return true
      }

      if (n.recipientEmail && userEmail) {
        return n.recipientEmail.toLowerCase() === userEmail
      }

      // If no specific email or user id is targeted, check if it's general for applicant
      return n.recipientRole === "applicant" || n.recipientRole === "all"
    })
  }

  return allNotifs
}
