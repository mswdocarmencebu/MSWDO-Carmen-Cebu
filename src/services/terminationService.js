import { supabase } from "@/lib/supabaseClient"
import { recordAuditLog } from "./auditService"
import { updateApplicationStatus } from "./applicationService"

const LOCAL_TERMINATION_HISTORY_KEY = "mswdo_termination_history"
const LOCAL_TERMINATIONS_TABLE_KEY = "mswdo_user_terminations_cache"
const APPS_PRIMARY_KEY = "mswdo_submitted_applications"
const APPS_LEGACY_KEY = "mswdo_applications"
const MEMBERS_PRIMARY_KEY = "mswdo_members_registry"
const MEMBERS_LEGACY_KEY = "mswdo_members"
const ARCHIVES_KEY = "mswdo_archives_registry"

/**
 * Helper to resolve user ID by email if only email or application is provided.
 */
export async function resolveUserIdByEmail(email) {
  if (!email) return null
  try {
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name, role, is_terminated")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle()
    return data || null
  } catch (err) {
    console.warn("[terminationService] resolveUserIdByEmail notice:", err.message)
    return null
  }
}

/**
 * Check if a user is terminated by user_id or email.
 */
export async function checkUserTermination(userIdOrEmail) {
  if (!userIdOrEmail) return { isTerminated: false }

  try {
    const isEmail = String(userIdOrEmail).includes("@")
    const query = supabase
      .from("users")
      .select("id, email, full_name, is_terminated, termination_reason, terminated_at")

    const { data, error } = isEmail
      ? await query.ilike("email", userIdOrEmail.trim().toLowerCase()).maybeSingle()
      : await query.eq("id", userIdOrEmail).maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.warn("[terminationService] checkUserTermination notice:", error.message)
    }

    if (data) {
      return {
        isTerminated: Boolean(data.is_terminated),
        reason: data.termination_reason || null,
        terminatedAt: data.terminated_at || null,
        user: data,
      }
    }
  } catch (e) {
    console.warn("[terminationService] checkUserTermination fallback check:", e)
  }

  // Local storage fallback check
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_TERMINATIONS_TABLE_KEY) || "[]")
    const match = local.find(
      (x) =>
        (x.userId && x.userId === userIdOrEmail) ||
        (x.email && x.email.toLowerCase() === String(userIdOrEmail).toLowerCase())
    )
    if (match) {
      return {
        isTerminated: match.action === "Terminated",
        reason: match.reason || null,
        terminatedAt: match.createdAt || null,
      }
    }
  } catch (_) {}

  return { isTerminated: false }
}

/**
 * Terminate a user account:
 * 1. Sets is_terminated = true in public.users
 * 2. Deactivates role records (admin_staff_users, applicant_users)
 * 3. Synchronizes associated applications and members (status = Terminated)
 * 4. Records tracking entry in public.user_terminations
 * 5. Records security audit log
 */
