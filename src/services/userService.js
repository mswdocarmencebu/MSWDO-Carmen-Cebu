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
