import { supabase } from "@/lib/supabaseClient"
import { resolveAvatarUrl } from "./avatarService"

const MEMBERS_STORAGE_KEY = "mswdo_members_registry"
const ARCHIVES_STORAGE_KEY = "mswdo_archives_registry"

// Default seed members to display if database is clean or connecting
export const DEFAULT_SEED_MEMBERS = [
  {
    id: "m0000000-0000-0000-0000-000000000001",
    uid: "sd882194mSwdoDelante97172",
    initials: "SD",
    name: "Shen M Delante",
    email: "alotajennery@gmail.com",
    memberId: "MSWDO-97172",
    category: "Person with Disability (PWD)",
    contact: "09436232143",
    status: "Active",
    updated: "Sep 22, 2026",
    birthDate: "May 14, 1994",
    gender: "Female",
    civilStatus: "Single",
    occupation: "Employed",
    address: "Poblacion, Carmen, Cebu",
    barangay: "Barangay Poblacion",
    sourceApplication: "Online Program Application",
    lastUpdatedFull: "Sep 22, 2026, 6:01 PM",
    hasDuplicates: false,
    missingFiles: false,
    categoryDetails: {
      applicationType: "New Applicant",
      disabilityType: "Orthopedic / Physical Disability",
      disabilityCause: "Congenital / Inborn",
      educationalAttainment: "College Graduate",
      employmentStatus: "Employed",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "shen_pwd_request.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Verified" },
      { id: "doc2", key: "medical_cert", name: "Medical certificate", fileName: "doh_med_assessment.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", status: "Verified" },
      { id: "doc3", key: "valid_id", name: "Valid government ID", fileName: "shen_philhealth_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Verified" },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000002",
    uid: "nd992011YouthDelante87656",
    initials: "ND",
    name: "Neil M Delante",
    email: "neilmolinadelante@gmail.com",
    memberId: "MSWDO-87656",
    category: "Youth",
    contact: "0943632143",
    status: "Active",
    updated: "Sep 20, 2026",
    birthDate: "Oct 28, 2005",
    gender: "Male",
    civilStatus: "Single",
    occupation: "Student",
    address: "Dawis Norte, Carmen, Cebu",
    barangay: "Dawis Norte",
    sourceApplication: "Assisted Counter Application",
    lastUpdatedFull: "Sep 20, 2026, 2:10 PM",
    hasDuplicates: false,
    missingFiles: false,
    categoryDetails: {
      educationalAttainment: "College Undergraduate",
      outOfSchool: "No",
      schoolName: "Cebu Technological University - Carmen",
      organization: "Carmen Youth Advocates",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "neil_youth_req.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Verified" },
      { id: "doc2", key: "psa_birth_cert", name: "PSA Birth Certificate", fileName: "delante_psa.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", status: "Verified" },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000003",
    uid: "ao80714WomenApplicantOne",
    initials: "AO",
    name: "Applicant N One",
    email: "delanteneil4@gmail.com",
    memberId: "MSWDO-80714",
    category: "Women",
    contact: "0915165156",
    status: "Active",
    updated: "Aug 4, 2026",
    birthDate: "Jul 19, 1988",
    gender: "Female",
    civilStatus: "Married",
    occupation: "Self-employed",
    address: "Luyang, Carmen, Cebu",
    barangay: "Luyang",
    sourceApplication: "Online Intake Portal",
    lastUpdatedFull: "Aug 4, 2026, 11:45 AM",
    hasDuplicates: false,
    missingFiles: true,
    missingFilesCount: 2,
    categoryDetails: {
      isSoloParent: "Yes",
      numberOfChildren: "2",
      occupation: "Self-employed",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "solo_parent_req.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Verified" },
    ],
  },
  {
    id: "m0000000-0000-0000-0000-000000000004",
    uid: "l5h9zK17lvaSElrxwePIVFIFqvH3",
    initials: "MR",
    name: "Maria C. Reyes",
    email: "maria.reyes@gmail.com",
    memberId: "MSWDO-62099",
    category: "Senior Citizen",
    contact: "09298765432",
    status: "Active",
    updated: "Sep 22, 2026",
    birthDate: "Apr 12, 1958",
    gender: "Female",
    civilStatus: "Widowed",
    occupation: "None / Homemaker",
    address: "Sitio Riverside, Cantipay, Carmen, Cebu",
    barangay: "Cantipay",
    sourceApplication: "Senior Citizen Welfare Program",
    lastUpdatedFull: "Sep 22, 2026, 7:31 PM",
    hasDuplicates: true,
    missingFiles: false,
    categoryDetails: {
      citizenship: "Filipino",
      pension: "None",
      livingArrangement: "Living with Relatives",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "reyes_senior.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Verified" },
      { id: "doc2", key: "valid_id", name: "Postal ID", fileName: "reyes_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Verified" },
    ],
  },
]