export async function terminateUser({
  userId,
  email,
  name,
  category,
  role,
  reason = "Administrative policy enforcement",
  notes = "",
  performedBy = null,
  performedByName = "System Administrator",
  performedByRole = "Super Admin",
  applicationId = null,
}) {
  let resolvedUser = null
  let targetUserId = userId

  // 1. Resolve user record if not provided
  if (!targetUserId && email) {
    resolvedUser = await resolveUserIdByEmail(email)
    if (resolvedUser?.id) {
      targetUserId = resolvedUser.id
    }
  }

  // 2. Try RPC function terminate_user (atomic SECURITY DEFINER execution)
  let rpcSuccess = false
  if (targetUserId) {
    try {
      const { data, error } = await supabase.rpc("terminate_user", {
        p_user_id: targetUserId,
        p_reason: reason,
        p_performed_by: performedBy,
        p_performed_by_name: performedByName,
        p_performed_by_role: performedByRole,
        p_notes: notes,
      })
      if (!error && data?.success) {
        rpcSuccess = true
      }
    } catch (rpcErr) {
      console.warn("[terminationService] RPC terminate_user note:", rpcErr.message)
    }
  }

  // 3. Graceful fallback if RPC is not deployed yet
  if (!rpcSuccess && targetUserId) {
    try {
      // 3A. Update public.users
      await supabase
        .from("users")
        .update({
          is_terminated: true,
          terminated_at: new Date().toISOString(),
          termination_reason: reason,
          terminated_by: performedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId)

      // 3B. Update role tables
      await supabase
        .from("admin_staff_users")
        .update({ is_active: false, is_terminated: true, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId)

      await supabase
        .from("applicant_users")
        .update({ is_terminated: true })
        .eq("user_id", targetUserId)

      // 3C. Insert into tracking table
      await supabase.from("user_terminations").insert({
        user_id: targetUserId,
        action: "Terminated",
        reason,
        notes,
        performed_by: performedBy,
        performed_by_name: performedByName,
        performed_by_role: performedByRole,
      })
    } catch (fallbackErr) {
      console.warn("[terminationService] Direct tables termination fallback:", fallbackErr.message)
    }
  }

  // 4. Synchronize application and member records if applicable
  const targetEmail = email || resolvedUser?.email
  if (targetEmail) {
    try {
      await supabase
        .from("applications")
        .update({ status: "Terminated", updated_at: new Date().toISOString() })
        .ilike("email", targetEmail.trim().toLowerCase())
    } catch (_) {}

    try {
      await supabase
        .from("members")
        .update({ status: "Terminated", updated_at: new Date().toISOString() })
        .or(`email.ilike.${targetEmail.trim().toLowerCase()}${targetUserId ? `,user_id.eq.${targetUserId}` : ""}`)
    } catch (_) {}
  }
  if (applicationId) {
    try {
      await updateApplicationStatus(applicationId, "Terminated")
    } catch (_) {}
  }

  // Update local applications & members cache for instant UI feedback
  const syncApplicationList = (storageKey) => {
    try {
      const cachedApps = JSON.parse(localStorage.getItem(storageKey) || "[]")
      const updatedApps = cachedApps.map((a) => {
        if (
          (targetEmail && a.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (applicationId && (a.id === applicationId || a.reference === applicationId)) ||
          (targetUserId && a.userId === targetUserId)
        ) {
          return { ...a, status: "Terminated", isTerminated: true }
        }
        return a
      })
      localStorage.setItem(storageKey, JSON.stringify(updatedApps))
    } catch (_) {}
  }
  syncApplicationList(APPS_PRIMARY_KEY)
  syncApplicationList(APPS_LEGACY_KEY)

  let targetedMemberData = null
  const syncMemberList = (storageKey) => {
    try {
      const cachedMems = JSON.parse(localStorage.getItem(storageKey) || "[]")
      const updatedMems = cachedMems.map((m) => {
        if (
          (targetEmail && m.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (targetUserId && (m.userId === targetUserId || m.id === targetUserId)) ||
          (applicationId && (m.applicationId === applicationId || m.id === applicationId || m.memberId?.includes(String(applicationId))))
        ) {
          targetedMemberData = m
          return { ...m, status: "Terminated", isTerminated: true, isArchived: true }
        }
        return m
      })
      localStorage.setItem(storageKey, JSON.stringify(updatedMems))
    } catch (_) {}
  }
  syncMemberList(MEMBERS_PRIMARY_KEY)
  syncMemberList(MEMBERS_LEGACY_KEY)

  // Put into Archive Vault (Requirement: Terminating support put into archive)
  const archiveEntry = {
    id: `arch-term-${Date.now()}`,
    record_type: "terminated_account",
    record_id: targetUserId || applicationId || `term-${Date.now()}`,
    member_id: applicationId || targetUserId || targetedMemberData?.memberId || "USER-ACC",
    title: name || targetedMemberData?.name || resolvedUser?.full_name || "Beneficiary",
    category: category || targetedMemberData?.category || role || "General",
    reason: `Terminated: ${reason}${notes ? ` (${notes})` : ""}`,
    archived_by_name: performedByName,
    archived_at: new Date().toISOString(),
    status: "Terminated",
    original_data: {
      userId: targetUserId,
      email: targetEmail,
      name: name || targetedMemberData?.name || resolvedUser?.full_name,
      category,
      role,
      reason,
      notes,
      applicationId,
      member: targetedMemberData,
    },
  }

  // Insert into Supabase archives
  try {
    supabase.from("archives").insert([archiveEntry]).then(() => {})
  } catch (_) {}

  // Save to local archives cache
  try {
    const existingArchives = JSON.parse(localStorage.getItem(ARCHIVES_KEY) || "[]")
    const filteredArchives = existingArchives.filter(
      (x) =>
        x.record_id !== archiveEntry.record_id &&
        (!targetEmail || x.original_data?.email?.toLowerCase() !== targetEmail.toLowerCase())
    )
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify([archiveEntry, ...filteredArchives]))
  } catch (_) {}

  // 5. Update local tracking caches for instant UI synchronization & offline resilience
  const newLog = {
    id: `term-${Date.now()}`,
    userId: targetUserId,
    email: targetEmail || "",
    name: name || resolvedUser?.full_name || "User",
    memberId: applicationId || targetUserId || "USER-ACC",
    category: category || role || "General",
    action: "Terminated",
    reason,
    notes,
    performedByName,
    performedByRole,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  }

  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_TERMINATIONS_TABLE_KEY) || "[]")
    const filtered = existing.filter((x) => x.userId !== targetUserId)
    filtered.unshift(newLog)
    localStorage.setItem(LOCAL_TERMINATIONS_TABLE_KEY, JSON.stringify(filtered.slice(0, 150)))
  } catch (_) {}

  try {
    const existingHist = JSON.parse(localStorage.getItem(LOCAL_TERMINATION_HISTORY_KEY) || "[]")
    existingHist.unshift(newLog)
    localStorage.setItem(LOCAL_TERMINATION_HISTORY_KEY, JSON.stringify(existingHist.slice(0, 150)))
  } catch (_) {}

  // 6. Security Audit Log
  try {
    await recordAuditLog({
      action: "USER_TERMINATED",
      module: "SECURITY",
      target: targetEmail || name || targetUserId || "User Account",
      details: `User terminated by ${performedByName} (${performedByRole}). Reason: ${reason}${notes ? ` | Notes: ${notes}` : ""}`,
    })
  } catch (_) {}

  // 7. Broadcast live update events to update Staff and Super Admin interfaces instantly
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mswdo_user_terminations_changed", {
        detail: {
          userId: targetUserId,
          email: targetEmail,
          applicationId,
          action: "Terminated",
          name,
        },
      })
    )
    window.dispatchEvent(
      new CustomEvent("application_status_updated", {
        detail: {
          id: applicationId,
          email: targetEmail,
          status: "Terminated",
        },
      })
    )
    window.dispatchEvent(
      new CustomEvent("mswdo_members_changed", {
        detail: {
          userId: targetUserId,
          email: targetEmail,
          status: "Terminated",
        },
      })
    )
    window.dispatchEvent(new Event("storage"))
  }

  return { success: true, userId: targetUserId, action: "Terminated" }
}

