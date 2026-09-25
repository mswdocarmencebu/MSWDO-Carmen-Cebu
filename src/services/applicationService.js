import { supabase } from "@/lib/supabaseClient"
import { createMemberFromApplication, removeMemberByApplication } from "./memberService"
import { sendApplicantCredentials } from "./emailService"
import { createNotification } from "./notificationService"
import { resolveAvatarUrl } from "./avatarService"

export const STORAGE_KEY = "mswdo_submitted_applications"
export const DOC_STATUSES_KEY = "mswdo_doc_statuses"

// Format category code to user-friendly label
export function getSectorLabel(cat) {
  if (!cat) return "General Citizen"
  const lower = String(cat).toLowerCase()
  if (lower.includes("youth") || lower.includes("kabataan") || lower.includes("student")) {
    return "Youth"
  }
  if (lower.includes("pwd") || lower.includes("disabilit") || lower.includes("kapansanan")) {
    return "Person with Disability (PWD)"
  }
  if (lower.includes("senior") || lower.includes("elderly") || lower.includes("pension")) {
    return "Senior Citizen"
  }
  if (lower.includes("women") || lower.includes("solo parent") || lower.includes("babae")) {
    return "Women's Welfare"
  }
  return cat
}

// Normalization helper for strictly matching program sector with user approved sector
export function isSectorMatch(programSector, userSector) {
  if (!programSector || !userSector) return false
  const ps = String(programSector).toLowerCase().trim()
  const us = String(userSector).toLowerCase().trim()

  if (ps === us) return true

  // Youth
  const isYouthUser = us.includes("youth") || us.includes("kabataan") || us.includes("student")
  const isYouthProg = ps.includes("youth") || ps.includes("kabataan") || ps.includes("student")
  if (isYouthUser || isYouthProg) return isYouthUser && isYouthProg

  // PWD
  const isPwdUser = us.includes("pwd") || us.includes("disabilit") || us.includes("kapansanan")
  const isPwdProg = ps.includes("pwd") || ps.includes("disabilit") || ps.includes("kapansanan")
  if (isPwdUser || isPwdProg) return isPwdUser && isPwdProg

  // Senior Citizen
  const isSeniorUser = us.includes("senior") || us.includes("elderly") || us.includes("aging") || us.includes("pension")
  const isSeniorProg = ps.includes("senior") || ps.includes("elderly") || ps.includes("aging") || ps.includes("pension")
  if (isSeniorUser || isSeniorProg) return isSeniorUser && isSeniorProg

  // Women / Solo Parent
  const isWomenUser = us.includes("women") || us.includes("solo parent") || us.includes("babae")
  const isWomenProg = ps.includes("women") || ps.includes("solo parent") || ps.includes("babae")
  if (isWomenUser || isWomenProg) return isWomenUser && isWomenProg

  return ps.includes(us) || us.includes(ps)
}

