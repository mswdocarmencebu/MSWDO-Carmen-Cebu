import { supabase } from "@/lib/supabaseClient"

/**
 * Dynamic Avatar Service for MSWDO Carmen.
 * Fully dynamic: NO hardcoded user lists or static arrays.
 *
 * Dynamically resolves profile photos from:
 * 1. Supabase Storage (application-documents bucket, avatars/ folder)
 * 2. Supabase DB records (staff_users_view, applications)
 * 3. Browser localStorage (mswdo_avatar_* keys populated when users update photos)
 * 4. Direct record properties (avatarUrl, avatar_url, photoUrl, photo_url, selfie_url)
 *
 * If a user has no uploaded photo, returns null so the UI cleanly displays the fallback initials.
 */

// In-memory dynamic caches
const cacheByUserId = new Map()
const cacheByEmail  = new Map()
const cacheByName   = new Map()

// Normalize string for fuzzy matching (e.g. "Marcelo G. Rodrigo" -> "marcelo rodrigo")
function normalizeKey(str) {
  if (!str) return ""
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Generate first+last token (e.g. "marcelo gesim rodrigo" -> "marcelo rodrigo")
function firstLastKey(str) {
  const norm = normalizeKey(str)
  if (!norm) return ""
  const parts = norm.split(" ").filter((p) => p.length > 1)
  if (parts.length <= 1) return norm
  return `${parts[0]} ${parts[parts.length - 1]}`
}

let isSyncing   = false
let lastSyncTime = 0

/**
 * Dynamically syncs avatars from Supabase Storage and database views.
 * Throttled to once per 30 seconds to prevent re-render loops.
 * Does NOT dispatch any events after completing — callers must handle UI refresh.
 */
export async function syncAvatarsFromStorage(force = false) {
  const now = Date.now()
  // Throttle: at most once per 30 s, unless forced or cache is empty
  if (isSyncing) return
  if (!force && cacheByUserId.size > 0 && now - lastSyncTime < 30_000) return

  isSyncing = true

  try {
    // 1. Read all localStorage avatar entries (written by registerUserAvatar)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith("mswdo_avatar_")) {
            const rawTarget = key.slice("mswdo_avatar_".length).trim()
            const val = localStorage.getItem(key)
            if (val && typeof val === "string" && val.trim()) {
              const url = val.trim()
              if (rawTarget.includes("@")) {
                cacheByEmail.set(rawTarget.toLowerCase(), url)
              } else {
                cacheByUserId.set(rawTarget, url)
                cacheByName.set(normalizeKey(rawTarget), url)
              }
            }
          }
        }
      } catch (_) {}
    }

    // 2. Fetch avatar files from Supabase Storage
    const { data: storageFiles, error: storageErr } = await supabase.storage
      .from("application-documents")
      .list("avatars", { limit: 100, sortBy: { column: "created_at", order: "desc" } })

    if (!storageErr && Array.isArray(storageFiles)) {
      storageFiles.forEach((file) => {
        if (!file?.name || file.name.startsWith(".")) return
        // Filename format: ${userId}_${timestamp}.${ext}
        const fileUserId = file.name.split("_")[0]
        if (fileUserId && !cacheByUserId.has(fileUserId)) {
          const { data: pubData } = supabase.storage
            .from("application-documents")
            .getPublicUrl(`avatars/${file.name}`)
          if (pubData?.publicUrl) {
            cacheByUserId.set(fileUserId, pubData.publicUrl)
          }
        }
      })
    }

    // 3. Cross-reference staff_users_view → link user_id to emails & names
    try {
      const { data: staffList } = await supabase
        .from("staff_users_view")
        .select("user_id, email, full_name, first_name, last_name, selfie_url")

      if (Array.isArray(staffList)) {
        staffList.forEach((staff) => {
          const staffUid      = staff.user_id
          const staffEmail    = staff.email?.toLowerCase().trim()
          const staffFullName = staff.full_name || `${staff.first_name || ""} ${staff.last_name || ""}`.trim()

          let avatarUrl = cacheByUserId.get(staffUid) || staff.selfie_url || null
          if (!avatarUrl && staffEmail) avatarUrl = cacheByEmail.get(staffEmail)

          if (avatarUrl) {
            if (staffUid)      cacheByUserId.set(staffUid, avatarUrl)
            if (staffEmail)    cacheByEmail.set(staffEmail, avatarUrl)
            if (staffFullName) {
              cacheByName.set(normalizeKey(staffFullName), avatarUrl)
              cacheByName.set(firstLastKey(staffFullName), avatarUrl)
            }
          }
        })
      }
    } catch (_) {}

    // 4. Cross-reference applications table for applicant photos
    try {
      const { data: appList } = await supabase
        .from("applications")
        .select("id, email, first_name, last_name, documents")
        .limit(100)

      if (Array.isArray(appList)) {
        appList.forEach((app) => {
          const email    = app.email?.toLowerCase().trim()
          const fullName = `${app.first_name || ""} ${app.last_name || ""}`.trim()

          let docPhotoUrl = null
          if (Array.isArray(app.documents)) {
            const photoDoc = app.documents.find((d) => {
              const k = (d.key || d.name || d.title || "").toLowerCase()
              return k.includes("photo") || k.includes("selfie") || k.includes("2x2") || k.includes("id_pic")
            })
            if (photoDoc?.url || photoDoc?.previewUrl) {
              docPhotoUrl = photoDoc.url || photoDoc.previewUrl
            }
          }

          const existingUrl = (email && cacheByEmail.get(email)) || docPhotoUrl
          if (existingUrl) {
            if (email)    cacheByEmail.set(email, existingUrl)
            if (fullName) {
              cacheByName.set(normalizeKey(fullName), existingUrl)
              cacheByName.set(firstLastKey(fullName), existingUrl)
            }
          }
        })
      }
    } catch (_) {}

    lastSyncTime = Date.now()

    // ⚠️ Intentionally NOT dispatching mswdo_avatar_updated here —
    // doing so would create a feedback loop (event → sync → event → sync …).
    // UserAvatar components listen to this event only via registerUserAvatar calls.
  } catch (err) {
    console.warn("[avatarService] sync warning:", err.message)
  } finally {
    isSyncing = false
  }
}

