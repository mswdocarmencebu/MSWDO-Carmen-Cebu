import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Copy,
  Check,
  ChevronLeft,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
  Accessibility,
  Users,
  GraduationCap,
  Sparkles,
  Download,
  Image as ImageIcon,
  Printer,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "@/routes/RouterContext"
import { getApplicationByReference, normalizeDateToYMD } from "@/services/applicationService"

export function TrackApplicationPage() {
  const { navigate } = useRouter()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRef = searchParams.get("ref") || ""
  const initialDob = normalizeDateToYMD(searchParams.get("dob") || "") || ""

  const [referenceInput, setReferenceInput] = useState(initialRef)
  const [birthDateInput, setBirthDateInput] = useState(initialDob)
  const [application, setApplication] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [copiedKey, setCopiedKey] = useState(null)

  // Document Lightbox preview state
  const [activeDocIndex, setActiveDocIndex] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Load application when query param changes or on mount
  useEffect(() => {
    if (initialRef && initialDob) {
      performLookup(initialRef, initialDob)
    }
  }, [initialRef, initialDob])

  const performLookup = async (refCode, bday) => {
    const code = (refCode !== undefined ? refCode : referenceInput).trim()
    const birth = (bday !== undefined ? bday : birthDateInput).trim()

    if (!code) {
      setSearchError("Please enter your Application reference.")
      return
    }
    if (!birth) {
      setSearchError("Please enter the Applicant birthdate to securely locate this application.")
      return
    }

    setSearchError("")
    setIsLoading(true)
    setHasSearched(true)

    try {
      const result = await getApplicationByReference(code, birth)
      if (result) {
        setApplication(result)
        setSearchParams({ ref: result.reference, dob: birth })
      } else {
        setApplication(null)
        setSearchError(`No submitted application matching reference "${code}" and the provided birthdate was found. Please check both details.`)
      }
    } catch (err) {
      console.error("Lookup error:", err)
      setSearchError("Failed to query tracking records. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    performLookup(referenceInput, birthDateInput)
  }

  const copyToClipboard = (txt, key) => {
    if (!txt) return
    navigator.clipboard.writeText(txt)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return null
    const birthDate = new Date(dobString)
    if (isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Normalize documents list
  const documents = useMemo(() => {
    if (application?.documents && Array.isArray(application.documents) && application.documents.length > 0) {
      return application.documents.map((d, i) => ({
        id: d.id || `doc-${i + 1}`,
        name: d.name || d.title || d.key || `Document ${i + 1}`,
        fileName: d.fileName || "",
        fileType: d.fileType || "",
        fileSize: d.fileSize || 0,
        url: d.url || d.previewUrl || d.storageUrl || "",
        status: d.status || "Pending",
      }))
    }
    return []
  }, [application])

  const applicantAge = calculateAge(application?.birthDate)

  // Status mapping and configuration
  const statusConfig = {
    Pending: {
      label: "Pending Ongoing Review",
      description: "Your application and documents have been recorded and are queued for initial review by MSWDO caseworkers.",
      badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      stepIndex: 1,
      icon: Clock,
    },
    "Needs correction": {
      label: "Action Required / Needs Correction",
      description: "MSWDO staff has requested re-submission or additional clarity on one or more of your documents. Please review flagged items.",
      badge: "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800",
      stepIndex: 2,
      icon: AlertTriangle,
    },
    Resubmitted: {
      label: "Resubmitted for Review",
      description: "Your updated requirements have been resubmitted and are back in the caseworker verification queue.",
      badge: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      stepIndex: 2,
      icon: RotateCcw,
    },
    Approved: {
      label: "Application Approved",
      description: "Congratulations! Your application has been approved. Your municipal applicant credentials have been generated and dispatched.",
      badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      stepIndex: 4,
      icon: CheckCircle2,
    },
    Rejected: {
      label: "Application Not Approved",
      description: "This application did not meet the municipal program statutory criteria or eligibility qualifications.",
      badge: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800",
      stepIndex: 0,
      icon: XCircle,
    },
  }

  const currentStatusInfo = statusConfig[application?.status] || statusConfig.Pending

  // Sector Icon Helper
  const getSectorIcon = (cat) => {
    const c = (cat || "").toLowerCase()
    if (c === "senior" || c.includes("senior")) return HeartHandshake
    if (c === "pwd" || c.includes("pwd") || c.includes("disability")) return Accessibility
    if (c === "women" || c.includes("women")) return Users
    return GraduationCap
  }

  const SectorIcon = getSectorIcon(application?.category || application?.sector)

  // Sector Details Renderer
  const renderSectorDetails = () => {
    if (!application) return null
    const cat = (application.category || "").toLowerCase()
    const d = application.categoryDetails || {}

    if (cat === "senior") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <InfoItem label="Citizenship" value={d.citizenship || "Filipino"} />
          <InfoItem label="Religion" value={d.religion || "Roman Catholic"} />
          <InfoItem label="Pension Status" value={d.pension || "None"} />
          <InfoItem label="Living Arrangement" value={d.livingArrangement || "Living with Relatives"} />
          <InfoItem label="Occupation" value={d.occupation || "None / Homemaker"} />
          <InfoItem label="Annual Income" value={d.annualIncome || "Below ₱50,000"} />
          <InfoItem label="Disability Status" value={d.withDisability || "No"} />
          <InfoItem label="Medical Condition" value={d.hasIllness || "None reported"} />
          {d.familyRows && Array.isArray(d.familyRows) && d.familyRows.length > 0 && d.familyRows[0].name && (
            <div className="col-span-full p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Family Composition</p>
              <div className="text-xs text-foreground space-y-1">
                {d.familyRows.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-0">
                    <span className="font-semibold">{f.name} ({f.relation})</span>
                    <span className="text-muted-foreground text-[11px]">{f.age} yrs · {f.occupation || "N/A"} · ₱{f.income || 0}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (cat === "pwd") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <InfoItem label="Application Type" value={d.applicationType || "New Applicant"} />
          <InfoItem label="Disability Type" value={d.disabilityType || "Orthopedic / Physical Disability"} />
          <InfoItem label="Disability Cause" value={d.disabilityCause || "Congenital / Inborn"} />
          <InfoItem label="Educational Attainment" value={d.educationalAttainment || application.education || "College Graduate"} />
          <InfoItem label="Employment Status" value={d.employmentStatus || "Employed"} />
          <InfoItem label="Date Applied" value={d.dateApplied || application.submitted || "2026-09-22"} mono />
        </div>
      )
    }

    if (cat === "women") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <InfoItem label="Solo Parent Status" value={d.isSoloParent || "Yes"} />
          <InfoItem label="Number of Children" value={d.numberOfChildren || "2"} />
          <InfoItem label="Occupation" value={d.occupation || "Self-Employed / Vendor"} />
          <InfoItem label="Place of Birth" value={d.placeOfBirth || "Carmen, Cebu"} />
          <InfoItem label="Educational Attainment" value={d.educationalAttainment || "High School Graduate"} />
          <InfoItem label="Monthly Income" value={d.monthlyIncome ? `₱${d.monthlyIncome}` : "N/A"} />
          <InfoItem label="Spouse / Father Name" value={d.spouseName || d.fatherName || "N/A"} />
          <InfoItem label="Mother Name" value={d.motherName || "N/A"} />
        </div>
      )
    }

    // Default Youth
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem label="Educational Attainment" value={d.educationalAttainment || application.education || "College Undergraduate"} />
        <InfoItem label="Out of School Status" value={d.outOfSchool || (application.outOfSchool === "yes" ? "Yes" : "No")} />
        {d.schoolName && <InfoItem label="School / University" value={d.schoolName} wide />}
        {d.organization && <InfoItem label="Youth Organization / SK" value={d.organization} />}
        {d.targetAssistance && <InfoItem label="Target Assistance Program" value={d.targetAssistance} />}
      </div>
    )
  }

  const currentPreviewDoc = activeDocIndex !== null ? documents[activeDocIndex] : null

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-foreground flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* ── Top Header ── */}
      <header className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/carmen_lgu_logo.png"
              alt="Carmen LGU Logo"
              className="size-10 object-contain drop-shadow-xs shrink-0 select-none"
            />
            <div className="text-left">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-heading leading-tight">
                MSWDO Carmen
              </h1>
              <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Application Tracking &amp; Verification Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/apply")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline px-2.5 py-1.5 cursor-pointer"
            >
              New Application
            </button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/signin")}
              className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Tracking Container ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-5 py-6 space-y-6">
        {/* Search Box Card */}
        <div className="rounded-[5px] border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xl shadow-blue-950/5 space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
              <ShieldCheck className="size-3" />
              Secure Public Tracking
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
              Track Your Application
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Please enter your application reference number and applicant birthdate to securely locate and track your welfare assistance record.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="pt-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Field 1: Application reference* */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Application reference</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={referenceInput}
                    onChange={(e) => {
                      setReferenceInput(e.target.value)
                      if (searchError) setSearchError("")
                    }}
                    placeholder="MSWDO-2026-XXXXXXXXXX"
                    className="w-full pl-8.5 pr-3 py-2 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 font-mono tracking-wide uppercase transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter the complete reference exactly as issued.
                </p>
              </div>

              {/* Field 2: Applicant birthdate* */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Applicant birthdate</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDateInput}
                    onChange={(e) => {
                      setBirthDateInput(e.target.value)
                      if (searchError) setSearchError("")
                    }}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-foreground outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Used only to securely locate this application.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="w-full sm:w-auto">
                {searchError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {searchError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="brand"
                disabled={isLoading}
                className="w-full sm:w-auto h-9.5 rounded-[5px] text-xs sm:text-sm font-semibold px-6 gap-2 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span>Track Application</span>
              </Button>
            </div>
          </form>
        </div>

        {/* ── Tracking Result View ── */}
        {application && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Status Hero Card */}
            <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Tracking Reference
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base sm:text-lg font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                        {application.reference}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(application.reference, "ref")}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy reference"
                      >
                        {copiedKey === "ref" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground font-heading">
                    {application.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <SectorIcon className="size-3.5 text-blue-600" />
                      {application.sector}
                    </span>
                    <span>•</span>
                    <span>Filed: {application.submitted}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-bold border ${currentStatusInfo.badge}`}>
                    {React.createElement(currentStatusInfo.icon, { className: "size-3.5" })}
                    {currentStatusInfo.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Carmen Municipal Hall MSWDO
                  </span>
                </div>
              </div>

              {/* Status Stepper Tracker */}
              <div className="p-5 sm:p-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Processing Lifecycle
                </p>

                {/* Progress bar and 4-step pipeline */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
                  {[
                    { step: 1, title: "Intake Submitted", desc: "Online submission confirmed" },
                    { step: 2, title: "Document Review", desc: "Caseworker verification" },
                    { step: 3, title: "Eligibility Audit", desc: "Statutory standards check" },
                    { step: 4, title: "Approved & Released", desc: "Account & credentials ready" },
                  ].map((s) => {
                    const isCompleted = currentStatusInfo.stepIndex >= s.step
                    const isCurrent = currentStatusInfo.stepIndex === s.step
                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-[5px] border transition-colors ${
                          isCompleted
                            ? "bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900 shadow-2xs"
                            : "bg-zinc-100/60 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-200 dark:bg-zinc-700 text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? <Check className="size-3.5" /> : s.step}
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground pl-8">
                          {s.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="p-3 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="size-4 shrink-0 text-blue-600 mt-0.5" />
                  <p className="leading-relaxed">
                    {currentStatusInfo.description}
                  </p>
                </div>
              </div>

              {/* Quick Details Bar */}
              <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">Contact Number</span>
                  <span className="font-semibold text-foreground font-mono">{application.contact || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-foreground truncate block">{application.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">Residence</span>
                  <span className="font-semibold text-foreground truncate block">{application.address || "Carmen, Cebu"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">Estimated Review</span>
                  <span className="font-semibold text-foreground">3 – 5 Working Days</span>
                </div>
              </div>
            </div>

            {/* Applicant Personal Information Card */}
            <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                <User className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-foreground font-heading uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <InfoItem label="Full Name" value={application.name} wide />
                <InfoItem label="Date of Birth" value={application.birthDate} mono />
                <InfoItem
                  label="Age"
                  value={applicantAge !== null ? `${applicantAge} years old` : "—"}
                />
                <InfoItem label="Gender" value={application.gender} />
                <InfoItem label="Civil Status" value={application.civilStatus} />
                <InfoItem label="Contact Number" value={application.contact} mono />
                <InfoItem label="Email Address" value={application.email} />
                <InfoItem label="Complete Address" value={application.address} wide />
              </div>
            </div>

            {/* Sector-Specific Program Details Card */}
            <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                <SectorIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-foreground font-heading uppercase tracking-wider">
                  {application.sector} — Program Details
                </h3>
              </div>

              {renderSectorDetails()}
            </div>

            {/* Documentary Requirements & Uploaded Attachments */}
            <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground font-heading uppercase tracking-wider">
                    Uploaded Documentary Requirements ({documents.length})
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Click any document to inspect
                </span>
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No documents attached to this intake record.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      onClick={() => {
                        setActiveDocIndex(idx)
                        setZoomLevel(1)
                        setRotation(0)
                      }}
                      className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        {doc.url ? (
                          <div className="size-12 rounded-[5px] overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shrink-0 relative">
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="size-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="size-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="size-12 rounded-[5px] bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                            <FileText className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {doc.fileName || "document_file.jpg"}
                          </p>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold mt-1 border ${
                              doc.status === "Verified"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : doc.status === "Needs correction"
                                ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="w-full sm:w-auto h-10 rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Printer className="size-4" />
                Print Acknowledgment Copy
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="brand"
                  onClick={() => navigate("/signin")}
                  className="w-full sm:w-auto h-10 rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  Go to Sign In
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Document Lightbox Modal ── */}
      {currentPreviewDoc && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveDocIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full h-[90vh] bg-zinc-950 text-white rounded-[6px] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Toolbar */}
            <div className="h-13 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="size-8 rounded-[4px] bg-zinc-800 flex items-center justify-center shrink-0 text-blue-400">
                  <ImageIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentPreviewDoc.name}</p>
                  <p className="text-[10px] text-zinc-400 truncate font-mono">
                    Document {activeDocIndex + 1} of {documents.length} · {currentPreviewDoc.fileName || "photo.jpg"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-center select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1)
                    setRotation(0)
                  }}
                  className="px-2 py-1 rounded-[4px] text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                >
                  Reset
                </button>
                {currentPreviewDoc.url && (
                  <a
                    href={currentPreviewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer ml-1"
                    title="Open original"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveDocIndex(null)}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-2"
                  title="Close viewer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Central Canvas View */}
            <div className="flex-1 overflow-auto relative flex items-center justify-center p-4 bg-zinc-900/60 select-none">
              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocIndex((prev) => (prev - 1 + documents.length) % documents.length)
                    setZoomLevel(1)
                    setRotation(0)
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Previous document"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}

              {currentPreviewDoc.url ? (
                <div
                  className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={currentPreviewDoc.url}
                    alt={currentPreviewDoc.name}
                    className="max-w-[85vw] sm:max-w-2xl max-h-[70vh] object-contain rounded-[4px] shadow-2xl"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-zinc-400">
                  <FileText className="size-12 mx-auto" />
                  <p className="text-sm font-semibold">Preview not available for this file type</p>
                </div>
              )}

              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocIndex((prev) => (prev + 1) % documents.length)
                    setZoomLevel(1)
                    setRotation(0)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Next document"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Municipal Footer ── */}
      <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800 py-6 mt-8 bg-white/50 dark:bg-zinc-900/50 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">
          Municipality of Carmen · Province of Cebu
        </p>
        <p className="text-[11px]">
          Municipal Social Welfare and Development Office · Data Privacy Act of 2012 Compliance
        </p>
      </footer>
    </div>
  )
}

function InfoItem({ label, value, mono = false, wide = false }) {
  return (
    <div
      className={`p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 ${
        wide ? "col-span-full" : ""
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  )
}

export default TrackApplicationPage
