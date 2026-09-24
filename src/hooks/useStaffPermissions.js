import { useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"

/**
 * Normalizes a category or sector string for flexible cross-matching.
 */
function normalizeCategoryString(str) {
  if (!str) return ""
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if a single target category or sector matches an allowed category definition.
 */
function matchesCategory(target, allowed) {
  if (!target || !allowed) return false
  const t = normalizeCategoryString(target)
  const a = normalizeCategoryString(allowed)

  // Direct substring or equality
  if (t === a || t.includes(a) || a.includes(t)) return true

  // PWD / Disability alias matching
  const isPwdA = a.includes("pwd") || a.includes("disability")
  const isPwdT = t.includes("pwd") || t.includes("disability")
  if (isPwdA && isPwdT) return true

  // Senior alias matching
  const isSeniorA = a.includes("senior") || a.includes("elderly")
  const isSeniorT = t.includes("senior") || t.includes("elderly")
  if (isSeniorA && isSeniorT) return true

  // Women / Solo Parent alias matching
  const isWomenA = a.includes("women") || a.includes("solo parent")
  const isWomenT = t.includes("women") || t.includes("solo parent")
  if (isWomenA && isWomenT) return true

  // Youth / Children alias matching
  const isYouthA = a.includes("youth") || a.includes("student") || a.includes("child")
  const isYouthT = t.includes("youth") || t.includes("student") || t.includes("child")
  if (isYouthA && isYouthT) return true

  return false
}

/**
 * Hook providing granular staff permissions and category access boundaries.
 */
export function useStaffPermissions() {
  const { role, profile, roleDetails } = useAuth()

  const isSuperAdmin = role === "super_admin_user" || role === "itsd"
  const isStaff = role === "admin_staff" || role === "inventory_staff"

  // Base permission flags from roleDetails or defaults
  const permissions = useMemo(() => {
    // Super Admin has unrestricted permissions
    if (isSuperAdmin) {
      return {
        isSuperAdmin: true,
        isStaff: false,
        canView: true,
        canEdit: true,
        canApprove: true,
        canDelete: true,
        hasFullAccess: true,
        position: "Super Admin",
        allowedCategories: [],
      }
    }

    if (!isStaff) {
      // Non-staff, non-super admin (e.g. applicant)
      return {
        isSuperAdmin: false,
        isStaff: false,
        canView: true,
        canEdit: false,
        canApprove: false,
        canDelete: false,
        hasFullAccess: false,
        position: "",
        allowedCategories: [],
      }
    }

    const rd = roleDetails || profile?.roleDetails || {}
    const position = rd.position || "Staff"
    const isITStaff = position === "IT Staff" || position === "Admin"

    // IT Staff has full administrative access
    if (isITStaff) {
      return {
        isSuperAdmin: false,
        isStaff: true,
        canView: true,
        canEdit: true,
        canApprove: true,
        canDelete: true,
        hasFullAccess: true,
        position,
        allowedCategories: [],
      }
    }

    // Parse category access array
    let rawCategories = rd.category_access
    let parsedCategories = []
    if (Array.isArray(rawCategories)) {
      parsedCategories = rawCategories
    } else if (typeof rawCategories === "string") {
      try {
        const parsed = JSON.parse(rawCategories)
        if (Array.isArray(parsed)) parsedCategories = parsed
      } catch (_) {
        if (rawCategories.trim()) parsedCategories = [rawCategories.trim()]
      }
    }

    // If no explicit category array assigned, fall back to staff's assigned position
    if (parsedCategories.length === 0 && position && position !== "Staff") {
      parsedCategories = [position]
    }

    // Granular privileges with safe defaults
    const canView = rd.can_view ?? true
    const canEdit = rd.can_edit ?? false
    const canApprove = rd.can_approve ?? false
    const canDelete = rd.can_delete ?? false

    return {
      isSuperAdmin: false,
      isStaff: true,
      canView,
      canEdit,
      canApprove,
      canDelete,
      hasFullAccess: false,
      position,
      allowedCategories: parsedCategories,
    }
  }, [isSuperAdmin, isStaff, roleDetails, profile])

  /**
   * Evaluates if a given item's category/sector is allowed for this staff member.
   */
  const isCategoryAllowed = useMemo(() => {
    return (itemCategoryOrSector) => {
      if (permissions.hasFullAccess) return true
      if (!permissions.allowedCategories || permissions.allowedCategories.length === 0) return true
      if (!itemCategoryOrSector) return false

      return permissions.allowedCategories.some((allowed) =>
        matchesCategory(itemCategoryOrSector, allowed)
      )
    }
  }, [permissions.hasFullAccess, permissions.allowedCategories])

  /**
   * Filters a list of records by the staff member's category access.
   */
  const filterByAllowedCategory = useMemo(() => {
    return (items, getCategoryFn = (item) => item.category || item.sector) => {
      if (!Array.isArray(items)) return []
      if (permissions.hasFullAccess) return items
      if (!permissions.allowedCategories || permissions.allowedCategories.length === 0) return items

      return items.filter((item) => {
        const cat = getCategoryFn(item)
        return isCategoryAllowed(cat)
      })
    }
  }, [permissions.hasFullAccess, permissions.allowedCategories, isCategoryAllowed])

  return useMemo(() => ({
    ...permissions,
    isCategoryAllowed,
    filterByAllowedCategory,
  }), [permissions, isCategoryAllowed, filterByAllowedCategory])
}

export default useStaffPermissions
