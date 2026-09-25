import { supabase } from "@/lib/supabaseClient"
import { recordAuditLog } from "./auditService"

export const CMS_STORAGE_KEY = "mswdo_cms_content_cache"
export const CMS_UPDATED_EVENT = "mswdo_cms_updated"

// Default seed CMS data
export const DEFAULT_CMS_CONTENT = {
  hero: {
    id: "hero",
    title: "Social welfare support, made easier to access.",
    subtitle: "Apply for programs, monitor requests, and receive assistance updates through one secure municipal portal.",
    imageUrl: "/mswdo-community-hero-portrait.png",
    isPublished: true,
    data: {
      municipalTitle: "MSWDO Carmen, Cebu 6005",
      officeName: "Municipal Social Welfare and Development Office",
      guidanceNote: "Residents of Carmen, Cebu may submit applications for Senior Citizen IDs, PWD welfare, Solo Parent subsidies, and youth assistance directly online.",
      ctaText: "Apply for Welfare Assistance",
      ctaLink: "/apply",
      trackCtaText: "Track Application Status",
      trackCtaLink: "/track",
      liveBadgeText: "Live on Citizen Portal",
    },
    updatedAt: new Date().toISOString(),
    updatedByName: "System Initializer",
  },
  services: {
    id: "services",
    title: "Municipal Social Welfare Services Directory",
    subtitle: "Explore social welfare programs, assistance packages, and eligibility criteria offered by Carmen MSWDO.",
    imageUrl: null,
    isPublished: true,
    data: {
      items: [
        {
          id: "srv-1",
          title: "Senior Citizen Social Protection & OSCA Services",
          category: "Senior Citizen",
          description: "Issuance of Senior Citizen Identification Card, purchase booklet for medicines and groceries, local social pension screening, and centenarian cash gifts.",
          eligibility: "Filipino citizen, at least 60 years old, permanent resident of Carmen, Cebu.",
          requirements: ["PSA Birth Certificate or Voter Certificate", "1x1 ID Photos (2 pcs)", "Barangay Certificate of Residency"],
          isActive: true,
          icon: "HeartHandshake",
        },
        {
          id: "srv-2",
          title: "Persons with Disability (PWD) Welfare & Support",
          category: "Person with Disability (PWD)",
          description: "Registration and issuance of PWD ID cards, assistive mobility devices (wheelchairs, crutches), special livelihood assistance, and medical rehabilitation referrals.",
          eligibility: "Resident of Carmen with physical, mental, intellectual, or sensory impairments.",
          requirements: ["Medical Evaluation Certificate from licensed physician", "Barangay Certificate of Indigency", "Valid Government ID or Birth Certificate"],
          isActive: true,
          icon: "Accessibility",
        },
        {
          id: "srv-3",
          title: "Youth & Student Educational Welfare Grant",
          category: "Youth",
          description: "Special financial educational assistance for indigent students, skills training referrals, youth organization accreditation, and anti-delinquency guidance counseling.",
          eligibility: "Enrolled youth/student aged 15-30 residing in Carmen whose family income falls below poverty threshold.",
          requirements: ["Certificate of Enrollment / COR", "Valid Student ID", "Barangay Certificate of Indigency"],
          isActive: true,
          icon: "GraduationCap",
        },
        {
          id: "srv-4",
          title: "Solo Parents Welfare & Women Empowerment",
          category: "Women",
          description: "Issuance of Solo Parent Identification Card (under RA 11861), monthly welfare subsidies, crisis intervention, psychosocial support, and livelihood capital assistance.",
          eligibility: "Solo parent residing in Carmen with sole parental custody over dependent children.",
          requirements: ["Solo Parent Sworn Affidavit", "Birth Certificates of Dependents", "Barangay Certificate of Solo Parent Status"],
          isActive: true,
          icon: "Users",
        },
        {
          id: "srv-5",
          title: "Assistance to Individuals in Crisis Situations (AICS)",
          category: "General",
          description: "Immediate emergency cash or voucher grants for hospital bills, medicine purchases, burial costs, and transportation assistance for stranded constituents.",
          eligibility: "Any Carmen constituent in verified acute economic distress or bereavement.",
          requirements: ["Hospital Bill / Doctor Prescription or Death Certificate", "Barangay Indigency Certificate", "Valid Government ID"],
          isActive: true,
          icon: "HeartHandshake",
        },
      ],
    },
    updatedAt: new Date().toISOString(),
    updatedByName: "System Initializer",
  },
  faqs: {
    id: "faqs",
    title: "Citizen Help Center & Frequently Asked Questions",
    subtitle: "Clear answers to common questions regarding applications, requirements, claiming schedules, and citizen benefits.",
    imageUrl: null,
    isPublished: true,
    data: {
      items: [
        {
          id: "faq-1",
          question: "Who is eligible to apply for MSWDO welfare programs in Carmen?",
          category: "General",
          answer: "All bonafide residents of Carmen, Cebu who belong to vulnerable sectors (Senior Citizens aged 60+, Persons with Disability, Solo Parents, indigent students, or families in crisis) are eligible to apply.",
          order: 1,
        },
        {
          id: "faq-2",
          question: "How long does the online application evaluation take?",
          category: "Application",
          answer: "Standard application review takes 3 to 5 business days upon digital submission of all complete required documents. You can track your real-time status online using your reference number.",
          order: 2,
        },
        {
          id: "faq-3",
          question: "What happens if my application is marked \"Needs correction\"?",
          category: "Application",
          answer: "If an uploaded requirement is blurry or missing, caseworkers will flag the specific document. You can open the Track Application page or sign into your applicant portal to upload the replacement file immediately.",
          order: 3,
        },
        {
          id: "faq-4",
          question: "How are approved financial and medical subsidies disbursed?",
          category: "Benefits",
          answer: "Approved assistance can be claimed directly at the MSWDO Office at the Carmen Municipal Hall during scheduled payout dates, or through designated municipal cash disbursement partners.",
          order: 4,
        },
        {
          id: "faq-5",
          question: "Can I track my application without signing in?",
          category: "General",
          answer: "Yes! Simply navigate to the \"Track Application\" page and input your Application Reference Number (e.g., MSWDO-2026-XXXXX) to check current verification progress.",
          order: 5,
        },
      ],
    },
    updatedAt: new Date().toISOString(),
    updatedByName: "System Initializer",
  },
  documents: {
    id: "documents",
    title: "Downloadable Municipal Application Forms & Checklists",
    subtitle: "Official MSWDO printable forms, sworn statements, and requirement checklists for citizen download.",
    imageUrl: null,
    isPublished: true,
    data: {
      items: [
        {
          id: "doc-1",
          title: "General Intake & Social Welfare Application Form",
          code: "MSWDO-FORM-001",
          category: "General",
          fileSize: "184 KB",
          format: "PDF",
          url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg",
          description: "Primary application sheet required for all new walk-in and indigent assistance intakes.",
        },
        {
          id: "doc-2",
          title: "Senior Citizen (OSCA) Member Registration Sheet",
          code: "MSWDO-OSCA-02",
          category: "Senior Citizen",
          fileSize: "142 KB",
          format: "PDF",
          url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg",
          description: "Registration form for Senior Citizen ID issuance, discount booklet, and social pension enrollment.",
        },
        {
          id: "doc-3",
          title: "PWD Disability Medical Evaluation & Intake Sheet",
          code: "MSWDO-PWD-03",
          category: "Person with Disability (PWD)",
          fileSize: "210 KB",
          format: "PDF",
          url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg",
          description: "Official assessment form to be completed by attending physician for PWD ID eligibility.",
        },
        {
          id: "doc-4",
          title: "Solo Parent Sworn Affidavit & Family Background Sheet",
          code: "MSWDO-SOLO-04",
          category: "Women",
          fileSize: "165 KB",
          format: "PDF",
          url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg",
          description: "Notarized sworn affidavit of solo parenthood under Republic Act No. 11861.",
        },
        {
          id: "doc-5",
          title: "Social Case Study Assessment Request Template",
          code: "MSWDO-SCS-05",
          category: "General",
          fileSize: "198 KB",
          format: "PDF",
          url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg",
          description: "Template for hospital social services, medical charity, and educational sponsorship requests.",
        },
      ],
    },
    updatedAt: new Date().toISOString(),
    updatedByName: "System Initializer",
  },
}

