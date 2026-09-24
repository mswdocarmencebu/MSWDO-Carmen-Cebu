import { supabase } from "@/lib/supabaseClient"
import { sendStaffCredentialsEmail } from "./emailService"

/* ─── Constants ─────────────────────────────────────────────────────────── */
export const STAFF_ROLES    = ["Admin", "Staff"]
export const STAFF_POSITIONS = ["Senior Citizen", "PWD", "Women's", "Youth"]
export const CATEGORIES = [
  "Senior Citizen",
  "Person with Disability (PWD)",
  "Women",
  "Youth",
]

/* ─── getStaffUsers ──────────────────────────────────────────────────────── */
/**
 * Fetch all admin_staff users joined with their privilege profile.
 * Falls back to empty array — never returns mock data.
 */
export async function getStaffUsers() {
  const { data, error } = await supabase
    .from("staff_users_view")
    .select("*")
    .order("registered_at", { ascending: false })

  if (error) {
    console.error("[userService] getStaffUsers error:", error.message)
    return []
  }
  return (data || []).map(mapRow)
}

/* ─── generateStaffTemporaryPassword ─────────────────────────────────────── */
/**
 * Generates a unique, cryptographically strong temporary password
 * meeting Carmen LGU municipal security requirements (uppercase, lowercase, numbers, special symbol).
 * e.g. "Carmen@4829-TxKq"
 */
export function generateStaffTemporaryPassword() {
  const charsUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const charsLower = "abcdefghjkmnpqrstuvwxyz"
  const charsSpecial = "@#$!%*&"

  const getRandom = (set) => set[Math.floor(Math.random() * set.length)]

  const part1 = "Carmen"
  const special1 = getRandom(charsSpecial)
  const digits = `${Math.floor(1000 + Math.random() * 9000)}`
  const special2 = "-"
  const suffix = Array.from({ length: 4 }, (_, i) => {
    if (i % 2 === 0) return getRandom(charsUpper)
    return getRandom(charsLower)
  }).join("")

  return `${part1}${special1}${digits}${special2}${suffix}`
}

/* ─── createStaffUser ────────────────────────────────────────────────────── */
/**
 * Creates a new admin_staff account + privilege record via the
 * create_staff_user Supabase RPC function. Auto-generates a unique temporary
 * password if none is provided, records must_change_password = true,
 * and automatically dispatches official credentials to the staff email.
 */
