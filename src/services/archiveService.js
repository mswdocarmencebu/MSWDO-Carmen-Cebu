import { supabase } from "@/lib/supabaseClient"
import { recordAuditLog } from "./auditService"
import { unarchiveMember } from "./memberService"

export const ARCHIVES_STORAGE_KEY = "mswdo_archives_registry"
export const ARCHIVES_CHANGED_EVENT = "mswdo_archives_changed"

export const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())

/**
 * 1. Read: Fetch all archived records from Supabase and cache
 */
export async function getArchives({ recordType = "", category = "", search = "" } = {}) {
  let dbRows = []
  let supabaseSuccess = false

  try {
    let query = supabase
      .from("archives")
      .select("*")
      .order("archived_at", { ascending: false })

    if (recordType) {
      query = query.eq("record_type", recordType)
    }
    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (!error && Array.isArray(data)) {
      dbRows = data
      supabaseSuccess = true
    } else if (error) {
      console.warn("[archiveService] Supabase getArchives error:", error.message)
    }
  } catch (err) {
    console.warn("[archiveService] Supabase getArchives catch:", err.message)
  }

  // Read local storage cache
  let localRows = []
  try {
    const raw = localStorage.getItem(ARCHIVES_STORAGE_KEY)
    localRows = raw ? JSON.parse(raw) : []
  } catch (_) {}

  // Merge and de-duplicate by id or (record_type + record_id)
  const combined = [...dbRows]
  const seenKeys = new Set(
    combined.map((x) => x.id || `${x.record_type}-${x.record_id || x.member_id}`)
  )

  for (const item of localRows) {
    const key = item.id || `${item.record_type}-${item.record_id || item.member_id}`
    if (!seenKeys.has(key)) {
      combined.push(item)
      seenKeys.add(key)
    }
  }

  // Update local cache if Supabase query succeeded
  if (supabaseSuccess) {
    try {
      localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(combined.slice(0, 500)))
    } catch (_) {}
  }

  // Apply search query filter if provided
  let filtered = combined
  if (search && search.trim()) {
    const q = search.toLowerCase().trim()
    filtered = combined.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.member_id?.toLowerCase().includes(q) ||
        item.record_id?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.archived_by_name?.toLowerCase().includes(q)
      )
    })
  }

  return filtered.sort(
    (a, b) => new Date(b.archived_at || b.created_at || 0) - new Date(a.archived_at || a.created_at || 0)
  )
}

/**
 * 2. Create: Archive a record into public.archives and cache
 */
export async function createArchiveEntry({
  record_type = "member",
  record_id,
  member_id = null,
  title,
  category = "General",
  reason = "Archived by administrator",
  notes = "",
  archived_by = null,
  archived_by_name = "Super Admin",
  original_data = {},
  status = "Archived",
}) {
  if (!title) throw new Error("Archive title is required.")
  const recId = record_id || `rec-${Date.now()}`

  const newEntry = {
    id: isUUID(recId) ? undefined : undefined,
    record_type,
    record_id: String(recId),
    member_id: member_id ? String(member_id) : null,
    title: title.trim(),
    category: category || "General",
    reason: reason || "Archived by administrator",
    archived_by: isUUID(archived_by) ? archived_by : null,
    archived_by_name: archived_by_name || "Super Admin",
    original_data: {
      ...original_data,
      notes: notes || original_data?.notes || "",
    },
    archived_at: new Date().toISOString(),
    status: status || "Archived",
  }

  let savedData = null

  // 2A. Insert to Supabase public.archives
  try {
    const { data, error } = await supabase
      .from("archives")
      .insert([newEntry])
      .select()
      .maybeSingle()

    if (!error && data) {
      savedData = data
    } else if (error) {
      console.warn("[archiveService] Supabase insert archive notice:", error.message)
    }
  } catch (err) {
    console.warn("[archiveService] Supabase insert archive catch:", err.message)
  }

  const finalRecord = savedData || {
    id: `arch-${Date.now()}`,
    ...newEntry,
  }

  // 2B. Cache locally
  try {
    const existing = JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
    const updated = [
      finalRecord,
      ...existing.filter((x) => x.id !== finalRecord.id && x.record_id !== finalRecord.record_id),
    ]
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(updated.slice(0, 500)))
  } catch (_) {}

  // 2C. Security audit log
  try {
    await recordAuditLog({
      action: "Archive Record",
      category: "Archives",
      details: `Archived ${record_type}: "${title}" (Reason: ${reason})`,
      record_id: String(finalRecord.record_id),
    })
  } catch (_) {}

  // 2D. Real-time event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHIVES_CHANGED_EVENT, { detail: { action: "created", record: finalRecord } })
    )
  }

  return finalRecord
}

/**
 * 3. Update: Modify metadata/reason/category of an archived entry
 */