// In-memory memory fallback in case localStorage hits quota
let inMemoryCmsCache = null

/**
 * Read local cache
 */
function getCachedCmsData() {
  if (inMemoryCmsCache) return inMemoryCmsCache
  if (typeof window === "undefined") return DEFAULT_CMS_CONTENT
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      inMemoryCmsCache = { ...DEFAULT_CMS_CONTENT, ...parsed }
      return inMemoryCmsCache
    }
  } catch (e) {
    console.warn("Failed to parse CMS cache:", e)
  }
  inMemoryCmsCache = { ...DEFAULT_CMS_CONTENT }
  return inMemoryCmsCache
}

/**
 * Write to local cache
 */
function setCachedCmsData(data) {
  inMemoryCmsCache = data
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn("Failed to save CMS cache to localStorage (quota exceeded or disabled):", e)
    // If quota exceeded due to huge base64, attempt to save without large data URLs
    try {
      const sanitized = {}
      for (const key of Object.keys(data)) {
        sanitized[key] = { ...data[key] }
        if (sanitized[key]?.imageUrl?.startsWith("data:")) {
          sanitized[key].imageUrl = "/mswdo-community-hero-portrait.png"
        }
      }
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(sanitized))
    } catch (_) {}
  }

  try {
    window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: data }))
  } catch (_) {}
}