/**
 * Unterminate (Restore / Reinstate) a user account:
 * 1. Sets is_terminated = false in public.users
 * 2. Reactivates role records (admin_staff_users, applicant_users)
 * 3. Synchronizes associated applications and members (status = Approved / Active)
 * 4. Records tracking entry in public.user_terminations with action 'Unterminated'
 * 5. Records security audit log
 */
export async function unterminateUser({
  userId,
  email,
  name,
  category,
  role,
  reason = "Reinstated by Administrator",
  notes = "",
  performedBy = null,
  performedByName = "System Administrator",
  performedByRole = "Super Admin",
  applicationId = null,
}) {
  let resolvedUser = null
  let targetUserId = userId

  // 1. Resolve user record if not provided
  if (!targetUserId && email) {
    resolvedUser = await resolveUserIdByEmail(email)
    if (resolvedUser?.id) {
      targetUserId = resolvedUser.id
    }
  }

  // 2. Try RPC function unterminate_user (atomic SECURITY DEFINER execution)
  let rpcSuccess = false
  if (targetUserId) {
    try {
      const { data, error } = await supabase.rpc("unterminate_user", {
        p_user_id: targetUserId,
        p_reason: reason,
        p_performed_by: performedBy,
        p_performed_by_name: performedByName,
        p_performed_by_role: performedByRole,
        p_notes: notes,
      })
      if (!error && data?.success) {
        rpcSuccess = true
      }
    } catch (rpcErr) {
      console.warn("[terminationService] RPC unterminate_user note:", rpcErr.message)
    }
  }

  // 3. Graceful fallback if RPC is not deployed yet
  if (!rpcSuccess && targetUserId) {
    try {
      // 3A. Update public.users
      await supabase
        .from("users")
        .update({
          is_terminated: false,
          terminated_at: null,
          termination_reason: null,
          terminated_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId)

      // 3B. Update role tables
      await supabase
        .from("admin_staff_users")
        .update({ is_active: true, is_terminated: false, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId)

      await supabase
        .from("applicant_users")
        .update({ is_terminated: false })
        .eq("user_id", targetUserId)

      // 3C. Insert into tracking table
      await supabase.from("user_terminations").insert({
        user_id: targetUserId,
        action: "Unterminated",
        reason,
        notes,
        performed_by: performedBy,
        performed_by_name: performedByName,
        performed_by_role: performedByRole,
      })
    } catch (fallbackErr) {
      console.warn("[terminationService] Direct tables untermination fallback:", fallbackErr.message)
    }
  }

  // 4. Synchronize application and member records if applicable
  const targetEmail = email || resolvedUser?.email
  if (targetEmail) {
    try {
      await supabase
        .from("applications")
        .update({ status: "Approved", updated_at: new Date().toISOString() })
        .ilike("email", targetEmail.trim().toLowerCase())
        .eq("status", "Terminated")
    } catch (_) {}

    try {
      await supabase
        .from("members")
        .update({ status: "Active", updated_at: new Date().toISOString() })
        .or(`email.ilike.${targetEmail.trim().toLowerCase()}${targetUserId ? `,user_id.eq.${targetUserId}` : ""}`)
        .eq("status", "Terminated")
    } catch (_) {}
  }
  if (applicationId) {
    try {
      await updateApplicationStatus(applicationId, "Approved")
    } catch (_) {}
  }

  // Update local applications & members cache for instant UI feedback
  const syncApplicationListUnterminate = (storageKey) => {
    try {
      const cachedApps = JSON.parse(localStorage.getItem(storageKey) || "[]")
      const updatedApps = cachedApps.map((a) => {
        if (
          (targetEmail && a.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (applicationId && (a.id === applicationId || a.reference === applicationId)) ||
          (targetUserId && a.userId === targetUserId)
        ) {
          return { ...a, status: "Approved", isTerminated: false }
        }
        return a
      })
      localStorage.setItem(storageKey, JSON.stringify(updatedApps))
    } catch (_) {}
  }
  syncApplicationListUnterminate(APPS_PRIMARY_KEY)
  syncApplicationListUnterminate(APPS_LEGACY_KEY)

  const syncMemberListUnterminate = (storageKey) => {
    try {
      const cachedMems = JSON.parse(localStorage.getItem(storageKey) || "[]")
      const updatedMems = cachedMems.map((m) => {
        if (
          (targetEmail && m.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (targetUserId && (m.userId === targetUserId || m.id === targetUserId)) ||
          (applicationId && (m.applicationId === applicationId || m.id === applicationId || m.memberId?.includes(String(applicationId))))
        ) {
          return { ...m, status: "Active", isTerminated: false, isArchived: false }
        }
        return m
      })
      localStorage.setItem(storageKey, JSON.stringify(updatedMems))
    } catch (_) {}
  }
  syncMemberListUnterminate(MEMBERS_PRIMARY_KEY)
  syncMemberListUnterminate(MEMBERS_LEGACY_KEY)

  // Remove from Archive Vault upon reinstatement
  try {
    const existingArchives = JSON.parse(localStorage.getItem(ARCHIVES_KEY) || "[]")
    const filteredArchives = existingArchives.filter(
      (x) =>
        x.record_id !== targetUserId &&
        x.record_id !== applicationId &&
        (!targetEmail || x.original_data?.email?.toLowerCase() !== targetEmail.toLowerCase())
    )
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(filteredArchives))
  } catch (_) {}

  try {
    const filterParts = []
    if (targetUserId) filterParts.push(`record_id.eq.${targetUserId}`)
    if (applicationId) filterParts.push(`record_id.eq.${applicationId}`)
    if (filterParts.length > 0) {
      supabase.from("archives").delete().or(filterParts.join(",")).then(() => {})
    }
  } catch (_) {}

  // 5. Update local tracking caches
  const newLog = {
    id: `unterminate-${Date.now()}`,
    userId: targetUserId,
    email: targetEmail || "",
    name: name || resolvedUser?.full_name || "User",
    memberId: applicationId || targetUserId || "USER-ACC",
    category: category || role || "General",
    action: "Unterminated",
    reason,
    notes,
    performedByName,
    performedByRole,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  }

  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_TERMINATIONS_TABLE_KEY) || "[]")
    const filtered = existing.filter((x) => x.userId !== targetUserId)
    filtered.unshift(newLog)
    localStorage.setItem(LOCAL_TERMINATIONS_TABLE_KEY, JSON.stringify(filtered.slice(0, 150)))
  } catch (_) {}

  try {
    const existingHist = JSON.parse(localStorage.getItem(LOCAL_TERMINATION_HISTORY_KEY) || "[]")
    existingHist.unshift(newLog)
    localStorage.setItem(LOCAL_TERMINATION_HISTORY_KEY, JSON.stringify(existingHist.slice(0, 150)))
  } catch (_) {}

  // 6. Security Audit Log
  try {
    await recordAuditLog({
      action: "USER_UNTERMINATED",
      module: "SECURITY",
      target: targetEmail || name || targetUserId || "User Account",
      details: `User reinstated by ${performedByName} (${performedByRole}). Reason: ${reason}${notes ? ` | Notes: ${notes}` : ""}`,
    })
  } catch (_) {}

  // 7. Broadcast live update events
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mswdo_user_terminations_changed", {
        detail: {
          userId: targetUserId,
          email: targetEmail,
          applicationId,
          action: "Unterminated",
          name,
        },
      })
    )
    window.dispatchEvent(
      new CustomEvent("application_status_updated", {
        detail: {
          id: applicationId,
          email: targetEmail,
          status: "Approved",
        },
      })
    )
    window.dispatchEvent(
      new CustomEvent("mswdo_members_changed", {
        detail: {
          userId: targetUserId,
          email: targetEmail,
          status: "Active",
        },
      })
    )
    window.dispatchEvent(new Event("storage"))
  }

  return { success: true, userId: targetUserId, action: "Unterminated" }
}

