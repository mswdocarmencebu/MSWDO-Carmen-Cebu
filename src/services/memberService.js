import { supabase } from "@/lib/supabaseClient"
import { resolveAvatarUrl } from "./avatarService"

const MEMBERS_STORAGE_KEY = "mswdo_members_registry"
const ARCHIVES_STORAGE_KEY = "mswdo_archives_registry"
const DELETED_MEMBERS_KEY = "mswdo_deleted_member_ids"

export const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())

export function getDeletedMemberIds() {
  try {
    const raw = localStorage.getItem(DELETED_MEMBERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function recordDeletedMemberId(idOrCode) {
  if (!idOrCode) return
  try {
    const list = getDeletedMemberIds()
    const str = String(idOrCode).trim()
    if (str && !list.includes(str)) {
      list.push(str)
      localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(list))
    }
  } catch {}
}

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
    first_name: item.first_name || "",
    middle_name: item.middle_name || "",
    last_name: item.last_name || "",
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
  let membersTableQueried = false
  let applicationsTableQueried = false

  // 1A. Fetch from public.members
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      dbMembers = data
      membersTableQueried = true
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
      applicationsTableQueried = true
    }
  } catch (err) {
    console.warn("Could not query applications:", err.message)
  }

  // 1C. When Supabase was queried, synchronize localStorage so deleted records don't persist as ghosts
  if (applicationsTableQueried) {
    try {
      const dbAppIds = new Set(allApplications.map((a) => a.id))
      const dbAppRefs = new Set(
        allApplications.map((a) => a.reference_number || a.reference).filter(Boolean)
      )
      const localApps = JSON.parse(localStorage.getItem("mswdo_submitted_applications") || "[]")
      const purgedLocalApps = localApps.filter(
        (la) => dbAppIds.has(la.id) || dbAppRefs.has(la.reference) || dbAppRefs.has(la.reference_number)
      )
      localStorage.setItem("mswdo_submitted_applications", JSON.stringify(purgedLocalApps))
    } catch (_) {}
  }

  // 1D. Categorize applications & identify permanently deleted records
  const deletedIds = getDeletedMemberIds()
  const deletedSet = new Set(deletedIds.map((x) => String(x).toLowerCase().trim()))

  const isDeletedApp = (app) => {
    if (deletedSet.size === 0) return false
    const appId = (app.id || "").toLowerCase().trim()
    const appRef = (app.reference_number || app.reference || "").toLowerCase().trim()
    const cleanRef = appRef.replace("mswdo-2026-", "").replace("mswdo-", "")
    const appEmail = (app.email || "").toLowerCase().trim()

    return (
      (appId && deletedSet.has(appId)) ||
      (appRef && deletedSet.has(appRef)) ||
      (cleanRef && deletedSet.has(cleanRef)) ||
      (cleanRef && deletedSet.has(`mswdo-${cleanRef}`)) ||
      (appEmail && deletedSet.has(appEmail))
    )
  }

  const approvedApps = allApplications.filter(
    (a) => (a.status || "").toLowerCase() === "approved" && !isDeletedApp(a)
  )
  const rejectedOrCorrectionApps = allApplications.filter((a) => {
    const s = (a.status || "").toLowerCase()
    return s === "rejected" || s === "needs correction"
  })

  // 1E. Auto-enroll approved applications into members ONLY if approved applications exist in DB
  if (approvedApps.length > 0) {
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

        dbMembers.unshift(newMemberRow)

        try {
          supabase
            .from("members")
            .upsert([newMemberRow], { onConflict: "member_id" })
            .then(() => {})
        } catch {}
      }
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

  // Check if member was explicitly deleted
  const isDeletedMember = (m) => {
    if (deletedSet.size === 0) return false
    const mId = (m.id || "").toLowerCase().trim()
    const mMemberId = (m.member_id || m.memberId || "").toLowerCase().trim()
    const cleanRef = mMemberId.replace("mswdo-2026-", "").replace("mswdo-", "")
    const mAppId = (m.application_id || m.applicationId || "").toLowerCase().trim()
    const mEmail = (m.email || "").toLowerCase().trim()

    return (
      (mId && deletedSet.has(mId)) ||
      (mMemberId && deletedSet.has(mMemberId)) ||
      (cleanRef && deletedSet.has(cleanRef)) ||
      (cleanRef && deletedSet.has(`mswdo-${cleanRef}`)) ||
      (mAppId && deletedSet.has(mAppId)) ||
      (mEmail && deletedSet.has(mEmail))
    )
  }

  const validMembers = dbMembers.filter((m) => !isRejectedOrCorrection(m) && !isDeletedMember(m))

  // 1G. If Supabase members table was queried, it is the single source of truth!
  if (membersTableQueried) {
    const mapped = validMembers.map(mapDbRowToMember)
    try {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(mapped))
    } catch {}
    return mapped
  }

  // 1H. Fallback to localStorage only if Supabase was completely unreachable/offline
  try {
    const local = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY) || "[]")
    if (Array.isArray(local) && local.length > 0) {
      return local.filter((m) => !isDeletedMember(m))
    }
  } catch {}

  // If empty, return empty list!
  return []
}