// Fallback seed applications across all 4 sectors
export const DEFAULT_SEED_APPLICATIONS = [
  {
    id: "APP-01",
    initials: "ND",
    name: "Neil Delante",
    email: "nemo.delante@gmail.com",
    sector: "Youth",
    category: "youth",
    submitted: "Sep 22, 2026",
    status: "Pending",
    reference: "MSWDO-2026-NR7FKNEAC2",
    birthDate: "2000-07-02",
    gender: "Male",
    civilStatus: "Single",
    address: "Purok 3, Poblacion, Carmen, Cebu",
    contact: "09086602701",
    categoryDetails: {
      educationalAttainment: "College Undergraduate",
      outOfSchool: "No, Currently Enrolled",
      schoolName: "Cebu Technological University - Carmen",
      organization: "Carmen Youth Advocates",
      targetAssistance: "Educational Assistance / Scholarship",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "neil_delante_request_form.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Pending" },
      { id: "doc2", key: "psa_birth_cert", name: "PSA / NSO birth certificate", fileName: "delante_psa_cert.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", status: "Pending" },
      { id: "doc3", key: "valid_id", name: "Valid government ID", fileName: "neil_national_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Pending" },
      { id: "doc4", key: "voter_cert", name: "Voter verification / certificate", fileName: "delante_voter_stub.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg", status: "Pending" },
    ],
    education: "college",
    outOfSchool: "no",
    hasDuplicate: true,
  },
  {
    id: "APP-02",
    initials: "MR",
    name: "Maria Gomez Reyes",
    email: "mary.reyes@gmail.com",
    sector: "Senior Citizen",
    category: "senior",
    submitted: "Sep 22, 2026",
    status: "Pending",
    reference: "MSWDO-2026-SC20269921",
    birthDate: "1958-04-12",
    gender: "Female",
    civilStatus: "Widowed",
    address: "Sitio Riverside, Cantipay, Carmen, Cebu",
    contact: "09298765432",
    categoryDetails: {
      citizenship: "Filipino",
      religion: "Roman Catholic",
      birthplace: "Cantipay, Carmen, Cebu",
      pension: "None",
      livingArrangement: "Living with Relatives",
      occupation: "None / Homemaker",
      annualIncome: "Below ₱50,000",
      regularSupport: "No",
      withDisability: "No",
      hasIllness: "Hypertension",
      familyRows: [
        { id: 1, name: "Jose Reyes", relation: "Son", age: "38", status: "Married", occupation: "Farmer", income: "8000" },
      ],
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "reyes_senior_request.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Pending" },
      { id: "doc2", key: "psa_birth_cert", name: "PSA / NSO birth certificate", fileName: "reyes_birth_record.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", status: "Pending" },
      { id: "doc3", key: "valid_id", name: "Valid government ID", fileName: "reyes_postal_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Pending" },
    ],
    education: "elementary",
    outOfSchool: "no",
    hasDuplicate: false,
  },
  {
    id: "APP-03",
    initials: "SD",
    name: "Shen M. Delante",
    email: "alotajennery@gmail.com",
    sector: "Person with Disability (PWD)",
    category: "pwd",
    submitted: "Sep 20, 2026",
    status: "Approved",
    reference: "MSWDO-2026-SD99182701",
    birthDate: "1994-05-14",
    gender: "Female",
    civilStatus: "Single",
    address: "Poblacion, Carmen, Cebu",
    contact: "09436232143",
    categoryDetails: {
      applicationType: "New Applicant",
      disabilityType: "Orthopedic / Physical Disability",
      disabilityCause: "Congenital / Inborn",
      dateApplied: "2026-09-18",
      educationalAttainment: "College Graduate",
      employmentStatus: "Employed",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "shen_pwd_request.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Verified" },
      { id: "doc2", key: "medical_cert", name: "Medical certificate", fileName: "doh_med_assessment.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", status: "Verified" },
      { id: "doc3", key: "valid_id", name: "Valid government ID", fileName: "shen_philhealth_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Verified" },
    ],
    education: "college",
    outOfSchool: "no",
    hasDuplicate: false,
  },
  {
    id: "APP-04",
    initials: "EB",
    name: "Elena Santos Bautista",
    email: "elena.bautista@gmail.com",
    sector: "Women's Welfare",
    category: "women",
    submitted: "Sep 19, 2026",
    status: "Pending",
    reference: "MSWDO-2026-WW44918290",
    birthDate: "1988-09-18",
    gender: "Female",
    civilStatus: "Single",
    address: "Sitio Proper, Dawis Norte, Carmen, Cebu",
    contact: "09175543210",
    categoryDetails: {
      dateOfRegistration: "2026-09-19",
      placeOfBirth: "Carmen, Cebu",
      educationalAttainment: "High School Graduate",
      isSoloParent: "Yes",
      numberOfChildren: "2",
      occupation: "Self-Employed / Vendor",
      fatherName: "Ricardo Santos",
      motherName: "Corazon Santos",
    },
    documents: [
      { id: "doc1", key: "request_form", name: "Request form", fileName: "bautista_solo_parent_req.pdf", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Pending" },
      { id: "doc2", key: "brgy_cert", name: "Barangay certificate", fileName: "dawis_norte_clearance.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", status: "Pending" },
      { id: "doc3", key: "psa_birth_cert", name: "PSA / NSO birth certificate", fileName: "elena_birth_cert.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", status: "Pending" },
      { id: "doc4", key: "valid_id", name: "Valid government ID", fileName: "bautista_national_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Pending" },
    ],
    education: "high school",
    outOfSchool: "no",
    hasDuplicate: false,
  },
]

