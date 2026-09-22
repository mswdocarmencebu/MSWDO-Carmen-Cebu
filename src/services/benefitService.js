import { supabase } from "@/lib/supabaseClient"

const PROGRAMS_STORAGE_KEY = "mswdo_benefit_programs"
const CLAIMS_STORAGE_KEY = "mswdo_benefit_claims"

export const INITIAL_PROGRAMS = [
  {
    id: "BEN-001",
    code: "BEN-001",
    name: "Ayuda Sa Kabataan",
    description: "This 'Ayuda' is for Youth",
    sector: "Youth",
    amount: "₱1,000.00",
    status: "Active",
    requirements: "Barangay Certificate of Indigency, Valid Government ID",
    createdAt: "Sep 01, 2026",
  },
  {
    id: "BEN-002",
    code: "BEN-002",
    name: "Tulong Para Sa May Kapansanan",
    description: "Medical subsidy and assistive device allowance for PWD beneficiaries",
    sector: "PWD",
    amount: "₱2,000.00",
    requirements: "Valid PWD ID, Medical Certificate / Assessment, Barangay Indigency",
    status: "Active",
    createdAt: "Sep 05, 2026",
  },
  {
    id: "BEN-003",
    code: "BEN-003",
    name: "Senior Citizen Social Pension",
    description: "Quarterly financial stipend for indigent senior citizens aged 60 and above",
    sector: "Senior Citizen",
    amount: "₱1,500.00",
    requirements: "OSCA Senior Citizen ID, Proof of Indigency, Certificate of Residency",
    status: "Active",
    createdAt: "Sep 08, 2026",
  },
  {
    id: "BEN-004",
    code: "BEN-004",
    name: "Solo Parent & Women Livelihood Aid",
    description: "Empowerment and micro-enterprise grant for solo mothers and disadvantaged women",
    sector: "Women",
    amount: "₱1,500.00",
    requirements: "Solo Parent ID, Barangay Indigency, Certificate of Income",
    status: "Active",
    createdAt: "Sep 12, 2026",
  },
  {
    id: "BEN-005",
    code: "BEN-005",
    name: "Emergency Indigent Cash Assistance (AICS)",
    description: "Immediate crisis assistance for indigent residents across all sectors",
    sector: "General",
    amount: "₱3,000.00",
    requirements: "Barangay Certificate of Indigency, Valid Government ID, Incident Assessment",
    status: "Active",
    createdAt: "Sep 15, 2026",
  },
]

export const INITIAL_CLAIMS = [
  {
    id: "CLM-001",
    claimNumber: "CLM-001",
    memberName: "Neil M Delante",
    memberId: "MSWDO-87656",
    benefit: "Ayuda Sa Kabataan",
    amount: "₱1,000.00",
    date: "Sep 11, 2026",
    status: "Pending",
    releaseMethod: "Cash",
    referenceNo: "VOUCHER-001",
    remarks: "Pending casework evaluation",
  },
  {
    id: "CLM-002",
    claimNumber: "CLM-002",
    memberName: "Neil M Delante",
    memberId: "MSWDO-87656",
    benefit: "Ayuda Sa Kabataan",
    amount: "₱1,000.00",
    date: "Sep 10, 2026",
    status: "Cancelled",
    releaseMethod: "Cash",
    referenceNo: "VOUCHER-002",
    remarks: "Cancelled by applicant request",
  },
  {
    id: "CLM-003",
    claimNumber: "CLM-003",
    memberName: "Neil M Delante",
    memberId: "MSWDO-87656",
    benefit: "Ayuda Sa Kabataan",
    amount: "₱1,000.00",
    date: "Sep 3, 2026",
    status: "Cancelled",
    releaseMethod: "Cash",
    referenceNo: "VOUCHER-003",
    remarks: "Duplicate submission",
  },
  {
    id: "CLM-004",
    claimNumber: "CLM-004",
    memberName: "Neil M Delante",
    memberId: "MSWDO-87656",
    benefit: "Ayuda Sa Kabataan",
    amount: "₱1,000.00",
    date: "Sep 3, 2026",
    status: "Processed",
    releaseMethod: "Cash",
    referenceNo: "VOUCHER-004",
    remarks: "Approved and released via Carmen Treasurer",
  },
]

function isUUID(str) {
  if (!str || typeof str !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function notifyStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
  }
}