// Kick off ONE initial sync on module load.
// Do NOT add a mswdo_avatar_updated listener here — it would loop.
// The "storage" listener only fires for changes made in OTHER tabs, not this one.
if (typeof window !== "undefined") {
  syncAvatarsFromStorage()
  // Cross-tab sync: when another tab writes localStorage (e.g. user uploads avatar in another tab)
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("mswdo_avatar_")) {
      syncAvatarsFromStorage(true)
    }
  })
}

/**
 * Resolves avatar photo URL dynamically for any user, member, or applicant.
 * Returns the URL if a profile photo exists, or null for fallback initials.
 */
export function resolveAvatarUrl(record) {
  if (!record) return null

  // 1. Direct photo properties on the record object
  for (const key of ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "selfie_url"]) {
    if (record[key] && typeof record[key] === "string" && record[key].trim()) {
      return record[key].trim()
    }
  }

  // 2. Check documents array for a photo/selfie
  if (Array.isArray(record.documents)) {
    const photoDoc = record.documents.find((d) => {
      const k = (d?.key || d?.name || d?.title || "").toLowerCase()
      return k.includes("photo") || k.includes("selfie") || k.includes("2x2") || k.includes("id_pic")
    })
    if (photoDoc?.url || photoDoc?.previewUrl) {
      return (photoDoc.url || photoDoc.previewUrl).trim()
    }
  }

  const userId  = record.userId || record.user_id || record.uid || record.id || ""
  const email   = (record.email || "").toLowerCase().trim()
  const rawName = record.name || record.full_name ||
    `${record.firstName || record.first_name || ""} ${record.lastName || record.last_name || ""}`.trim()
  const normName = normalizeKey(rawName)
  const flKey    = firstLastKey(rawName)

  // 3. Check in-memory caches
  if (userId   && cacheByUserId.has(userId))   return cacheByUserId.get(userId)
  if (email    && cacheByEmail.has(email))      return cacheByEmail.get(email)
  if (normName && cacheByName.has(normName))    return cacheByName.get(normName)
  if (flKey    && cacheByName.has(flKey))       return cacheByName.get(flKey)

  // 4. Check localStorage directly
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (userId) {
        const local = localStorage.getItem(`mswdo_avatar_${userId}`)
        if (local && local.trim()) return local.trim()
      }
      if (email) {
        const local = localStorage.getItem(`mswdo_avatar_${email}`)
        if (local && local.trim()) return local.trim()
      }
      if (normName) {
        const local = localStorage.getItem(`mswdo_avatar_${normName}`)
        if (local && local.trim()) return local.trim()
      }
    } catch (_) {}
  }

  // 5. Cache is empty and no sync pending → trigger background sync (once)
  //    Do NOT dispatch any event here — just silently fetch in background.
  if (cacheByUserId.size === 0 && !isSyncing) {
    syncAvatarsFromStorage()
  }

  return null
}

/**
 * Registers a newly-uploaded avatar into memory and localStorage.
 * Dispatches mswdo_avatar_updated so UserAvatar components re-render immediately.
 */
export function registerUserAvatar({ userId, email, name, avatarUrl }) {
  if (!avatarUrl) return

  if (userId) {
    cacheByUserId.set(userId, avatarUrl)
    try { localStorage.setItem(`mswdo_avatar_${userId}`, avatarUrl) } catch (_) {}
  }
  if (email) {
    const cleanEmail = email.toLowerCase().trim()
    cacheByEmail.set(cleanEmail, avatarUrl)
    try { localStorage.setItem(`mswdo_avatar_${cleanEmail}`, avatarUrl) } catch (_) {}
  }
  if (name) {
    const norm = normalizeKey(name)
    const fl   = firstLastKey(name)
    if (norm) {
      cacheByName.set(norm, avatarUrl)
      try { localStorage.setItem(`mswdo_avatar_${norm}`, avatarUrl) } catch (_) {}
    }
    if (fl) cacheByName.set(fl, avatarUrl)
  }

  // Notify UserAvatar components in THIS tab to re-resolve.
  // Do NOT dispatch "storage" — that would re-trigger syncAvatarsFromStorage.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mswdo_avatar_updated", {
      detail: { userId, email, avatarUrl },
    }))
  }
}