// 2A. Remove member when application is returned for correction or rejected
export async function removeMemberByApplication(appIdOrRef, appData = null) {
  if (!appIdOrRef && !appData) return false

  const id = appIdOrRef || appData?.id
  const ref = appData?.reference || appData?.reference_number || appIdOrRef
  const email = (appData?.email || "").toLowerCase().trim()
  const name = (appData?.name || `${appData?.first_name || ""} ${appData?.last_name || ""}`).toLowerCase().trim()

  // 1. Remove from Supabase safely
  try {
    if (id && isUUID(id)) {
      await supabase.from("members").delete().eq("application_id", id)
    }
    if (ref) {
      const cleanRef = ref.replace("MSWDO-2026-", "").replace("MSWDO-", "").trim()
      if (cleanRef) {
        await supabase.from("members").delete().ilike("member_id", `%${cleanRef}%`)
      }
    }
    if (email && email.includes("@")) {
      await supabase.from("members").delete().ilike("email", email)
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
    let result = null
    if (isUUID(memberId)) {
      const { data, error } = await supabase
        .from("members")
        .update(updatePayload)
        .eq("id", memberId)
        .select()
        .maybeSingle()
      if (!error && data) result = data
    }

    if (!result) {
      const { data, error } = await supabase
        .from("members")
        .update(updatePayload)
        .eq("member_id", memberId)
        .select()
        .maybeSingle()
      if (!error && data) result = data
    }

    if (result) {
      return mapDbRowToMember(result)
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
    const updateData = {
      status: "Archived",
      is_archived: true,
      updated_at: new Date().toISOString(),
    }
    if (member.id && isUUID(member.id)) {
      await supabase.from("members").update(updateData).eq("id", member.id)
    }
    if (member.memberId) {
      await supabase.from("members").update(updateData).eq("member_id", member.memberId)
    }
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("mswdo_members_changed", { detail: { memberId: member.id, status: "Archived" } }))
    }
  } catch {}

  return true
}

// 5. Restore / Unarchive a member record
export async function unarchiveMember(memberId) {
  if (!memberId) return false

  try {
    const updateData = {
      status: "Active",
      is_archived: false,
      updated_at: new Date().toISOString(),
    }
    if (isUUID(memberId)) {
      await supabase.from("members").update(updateData).eq("id", memberId)
    } else {
      await supabase.from("members").update(updateData).eq("member_id", memberId)
    }
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("mswdo_members_changed", { detail: { memberId: member.id, status: "Archived" } }))
    }
  } catch {}

  return true
}