export function mapDbRowToProgram(row) {
  if (!row) return null
  return {
    id: row.code || row.id,
    dbId: row.id,
    code: row.code || row.id,
    name: row.name || "Unnamed Program",
    description: row.description || "",
    sector: row.sector || "General",
    amount: row.amount || "₱1,000.00",
    requirements: row.requirements || "Barangay Certificate of Indigency, Valid Government ID",
    status: row.status || "Active",
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Today",
  }
}

export function mapDbRowToClaim(row) {
  if (!row) return null
  return {
    id: row.claim_number || row.id,
    dbId: row.id,
    claimNumber: row.claim_number || row.id,
    memberId: row.member_id || "MSWDO-00000",
    memberName: row.member_name || "Beneficiary",
    benefit: row.benefit_name || "Welfare Grant",
    amount: row.amount || "₱1,000.00",
    date: row.release_date
      ? new Date(row.release_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent",
    status: row.status || "Pending",
    releaseMethod: row.release_method || "Cash",
    releaseDate: row.release_date || "",
    referenceNo: row.reference_no || "",
    remarks: row.remarks || "",
  }
}

// 1. Get Programs directly from Supabase (with fallback cache)
export async function getBenefitPrograms() {
  try {
    const { data, error } = await supabase
      .from("benefit_programs")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      if (data.length === 0) {
        const hasLoadedBefore = localStorage.getItem(PROGRAMS_STORAGE_KEY + "_init")
        if (!hasLoadedBefore) {
          localStorage.setItem(PROGRAMS_STORAGE_KEY + "_init", "true")
          return INITIAL_PROGRAMS
        }
        localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify([]))
        return []
      }
      const mapped = data.map(mapDbRowToProgram)
      localStorage.setItem(PROGRAMS_STORAGE_KEY + "_init", "true")
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(mapped))
      return mapped
    }
  } catch (err) {
    console.warn("Could not load benefit_programs from Supabase:", err.message)
  }

  // Fallback cache
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {}

  return INITIAL_PROGRAMS
}

// 2. Save Program into Supabase
export async function saveBenefitProgram(newProg) {
  const code = newProg.id || newProg.code || `BEN-${Date.now().toString().slice(-4)}`
  const payload = {
    code: code,
    name: newProg.name,
    description: newProg.description || `Social welfare assistance for ${newProg.sector}`,
    sector: newProg.sector,
    amount: newProg.amount || "₱1,000.00",
    requirements: newProg.requirements || "Barangay Certificate of Indigency, Valid Government ID",
    status: newProg.status || "Active",
    updated_at: new Date().toISOString(),
  }

  let savedRow = null
  try {
    const { data, error } = await supabase
      .from("benefit_programs")
      .insert([payload])
      .select()
      .maybeSingle()

    if (!error && data) {
      savedRow = mapDbRowToProgram(data)
    }
  } catch (err) {
    console.warn("Could not insert benefit_program in Supabase:", err.message)
  }

  const finalProg = savedRow || {
    ...newProg,
    id: code,
    code: code,
    createdAt: "Today",
  }

  try {
    const existing = JSON.parse(localStorage.getItem(PROGRAMS_STORAGE_KEY) || "[]")
    const updated = [finalProg, ...existing.filter((p) => p.id !== code && p.code !== code)]
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(updated))
    notifyStorageChange()
    return updated
  } catch {
    return [finalProg]
  }
}

// 3. Update Existing Program in Supabase
export async function updateBenefitProgram(progId, updates) {
  // Extract strictly allowed database column fields to prevent passing invalid fields or primary key UUIDs
  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.description !== undefined) payload.description = updates.description.trim()
  if (updates.sector !== undefined) payload.sector = updates.sector
  if (updates.amount !== undefined) payload.amount = updates.amount.trim()
  if (updates.requirements !== undefined) payload.requirements = updates.requirements.trim()
  if (updates.status !== undefined) payload.status = updates.status
  payload.updated_at = new Date().toISOString()

  const targetUuid = isUUID(progId)
    ? progId
    : isUUID(updates.dbId)
    ? updates.dbId
    : isUUID(updates.id)
    ? updates.id
    : null

  const targetCode = !isUUID(progId)
    ? progId
    : updates.code || (!isUUID(updates.id) ? updates.id : null)

  let dbSuccess = false
  try {
    let query = supabase.from("benefit_programs").update(payload)
    if (targetUuid) {
      query = query.eq("id", targetUuid)
    } else if (targetCode) {
      query = query.eq("code", targetCode)
    }

    const { data, error } = await query.select()
    if (!error && Array.isArray(data) && data.length > 0) {
      dbSuccess = true
    } else if (error) {
      console.warn("Supabase update program error:", error.message)
      // Retry with alternative identifier if available
      if (!targetUuid && updates.dbId && isUUID(updates.dbId)) {
        const retry = await supabase.from("benefit_programs").update(payload).eq("id", updates.dbId).select()
        if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
          dbSuccess = true
        }
      }
    }
  } catch (err) {
    console.warn("Could not update benefit_program in Supabase:", err.message)
  }

  if (dbSuccess) {
    const fresh = await getBenefitPrograms()
    notifyStorageChange()
    return fresh
  }

  // Fallback cache update
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : INITIAL_PROGRAMS
    const updated = existing.map((p) =>
      p.id === progId || p.code === progId || p.dbId === progId || (targetUuid && p.dbId === targetUuid) || (targetCode && p.code === targetCode)
        ? { ...p, ...payload }
        : p
    )
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(updated))
    notifyStorageChange()
    return updated
  } catch {
    return []
  }
}