// Normalize raw database row to unified UI Member Model
function mapDbRowToMember(item) {
  const initials = (
    item.first_name?.[0] || item.full_name?.[0] || "M"
  ) + (
    item.last_name?.[0] || item.full_name?.split(" ")?.slice(-1)?.[0]?.[0] || ""
  )

  const updatedDate = item.updated_at || item.created_at || new Date().toISOString()
  const formattedUpdated = new Date(updatedDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Format birthDate string
  let birthDateFormatted = "—"
  if (item.dob) {
    const d = new Date(item.dob)
    if (!isNaN(d.getTime())) {
      birthDateFormatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  const docs = Array.isArray(item.documents) ? item.documents : []
  const missingFilesCount = docs.length < 2 ? 2 - docs.length : 0

  return {
    id: item.id,
    applicationId: item.application_id,
    userId: item.user_id,
    uid: item.user_id || item.id,
    initials: initials.toUpperCase(),
    name: item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unnamed Beneficiary",
    firstName: item.first_name || "",
    middleName: item.middle_name || "",
    lastName: item.last_name || "",
    email: item.email || "—",
    memberId: item.member_id || "—",
    category: item.category || "General",
    contact: item.contact_number || "—",
    status: item.status || "Active",
    isArchived: item.is_archived || item.status === "Archived",
    updated: formattedUpdated,
    birthDate: birthDateFormatted,
    rawDob: item.dob,
    gender: item.gender || "—",
    civilStatus: item.civil_status || "—",
    occupation: item.occupation || "—",
    address: item.complete_address || "Carmen, Cebu",
    barangay: item.barangay || "Carmen",
    sourceApplication: item.source_application || "Online Program Application",
    lastUpdatedFull: new Date(updatedDate).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    hasDuplicates: Boolean(item.duplicate_of),
    duplicateOf: item.duplicate_of || null,
    missingFiles: missingFilesCount > 0,
    missingFilesCount,
    categoryDetails: item.category_details || {},
    documents: docs,
    avatarUrl: resolveAvatarUrl(item),
  }
}

// 1. Fetch Members directly from Supabase, syncing with approved applications
export async function getMembers() {
  let dbMembers = []
  let allApplications = []

  // 1A. Fetch from public.members
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      dbMembers = data
    }
  } catch (err) {
    console.warn("Could not load from members table:", err.message)
  }

  // 1B. Fetch all applications from Supabase
  try {
    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select("*")

    if (!appsError && Array.isArray(appsData)) {
      allApplications = appsData
    }
  } catch (err) {
    console.warn("Could not query applications:", err.message)
  }

  // 1C. Merge with localStorage applications (mswdo_submitted_applications)
  // CRITICAL: DB rows are source of truth! Never let stale localStorage overwrite Approved status.
  try {
    const localApps = JSON.parse(localStorage.getItem("mswdo_submitted_applications") || "[]")
    localApps.forEach((localApp) => {
      const idx = allApplications.findIndex(
        (a) =>
          a.id === localApp.id ||
          (a.reference_number &&
            (a.reference_number === localApp.reference ||
              a.reference_number === localApp.reference_number))
      )
      if (idx >= 0) {
        const dbApp = allApplications[idx]
        const effectiveStatus =
          (dbApp.status || "").toLowerCase() === "approved"
            ? dbApp.status
            : localApp.status || dbApp.status
        allApplications[idx] = {
          ...localApp,
          ...dbApp,
          status: effectiveStatus,
        }
      } else {
        allApplications.push(localApp)
      }
    })
  } catch {}

  // 1D. Categorize applications
  const approvedApps = allApplications.filter(
    (a) => (a.status || "").toLowerCase() === "approved"
  )
  const rejectedOrCorrectionApps = allApplications.filter((a) => {
    const s = (a.status || "").toLowerCase()
    return s === "rejected" || s === "needs correction"
  })

  // 1E. Auto-enroll approved applications into members if not already enrolled
  for (const app of approvedApps) {
    const appId = app.id
    const appRef = (app.reference_number || app.reference || "")
      .replace("MSWDO-2026-", "")
      .replace("MSWDO-", "")
      .toLowerCase()
    const appEmail = (app.email || "").toLowerCase().trim()

    const alreadyEnrolled = dbMembers.some((m) => {
      const mAppId = m.application_id || m.applicationId
      const mMemberId = (m.member_id || m.memberId || "")
        .replace("MSWDO-2026-", "")
        .replace("MSWDO-", "")
        .toLowerCase()
      const mEmail = (m.email || "").toLowerCase().trim()

      if (appId && mAppId && mAppId === appId) return true
      if (appRef && mMemberId && mMemberId === appRef) return true
      if (appEmail && mEmail && appEmail === mEmail) return true
      return false
    })

    if (!alreadyEnrolled) {
      const refSuffix =
        (app.reference_number || app.reference)
          ?.replace("MSWDO-2026-", "")
          .replace("MSWDO-", "") || Math.floor(10000 + Math.random() * 90000)
      const generatedMemberId = `MSWDO-${refSuffix}`
      const fullName = (
        app.full_name ||
        app.name ||
        `${app.first_name || app.firstName || ""} ${
          app.middle_name || app.middleName
            ? (app.middle_name || app.middleName) + " "
            : ""
        }${app.last_name || app.lastName || ""}`
      ).trim()

      const sectorLabel =
        app.category === "senior"
          ? "Senior Citizen"
          : app.category === "pwd"
          ? "Person with Disability (PWD)"
          : app.category === "women"
          ? "Women's Welfare"
          : app.category === "youth"
          ? "Youth"
          : app.sector || "General"

      const newMemberRow = {
        application_id: app.id,
        member_id: generatedMemberId,
        full_name: fullName || "Beneficiary",
        first_name: app.first_name || app.firstName || fullName.split(" ")[0] || "",
        middle_name: app.middle_name || app.middleName || "",
        last_name:
          app.last_name || app.lastName || fullName.split(" ").slice(-1)[0] || "",
        email: app.email,
        contact_number: app.contact_number || app.contact || "",
        category: sectorLabel,
        status: "Active",
        dob: app.dob || app.birthDate || null,
        gender: app.gender || "Unspecified",
        civil_status: app.civil_status || app.civilStatus || "Single",
        occupation:
          app.category_details?.occupation ||
          app.categoryDetails?.occupation ||
          "Resident",
        complete_address:
          app.complete_address || app.address || "Barangay Poblacion, Carmen, Cebu",
        category_details: app.category_details || app.categoryDetails || {},
        documents: app.documents || [],
        source_application: "Online Program Application",
        created_at: app.submitted_at || app.submitted || new Date().toISOString(),
      }

      // Add to dbMembers immediately
      dbMembers.unshift(newMemberRow)

      // Try persisting to Supabase in background
      try {
        supabase
          .from("members")
          .upsert([newMemberRow], { onConflict: "member_id" })
          .then(() => {})
      } catch {}
    }
  }

  // 1F. Only filter out members that specifically match a rejected or needs-correction application
  const isRejectedOrCorrection = (m) => {
    const mStatus = (m.status || "").toLowerCase()
    if (mStatus === "needs correction" || mStatus === "rejected") return true

    const mAppId = m.application_id || m.applicationId
    const mRef = (m.member_id || m.memberId || "")
      .replace("MSWDO-2026-", "")
      .replace("MSWDO-", "")
      .toLowerCase()
    const mEmail = (m.email || "").toLowerCase().trim()

    return rejectedOrCorrectionApps.some((app) => {
      const appId = app.id
      const appRef = (app.reference_number || app.reference || "")
        .replace("MSWDO-2026-", "")
        .replace("MSWDO-", "")
        .toLowerCase()
      const appEmail = (app.email || "").toLowerCase().trim()

      if (appId && mAppId && mAppId === appId) return true
      if (appRef && mRef && mRef === appRef) return true
      if (appEmail && mEmail && appEmail === mEmail) return true
      return false
    })
  }

  const validMembers = dbMembers.filter((m) => !isRejectedOrCorrection(m))

  // 1G. Map and cache
  if (validMembers.length > 0) {
    const mapped = validMembers.map(mapDbRowToMember)
    try {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(mapped))
    } catch {}
    return mapped
  }

  // 1H. Fallback to localStorage only if DB was unavailable and local records exist
  try {
    const local = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    if (Array.isArray(local) && local.length > 0) {
      const filteredLocal = local.filter((m) => !isUnapproved(m))
      if (filteredLocal.length > 0) return filteredLocal
    }
  } catch {}

  // If empty, return empty list! Never display fallbacks!
  return []
}

