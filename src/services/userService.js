import { supabase } from "@/lib/supabaseClient"

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

/* ─── createStaffUser ────────────────────────────────────────────────────── */
/**
 * Creates a new admin_staff account + privilege record via the
 * create_staff_user Supabase RPC function.
 */
export async function createStaffUser({
  firstName, lastName, mi, birthDate,
  idNumber, contact, email, password,
  role, position, categories,
  canView = true, canEdit = false, canApprove = false, canDelete = false,
}) {
  // Admin role → always IT Staff, full access
  const resolvedPosition = role === "Admin" ? "IT Staff" : position

  const { data, error } = await supabase.rpc("create_staff_user", {
    p_email:           email.trim().toLowerCase(),
    p_password:        password,
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
  return data
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