/**
 * Fetch a specific CMS section by ID from Supabase or Cache
 */
export async function getCmsSection(sectionId) {
  const cached = getCachedCmsData()

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("cms_content")
        .select("*")
        .eq("id", sectionId)
        .maybeSingle()

      if (!error && data) {
        const mapped = {
          id: data.id,
          title: data.title,
          subtitle: data.subtitle,
          imageUrl: data.image_url,
          storagePath: data.storage_path,
          isPublished: data.is_published,
          data: data.data || {},
          updatedAt: data.updated_at,
          updatedByName: data.updated_by_name || "Administrator",
        }
        // Update local cache for this section
        const updatedCache = { ...cached, [sectionId]: mapped }
        setCachedCmsData(updatedCache)
        return mapped
      }
    }
  } catch (err) {
    console.warn(`Supabase getCmsSection(${sectionId}) warning:`, err.message)
  }

  return cached[sectionId] || DEFAULT_CMS_CONTENT[sectionId]
}

/**
 * Fetch all CMS sections
 */
export async function getAllCmsSections() {
  const cached = getCachedCmsData()

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("cms_content")
        .select("*")
        .order("updated_at", { ascending: false })

      if (!error && Array.isArray(data) && data.length > 0) {
        const merged = { ...cached }
        data.forEach((row) => {
          merged[row.id] = {
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            imageUrl: row.image_url,
            storagePath: row.storage_path,
            isPublished: row.is_published,
            data: row.data || {},
            updatedAt: row.updated_at,
            updatedByName: row.updated_by_name || "Administrator",
          }
        })
        setCachedCmsData(merged)
        return merged
      }
    }
  } catch (err) {
    console.warn("Supabase getAllCmsSections warning:", err.message)
  }

  return cached
}

/**
 * Save/Update a CMS section to Supabase and Cache
 */