// 6. Link Duplicate Member
export async function linkDuplicateMembers(primaryMemberId, duplicateMemberId) {
  if (!primaryMemberId || !duplicateMemberId) return false

  try {
    const updateData = {
      duplicate_of: primaryMemberId,
      updated_at: new Date().toISOString(),
    }
    if (isUUID(duplicateMemberId)) {
      await supabase.from("members").update(updateData).eq("id", duplicateMemberId)
    } else {
      await supabase.from("members").update(updateData).eq("member_id", duplicateMemberId)
    }
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

// 8. Delete a member record permanently from database and cache
export async function deleteMember(memberIdOrObject) {
  if (!memberIdOrObject) return false

  const memberObj = typeof memberIdOrObject === "object" ? memberIdOrObject : {}
  const rawId = typeof memberIdOrObject === "object" ? (memberIdOrObject.id || memberIdOrObject.memberId) : memberIdOrObject
  const memberCode = memberObj.memberId || (typeof memberIdOrObject === "string" && !isUUID(memberIdOrObject) ? memberIdOrObject : null)
  const memberId = memberObj.id || (typeof memberIdOrObject === "string" && isUUID(memberIdOrObject) ? memberIdOrObject : null)
  const email = memberObj.email && memberObj.email !== "—" ? memberObj.email.trim() : null
  const appId = memberObj.applicationId || memberObj.application_id || null
  const uid = memberObj.uid || memberObj.userId || memberObj.user_id || null

  // Record deleted identifiers so getMembers() permanently remembers to exclude them
  const identifiersToRecord = [
    rawId,
    memberId,
    memberCode,
    email,
    appId,
    uid,
    memberCode?.replace("MSWDO-2026-", "")?.replace("MSWDO-", ""),
  ].filter(Boolean)

  identifiersToRecord.forEach((id) => recordDeletedMemberId(id))

  // 1. Delete from Supabase public.members safely without column type casting errors
  // 1A. Delete by member_id (TEXT column in Supabase)
  if (memberCode) {
    try {
      await supabase.from("members").delete().eq("member_id", memberCode)
      const cleanCode = memberCode.replace("MSWDO-2026-", "").replace("MSWDO-", "").trim()
      if (cleanCode && cleanCode !== memberCode) {
        await supabase.from("members").delete().ilike("member_id", `%${cleanCode}%`)
      }
    } catch (err) {
      console.warn("Could not delete member by member_id from Supabase:", err?.message)
    }
  }

  // 1B. Delete by id (UUID column) ONLY if valid UUID
  if (memberId && isUUID(memberId)) {
    try {
      await supabase.from("members").delete().eq("id", memberId)
    } catch (err) {
      console.warn("Could not delete member by id from Supabase:", err?.message)
    }
  }

  // 1C. Delete by user_id/uid (UUID column) if valid UUID and different
  if (uid && isUUID(uid) && uid !== memberId) {
    try {
      await supabase.from("members").delete().eq("id", uid)
    } catch (err) {
      console.warn("Could not delete member by uid from Supabase:", err?.message)
    }
  }

  // 1D. Delete by application_id (UUID column) if valid UUID
  if (appId && isUUID(appId)) {
    try {
      await supabase.from("members").delete().eq("application_id", appId)
    } catch (err) {
      console.warn("Could not delete member by application_id from Supabase:", err?.message)
    }
  }

  // 1E. Delete by email if provided
  if (email && email.includes("@")) {
    try {
      await supabase.from("members").delete().ilike("email", email)
    } catch (err) {
      console.warn("Could not delete member by email from Supabase:", err?.message)
    }
  }

  // 2. Prevent application from re-enrolling this member: update linked application status
  if (appId && isUUID(appId)) {
    try {
      await supabase.from("applications").update({ status: "Archived" }).eq("id", appId)
    } catch (_) {}
  }
  if (memberCode) {
    try {
      await supabase.from("applications").update({ status: "Archived" }).eq("reference_number", memberCode)
    } catch (_) {}
  }

  // 3. Delete any archive entry for this member
  if (memberId && isUUID(memberId)) {
    try {
      await supabase.from("archives").delete().eq("record_id", memberId)
    } catch (_) {}
  }
  if (memberCode) {
    try {
      await supabase.from("archives").delete().eq("member_id", memberCode)
    } catch (_) {}
  }

  // 4. Clean localStorage applications so it doesn't auto-enroll locally
  try {
    const localApps = JSON.parse(localStorage.getItem("mswdo_submitted_applications") || "[]")
    const updatedApps = localApps.map((a) => {
      const match =
        (appId && a.id === appId) ||
        (memberCode && (a.reference === memberCode || a.reference_number === memberCode)) ||
        (email && a.email?.toLowerCase() === email.toLowerCase())
      return match ? { ...a, status: "Archived" } : a
    })
    localStorage.setItem("mswdo_submitted_applications", JSON.stringify(updatedApps))
  } catch (_) {}

  // 5. Remove from localStorage members registries
  const storageKeys = [MEMBERS_STORAGE_KEY, "mswdo_members"]
  for (const key of storageKeys) {
    try {
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      const updated = existing.filter((m) => {
        if (rawId && (m.id === rawId || m.memberId === rawId)) return false
        if (memberId && m.id === memberId) return false
        if (memberCode && (m.id === memberCode || m.memberId === memberCode)) return false
        if (appId && (m.applicationId === appId || m.application_id === appId)) return false
        if (uid && (m.uid === uid || m.userId === uid || m.id === uid)) return false
        if (email && m.email && m.email.toLowerCase() === email.toLowerCase()) return false
        return true
      })
      localStorage.setItem(key, JSON.stringify(updated))
    } catch (_) {}
  }

  // 6. Remove from archive storage if present
  try {
    const existingArchives = JSON.parse(localStorage.getItem(ARCHIVES_STORAGE_KEY) || "[]")
    const updatedArchives = existingArchives.filter(
      (a) => a.record_id !== memberId && a.member_id !== memberCode && a.record_id !== uid && a.record_id !== rawId
    )
    localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(updatedArchives))
  } catch (_) {}

  // 7. Dispatch real-time events
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(
      new CustomEvent("mswdo_members_changed", {
        detail: { memberId: rawId, memberCode, action: "deleted" },
      })
    )
  }

  return true
}