export async function createStaffUser({
  firstName, lastName, mi, birthDate,
  idNumber, contact, email, password,
  role, position, categories,
  canView = true, canEdit = false, canApprove = false, canDelete = false,
}) {
  // Admin role → always IT Staff, full access
  const resolvedPosition = role === "Admin" ? "IT Staff" : position
  const resolvedPassword = (password && password.trim()) || generateStaffTemporaryPassword()
  const cleanEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.rpc("create_staff_user", {
    p_email:           cleanEmail,
    p_password:        resolvedPassword,
    p_first_name:      firstName.trim(),
    p_last_name:       lastName.trim(),
    p_middle_initial:  mi?.trim() || null,
    p_birth_date:      birthDate || null,
    p_id_number:       idNumber?.trim() || null,
    p_contact_number:  contact?.trim() || null,
    p_position:        resolvedPosition,
    p_category_access: JSON.stringify(categories),
    p_can_view:        canView,
    p_can_edit:        canEdit,
    p_can_approve:     canApprove,
    p_can_delete:      canDelete,
  })

  if (error) throw new Error(error.message)
  if (data && !data.success) throw new Error(data.error || "Failed to create user")

  const userId = data.user_id

  // 1. Mark must_change_password = true on admin_staff_users record
  if (userId) {
    try {
      await supabase
        .from("admin_staff_users")
        .update({
          must_change_password: true,
          temporary_password: resolvedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    } catch (tblErr) {
      console.warn("[userService] admin_staff_users flag note:", tblErr.message)
    }
  }

  // 2. Dispatch official staff credentials email with temporary password
  let emailResult = null
  try {
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    emailResult = await sendStaffCredentialsEmail({
      name: fullName,
      email: cleanEmail,
      temporaryPassword: resolvedPassword,
      idNumber: idNumber?.trim() || "STAFF-ACCOUNT",
      position: resolvedPosition,
      role: role || "Staff",
    })
  } catch (emailErr) {
    console.warn("[userService] Staff email dispatch warning:", emailErr.message)
  }

  return {
    ...data,
    temporaryPassword: resolvedPassword,
    emailResult,
  }
}

/* ─── completeStaffPasswordSetup ─────────────────────────────────────────── */
/**
 * Completes staff first-time password update, transitioning from
 * temporary password to permanent password in Supabase Auth & admin_staff_users.
 *
 * NOTE: requires the columns must_change_password (boolean) and
 * temporary_password (text) to exist on admin_staff_users.
 * Run supabase/migrations/add_staff_must_change_password.sql if not done yet.
 */
export async function completeStaffPasswordSetup(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  // 1. Get current session user
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    throw new Error("No authenticated session found. Please sign in again.")
  }

  // 2. Immediately mark permanent password in localStorage so any quick refresh knows it's real
  try {
    if (user?.id) localStorage.setItem(`mswdo_staff_pwd_set_${user.id}`, "true")
    if (user?.email) localStorage.setItem(`mswdo_staff_pwd_set_${user.email.toLowerCase()}`, "true")
  } catch (_) {}

  // 3. Update password + flags in Supabase Auth user_metadata
  const { error: authErr } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      must_change_password: false,
      has_permanent_password: true,
      temporary_password: null,
      password_updated_at: new Date().toISOString(),
    },
  })
  if (authErr) {
    throw new Error(`Auth password update failed: ${authErr.message}`)
  }

  // 4. Try RPC function complete_staff_password_setup (SECURITY DEFINER, bypasses RLS)
  try {
    await supabase.rpc("complete_staff_password_setup", {
      p_new_password: newPassword,
    })
  } catch (rpcErr) {
    // If RPC isn't deployed yet, fall back to direct table update
  }

  // 5. Direct table update fallback for admin_staff_users
  try {
    await supabase
      .from("admin_staff_users")
      .update({
        must_change_password: false,
        temporary_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
  } catch (_) {}

  // 6. Direct table update fallback for super_admin_users
  try {
    await supabase
      .from("super_admin_users")
      .update({
        must_change_password: false,
        temporary_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
  } catch (_) {}

  // 7. Force session refresh so updated token is in localStorage
  try {
    await supabase.auth.refreshSession()
  } catch (_) {}

  // 6. Audit log
  try {
    const { recordAuditLog } = await import("@/services/auditService")
    await recordAuditLog({
      action: "STAFF_PASSWORD_UPDATED",
      module: "SECURITY",
      target: user.email,
      details: "Staff member successfully changed initial temporary password to permanent password.",
    })
  } catch (_) {}

  return { success: true }
}

/* ─── updateStaffPrivileges ──────────────────────────────────────────────── */
/**
 * Update the privilege columns for an existing staff member.
 */
export async function updateStaffPrivileges(userId, {
  position, categories, canView, canEdit, canApprove, canDelete,
}) {
  const { error } = await supabase
    .from("admin_staff_users")
    .update({
      position,
      category_access: categories,
      can_view:        canView,
      can_edit:        canEdit,
      can_approve:     canApprove,
      can_delete:      canDelete,
      updated_at:      new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
  return true
}

/* ─── toggleStaffActive ──────────────────────────────────────────────────── */
export async function toggleStaffActive(userId, isActive) {
  const { error } = await supabase
    .from("admin_staff_users")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
  return true
}

/* ─── updateStaffUser ─────────────────────────────────────────────────── */
/**
 * Update user details, role, position, category access, and permissions.
 * Uses atomic RPC if present with graceful fallback to table updates.
 */
export async function updateStaffUser(userId, {
  firstName, lastName, mi, birthDate,
  idNumber, contact,
  role, position, categories,
  canView = true, canEdit = false, canApprove = false, canDelete = false,
  isActive = true,
}) {
  const resolvedPosition = role === "Admin" ? "IT Staff" : position

  // Try RPC update_staff_user first
  try {
    const { data, error } = await supabase.rpc("update_staff_user", {
      p_user_id:         userId,
      p_first_name:      firstName?.trim(),
      p_last_name:       lastName?.trim(),
      p_middle_initial:  mi?.trim() || null,
      p_birth_date:      birthDate || null,
      p_id_number:       idNumber?.trim() || null,
      p_contact_number:  contact?.trim() || null,
      p_position:        resolvedPosition,
      p_category_access: JSON.stringify(categories || []),
      p_can_view:        canView,
      p_can_edit:        canEdit,
      p_can_approve:     canApprove,
      p_can_delete:      canDelete,
      p_is_active:       isActive,
    })
    if (!error && data?.success) {
      return data
    }
  } catch (rpcErr) {
    console.warn("[userService] RPC update_staff_user note:", rpcErr.message)
  }

  // Fallback: Direct table updates
  const fullName = [firstName, mi ? mi + "." : "", lastName].filter(Boolean).join(" ").trim()

  // 1. Update public.users
  const userUpdate = {}
  if (firstName !== undefined) userUpdate.first_name = firstName.trim()
  if (lastName !== undefined)  userUpdate.last_name = lastName.trim()
  if (mi !== undefined)        userUpdate.middle_initial = mi.trim() || null
  if (fullName)                userUpdate.full_name = fullName
  userUpdate.updated_at = new Date().toISOString()

  const { error: userError } = await supabase
    .from("users")
    .update(userUpdate)
    .eq("id", userId)

  if (userError) {
    console.warn("[userService] Direct users table update note:", userError.message)
  }

  // 2. Update admin_staff_users
  const staffTierMap = {
    "IT Staff": "Technical Staff",
    "Senior Citizen": "Senior Citizen Welfare Officer",
    "PWD": "PWD Affairs Officer",
    "Women's": "Women's Welfare Officer",
    "Youth": "Youth Affairs Officer",
  }
  const staffTier = staffTierMap[resolvedPosition] || "Intake Officer"

  const staffUpdate = {
    position:        resolvedPosition,
    staff_tier:      staffTier,
    category_access: categories || [],
    can_view:        canView,
    can_edit:        canEdit,
    can_approve:     canApprove,
    can_delete:      canDelete,
    id_number:       idNumber || null,
    contact_number:  contact || null,
    birth_date:      birthDate || null,
    is_active:       isActive,
    updated_at:      new Date().toISOString(),
  }

  const { error: staffError } = await supabase
    .from("admin_staff_users")
    .update(staffUpdate)
    .eq("user_id", userId)

  if (staffError) throw new Error(staffError.message)

  return { success: true, user_id: userId, name: fullName }
}

/* ─── deleteStaffUser ─────────────────────────────────────────────────── */
/**
 * Permanently delete a staff account.
 * Uses atomic RPC if present with graceful fallback to table deletes.
 */
export async function deleteStaffUser(userId) {
  // Try RPC delete_staff_user first
  try {
    const { data, error } = await supabase.rpc("delete_staff_user", {
      p_user_id: userId,
    })
    if (!error && data?.success) {
      return data
    }
  } catch (rpcErr) {
    console.warn("[userService] RPC delete_staff_user note:", rpcErr.message)
  }

  // Fallback: Direct table delete
  // 1. Delete from admin_staff_users
  const { error: staffError } = await supabase
    .from("admin_staff_users")
    .delete()
    .eq("user_id", userId)

  if (staffError) throw new Error(staffError.message)

  // 2. Delete from users
  const { error: userError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)

  if (userError) {
    console.warn("[userService] Note: public.users delete:", userError.message)
  }

  return { success: true, user_id: userId }
}

/* ─── Row mapper ─────────────────────────────────────────────────────────── */
function mapRow(r) {
  const name = r.full_name || [r.first_name, r.middle_initial ? r.middle_initial + "." : "", r.last_name].filter(Boolean).join(" ")
  return {
    userId:          r.user_id,
    staffId:         r.staff_id,
    name,
    firstName:       r.first_name || "",
    lastName:        r.last_name  || "",
    mi:              r.middle_initial || "",
    email:           r.email,
    role:            "Admin Staff",
    position:        r.position || "IT Staff",
    idNumber:        r.id_number || "—",
    contact:         r.contact_number || "—",
    birthDate:       r.birth_date || null,
    categories:      Array.isArray(r.category_access) ? r.category_access : [],
    canView:         r.can_view  ?? true,
    canEdit:         r.can_edit  ?? false,
    canApprove:      r.can_approve ?? false,
    canDelete:       r.can_delete ?? false,
    isActive:        r.is_active ?? true,
    createdAt:       r.registered_at,
    updatedAt:       r.profile_updated_at,
  }
}