// Helper: Upload file to Supabase Storage bucket 'application-documents'
export async function uploadDocumentToStorage(file, refCode, docKey) {
  if (!file) return null

  try {
    const cleanFileName = (file.name || `${docKey}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_")
    const filePath = `${refCode}/${docKey}_${Date.now()}_${cleanFileName}`

    const { data, error } = await supabase.storage
      .from("application-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (error) {
      console.warn(`Supabase Storage upload warning for ${docKey}:`, error.message)
      return null
    }

    const { data: publicData } = supabase.storage
      .from("application-documents")
      .getPublicUrl(filePath)

    return {
      path: filePath,
      publicUrl: publicData?.publicUrl || "",
    }
  } catch (err) {
    console.warn(`Supabase Storage upload exception for ${docKey}:`, err.message)
    return null
  }
}

// 1. Submit pre-application
export async function submitPreApplication(formData) {
  const {
    category,
    basicInfo,
    categoryDetails,
    uploadedFiles = {},
    referenceNumber: customRef,
  } = formData

  const refCode =
    customRef ||
    `MSWDO-2026-${category.toUpperCase().slice(0, 2)}${Math.floor(100000 + Math.random() * 900000)}`

  // Upload files to Supabase Storage bucket 'application-documents'
  const formattedDocs = await Promise.all(
    Object.keys(uploadedFiles).map(async (k, idx) => {
      const fileItem = uploadedFiles[k]
      let publicUrl = ""

      if (fileItem?.file) {
        const uploadResult = await uploadDocumentToStorage(fileItem.file, refCode, k)
        if (uploadResult?.publicUrl) {
          publicUrl = uploadResult.publicUrl
        }
      }

      return {
        id: `doc-${idx + 1}`,
        key: k,
        name: fileItem.title || k,
        fileName: fileItem.file?.name || `${k}.pdf`,
        fileType: fileItem.file?.type || "application/octet-stream",
        fileSize: fileItem.file?.size || 0,
        storageUrl: publicUrl || null,
        url: publicUrl || fileItem.dataUrl || fileItem.previewUrl || "",
        status: "Pending",
      }
    })
  )

  const payload = {
    reference_number: refCode,
    category: category.toLowerCase(),
    status: "Pending", // Default status is pending ongoing review
    first_name: (basicInfo.firstName || "").trim(),
    middle_name: (basicInfo.middleName || "").trim(),
    last_name: (basicInfo.lastName || "").trim(),
    dob: basicInfo.dob || null,
    gender: category === "women" ? "Female" : basicInfo.gender || "Unspecified",
    civil_status: basicInfo.civilStatus || "Single",
    complete_address: (basicInfo.completeAddress || "").trim(),
    contact_number: (basicInfo.contactNumber || "").trim(),
    email: (basicInfo.email || "").trim().toLowerCase(),
    category_details: categoryDetails || {},
    documents: formattedDocs,
    submitted_at: new Date().toISOString(),
  }

  let dbResult = null
  let dbError = null

  try {
    const { data, error } = await supabase
      .from("applications")
      .insert([payload])
      .select()
      .maybeSingle()

    if (error) {
      dbError = error
      console.warn("Supabase insert error (falling back to local registry):", error.message)
    } else {
      dbResult = data
    }
  } catch (err) {
    dbError = err
    console.warn("Supabase insert exception:", err.message)
  }

  // Create unified application object
  const unifiedRecord = {
    id: dbResult?.id || `APP-${Date.now()}`,
    initials: `${payload.first_name[0] || ""}${payload.last_name[0] || ""}`.toUpperCase(),
    name: `${payload.first_name} ${payload.middle_name ? payload.middle_name + " " : ""}${payload.last_name}`.trim(),
    email: payload.email,
    sector: getSectorLabel(payload.category),
    category: payload.category,
    submitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    status: "Pending",
    reference: payload.reference_number,
    birthDate: payload.dob,
    gender: payload.gender,
    civilStatus: payload.civil_status,
    address: payload.complete_address,
    contact: payload.contact_number,
    categoryDetails: payload.category_details,
    documents: payload.documents,
    education: payload.category_details?.educationalAttainment || "College",
    outOfSchool: payload.category_details?.outOfSchool?.toLowerCase().includes("yes") ? "yes" : "no",
    hasDuplicate: false,
    dbSaved: !dbError && !!dbResult,
  }

  // Always persist in local storage registry for immediate visibility across tabs & offline resilience
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const filtered = existing.filter((a) => a.reference !== unifiedRecord.reference)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([unifiedRecord, ...filtered]))
  } catch (e) {
    console.warn("Could not save to localStorage:", e)
  }

  // Create live notification for Super Admin & Admin Staff (filtered by sector access)
  try {
    await createNotification({
      title: `New ${unifiedRecord.sector} Application`,
      message: `${unifiedRecord.name} submitted an application under ${unifiedRecord.sector} (Ref: ${unifiedRecord.reference}).`,
      type: "application_submitted",
      sector: unifiedRecord.sector,
      recipientRole: "admin",
      reference: unifiedRecord.reference,
      link: "/dashboard/applications",
    })

    // Create live confirmation notification for Applicant
    if (unifiedRecord.email) {
      await createNotification({
        title: "Application Received",
        message: `Your ${unifiedRecord.sector} intake application (Ref: ${unifiedRecord.reference}) has been successfully submitted and is under initial review.`,
        type: "application_submitted",
        sector: unifiedRecord.sector,
        recipientRole: "applicant",
        recipientEmail: unifiedRecord.email,
        reference: unifiedRecord.reference,
        link: "/dashboard/applicant/tracking",
      })
    }
  } catch (err) {
    console.warn("Could not dispatch application notification:", err)
  }

  return unifiedRecord
}

// 2. Fetch all applications directly from Supabase (with fallback to seeds only if DB is empty or offline)
export async function getApplications() {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        initials: `${item.first_name?.[0] || ""}${item.last_name?.[0] || ""}`.toUpperCase(),
        name: `${item.first_name || ""} ${item.middle_name ? item.middle_name + " " : ""}${item.last_name || ""}`.trim(),
        email: item.email,
        sector: getSectorLabel(item.category),
        category: item.category,
        submitted: item.submitted_at
          ? new Date(item.submitted_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          : "—",
        status: item.status || "Pending",
        reference: item.reference_number,
        birthDate: item.dob,
        gender: item.gender,
        civilStatus: item.civil_status,
        address: item.complete_address,
        contact: item.contact_number,
        categoryDetails: item.category_details || {},
        documents: item.documents || [],
        education: item.category_details?.educationalAttainment || "College",
        outOfSchool: item.category_details?.outOfSchool?.toLowerCase().includes("yes") ? "yes" : "no",
        hasDuplicate: false,
        dbSaved: true,
        avatarUrl: resolveAvatarUrl(item),
      }))
    }
  } catch (err) {
    console.warn("Could not fetch applications from Supabase:", err.message)
  }

  // Fallback to local storage only if Supabase failed/offline and local storage has records
  let localApps = []
  try {
    localApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {}

  if (Array.isArray(localApps) && localApps.length > 0) {
    return localApps
  }

  // If empty, return empty list! Never display fallbacks!
  return []
}

// Helper to normalize any date input (e.g. MM/DD/YYYY, YYYY-MM-DD, slashes or hyphens) to YYYY-MM-DD
export function normalizeDateToYMD(input) {
  if (!input) return null
  const str = String(input).trim()
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }
  const mdy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (mdy) {
    const month = mdy[1].padStart(2, "0")
    const day = mdy[2].padStart(2, "0")
    const year = mdy[3]
    return `${year}-${month}-${day}`
  }
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  return str
}

// 2.1 Get single application by reference number or ID
export async function getApplicationByReference(refOrId, birthdate = null) {
  if (!refOrId) return null
  const cleaned = refOrId.trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)
  const cleanedBirthdate = birthdate ? normalizeDateToYMD(birthdate) : null

  // 1. Query Supabase
  try {
    let query = supabase.from("applications").select("*")

    if (isUuid) {
      query = query.or(`reference_number.ilike.${cleaned},id.eq.${cleaned}`)
    } else {
      query = query.ilike("reference_number", cleaned)
    }

    if (cleanedBirthdate) {
      query = query.eq("dob", cleanedBirthdate)
    }

    const { data, error } = await query.maybeSingle()

    if (!error && data) {
      const rawApp = {
        id: data.id,
        initials: `${data.first_name?.[0] || ""}${data.last_name?.[0] || ""}`.toUpperCase(),
        name: `${data.first_name || ""} ${data.middle_name ? data.middle_name + " " : ""}${data.last_name || ""}`.trim(),
        firstName: data.first_name || "",
        middleName: data.middle_name || "",
        lastName: data.last_name || "",
        email: data.email,
        sector: getSectorLabel(data.category),
        category: data.category,
        submitted: data.submitted_at
          ? new Date(data.submitted_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          : "Sep 22, 2026",
        submittedAt: data.submitted_at || data.created_at,
        status: data.status || "Pending",
        reference: data.reference_number,
        birthDate: data.dob,
        gender: data.gender,
        civilStatus: data.civil_status,
        address: data.complete_address,
        contact: data.contact_number,
        categoryDetails: data.category_details || {},
        documents: data.documents || [],
        education: data.category_details?.educationalAttainment || "College",
        outOfSchool: data.category_details?.outOfSchool?.toLowerCase().includes("yes") ? "yes" : "no",
        hasDuplicate: false,
        dbSaved: true,
      }
      return enrichApplicationWithDocStatuses(rawApp)
    }
  } catch (err) {
    console.warn("Could not query application by reference from Supabase:", err.message)
  }

  // 2. Query localStorage
  try {
    const localApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const match = localApps.find((a) => {
      const matchesRef =
        a.reference?.toLowerCase() === cleaned.toLowerCase() ||
        a.id?.toLowerCase() === cleaned.toLowerCase()
      if (!matchesRef) return false
      if (cleanedBirthdate) {
        return a.birthDate === cleanedBirthdate || a.dob === cleanedBirthdate
      }
      return true
    })
    if (match) return enrichApplicationWithDocStatuses(match)
  } catch {}

  // 3. Check default seeds
  const seedMatch = DEFAULT_SEED_APPLICATIONS.find((a) => {
    const matchesRef =
      a.reference?.toLowerCase() === cleaned.toLowerCase() ||
      a.id?.toLowerCase() === cleaned.toLowerCase()
    if (!matchesRef) return false
    if (cleanedBirthdate) {
      return a.birthDate === cleanedBirthdate || a.dob === cleanedBirthdate
    }
    return true
  })
  if (seedMatch) return enrichApplicationWithDocStatuses(seedMatch)

  return null
}

// Enrich application documents with verified/flagged statuses from local storage or approval status
export function enrichApplicationWithDocStatuses(app) {
  if (!app) return app
  let storedStatuses = {}
  try {
    storedStatuses = JSON.parse(localStorage.getItem(DOC_STATUSES_KEY) || "{}")
  } catch {}

  const isApproved = app.status?.toLowerCase() === "approved"
  const ref = app.reference || app.id || ""
  const rawDocs = Array.isArray(app.documents) ? app.documents : []

  const enrichedDocs = rawDocs.map((d, i) => {
    const docId = d.id || `doc-${i + 1}`
    const docKey = d.key || ""
    const stored =
      storedStatuses[`${ref}_${docId}`] ||
      storedStatuses[`${ref}_${docKey}`] ||
      storedStatuses[`${app.id}_${docId}`] ||
      storedStatuses[`${app.id}_${docKey}`] ||
      storedStatuses[docId] ||
      storedStatuses[docKey]

    let status = stored || d.status || "Pending"

    // If the application is approved, any unflagged doc is officially Verified
    if (isApproved && status !== "Needs correction" && status !== "Rejected") {
      status = "Verified"
    } else if (typeof status === "string" && status.toLowerCase() === "verified") {
      status = "Verified"
    } else if (typeof status === "string" && status.toLowerCase() === "needs correction") {
      status = "Needs correction"
    }

    return {
      ...d,
      id: docId,
      key: docKey,
      name: d.name || d.title || d.key || `Document ${i + 1}`,
      fileName: d.fileName || "",
      fileType: d.fileType || "",
      fileSize: d.fileSize || 0,
      url: d.url || d.previewUrl || d.storageUrl || "",
      status,
    }
  })

  return {
    ...app,
    documents: enrichedDocs,
  }
}

// Update single document status (Verified, Needs correction, Pending)
export async function updateApplicationDocStatus(appIdOrRef, docIdOrKey, newStatus) {
  if (!appIdOrRef || !docIdOrKey) return false

  // 1. Update in DOC_STATUSES_KEY
  try {
    const stored = JSON.parse(localStorage.getItem(DOC_STATUSES_KEY) || "{}")
    stored[`${appIdOrRef}_${docIdOrKey}`] = newStatus
    stored[docIdOrKey] = newStatus
    localStorage.setItem(DOC_STATUSES_KEY, JSON.stringify(stored))
  } catch {}

  // 2. Update in localStorage STORAGE_KEY
  let updatedDocs = null
  try {
    const localApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    let found = false
    const updated = localApps.map((a) => {
      if (a.id === appIdOrRef || a.reference === appIdOrRef) {
        found = true
        const nextDocs = (a.documents || []).map((d) => {
          if (d.id === docIdOrKey || d.key === docIdOrKey) {
            return { ...d, status: newStatus }
          }
          return d
        })
        updatedDocs = nextDocs
        return { ...a, documents: nextDocs }
      }
      return a
    })

    if (!found) {
      const seed = DEFAULT_SEED_APPLICATIONS.find(
        (a) => a.id === appIdOrRef || a.reference === appIdOrRef
      )
      if (seed) {
        const nextDocs = (seed.documents || []).map((d) => {
          if (d.id === docIdOrKey || d.key === docIdOrKey) {
            return { ...d, status: newStatus }
          }
          return d
        })
        updatedDocs = nextDocs
        updated.unshift({ ...seed, documents: nextDocs })
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  // 3. Update in Supabase if documents array exists
  if (updatedDocs) {
    try {
      await supabase
        .from("applications")
        .update({
          documents: updatedDocs,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${appIdOrRef},reference_number.eq.${appIdOrRef}`)
    } catch (e) {
      console.warn("Supabase documents update warning:", e)
    }
  }

  // 4. Dispatch storage events for instant multi-tab sync
  window.dispatchEvent(new Event("storage"))
  window.dispatchEvent(
    new CustomEvent("application_doc_updated", {
      detail: { appIdOrRef, docIdOrKey, newStatus, documents: updatedDocs },
    })
  )

  // Dispatch live notification for applicant if document requires correction
  if (newStatus === "Needs correction") {
    try {
      const localApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      const app = localApps.find((a) => a.id === appIdOrRef || a.reference === appIdOrRef)
      if (app && app.email) {
        await createNotification({
          title: "Document Needs Correction",
          message: `Your submitted document "${docIdOrKey}" requires correction. Please re-upload it via your portal.`,
          type: "document_correction",
          sector: app.sector || "General",
          recipientRole: "applicant",
          recipientEmail: app.email,
          reference: app.reference || appIdOrRef,
          link: "/dashboard/applicant/status",
        })
      }
    } catch (err) {
      console.warn("Could not dispatch doc notification:", err)
    }
  }

  return true
}