// 2A. Remove member when application is returned for correction or rejected
export async function removeMemberByApplication(appIdOrRef, appData = null) {
  if (!appIdOrRef && !appData) return false

  const id = appIdOrRef || appData?.id
  const ref = appData?.reference || appData?.reference_number || appIdOrRef
  const email = (appData?.email || "").toLowerCase().trim()
  const name = (appData?.name || `${appData?.first_name || ""} ${appData?.last_name || ""}`).toLowerCase().trim()

  // 1. Remove from Supabase
  try {
    const filters = []
    if (id) filters.push(`application_id.eq.${id}`)
    if (ref) {
      const cleanRef = ref.replace("MSWDO-2026-", "").replace("MSWDO-", "")
      filters.push(`member_id.ilike.%${cleanRef}%`)
    }
    if (email) filters.push(`email.ilike.${email}`)

    if (filters.length > 0) {
      await supabase.from("members").delete().or(filters.join(","))
    }
  } catch (err) {
    console.warn("Could not remove member from Supabase:", err.message)
  }

  // 2. Remove from localStorage registry
  try {
    const existing = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const filtered = existing.filter((m) => {
      if (id && (m.applicationId === id || m.id === id)) return false
      if (ref) {
        const cleanRef = ref.replace("MSWDO-2026-", "").replace("MSWDO-", "").toLowerCase()
        if (m.memberId?.toLowerCase().includes(cleanRef)) return false
      }
      if (email && m.email?.toLowerCase() === email) return false
      if (name) {
        const mClean = (m.name || "").toLowerCase().replace(/[^a-z]/g, "")
        const aClean = name.replace(/[^a-z]/g, "")
        if (mClean === aClean || mClean.includes(aClean) || aClean.includes(mClean)) return false
      }
      return true
    })
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(filtered))
  } catch {}

  return true
}