// 4. Delete Program from Supabase
export async function deleteBenefitProgram(progId, extraId = null) {
  const targetUuid = isUUID(progId)
    ? progId
    : isUUID(extraId)
    ? extraId
    : null

  const targetCode = !isUUID(progId)
    ? progId
    : extraId && !isUUID(extraId)
    ? extraId
    : null

  let dbSuccess = false
  try {
    let query = supabase.from("benefit_programs").delete()
    if (targetUuid) {
      query = query.eq("id", targetUuid)
    } else if (targetCode) {
      query = query.eq("code", targetCode)
    }
    const { error } = await query

    if (!error) {
      dbSuccess = true
    } else {
      console.warn("Supabase delete program error:", error.message)
      if (targetCode && targetUuid) {
        const retry = await supabase.from("benefit_programs").delete().eq("code", targetCode)
        if (!retry.error) dbSuccess = true
      }
    }
  } catch (err) {
    console.warn("Could not delete benefit_program from Supabase:", err.message)
  }

  // Clean local storage immediately so it can never resurrect
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const updated = existing.filter(
      (p) =>
        p.id !== progId &&
        p.code !== progId &&
        p.dbId !== progId &&
        (!targetUuid || p.dbId !== targetUuid) &&
        (!targetCode || (p.code !== targetCode && p.id !== targetCode))
    )
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(updated))
    localStorage.setItem(PROGRAMS_STORAGE_KEY + "_init", "true")
  } catch {}

  if (dbSuccess) {
    const fresh = await getBenefitPrograms()
    notifyStorageChange()
    return fresh
  }

  notifyStorageChange()
  try {
    return JSON.parse(localStorage.getItem(PROGRAMS_STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

// 5. Get Claims directly from Supabase (with fallback cache)
export async function getBenefitClaims() {
  try {
    const { data, error } = await supabase
      .from("benefit_claims")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      if (data.length === 0) {
        const hasLoadedBefore = localStorage.getItem(CLAIMS_STORAGE_KEY + "_init")
        if (!hasLoadedBefore) {
          localStorage.setItem(CLAIMS_STORAGE_KEY + "_init", "true")
          return INITIAL_CLAIMS
        }
        localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify([]))
        return []
      }
      const mapped = data.map(mapDbRowToClaim)
      localStorage.setItem(CLAIMS_STORAGE_KEY + "_init", "true")
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(mapped))
      return mapped
    }
  } catch (err) {
    console.warn("Could not load benefit_claims from Supabase:", err.message)
  }

  // Fallback cache
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {}

  return INITIAL_CLAIMS
}

// 6. Save Claim into Supabase
export async function saveBenefitClaim(newClaim) {
  const claimNum = newClaim.id || newClaim.claimNumber || `CLM-${Date.now().toString().slice(-5)}`
  const payload = {
    claim_number: claimNum,
    member_id: newClaim.memberId,
    member_name: newClaim.memberName,
    benefit_name: newClaim.benefit,
    amount: newClaim.amount || "₱1,000.00",
    release_method: newClaim.releaseMethod || "Cash",
    release_date: newClaim.releaseDate || new Date().toISOString().split("T")[0],
    reference_no: newClaim.referenceNo || "",
    remarks: newClaim.remarks || "",
    status: newClaim.status || "Pending",
    updated_at: new Date().toISOString(),
  }

  let savedRow = null
  try {
    const { data, error } = await supabase
      .from("benefit_claims")
      .insert([payload])
      .select()
      .maybeSingle()

    if (!error && data) {
      savedRow = mapDbRowToClaim(data)
    }
  } catch (err) {
    console.warn("Could not insert benefit_claim in Supabase:", err.message)
  }

  const finalClaim = savedRow || {
    ...newClaim,
    id: claimNum,
    claimNumber: claimNum,
    date: "Just now",
  }

  try {
    const existing = JSON.parse(localStorage.getItem(CLAIMS_STORAGE_KEY) || "[]")
    const updated = [finalClaim, ...existing.filter((c) => c.id !== claimNum && c.claimNumber !== claimNum)]
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(updated))
    notifyStorageChange()
    return updated
  } catch {
    return [finalClaim]
  }
}