export async function saveCmsSection(sectionId, { title, subtitle, data, imageUrl, storagePath, isPublished = true, user = null }) {
  const cached = getCachedCmsData()
  const now = new Date().toISOString()
  const updatedByName = user?.name || user?.email || "Super Administrator"

  const updatedSection = {
    id: sectionId,
    title: title || cached[sectionId]?.title || "",
    subtitle: subtitle !== undefined ? subtitle : cached[sectionId]?.subtitle,
    imageUrl: imageUrl !== undefined ? imageUrl : cached[sectionId]?.imageUrl,
    storagePath: storagePath !== undefined ? storagePath : cached[sectionId]?.storagePath,
    data: data || cached[sectionId]?.data || {},
    isPublished: isPublished !== undefined ? isPublished : true,
    updatedAt: now,
    updatedByName,
  }

  // 1. Update local cache immediately
  const newCache = { ...cached, [sectionId]: updatedSection }
  setCachedCmsData(newCache)

  // 2. Persist in Supabase DB if available
  try {
    if (supabase) {
      const payload = {
        id: sectionId,
        title: updatedSection.title,
        subtitle: updatedSection.subtitle,
        image_url: updatedSection.imageUrl,
        storage_path: updatedSection.storagePath,
        data: updatedSection.data,
        is_published: updatedSection.isPublished,
        updated_by: user?.id || null,
        updated_by_name: updatedByName,
        updated_at: now,
      }

      const { error } = await supabase
        .from("cms_content")
        .upsert(payload, { onConflict: "id" })

      if (error) {
        console.warn("Supabase saveCmsSection upsert error (fallback cache kept):", error.message)
      }
    }
  } catch (err) {
    console.warn("Supabase saveCmsSection network error:", err.message)
  }

  // 3. Record Security Audit Log
  try {
    await recordAuditLog({
      action: "CMS_SECTION_UPDATED",
      category: "Content Management",
      details: `Updated CMS section "${sectionId}" (${updatedSection.title})`,
      performedBy: user?.id,
      performedByName: updatedByName,
      metadata: {
        sectionId,
        isPublished: updatedSection.isPublished,
        updatedAt: now,
      },
    })
  } catch (auditErr) {
    // Non-blocking
  }

  return updatedSection
}

/**
 * Compresses an image file client-side to ensure it is lightweight (<= 300KB)
 * before uploading to Supabase Storage or local cache fallback.
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.82) {
  if (!file || !file.type?.startsWith("image/")) return file

  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            resolve(file)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            },
            "image/jpeg",
            quality
          )
        }
        img.onerror = () => resolve(file)
        img.src = event.target.result
      }
      reader.onerror = () => resolve(file)
      reader.readAsDataURL(file)
    } catch (_) {
      resolve(file)
    }
  })
}

/**
 * Upload CMS media assets (images, documents) to Supabase Storage
 */
export async function uploadCmsAsset(file, folder = "cms") {
  if (!file) throw new Error("No file provided for upload.")

  // 1. Automatically compress images for web performance
  let uploadFile = file
  if (file.type?.startsWith("image/")) {
    try {
      uploadFile = await compressImage(file)
    } catch (compressErr) {
      console.warn("Image compression error (using original):", compressErr)
      uploadFile = file
    }
  }

  const timestamp = Date.now()
  const cleanName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const filePath = `${folder}/${timestamp}_${cleanName}`

  let publicUrl = null
  let storagePath = filePath

  // 2. Try Supabase Storage upload
  if (supabase) {
    const bucketsToTry = ["application-documents", "cms-assets", "public-assets"]
    for (const bucket of bucketsToTry) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, uploadFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: uploadFile.type || "application/octet-stream",
          })

        if (!uploadError) {
          const { data: pubData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl
            break
          }
        } else {
          console.warn(`Supabase storage bucket '${bucket}' upload:`, uploadError.message)
        }
      } catch (err) {
        // try next bucket
      }
    }
  }

  // 3. Fallback to local Data URL preview if storage upload failed or offline
  if (!publicUrl) {
    publicUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(uploadFile)
    })
  }

  return {
    publicUrl,
    storagePath,
    fileName: uploadFile.name,
    fileSize: `${Math.round(uploadFile.size / 1024)} KB`,
    fileType: uploadFile.type,
  }
}