// Bulk update all documents for an application
export async function updateApplicationDocuments(appIdOrRef, documents) {
  if (!appIdOrRef || !Array.isArray(documents)) return false

  // 1. Update in DOC_STATUSES_KEY
  try {
    const stored = JSON.parse(localStorage.getItem(DOC_STATUSES_KEY) || "{}")
    documents.forEach((d) => {
      if (d.id) {
        stored[`${appIdOrRef}_${d.id}`] = d.status || "Pending"
        stored[d.id] = d.status || "Pending"
      }
      if (d.key) {
        stored[`${appIdOrRef}_${d.key}`] = d.status || "Pending"
        stored[d.key] = d.status || "Pending"
      }
    })
    localStorage.setItem(DOC_STATUSES_KEY, JSON.stringify(stored))
  } catch {}

  // 2. Update in localStorage STORAGE_KEY
  try {
    const localApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    let found = false
    const updated = localApps.map((a) => {
      if (a.id === appIdOrRef || a.reference === appIdOrRef) {
        found = true
        return { ...a, documents }
      }
      return a
    })

    if (!found) {
      const seed = DEFAULT_SEED_APPLICATIONS.find(
        (a) => a.id === appIdOrRef || a.reference === appIdOrRef
      )
      if (seed) {
        updated.unshift({ ...seed, documents })
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  // 3. Update in Supabase
  try {
    await supabase
      .from("applications")
      .update({
        documents,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${appIdOrRef},reference_number.eq.${appIdOrRef}`)
  } catch (e) {
    console.warn("Supabase bulk documents update warning:", e)
  }

  // 4. Dispatch events
  window.dispatchEvent(new Event("storage"))
  window.dispatchEvent(
    new CustomEvent("application_doc_updated", {
      detail: { appIdOrRef, documents },
    })
  )

  return true
}

// 3. Update application status
export async function updateApplicationStatus(appIdOrRef, newStatus) {
  // If Approved, auto-verify any unflagged documents
  let verifiedDocs = null
  if (newStatus === "Approved") {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      const app = existing.find((a) => a.id === appIdOrRef || a.reference === appIdOrRef) ||
        DEFAULT_SEED_APPLICATIONS.find((a) => a.id === appIdOrRef || a.reference === appIdOrRef)
      if (app && Array.isArray(app.documents)) {
        verifiedDocs = app.documents.map((d) => ({
          ...d,
          status: d.status === "Needs correction" || d.status === "Rejected" ? d.status : "Verified",
        }))
        await updateApplicationDocuments(appIdOrRef, verifiedDocs)
      }
    } catch (e) {
      console.warn("Auto-verifying documents warning:", e)
    }
  }

  // Update in localStorage
  let updatedApp = null
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const updated = existing.map((a) => {
      if (a.id === appIdOrRef || a.reference === appIdOrRef) {
        updatedApp = {
          ...a,
          status: newStatus,
          ...(verifiedDocs ? { documents: verifiedDocs } : {}),
        }
        return updatedApp
      }
      return a
    })

    if (!updatedApp) {
      const seed = DEFAULT_SEED_APPLICATIONS.find(
        (a) => a.id === appIdOrRef || a.reference === appIdOrRef
      )
      if (seed) {
        updatedApp = {
          ...seed,
          status: newStatus,
          ...(verifiedDocs ? { documents: verifiedDocs } : {}),
        }
        updated.unshift(updatedApp)
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  // Update in Supabase
  try {
    const updatePayload = {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (verifiedDocs) {
      updatePayload.documents = verifiedDocs
    }

    await supabase
      .from("applications")
      .update(updatePayload)
      .or(`id.eq.${appIdOrRef},reference_number.eq.${appIdOrRef}`)
  } catch (e) {
    console.warn("Supabase status update error:", e)
  }

  // Synchronize with Members registry:
  if (newStatus === "Approved") {
    // When approved, enroll into members registry so it displays on members page
    if (updatedApp) {
      await createMemberFromApplication(updatedApp)
    }
  } else if (newStatus === "Needs correction" || newStatus === "Rejected" || newStatus === "Terminated") {
    // When returned for correction, rejected, or terminated, do NOT display on active members page
    await removeMemberByApplication(appIdOrRef, updatedApp)
  }

  // Dispatch events for tracking page and admin tabs
  window.dispatchEvent(new Event("storage"))
  window.dispatchEvent(
    new CustomEvent("application_status_updated", {
      detail: { appIdOrRef, status: newStatus },
    })
  )

  // Dispatch live notification for applicant
  if (updatedApp && updatedApp.email) {
    try {
      let notifTitle = `Application ${newStatus}`
      let notifType = "system"
      let notifMsg = `Your application (Ref: ${updatedApp.reference || appIdOrRef}) status is now "${newStatus}".`

      if (newStatus === "Approved") {
        notifTitle = "Application Approved"
        notifType = "application_approved"
        notifMsg = `Congratulations! Your ${updatedApp.sector || "MSWDO"} intake application (Ref: ${updatedApp.reference || appIdOrRef}) has been approved.`
      } else if (newStatus === "Needs correction") {
        notifTitle = "Action Needed: Document Correction"
        notifType = "document_correction"
        notifMsg = `Action needed: Your application (Ref: ${updatedApp.reference || appIdOrRef}) requires document corrections. Please visit your tracking portal.`
      } else if (newStatus === "Under Review" || newStatus === "In Review") {
        notifTitle = "Application Under Review"
        notifType = "system"
        notifMsg = `Your ${updatedApp.sector || "MSWDO"} application (Ref: ${updatedApp.reference || appIdOrRef}) is now being reviewed by a case worker.`
      }

      await createNotification({
        title: notifTitle,
        message: notifMsg,
        type: notifType,
        sector: updatedApp.sector || "General",
        recipientRole: "applicant",
        recipientEmail: updatedApp.email,
        reference: updatedApp.reference || appIdOrRef,
        link: "/dashboard/applicant/status",
      })
    } catch (err) {
      console.warn("Could not dispatch applicant status notification:", err)
    }
  }
}

// Generate a secure, unique temporary password per applicant approval
export function generateUniqueTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnpqrstuvwxyz"
  const numbers = "23456789"
  const specials = "#@$!%"

  const randomSpecial = specials[Math.floor(Math.random() * specials.length)]
  const randomUpper = upper[Math.floor(Math.random() * upper.length)]
  const randomLower = lower[Math.floor(Math.random() * lower.length)]
  const randomNum = numbers[Math.floor(Math.random() * numbers.length)]

  const pool = upper + lower + numbers
  let middle = ""
  for (let i = 0; i < 4; i++) {
    middle += pool[Math.floor(Math.random() * pool.length)]
  }

  // Example output: Carmen#7Kn8X2 or Carmen@9Bw4F1
  return `Carmen${randomSpecial}${randomUpper}${middle}${randomLower}${randomNum}`
}

// 4. Approve application and provision account with unique temporary credentials
export async function approveApplication(application, customPassword = null) {
  const email = (application.email || "").trim().toLowerCase()
  const appId = application.id
  const clientId = `APPL-${(application.reference || appId || "9000").slice(-4).toUpperCase()}`

  // Always generate a fresh unique temporary password for each approved applicant
  const tempPassword =
    customPassword && customPassword !== "MswdoPass2026!"
      ? customPassword
      : generateUniqueTemporaryPassword()

  // Mark all documents as Verified
  const rawDocs = Array.isArray(application.documents) ? application.documents : []
  const verifiedDocs = rawDocs.map((d) => ({
    ...d,
    status: d.status === "Needs correction" || d.status === "Rejected" ? d.status : "Verified",
  }))
  await updateApplicationDocuments(appId || application.reference, verifiedDocs)

  const applicantFullName =
    application.name ||
    `${application.first_name || ""} ${application.last_name || ""}`.trim() ||
    "Citizen Beneficiary"

  let rpcSuccess = false
  let rpcData = null

  // 1. Try calling the PostgreSQL SECURITY DEFINER RPC function with the unique temporary password
  try {
    const { data, error } = await supabase.rpc("approve_application_and_create_user", {
      p_application_id: String(appId || application.reference || email),
      p_temp_password: tempPassword,
    })

    if (!error && data?.success) {
      rpcSuccess = true
      rpcData = data
    } else {
      console.warn("RPC approve_application_and_create_user notice:", error?.message || data?.error)
    }
  } catch (err) {
    console.warn("RPC approve_application_and_create_user not available or failed:", err.message)
  }

  // 2. Perform client-side database updates and auth signup fallback if RPC wasn't available
  if (!rpcSuccess) {
    try {
      // Fallback: Provision auth user account via Supabase Auth SDK
      await supabase.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          data: {
            full_name: applicantFullName,
            role: "applicant_user",
            barangay: application.address || "Barangay Poblacion, Carmen",
            must_change_password: true,
          },
        },
      })
    } catch (signErr) {
      console.warn("Supabase auth signUp fallback notice:", signErr.message)
    }

    try {
      // Update application table with status Approved and temporary_password
      await supabase
        .from("applications")
        .update({
          status: "Approved",
          temporary_password: tempPassword,
          documents: verifiedDocs,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${appId},reference_number.eq.${application.reference}`)
    } catch (e) {
      console.warn("Status update fallback error:", e)
    }

    // Try to ensure applicant_users record is created if user exists with must_change_password = true
    try {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (userRecord?.id) {
        await supabase
          .from("applicant_users")
          .upsert({
            user_id: userRecord.id,
            barangay: application.address || "Barangay Poblacion, Carmen",
            category: `${application.sector || "Citizen"} Welfare Beneficiary`,
            client_id: clientId,
            temporary_password: tempPassword,
            must_change_password: true,
          })
      }
    } catch (e) {
      console.warn("Applicant users sync error:", e)
    }
  }

  // 3. Update status in local storage
  await updateApplicationStatus(appId || application.reference, "Approved")

  // 4. Enroll approved applicant into Members registry
  let memberRecord = null
  try {
    memberRecord = await createMemberFromApplication(application)
  } catch (mErr) {
    console.warn("Could not auto-enroll into members table:", mErr)
  }

  // 5. Dispatch automated credentials email via Resend
  const finalClientId = rpcData?.client_id || clientId
  let emailDispatch = null

  try {
    emailDispatch = await sendApplicantCredentials({
      applicantName: applicantFullName,
      email: email,
      temporaryPassword: tempPassword,
      clientId: finalClientId,
      sector: application.sector || application.category,
      reference: application.reference || appId,
    })
  } catch (emailErr) {
    console.warn("Could not dispatch applicant credentials email:", emailErr)
  }

  // 6. Return credentials package
  return {
    success: true,
    email: email,
    temporaryPassword: tempPassword,
    clientId: finalClientId,
    applicantName: applicantFullName,
    sector: application.sector || application.category,
    status: "Approved",
    dispatchedAt: new Date().toISOString(),
    emailDispatch: emailDispatch,
    message: emailDispatch?.simulated
      ? `Default credentials generated. Notification simulated for ${email}.`
      : `Default credentials generated and notification dispatched to ${email}.`,
  }
}

// 5. Delete application permanently
export async function deleteApplication(appIdOrRef) {
  if (!appIdOrRef) return false

  // 1. Delete from Supabase public.applications
  try {
    const { error } = await supabase
      .from("applications")
      .delete()
      .or(`id.eq.${appIdOrRef},reference_number.eq.${appIdOrRef}`)

    if (error) {
      console.warn("Supabase application deletion error:", error.message)
    }
  } catch (err) {
    console.warn("Could not delete application from Supabase:", err.message)
  }

  // 2. Also remove any linked member from public.members
  try {
    await removeMemberByApplication(appIdOrRef)
  } catch (mErr) {
    console.warn("Could not remove linked member on deletion:", mErr)
  }

  // 3. Remove from localStorage registry
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const updated = existing.filter(
      (a) => a.id !== appIdOrRef && a.reference !== appIdOrRef
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  return true
}

// 6. Complete initial password setup for first-time applicant login
export async function completeInitialPasswordSetup(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  // 1. Get current session user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("No authenticated session found. Please sign in again.")
  }

  // 2. ALWAYS update password and user_metadata via Supabase Auth SDK
  // This updates local storage session so browser knows must_change_password is now false!
  const { error: authErr } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      must_change_password: false,
    },
  })
  if (authErr) {
    console.warn("Supabase auth updateUser error:", authErr.message)
    throw authErr
  }

  // 3. Try calling RPC function complete_initial_password_setup
  try {
    await supabase.rpc("complete_initial_password_setup", {
      p_new_password: newPassword,
    })
  } catch (rpcErr) {
    console.warn("RPC complete_initial_password_setup notice:", rpcErr.message)
  }

  // 4. Ensure public.applicant_users is updated directly
  try {
    await supabase
      .from("applicant_users")
      .update({
        must_change_password: false,
        temporary_password: null,
        password_changed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
  } catch (tblErr) {
    console.warn("applicant_users table update notice:", tblErr.message)
  }

  // 5. Clear temporary_password from public.applications
  if (user.email) {
    try {
      await supabase
        .from("applications")
        .update({ temporary_password: null })
        .ilike("email", user.email)
    } catch (appErr) {
      console.warn("applications table clear temporary_password notice:", appErr.message)
    }
  }

  return { success: true }
}

// 7. Fetch applicant intake application and submitted documents
export async function fetchApplicantApplicationAndDocuments(email) {
  if (!email) return { application: null, documents: [] }

  const cleanEmail = email.trim().toLowerCase()

  // 1. Try fetching from Supabase public.applications
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .ilike("email", cleanEmail)
      .order("submitted_at", { ascending: false })

    if (!error && Array.isArray(data) && data.length > 0) {
      // Prioritize approved application if one exists
      const approved = data.find((a) => (a.status || "").toLowerCase() === "approved")
      const target = approved || data[0]
      return {
        application: target,
        documents: Array.isArray(target.documents) ? target.documents : [],
      }
    }
  } catch (err) {
    console.warn("Could not fetch applicant application from Supabase:", err.message)
  }

  // 2. Fallback to localStorage applications
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const userApps = local.filter((a) => (a.email || "").toLowerCase() === cleanEmail)
    if (userApps.length > 0) {
      const approved = userApps.find((a) => (a.status || "").toLowerCase() === "approved")
      const target = approved || userApps[0]
      return {
        application: target,
        documents: Array.isArray(target.documents) ? target.documents : [],
      }
    }
  } catch {}

  // 3. Fallback to default seed if matching
  const seedMatches = DEFAULT_SEED_APPLICATIONS.filter(
    (a) => (a.email || "").toLowerCase() === cleanEmail
  )
  if (seedMatches.length > 0) {
    const approved = seedMatches.find((a) => (a.status || "").toLowerCase() === "approved")
    const target = approved || seedMatches[0]
    return {
      application: target,
      documents: target.documents || [],
    }
  }

  return { application: null, documents: [] }
}