// 7. Update Claim Status in Supabase (with UUID safety)
export async function updateBenefitClaimStatus(claimId, newStatus) {
  let dbSuccess = false
  try {
    let query = supabase.from("benefit_claims").update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })

    if (isUUID(claimId)) {
      query = query.eq("id", claimId)
    } else {
      query = query.eq("claim_number", claimId)
    }

    const { data, error } = await query.select()
    if (!error && Array.isArray(data) && data.length > 0) {
      dbSuccess = true
    } else if (error) {
      console.warn("Supabase update claim status error:", error.message)
    }
  } catch (err) {
    console.warn("Could not update claim status in Supabase:", err.message)
  }

  if (dbSuccess) {
    const fresh = await getBenefitClaims()
    notifyStorageChange()
    return fresh
  }

  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : INITIAL_CLAIMS
    const updated = existing.map((c) =>
      c.id === claimId || c.claimNumber === claimId || c.dbId === claimId
        ? { ...c, status: newStatus }
        : c
    )
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(updated))
    notifyStorageChange()
    return updated
  } catch {
    return []
  }
}

// 8. Delete Claim permanently from Supabase
export async function deleteBenefitClaim(claimId, extraId = null) {
  const targetUuid = isUUID(claimId)
    ? claimId
    : isUUID(extraId)
    ? extraId
    : null

  const targetClaimNum = !isUUID(claimId)
    ? claimId
    : extraId && !isUUID(extraId)
    ? extraId
    : null

  let dbSuccess = false
  try {
    let query = supabase.from("benefit_claims").delete()

    if (targetUuid) {
      query = query.eq("id", targetUuid)
    } else if (targetClaimNum) {
      query = query.eq("claim_number", targetClaimNum)
    }

    const { error } = await query
    if (!error) {
      dbSuccess = true
    } else {
      console.warn("Supabase delete claim error:", error.message)
      if (targetClaimNum && targetUuid) {
        const retry = await supabase.from("benefit_claims").delete().eq("claim_number", targetClaimNum)
        if (!retry.error) dbSuccess = true
      }
    }
  } catch (err) {
    console.warn("Could not delete claim from Supabase:", err.message)
  }

  // Clean local storage immediately so it can never resurrect
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const updated = existing.filter(
      (c) =>
        c.id !== claimId &&
        c.claimNumber !== claimId &&
        c.dbId !== claimId &&
        (!targetUuid || c.dbId !== targetUuid) &&
        (!targetClaimNum || (c.claimNumber !== targetClaimNum && c.id !== targetClaimNum))
    )
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(updated))
    localStorage.setItem(CLAIMS_STORAGE_KEY + "_init", "true")
  } catch {}

  if (dbSuccess) {
    const fresh = await getBenefitClaims()
    notifyStorageChange()
    return fresh
  }

  notifyStorageChange()
  try {
    return JSON.parse(localStorage.getItem(CLAIMS_STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

// 9. Get Benefit Stats
export async function getBenefitStats() {
  const [programs, claims] = await Promise.all([
    getBenefitPrograms(),
    getBenefitClaims(),
  ])

  const totalPrograms = programs.length
  const activePrograms = programs.filter((p) => p.status === "Active").length
  const processedClaims = claims.filter((c) => c.status === "Processed").length
  const openRequests = claims.filter((c) => c.status === "Pending").length
  const releasedValue = claims
    .filter((c) => c.status === "Processed")
    .reduce((sum, c) => {
      const n = parseFloat((c.amount || "").replace(/[₱,]/g, "")) || 0
      return sum + n
    }, 0)

  return {
    totalPrograms,
    activePrograms,
    processedClaims,
    openRequests,
    releasedValue,
    claims,
    programs,
  }
}