// 2B. Create or sync a member when an application is approved
export async function createMemberFromApplication(application) {
  if (!application) return null

  const sectorLabel =
    application.category === "senior"
      ? "Senior Citizen"
      : application.category === "pwd"
      ? "Person with Disability (PWD)"
      : application.category === "women"
      ? "Women's Welfare"
      : application.category === "youth"
      ? "Youth"
      : application.sector || "General"

  const refSuffix =
    (application.reference_number || application.reference)
      ?.replace("MSWDO-2026-", "")
      .replace("MSWDO-", "") || Math.floor(10000 + Math.random() * 90000)
  const memberId = `MSWDO-${refSuffix}`

  const fullName = (
    application.full_name ||
    application.name ||
    `${application.first_name || application.firstName || ""} ${
      application.middle_name || application.middleName
        ? (application.middle_name || application.middleName) + " "
        : ""
    }${application.last_name || application.lastName || ""}`
  ).trim()

  const payload = {
    application_id: application.id,
    member_id: memberId,
    full_name: fullName || "Beneficiary",
    first_name: application.first_name || application.firstName || fullName.split(" ")[0] || "",
    middle_name: application.middle_name || application.middleName || "",
    last_name:
      application.last_name || application.lastName || fullName.split(" ").slice(-1)[0] || "",
    email: (application.email || "").toLowerCase(),
    contact_number: application.contact_number || application.contact || "",
    category: sectorLabel,
    status: "Active",
    dob: application.dob || application.birthDate || null,
    gender: application.gender || "Unspecified",
    civil_status: application.civil_status || application.civilStatus || "Single",
    occupation:
      application.category_details?.occupation ||
      application.categoryDetails?.occupation ||
      "Resident",
    complete_address:
      application.complete_address || application.address || "Barangay Poblacion, Carmen, Cebu",
    category_details: application.category_details || application.categoryDetails || {},
    documents: application.documents || [],
    source_application: "Online Program Application",
    created_at: application.submitted_at || application.submitted || new Date().toISOString(),
  }

  let result = null

  try {
    const { data, error } = await supabase
      .from("members")
      .upsert([payload], { onConflict: "member_id" })
      .select()
      .maybeSingle()

    if (!error && data) {
      result = mapDbRowToMember(data)
    }
  } catch (err) {
    console.warn("Could not insert member into Supabase:", err.message)
  }

  if (!result) {
    result = mapDbRowToMember({ id: `mem-${Date.now()}`, ...payload })
  }

  // Update local storage and notify listeners
  try {
    const existing = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const updated = [
      result,
      ...existing.filter((m) => m.id !== result.id && m.memberId !== result.memberId),
    ]
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated))
    if (typeof window !== "undefined") window.dispatchEvent(new Event("storage"))
  } catch {}

  return result
}