export async function updateArchiveEntry(id, fields = {}) {
  if (!id) throw new Error("Archive record ID is required.")

  const updatePayload = {
    title: fields.title,
    category: fields.category,
    reason: fields.reason,
    status: fields.status,
  }

  // Remove undefined fields
  Object.keys(updatePayload).forEach(
    (k) => updatePayload[k] === undefined && delete updatePayload[k]
  )

  let updatedData = null

  // 3A. Update in Supabase if valid UUID
  if (isUUID(id)) {
    try {
      const { data, error } = await supabase
        .from("archives")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .maybeSingle()

      if (!error && data) {
        updatedData = data
      }
    } catch (err) {
      console.warn("[archiveService] updateArchiveEntry Supabase error:", err.message)
    }
  }

  // 3B. Update in localStorage cache
  try {
    const existing = JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
    const updated = existing.map((item) => {
      if (item.id === id || item.record_id === id) {
        const merged = {
          ...item,
          ...fields,
          original_data: {
            ...item.original_data,
            notes: fields.notes !== undefined ? fields.notes : item.original_data?.notes,
          },
        }
        if (!updatedData) updatedData = merged
        return merged
      }
      return item
    })
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(updated))
  } catch (_) {}

  // 3C. Audit log
  try {
    await recordAuditLog({
      action: "Update Archive Entry",
      category: "Archives",
      details: `Updated archive entry #${id} (${fields.title || fields.reason || "metadata"})`,
      record_id: String(id),
    })
  } catch (_) {}

  // 3D. Real-time event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHIVES_CHANGED_EVENT, { detail: { action: "updated", id, fields } })
    )
  }

  return updatedData
}

/**
 * 4. Delete: Permanently remove a single record from public.archives
 */
export async function deleteArchiveEntry(id) {
  if (!id) return false

  // 4A. Delete from Supabase
  if (isUUID(id)) {
    try {
      await supabase.from("archives").delete().eq("id", id)
    } catch (err) {
      console.warn("[archiveService] deleteArchiveEntry Supabase error:", err.message)
    }
  }

  // 4B. Remove from localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
    const filtered = existing.filter((item) => item.id !== id && item.record_id !== id)
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(filtered))
  } catch (_) {}

  // 4C. Audit log
  try {
    await recordAuditLog({
      action: "Delete Archive Entry",
      category: "Archives",
      details: `Permanently purged archive entry #${id}`,
      record_id: String(id),
    })
  } catch (_) {}

  // 4D. Real-time event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHIVES_CHANGED_EVENT, { detail: { action: "deleted", id } })
    )
  }

  return true
}

/**
 * 5. Restore / Unarchive: Restores the record back to active status
 */
export async function restoreArchiveEntry(archiveItem) {
  if (!archiveItem) return false

  const recType = (archiveItem.record_type || "").toLowerCase()
  const recId = archiveItem.record_id || archiveItem.member_id

  // 5A. Handle member unarchival
  if (recType.includes("member")) {
    try {
      await unarchiveMember(recId)
    } catch (err) {
      console.warn("[archiveService] Error restoring member:", err.message)
    }
  }

  // 5B. Handle user/staff/applicant unarchival
  if (recType.includes("user") || recType.includes("staff") || recType.includes("applicant")) {
    if (isUUID(recId)) {
      try {
        await supabase
          .from("users")
          .update({ is_terminated: false, termination_reason: null, updated_at: new Date().toISOString() })
          .eq("id", recId)
      } catch (_) {}
    }
  }

  // 5C. Delete the record from archives since it is restored
  await deleteArchiveEntry(archiveItem.id || archiveItem.record_id)

  // 5D. Audit log
  try {
    await recordAuditLog({
      action: "Restore Archive Record",
      category: "Archives",
      details: `Restored ${archiveItem.record_type} "${archiveItem.title}" back to active status`,
      record_id: String(recId),
    })
  } catch (_) {}

  // 5E. Real-time event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHIVES_CHANGED_EVENT, { detail: { action: "restored", record: archiveItem } })
    )
  }

  return true
}

/**
 * 6. Clear: Permanently purge all archives from database and cache
 */
export async function clearAllArchives() {
  // 6A. Delete from Supabase safely
  try {
    const { data: records } = await supabase.from("archives").select("id").limit(500)
    if (Array.isArray(records) && records.length > 0) {
      const uuids = records.map((r) => r.id).filter(isUUID)
      for (let i = 0; i < uuids.length; i += 50) {
        const batch = uuids.slice(i, i + 50)
        await supabase.from("archives").delete().in("id", batch)
      }
    }
  } catch (err) {
    console.warn("[archiveService] clearAllArchives Supabase notice:", err.message)
  }

  // 6B. Clear localStorage
  try {
    localStorage.removeItem(ARCHIVES_STORAGE_KEY)
    localStorage.setItem(ARCHIVES_STORAGE_KEY, "[]")
  } catch (_) {}

  // 6C. Audit log
  try {
    await recordAuditLog({
      action: "Clear All Archives",
      category: "Archives",
      details: "Permanently purged all records from the archives vault",
    })
  } catch (_) {}

  // 6D. Real-time event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHIVES_CHANGED_EVENT, { detail: { action: "cleared" } })
    )
  }

  return true
}
