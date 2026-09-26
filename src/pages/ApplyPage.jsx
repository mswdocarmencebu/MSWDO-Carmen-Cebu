import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import {
  HeartHandshake,
  Accessibility,
  Users,
  GraduationCap,
} from "lucide-react"
import { useRouter } from "@/routes/RouterContext"
import {
  ApplyHeader,
  ApplyHeroBanner,
  ApplyNoticeAlert,
  ApplyStepper,
  ApplyCategoryStep,
  ApplyDetailsStep,
  ApplyDocumentsStep,
  ApplySuccessStep,
  ApplyFooter,
  CancelApplicationModal,
} from "@/components/features/apply"
import { submitPreApplication } from "@/services/applicationService"

export function ApplyPage() {
  const { navigate } = useRouter()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  // Steps: 1 = CATEGORY, 2 = DETAILS, 3 = DOCUMENTS, 4 = SUBMITTED CONFIRMATION
  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_step")
      const parsed = parseInt(saved, 10)
      return parsed && parsed >= 1 && parsed <= 3 ? parsed : 1
    } catch {
      return 1
    }
  })

  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      return localStorage.getItem("mswdo_apply_category") || "senior"
    } catch {
      return "senior"
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [copiedRef, setCopiedRef] = useState(false)
  const [dataPrivacyAgreed, setDataPrivacyAgreed] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [documentErrors, setDocumentErrors] = useState({})

  // Form State: Basic Information (Common to all categories)
  const [basicInfo, setBasicInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_basicInfo")
      return saved
        ? JSON.parse(saved)
        : {
            firstName: "",
            middleName: "",
            lastName: "",
            dob: "",
            gender: "",
            civilStatus: "",
            barangay: "",
            sitio: "",
            completeAddress: "",
            contactNumber: "",
            email: "",
          }
    } catch {
      return {
        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        gender: "",
        civilStatus: "",
        barangay: "",
        sitio: "",
        completeAddress: "",
        contactNumber: "",
        email: "",
      }
    }
  })

  // Category 1: Senior Citizen specific state
  const [seniorDetails, setSeniorDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_seniorDetails")
      return saved
        ? JSON.parse(saved)
        : {
            citizenship: "Filipino",
            religion: "Roman Catholic",
            birthplace: "",
            benefactor: "",
            pension: "None / Select",
            livingArrangement: "Select Arrangement",
            occupation: "",
            annualIncome: "",
            regularSupport: "No",
            withDisability: "No",
            hasIllness: "No",
          }
    } catch {
      return {
        citizenship: "Filipino",
        religion: "Roman Catholic",
        birthplace: "",
        benefactor: "",
        pension: "None / Select",
        livingArrangement: "Select Arrangement",
        occupation: "",
        annualIncome: "",
        regularSupport: "No",
        withDisability: "No",
        hasIllness: "No",
      }
    }
  })

  // Senior Citizen: Family Composition rows
  const [familyRows, setFamilyRows] = useState([
    { id: 1, name: "", relation: "", age: "", status: "", occupation: "", income: "" },
  ])

  // Category 2: Youth Welfare specific state
  const [youthDetails, setYouthDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_youthDetails")
      return saved
        ? JSON.parse(saved)
        : {
            educationalAttainment: "",
            outOfSchool: "No, Currently Enrolled",
            schoolName: "",
            organization: "",
            targetAssistance: "Educational Assistance / Scholarship",
          }
    } catch {
      return {
        educationalAttainment: "",
        outOfSchool: "No, Currently Enrolled",
        schoolName: "",
        organization: "",
        targetAssistance: "Educational Assistance / Scholarship",
      }
    }
  })

  // Category 3: Person with Disability (PWD) specific state (DOH Form 4.0)
  const [pwdDetails, setPwdDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_pwdDetails")
      return saved
        ? JSON.parse(saved)
        : {
            applicationType: "New Applicant",
            pwdNumber: "",
            dateApplied: "",
            disabilityType: "",
            disabilityCause: "",
            educationalAttainment: "",
            statusOfEmployment: "",
            occupationCategory: "",
            organizationAffiliated: "",
            orgContactPerson: "",
            orgOfficeAddress: "",
            orgTelNos: "",
            sssNo: "",
            gsisNo: "",
            pagibigNo: "",
            philhealthNo: "",
            fatherName: "",
            motherName: "",
            guardianName: "",
            accomplishedBy: "Applicant",
            certifyingPhysician: "",
          }
    } catch {
      return {
        applicationType: "New Applicant",
        pwdNumber: "",
        dateApplied: "",
        disabilityType: "",
        disabilityCause: "",
        educationalAttainment: "",
        statusOfEmployment: "",
        occupationCategory: "",
        organizationAffiliated: "",
        orgContactPerson: "",
        orgOfficeAddress: "",
        orgTelNos: "",
        sssNo: "",
        gsisNo: "",
        pagibigNo: "",
        philhealthNo: "",
        fatherName: "",
        motherName: "",
        guardianName: "",
        accomplishedBy: "Applicant",
        certifyingPhysician: "",
      }
    }
  })

  // Category 4: Women's Welfare specific state
  const [womenDetails, setWomenDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("mswdo_apply_womenDetails")
      return saved
        ? JSON.parse(saved)
        : {
            dateOfRegistration: "",
            placeOfBirth: "",
            educationalAttainment: "",
            spouseName: "",
            fatherName: "",
            motherName: "",
            isSoloParent: "No",
            numberOfChildren: "",
            occupation: "",
          }
    } catch {
      return {
        dateOfRegistration: "",
        placeOfBirth: "",
        educationalAttainment: "",
        spouseName: "",
        fatherName: "",
        motherName: "",
        isSoloParent: "No",
        numberOfChildren: "",
        occupation: "",
      }
    }
  })

  // Document Uploads State (simulated upload tracking)
  const [uploadedFiles, setUploadedFiles] = useState({})

  // Persistence effects
  React.useEffect(() => {
    try {
      if (step < 4) {
        localStorage.setItem("mswdo_apply_step", step.toString())
      }
    } catch {}
  }, [step])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_category", selectedCategory)
    } catch {}
  }, [selectedCategory])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_basicInfo", JSON.stringify(basicInfo))
    } catch {}
  }, [basicInfo])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_seniorDetails", JSON.stringify(seniorDetails))
    } catch {}
  }, [seniorDetails])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_youthDetails", JSON.stringify(youthDetails))
    } catch {}
  }, [youthDetails])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_pwdDetails", JSON.stringify(pwdDetails))
    } catch {}
  }, [pwdDetails])

  React.useEffect(() => {
    try {
      localStorage.setItem("mswdo_apply_womenDetails", JSON.stringify(womenDetails))
    } catch {}
  }, [womenDetails])

  // Clear errors for a field when user types
  const handleUpdateBasicInfo = (updated) => {
    setBasicInfo(updated)
    // Clear validation error when user fixes it
    if (Object.keys(fieldErrors).length > 0) {
      const newErrors = { ...fieldErrors }
      Object.keys(updated).forEach((k) => {
        if (updated[k] !== basicInfo[k] && newErrors[k]) {
          delete newErrors[k]
        }
      })
      setFieldErrors(newErrors)
      if (Object.keys(newErrors).length === 0) {
        setValidationError("")
      }
    }
  }

  const categories = [
    {
      id: "senior",
      title: "Senior Citizen",
      description: "Services for residents aged 60 years and above",
      icon: HeartHandshake,
      badge: "Elderly Care",
      iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40",
    },
    {
      id: "pwd",
      title: "Person with Disability",
      description: "Support and registration for persons with disabilities",
      icon: Accessibility,
      badge: "PWD Support",
      iconBg: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-900/40",
    },
    {
      id: "women",
      title: "Women's Welfare",
      description: "Assistance for women, mothers, and solo parents",
      icon: Users,
      badge: "Solo Parent & Family",
      iconBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40",
    },
    {
      id: "youth",
      title: "Youth Welfare",
      description: "Programs for young residents aged 15 to 30",
      icon: GraduationCap,
      badge: "Youth & Students",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40",
    },
  ]

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0]

  // Family Table Actions
  const handleAddFamilyRow = () => {
    setFamilyRows((prev) => [
      ...prev,
      { id: Date.now(), name: "", relation: "", age: "", status: "", occupation: "", income: "" },
    ])
  }

  const handleRemoveFamilyRow = (id) => {
    if (familyRows.length <= 1) return
    setFamilyRows((prev) => prev.filter((row) => row.id !== id))
  }

  const handleFamilyChange = (id, field, value) => {
    setFamilyRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  // Real File Upload & Removal
  const handleFileUpload = (docKey, fileData) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docKey]: fileData,
    }))
    setDocumentErrors((prev) => {
      if (!prev[docKey]) return prev
      const copy = { ...prev }
      delete copy[docKey]
      return copy
    })
  }

  const handleRemoveUpload = (docKey) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev }
      delete copy[docKey]
      return copy
    })
  }

  // Calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return 0
    const birthDate = new Date(dobString)
    if (isNaN(birthDate.getTime())) return 0
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Navigation and Validation
  const handleContinueFromStep1 = () => {
    setValidationError("")
    setFieldErrors({})
    setStep(2)
  }

  const handleContinueFromStep2 = () => {
    const errors = {}

    // 1. Required basic fields
    if (!basicInfo.firstName?.trim()) {
      errors.firstName = "First name is required."
    }
    if (!basicInfo.lastName?.trim()) {
      errors.lastName = "Last name is required."
    }
    if (!basicInfo.dob) {
      errors.dob = "Date of birth is required."
    }
    if (!basicInfo.gender && selectedCategory !== "women") {
      errors.gender = "Gender is required."
    }
    if (!basicInfo.civilStatus) {
      errors.civilStatus = "Civil status is required."
    }
    if (!basicInfo.completeAddress?.trim()) {
      errors.completeAddress = "Complete address is required."
    }

    // 2. Philippine phone number validation
    // Valid formats: 09XXXXXXXXX (11 digits), +639XXXXXXXXX (13 chars), 9XXXXXXXXX (10 digits)
    const phoneClean = (basicInfo.contactNumber || "").replace(/[\s\-()]/g, "")
    const phPhoneRegex = /^(09|\+639|9)\d{9}$/
    if (!phoneClean) {
      errors.contactNumber = "Contact number is required."
    } else if (!phPhoneRegex.test(phoneClean)) {
      errors.contactNumber = "Please enter a valid Philippine mobile number (e.g., 09171234567 or +639171234567)."
    }

    // 3. Email validation
    const emailClean = (basicInfo.email || "").trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailClean) {
      errors.email = "Email address is required."
    } else if (!emailRegex.test(emailClean)) {
      errors.email = "Please enter a valid email address."
    }

    // 4. Comprehensive Sector Age Validation across all categories
    if (basicInfo.dob) {
      const birthDate = new Date(basicInfo.dob)
      const today = new Date()

      if (birthDate > today) {
        errors.dob = "Date of birth cannot be in the future."
      } else {
        const age = calculateAge(basicInfo.dob)

        if (age > 125) {
          errors.dob = "Please enter a valid date of birth."
        } else if (selectedCategory === "senior") {
          // Senior Citizen: must be 60 years old or older
          if (age < 60) {
            errors.dob = `Senior Citizen applicants must be at least 60 years old (Current age: ${age}).`
          }
        } else if (selectedCategory === "youth") {
          // Youth Welfare: must be between 15 and 30 years old (RA 8044)
          if (age < 15) {
            errors.dob = `Youth Welfare applicants must be at least 15 years old (Current age: ${age}).`
          } else if (age > 30) {
            errors.dob = `Youth Welfare applicants must be 30 years old or younger (Current age: ${age}). Eligible age range is 15 to 30.`
          }
        } else if (selectedCategory === "women") {
          // Women's Welfare: must be at least 18 years old
          if (age < 18) {
            errors.dob = `Women's Welfare applicants must be at least 18 years old (Current age: ${age}).`
          }
        } else if (selectedCategory === "pwd") {
          // PWD: must be valid age
          if (age < 0) {
            errors.dob = "Please enter a valid date of birth."
          }
        }
      }
    }

    // If any error exists:
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstErrorKey = Object.keys(errors)[0]
      setValidationError(errors[firstErrorKey])

      // Scroll specifically to the first invalid field and focus it without resetting to top
      setTimeout(() => {
        const inputElem = document.getElementById(`input-${firstErrorKey}`)
        const fieldElem = document.getElementById(`field-${firstErrorKey}`)
        if (inputElem) {
          inputElem.focus()
          inputElem.scrollIntoView({ behavior: "smooth", block: "center" })
        } else if (fieldElem) {
          fieldElem.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 50)
      return
    }

    // Success -> proceed to Step 3
    setFieldErrors({})
    setValidationError("")
    setStep(3)
  }


  const handleSubmitApplication = (e) => {
    e.preventDefault()

    // 1. Validate required documents
    const reqDocs = getRequiredDocuments().filter((d) => d.required)
    const missingDocs = {}

    reqDocs.forEach((doc) => {
      if (!uploadedFiles[doc.key]) {
        missingDocs[doc.key] = true
      }
    })

    if (Object.keys(missingDocs).length > 0) {
      setDocumentErrors(missingDocs)
      const firstMissingKey = Object.keys(missingDocs)[0]
      const missingDocObj = reqDocs.find((d) => d.key === firstMissingKey)
      setValidationError(`Please upload the required document: ${missingDocObj?.title || "Required Document"}.`)

      setTimeout(() => {
        const cardElem = document.getElementById(`doc-card-${firstMissingKey}`)
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 50)
      return
    }

    // 2. Validate Data Privacy consent
    if (!dataPrivacyAgreed) {
      setValidationError("Please agree to the Data Privacy Act declaration to submit.")
      return
    }

    setDocumentErrors({})
    setValidationError("")
    setIsSubmitting(true)

    let categoryDetails = {}
    if (selectedCategory === "senior") {
      categoryDetails = { ...seniorDetails, familyRows }
    } else if (selectedCategory === "pwd") {
      categoryDetails = { ...pwdDetails }
    } else if (selectedCategory === "women") {
      categoryDetails = { ...womenDetails }
    } else if (selectedCategory === "youth") {
      categoryDetails = { ...youthDetails }
    }

    submitPreApplication({
      category: selectedCategory,
      basicInfo,
      categoryDetails,
      uploadedFiles,
    })
      .then((record) => {
        setReferenceNumber(record.reference)
        setIsSubmitting(false)
        setStep(4)
        try {
          localStorage.removeItem("mswdo_apply_step")
          localStorage.removeItem("mswdo_apply_category")
          localStorage.removeItem("mswdo_apply_basicInfo")
          localStorage.removeItem("mswdo_apply_seniorDetails")
          localStorage.removeItem("mswdo_apply_youthDetails")
          localStorage.removeItem("mswdo_apply_pwdDetails")
          localStorage.removeItem("mswdo_apply_womenDetails")
        } catch {}
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
      .catch((err) => {
        console.error("Submission error:", err)
        setValidationError("An error occurred during submission. Please try again.")
        setIsSubmitting(false)
      })
  }

  const handleCopyReference = () => {
    if (!referenceNumber) return
    navigator.clipboard.writeText(referenceNumber)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  // Get required documents based on category
  const getRequiredDocuments = () => {
    switch (selectedCategory) {
      case "senior":
        return [
          {
            key: "psa_birth_cert",
            title: "PSA / NSO birth certificate",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "valid_id",
            title: "Valid government ID",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "voter_cert",
            title: "Voter verification / certificate",
            desc: "Alternative when a valid ID is unavailable",
            required: false,
          },
        ]
      case "pwd":
        return [
          {
            key: "med_cert",
            title: "Medical certificate",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "valid_id",
            title: "Valid government ID",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "voter_cert",
            title: "Voter verification / certificate",
            desc: "Alternative when a valid ID is unavailable",
            required: false,
          },
        ]
      case "women":
        return [
          {
            key: "barangay_cert",
            title: "Barangay certificate",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "psa_birth_cert",
            title: "PSA / NSO birth certificate",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "valid_id",
            title: "Valid government ID",
            desc: "Choose a file from your device",
            required: true,
          },
          {
            key: "voter_cert",
            title: "Voter verification / certificate",
            desc: "Alternative when a valid ID is unavailable",
            required: false,
          },
        ]
      case "youth":
      default:
        return [
          {
            key: "school_id",
            title: "Certificate of Enrollment / Valid School ID *",
            desc: "Current semester enrollment certification or school ID copy",
            required: true,
          },
          {
            key: "birth_cert",
            title: "PSA or Local Civil Registrar Birth Certificate *",
            desc: "Proof of age between 15 and 30 years old",
            required: true,
          },
          {
            key: "indigency",
            title: "Barangay Certificate of Indigency *",
            desc: "Certifying residency and indigent family status in Carmen",
            required: true,
          },
          {
            key: "grades_report",
            title: "Copy of Grades / Form 138 (Optional)",
            desc: "Required for academic scholarship grant applicants",
            required: false,
          },
        ]
    }
  }

  const handleConfirmCancel = () => {
    try {
      localStorage.removeItem("mswdo_apply_step")
      localStorage.removeItem("mswdo_apply_category")
      localStorage.removeItem("mswdo_apply_basicInfo")
      localStorage.removeItem("mswdo_apply_seniorDetails")
      localStorage.removeItem("mswdo_apply_youthDetails")
      localStorage.removeItem("mswdo_apply_pwdDetails")
      localStorage.removeItem("mswdo_apply_womenDetails")
    } catch {}
    setIsCancelModalOpen(false)
    navigate("/signin")
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-foreground flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <ApplyHeader onCancel={() => setIsCancelModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-5 py-4 sm:py-5 space-y-4">
        <AnimatePresence mode="wait">
          {step === 4 ? (
            <ApplySuccessStep
              key="step-4"
              activeCategoryObj={activeCategoryObj}
              basicInfo={basicInfo}
              referenceNumber={referenceNumber}
              copiedRef={copiedRef}
              onCopyReference={handleCopyReference}
            />
          ) : (
            <div key="active-steps" className="space-y-4">
              {/* Top Hero Banner */}
              <ApplyHeroBanner />

              {/* Informational Alert and Validation Notice */}
              <ApplyNoticeAlert validationError={validationError} />

              {/* Connected Progress Stepper Card */}
              <ApplyStepper step={step} />

              {/* Step Forms */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <ApplyCategoryStep
                    key="category-step"
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    onContinue={handleContinueFromStep1}
                  />
                )}

                {step === 2 && (
                  <ApplyDetailsStep
                    key="details-step"
                    activeCategoryObj={activeCategoryObj}
                    onBackToCategory={() => {
                      setValidationError("")
                      setStep(1)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    basicInfo={basicInfo}
                    setBasicInfo={handleUpdateBasicInfo}
                    seniorDetails={seniorDetails}
                    setSeniorDetails={setSeniorDetails}
                    familyRows={familyRows}
                    onAddFamilyRow={handleAddFamilyRow}
                    onRemoveFamilyRow={handleRemoveFamilyRow}
                    onFamilyChange={handleFamilyChange}
                    youthDetails={youthDetails}
                    setYouthDetails={setYouthDetails}
                    pwdDetails={pwdDetails}
                    setPwdDetails={setPwdDetails}
                    womenDetails={womenDetails}
                    setWomenDetails={setWomenDetails}
                    onContinue={handleContinueFromStep2}
                    fieldErrors={fieldErrors}
                  />
                )}

                {step === 3 && (
                  <ApplyDocumentsStep
                    key="documents-step"
                    activeCategoryObj={activeCategoryObj}
                    requiredDocuments={getRequiredDocuments()}
                    uploadedFiles={uploadedFiles}
                    onUploadFile={handleFileUpload}
                    onRemoveFile={handleRemoveUpload}
                    dataPrivacyAgreed={dataPrivacyAgreed}
                    setDataPrivacyAgreed={setDataPrivacyAgreed}
                    onBackToDetails={() => {
                      setValidationError("")
                      setStep(2)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    onSubmit={handleSubmitApplication}
                    isSubmitting={isSubmitting}
                    lastName={basicInfo.lastName}
                    documentErrors={documentErrors}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Municipal Footer */}
      <ApplyFooter />

      {/* Cancel Confirmation Modal */}
      <CancelApplicationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}

export default ApplyPage