// 8. Add newly uploaded document to applicant's application record
export async function addApplicantDocument(email, newDoc) {
  if (!email || !newDoc) return { success: false, error: "Missing email or document" }
  const cleanEmail = email.trim().toLowerCase()

  try {
    // 1. Fetch current application from Supabase
    const { data: appData, error: fetchErr } = await supabase
      .from("applications")
      .select("id, reference_number, documents")
      .ilike("email", cleanEmail)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let currentDocs = []
    let appId = null

    if (!fetchErr && appData) {
      currentDocs = Array.isArray(appData.documents) ? [...appData.documents] : []
      appId = appData.id
    } else {
      // Check local storage
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      const found = local.find((a) => (a.email || "").toLowerCase() === cleanEmail)
      if (found) {
        currentDocs = Array.isArray(found.documents) ? [...found.documents] : []
        appId = found.id
      }
    }

    // Add new document
    const updatedDocs = [newDoc, ...currentDocs]

    // Update in Supabase if appId exists
    if (appId) {
      await supabase
        .from("applications")
        .update({ documents: updatedDocs, updated_at: new Date().toISOString() })
        .eq("id", appId)
    }

    // Update local storage
    try {
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      const updated = local.map((a) =>
        (a.email || "").toLowerCase() === cleanEmail
          ? { ...a, documents: updatedDocs }
          : a
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}

    window.dispatchEvent(
      new CustomEvent("mswdo_application_storage_changed", {
        detail: { email: cleanEmail, documents: updatedDocs },
      })
    )

    return { success: true, documents: updatedDocs }
  } catch (err) {
    console.error("Failed to add applicant document:", err)
    return { success: false, error: err.message }
  }
}

// 9. Citizen Inquiries Management
const INQUIRIES_STORAGE_KEY = "mswdo_applicant_inquiries"

export function submitApplicantInquiry({ email, name, subject, category, message, clientId }) {
  if (!email || !message) return { success: false, error: "Missing required fields" }

  const ticketNumber = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const newInquiry = {
    id: `inq-${Date.now()}`,
    ticketNumber,
    email: email.trim().toLowerCase(),
    name: name || "Beneficiary",
    clientId: clientId || "APPL-MUNICIPAL",
    category: category || "General Assistance",
    subject: subject || "Welfare Assistance Inquiry",
    message: message.trim(),
    status: "Received",
    response: "Thank you for reaching out. An MSWDO social worker has received your ticket and will evaluate your inquiry during office hours.",
    createdAt: new Date().toISOString(),
  }

  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const updated = [newInquiry, ...existing]
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated))

    window.dispatchEvent(new CustomEvent("mswdo_inquiries_updated"))
    return { success: true, inquiry: newInquiry }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export function getApplicantInquiries(email) {
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    if (!email) return all
    const cleanEmail = email.trim().toLowerCase()
    return all.filter((inq) => (inq.email || "").toLowerCase() === cleanEmail)
  } catch {
    return []
  }
}