// 3. Update an existing member record
export async function updateMember(memberId, fields) {
  if (!memberId) return null

  const updatePayload = {
    full_name: fields.name,
    first_name: fields.firstName,
    last_name: fields.lastName,
    contact_number: fields.contact,
    email: fields.email,
    category: fields.category,
    status: fields.status,
    complete_address: fields.address,
    civil_status: fields.civilStatus,
    occupation: fields.occupation,
    gender: fields.gender,
    updated_at: new Date().toISOString(),
  }

  // Clean undefined keys
  Object.keys(updatePayload).forEach((k) => updatePayload[k] === undefined && delete updatePayload[k])

  try {
    const { data, error } = await supabase
      .from("members")
      .update(updatePayload)
      .or(`id.eq.${memberId},member_id.eq.${memberId}`)
      .select()
      .maybeSingle()

    if (!error && data) {
      return mapDbRowToMember(data)
    }
  } catch (err) {
    console.warn("Could not update member in Supabase:", err.message)
  }

  // Update in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const updated = existing.map((m) => (m.id === memberId || m.memberId === memberId ? { ...m, ...fields, updated: "Just now" } : m))
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated))
    return updated.find((m) => m.id === memberId || m.memberId === memberId)
  } catch {}

  return null
}

// 4. Archive a member record and store snapshot in public.archives
export async function archiveMember(member, reason = "Archived by administrator") {
  if (!member) return false

  const archiveEntry = {
    record_type: "member",
    record_id: member.id || member.uid,
    member_id: member.memberId,
    title: member.name,
    category: member.category,
    reason: reason || "Archived by administrator",
    archived_by_name: "Super Admin",
    original_data: member,
    archived_at: new Date().toISOString(),
    status: "Archived",
  }

  // 4A. Insert into public.archives table
  let archiveSaved = false
  try {
    const { error: archErr } = await supabase
      .from("archives")
      .insert([archiveEntry])

    if (!archErr) archiveSaved = true
  } catch (e) {
    console.warn("Could not save to archives table in Supabase:", e.message)
  }

  // 4B. Update member status to 'Archived' in public.members
  try {
    await supabase
      .from("members")
      .update({
        status: "Archived",
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${member.id},member_id.eq.${member.memberId}`)
  } catch (e) {
    console.warn("Could not update member status in Supabase:", e.message)
  }

  // 4C. Update local caches
  try {
    // Save to archives cache
    const existingArchives = JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify([archiveEntry, ...existingArchives]))

    // Update members cache
    const existingMembers = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const updatedMembers = existingMembers.map((m) =>
      m.id === member.id || m.memberId === member.memberId
        ? { ...m, status: "Archived", isArchived: true }
        : m
    )
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers))
  } catch {}

  return true
}

// 5. Restore / Unarchive a member record
export async function unarchiveMember(memberId) {
  if (!memberId) return false

  try {
    await supabase
      .from("members")
      .update({
        status: "Active",
        is_archived: false,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${memberId},member_id.eq.${memberId}`)
  } catch (e) {
    console.warn("Could not unarchive member in Supabase:", e.message)
  }

  // Update in localStorage
  try {
    const existingMembers = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const updatedMembers = existingMembers.map((m) =>
      m.id === memberId || m.memberId === memberId
        ? { ...m, status: "Active", isArchived: false }
        : m
    )
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers))
  } catch {}

  return true
}

// 6. Link Duplicate Member
export async function linkDuplicateMembers(primaryMemberId, duplicateMemberId) {
  if (!primaryMemberId || !duplicateMemberId) return false

  try {
    await supabase
      .from("members")
      .update({
        duplicate_of: primaryMemberId,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${duplicateMemberId},member_id.eq.${duplicateMemberId}`)
  } catch (e) {
    console.warn("Could not link duplicate member in Supabase:", e.message)
  }

  // Update localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    const updated = existing.map((m) =>
      m.id === duplicateMemberId || m.memberId === duplicateMemberId
        ? { ...m, hasDuplicates: true, duplicateOf: primaryMemberId }
        : m
    )
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  return true
}

// 7. Get All Archived Records from public.archives
export async function getArchives() {
  try {
    const { data, error } = await supabase
      .from("archives")
      .select("*")
      .order("archived_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      return data
    }
  } catch (err) {
    console.warn("Could not fetch archives from Supabase:", err.message)
  }

  // LocalStorage fallback
  try {
    return JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}
