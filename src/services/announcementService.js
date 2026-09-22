import { supabase } from "@/lib/supabaseClient"

const ANNOUNCEMENTS_STORAGE_KEY = "mswdo_announcements"

function isUUID(str) {
  if (!str || typeof str !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function notifyStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
  }
}

/**
 * Map database row to standard frontend Announcement object
 */
export function mapDbRowToAnnouncement(row) {
  if (!row) return null

  let audienceArr = []
  if (Array.isArray(row.audience)) {
    audienceArr = row.audience
  } else if (typeof row.audience === "string") {
    try {
      audienceArr = JSON.parse(row.audience)
    } catch {
      audienceArr = [row.audience]
    }
  }

  return {
    id: row.code || row.id,
    dbId: row.id,
    code: row.code || row.id,
    title: row.title || "Untitled Announcement",
    message: row.message || "",
    audience: Array.isArray(audienceArr) ? audienceArr : [],
    expiry: row.expiry || "",
    status: row.status || "Published",
    pinned: Boolean(row.pinned),
    authorName: row.author_name || "Super Admin",
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent",
  }
}

/**
 * 1. Fetch announcements dynamically from Supabase
 * Strictly returns [] if empty — NO FALLBACK mock data.
 */
export async function getAnnouncements() {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      if (data.length === 0) {
        // Table exists and is empty — strictly return empty array
        localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify([]))
        return []
      }
      const mapped = data.map(mapDbRowToAnnouncement)
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(mapped))
      return mapped
    }
  } catch (err) {
    console.warn("Could not load announcements from Supabase:", err.message)
  }

  // Fallback cache only for locally saved items in this browser session
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {}

  // If no data exists from DB or local cache, strictly return empty array (NO MOCK FALLBACK)
  return []
}

/**
 * 2. Create new announcement
 */
export async function saveAnnouncement(announcementData) {
  const code = announcementData.id || announcementData.code || `ANN-${Date.now().toString().slice(-4)}`
  const audience = Array.isArray(announcementData.audience) ? announcementData.audience : []
  const expiryVal = announcementData.expiry && announcementData.expiry.trim() ? announcementData.expiry : null

  const payload = {
    code: code,
    title: announcementData.title.trim(),
    message: announcementData.message.trim(),
    audience: audience,
    expiry: expiryVal,
    status: announcementData.status || "Published",
    pinned: Boolean(announcementData.pinned),
    updated_at: new Date().toISOString(),
  }

  let savedItem = null

  try {
    const { data, error } = await supabase
      .from("announcements")
      .insert([payload])
      .select()
      .single()

    if (!error && data) {
      savedItem = mapDbRowToAnnouncement(data)
    }
  } catch (err) {
    console.warn("Supabase insert announcement error:", err.message)
  }

  if (!savedItem) {
    savedItem = {
      id: code,
      dbId: `local-${Date.now()}`,
      code: code,
      title: payload.title,
      message: payload.message,
      audience: payload.audience,
      expiry: payload.expiry || "",
      status: payload.status,
      pinned: payload.pinned,
      authorName: "Super Admin",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }
  }

  // Update local cache
  try {
    const existing = await getAnnouncements()
    const updatedList = [savedItem, ...existing.filter((a) => a.id !== savedItem.id && a.dbId !== savedItem.dbId)]
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updatedList))
    notifyStorageChange()
  } catch {}

  return savedItem
}

/**
 * 3. Update existing announcement
 */
export async function updateAnnouncement(target, updates) {
  if (!target) return null

  const audience = Array.isArray(updates.audience)
    ? updates.audience
    : target.audience || []

  const expiryVal =
    updates.expiry !== undefined
      ? updates.expiry && updates.expiry.trim()
        ? updates.expiry
        : null
      : target.expiry || null

  const payload = {
    title: (updates.title ?? target.title).trim(),
    message: (updates.message ?? target.message).trim(),
    audience: audience,
    expiry: expiryVal,
    status: updates.status || target.status || "Published",
    pinned: updates.pinned !== undefined ? Boolean(updates.pinned) : Boolean(target.pinned),
    updated_at: new Date().toISOString(),
  }

  let updatedRow = null

  try {
    let query = supabase.from("announcements").update(payload)
    if (isUUID(target.dbId)) {
      query = query.eq("id", target.dbId)
    } else if (isUUID(target.id)) {
      query = query.eq("id", target.id)
    } else {
      query = query.eq("code", target.code || target.id)
    }

    const { data, error } = await query.select().single()
    if (!error && data) {
      updatedRow = mapDbRowToAnnouncement(data)
    }
  } catch (err) {
    console.warn("Supabase update announcement error:", err.message)
  }

  const result = updatedRow || {
    ...target,
    ...updates,
    audience,
    expiry: expiryVal || "",
    status: payload.status,
    pinned: payload.pinned,
  }

  // Update local cache
  try {
    const existing = await getAnnouncements()
    const updatedList = existing.map((a) =>
      a.id === target.id || (target.dbId && a.dbId === target.dbId) ? result : a
    )
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updatedList))
    notifyStorageChange()
  } catch {}

  return result
}

/**
 * 4. Toggle Publish/Unpublish status
 */
export async function toggleAnnouncementStatus(target) {
  if (!target) return null
  const nextStatus = target.status === "Published" ? "Draft" : "Published"
  return updateAnnouncement(target, { status: nextStatus })
}

/**
 * 5. Toggle Pin status
 */
export async function toggleAnnouncementPinned(target) {
  if (!target) return null
  return updateAnnouncement(target, { pinned: !target.pinned })
}

/**
 * 6. Delete announcement
 */
export async function deleteAnnouncement(target) {
  if (!target) return false

  try {
    if (isUUID(target.dbId)) {
      await supabase.from("announcements").delete().eq("id", target.dbId)
    } else if (isUUID(target.id)) {
      await supabase.from("announcements").delete().eq("id", target.id)
    }

    const identifier = target.code || target.id
    if (identifier) {
      await supabase.from("announcements").delete().eq("code", identifier)
    }
  } catch (err) {
    console.warn("Supabase delete announcement error:", err.message)
  }

  // Remove from local cache
  try {
    const existing = await getAnnouncements()
    const updatedList = existing.filter(
      (a) => a.id !== target.id && (target.dbId ? a.dbId !== target.dbId : true)
    )
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updatedList))
    notifyStorageChange()
  } catch {}

  return true
}
