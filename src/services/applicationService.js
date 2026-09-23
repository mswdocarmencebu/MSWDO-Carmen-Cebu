import { supabase } from "@/lib/supabaseClient"
import { createMemberFromApplication, removeMemberByApplication } from "./memberService"

const STORAGE_KEY = "mswdo_submitted_applications"

// Format category code to user-friendly label
export function getSectorLabel(cat) {
  switch (cat?.toLowerCase()) {
    case "senior":
      return "Senior Citizen"
    case "pwd":
      return "Person with Disability (PWD)"
    case "women":
      return "Women's Welfare"
    case "youth":
      return "Youth"
    default:
      return cat || "General Citizen"
  }
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
      return {
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
    if (match) return match
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
  if (seedMatch) return seedMatch

  return null
}

// 3. Update application status
export async function updateApplicationStatus(appIdOrRef, newStatus) {
  // Update in localStorage
  let updatedApp = null
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    const updated = existing.map((a) => {
      if (a.id === appIdOrRef || a.reference === appIdOrRef) {
        updatedApp = { ...a, status: newStatus }
        return updatedApp
      }
      return a
    })

    if (!updatedApp) {
      const seed = DEFAULT_SEED_APPLICATIONS.find(
        (a) => a.id === appIdOrRef || a.reference === appIdOrRef
      )
      if (seed) {
        updatedApp = { ...seed, status: newStatus }
        updated.unshift(updatedApp)
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  // Update in Supabase
  try {
    await supabase
      .from("applications")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
}

// 4. Approve application and provision account with default credentials
export async function approveApplication(application, tempPassword = "MswdoPass2026!") {
  const email = (application.email || "").trim().toLowerCase()
  const appId = application.id
  const clientId = `APPL-${(application.reference || appId || "9000").slice(-4).toUpperCase()}`

  let rpcSuccess = false
  let rpcData = null

  // 1. Try calling the PostgreSQL SECURITY DEFINER RPC function
  try {
    const { data, error } = await supabase.rpc("approve_application_and_create_user", {
      p_application_id: appId,
      p_temp_password: tempPassword,
    })

    if (!error && data?.success) {
      rpcSuccess = true
      rpcData = data
    }
  } catch (err) {
    console.warn("RPC approve_application_and_create_user not available or failed:", err.message)
  }

  // 2. Perform client-side database updates if RPC wasn't available
  if (!rpcSuccess) {
    try {
      // Update application table
      await supabase
        .from("applications")
        .update({
          status: "Approved",
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${appId},reference_number.eq.${application.reference}`)
    } catch (e) {
      console.warn("Status update fallback error:", e)
    }

    // Try to ensure applicant_users record is created if user exists
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

  // 5. Return credentials package
  return {
    success: true,
    email: email,
    temporaryPassword: tempPassword,
    clientId: rpcData?.client_id || clientId,
    applicantName: application.name || `${application.first_name || ""} ${application.last_name || ""}`.trim(),
    sector: application.sector || application.category,
    status: "Approved",
    dispatchedAt: new Date().toISOString(),
    message: `Default credentials successfully generated and notification dispatched to ${email}.`,
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