/**
 * Fetch termination tracking history from database (public.user_terminations),
 * falling back gracefully to local tracking cache.
 */
export async function getTerminationHistory({ userId = null, limit = 100 } = {}) {
  let dbRows = []

  try {
    let query = supabase
      .from("user_terminations")
      .select(`
        id,
        user_id,
        action,
        reason,
        notes,
        performed_by,
        performed_by_name,
        performed_by_role,
        created_at,
        users:user_id (id, email, full_name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (!error && Array.isArray(data)) {
      dbRows = data.map((r) => {
        const u = r.users || {}
        return {
          id: r.id,
          userId: r.user_id,
          name: u.full_name || r.performed_by_name || "User",
          email: u.email || "",
          memberId: r.user_id ? `USR-${r.user_id.slice(0, 8).toUpperCase()}` : "N/A",
          category: u.role || "General",
          action: r.action,
          reason: r.reason || "N/A",
          notes: r.notes || "",
          performedByName: r.performed_by_name || "Administrator",
          performedByRole: r.performed_by_role || "Admin",
          createdAt: r.created_at,
          timestamp: new Date(r.created_at).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }
      })
    }
  } catch (err) {
    console.warn("[terminationService] getTerminationHistory DB error:", err.message)
  }

  // Merge with localStorage records
  let localRows = []
  try {
    const raw = localStorage.getItem(LOCAL_TERMINATION_HISTORY_KEY)
    localRows = raw ? JSON.parse(raw) : []
  } catch (_) {}

  // De-duplicate by id or (userId + action + timestamp)
  const combined = [...dbRows]
  const existingKeys = new Set(combined.map((x) => `${x.userId || x.memberId}-${x.action}-${x.timestamp}`))

  for (const item of localRows) {
    const key = `${item.userId || item.memberId}-${item.action}-${item.timestamp}`
    if (!existingKeys.has(key)) {
      combined.push(item)
      existingKeys.add(key)
    }
  }

  // Sort descending by date
  return combined.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
}

/**
 * Clear all termination tracking history records from database and cache.
 */
export async function clearTerminationHistory() {
  // 1. Try atomic RPC if available
  let rpcCleared = false
  try {
    const { data, error } = await supabase.rpc("clear_termination_history")
    if (!error && (data?.success || data === true)) {
      rpcCleared = true
    }
  } catch (_) {}

  // 2. Safe deletion from public.user_terminations table only if records exist
  if (!rpcCleared) {
    try {
      const { data: records, error: selectErr } = await supabase
        .from("user_terminations")
        .select("id")
        .limit(300)

      if (!selectErr && Array.isArray(records) && records.length > 0) {
        const validUuids = records
          .map((r) => r.id)
          .filter(
            (id) =>
              typeof id === "string" &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          )

        if (validUuids.length > 0) {
          for (let i = 0; i < validUuids.length; i += 50) {
            const batch = validUuids.slice(i, i + 50)
            await supabase.from("user_terminations").delete().in("id", batch)
          }
        }
      }
    } catch (err) {
      console.warn("[terminationService] clearTerminationHistory DB notice:", err.message)
    }
  }

  // 3. Clear local storage history
  try {
    localStorage.removeItem(LOCAL_TERMINATION_HISTORY_KEY)
    localStorage.setItem(LOCAL_TERMINATION_HISTORY_KEY, "[]")
  } catch (_) {}

  // 4. Record audit log safely
  try {
    await recordAuditLog({
      action: "Clear Termination History",
      category: "Security",
      details: "Cleared all termination history logs and records",
    })
  } catch (_) {}

  // 5. Dispatch real-time events (do NOT fire generic storage event to avoid premature re-fetching)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mswdo_termination_history_cleared"))
  }

  return { success: true }
}

/**
 * Delete a single termination history record by ID.
 */
export async function deleteTerminationHistoryItem(logId) {
  if (!logId) return false

  const isUuid =
    typeof logId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(logId).trim())

  if (isUuid) {
    try {
      await supabase.from("user_terminations").delete().eq("id", logId)
    } catch (err) {
      console.warn("[terminationService] deleteTerminationHistoryItem error:", err.message)
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_TERMINATION_HISTORY_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      const updated = list.filter((x) => x.id !== logId)
      localStorage.setItem(LOCAL_TERMINATION_HISTORY_KEY, JSON.stringify(updated))
    }
  } catch (_) {}

  return true
}
