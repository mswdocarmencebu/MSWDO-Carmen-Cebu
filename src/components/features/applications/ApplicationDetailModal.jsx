import React, { useState, useMemo, useEffect } from "react"
import {
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  GraduationCap,
  CalendarCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  UserRound,
  Copy,
  HeartHandshake,
  Accessibility,
  Users,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Image as ImageIcon,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/common"
import {
  approveApplication,
  updateApplicationDocStatus,
  updateApplicationDocuments,
  DOC_STATUSES_KEY,
} from "@/services/applicationService"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  canApprove: propCanApprove,
  canEdit: propCanEdit,
  canDelete: propCanDelete,
}) {
  const staffPerms = useStaffPermissions()
  const canApprove = propCanApprove !== undefined ? propCanApprove : staffPerms.canApprove
  const canEdit = propCanEdit !== undefined ? propCanEdit : staffPerms.canEdit
  const canDelete = propCanDelete !== undefined ? propCanDelete : staffPerms.canDelete
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false)
  const [isScheduling, setIsScheduling]                   = useState(false)
  const [appointmentDate, setAppointmentDate]             = useState("")
  const [scheduleSuccess, setScheduleSuccess]             = useState(false)
  const [isApproving, setIsApproving]                     = useState(false)
  const [credentialsNotice, setCredentialsNotice]         = useState(null)
  const [copiedKey, setCopiedKey]                         = useState(null)

  // In-app Confirmation Modals & Error Notification
  const [isReturnModalOpen, setIsReturnModalOpen]         = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen]         = useState(false)
  const [actionError, setActionError]                     = useState(null)
  const [correctionRemarks, setCorrectionRemarks]         = useState("")
  const [rejectionRemarks, setRejectionRemarks]           = useState("")

  // Advanced Image Viewer state
  const [activeDocIndex, setActiveDocIndex] = useState(null)
  const [zoomLevel, setZoomLevel]           = useState(1)
  const [rotation, setRotation]             = useState(0)

  // Dynamic documents from application record or fallback default list
  const docs = useMemo(() => {
    if (application?.documents && Array.isArray(application.documents) && application.documents.length > 0) {
      return application.documents.map((d, i) => ({
        id: d.id || `doc-${i + 1}`,
        name: d.name || d.title || `Document ${i + 1}`,
        fileName: d.fileName || "",
        fileType: d.fileType || "",
        fileSize: d.fileSize || 0,
        url: d.url || d.previewUrl || "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg",
        status: d.status || "Pending",
      }))
    }
    return [
      { id: "doc1", name: "Request form",                   fileName: "request_form.pdf",           url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/d4ybfmftmfldmldvj6a5.jpg", status: "Pending" },
      { id: "doc2", name: "Barangay certificate",           fileName: "brgy_clearance.jpg",         url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081711/mswdo/applications/vu4kscwlfyrooch545xt.jpg", status: "Pending" },
      { id: "doc3", name: "PSA / NSO birth certificate",    fileName: "psa_birth_certificate.jpg",  url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081716/mswdo/applications/sbsbky1vcrclr6khvqgu.jpg", status: "Pending" },
      { id: "doc4", name: "Valid government ID",            fileName: "philippine_national_id.jpg", url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/afa6wcfzr7ysvbd2vymk.jpg", status: "Pending" },
      { id: "doc5", name: "Voter verification / certificate", fileName: "voters_certificate.jpg",   url: "https://res.cloudinary.com/dyobffu4z/image/upload/v1790081712/mswdo/applications/q3ggiwbjjseuihyiatne.jpg", status: "Pending" },
    ]
  }, [application])

  const [docStatuses, setDocStatuses] = useState({})

  useEffect(() => {
    let storedStatuses = {}
    try {
      storedStatuses = JSON.parse(localStorage.getItem(DOC_STATUSES_KEY) || "{}")
    } catch {}

    const isAppApproved = application?.status?.toLowerCase() === "approved"
    const ref = application?.reference || application?.id || ""

    const initial = {}
    docs.forEach((d) => {
      const docId = d.id
      const docKey = d.key
      const stored =
        storedStatuses[`${ref}_${docId}`] ||
        storedStatuses[`${ref}_${docKey}`] ||
        storedStatuses[`${application?.id}_${docId}`] ||
        storedStatuses[`${application?.id}_${docKey}`] ||
        storedStatuses[docId] ||
        storedStatuses[docKey]

      let st = stored || d.status || "Pending"
      if (isAppApproved && st !== "Needs correction" && st !== "Rejected") {
        st = "Verified"
      }
      initial[docId] = st
    })
    setDocStatuses(initial)
  }, [docs, application])

  if (!isOpen || !application) return null

  const verifiedCount        = Object.values(docStatuses).filter((s) => s === "Verified").length
  const needsCorrectionCount  = Object.values(docStatuses).filter((s) => s === "Needs correction").length
  const allVerified           = docs.length > 0 && verifiedCount === docs.length

  const handleDocStatus = (id, status) => {
    const nextStatus = docStatuses[id] === status ? "Pending" : status
    setDocStatuses((prev) => ({ ...prev, [id]: nextStatus }))
    const targetRefOrId = application?.reference || application?.id
    if (targetRefOrId) {
      updateApplicationDocStatus(targetRefOrId, id, nextStatus)
    }
  }

  const handleScheduleSubmit = (e) => {
    e.preventDefault()
    if (appointmentDate) { setScheduleSuccess(true); setIsScheduling(false) }
  }

  const handleApprove = async () => {
    if (!allVerified) {
      setActionError("Please mark and verify all required documents as 'Verified' before approving.")
      return
    }
    if (application.hasDuplicate && !duplicateAcknowledged) {
      setActionError("Please acknowledge the potential duplicate identity match before approving.")
      return
    }

    setActionError(null)
    setIsApproving(true)
    try {
      const verifiedDocs = docs.map((d) => ({ ...d, status: "Verified" }))
      const targetRefOrId = application?.reference || application?.id
      if (targetRefOrId) {
        await updateApplicationDocuments(targetRefOrId, verifiedDocs)
      }
      const creds = await approveApplication({ ...application, documents: verifiedDocs })
      setCredentialsNotice(creds)
      onUpdateStatus?.(application.id, "Approved")
    } catch (err) {
      console.error("Approval error:", err)
      setActionError("An error occurred during approval. Please try again.")
    } finally {
      setIsApproving(false)
    }
  }

  const isApproved = application?.status?.toLowerCase() === "approved"
  const isRejected = application?.status?.toLowerCase() === "rejected"
  const isNeedsCorrection = application?.status?.toLowerCase() === "needs correction"

  const handleOpenReturnModal = () => {
    setActionError(null)
    setCorrectionRemarks("")
    setIsReturnModalOpen(true)
  }

  const handleConfirmReturnForCorrection = async () => {
    // If no document was explicitly flagged, mark any unverified documents as Needs correction
    let nextStatuses = { ...docStatuses }
    const flagged = Object.values(nextStatuses).filter((s) => s === "Needs correction").length
    if (flagged === 0) {
      docs.forEach((d) => {
        if (nextStatuses[d.id] !== "Verified") {
          nextStatuses[d.id] = "Needs correction"
        }
      })
      setDocStatuses(nextStatuses)
    }

    const updatedDocs = docs.map((d) => ({
      ...d,
      status: nextStatuses[d.id] || "Pending",
    }))

    const targetRefOrId = application?.reference || application?.id
    if (targetRefOrId) {
      await updateApplicationDocuments(targetRefOrId, updatedDocs)
    }

    onUpdateStatus?.(application.id, "Needs correction")
    setIsReturnModalOpen(false)
    onClose()
  }

  const handleOpenRejectModal = () => {
    setActionError(null)
    setRejectionRemarks("")
    setIsRejectModalOpen(true)
  }

  const handleConfirmReject = () => {
    onUpdateStatus?.(application.id, "Rejected")
    setIsRejectModalOpen(false)
    onClose()
  }

  const copyText = (txt, key) => {
    navigator.clipboard.writeText(txt)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Calculate applicant age helper
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

  const applicantAge = calculateAge(application.birthDate)

  // Helper: Detect whether document is an image
  const isImageDoc = (doc) => {
    if (!doc?.url) return false
    const u = doc.url.toLowerCase()
    if (u.startsWith("data:image/")) return true
    if (u.includes(".jpg") || u.includes(".jpeg") || u.includes(".png") || u.includes(".webp") || u.includes("/image/upload/")) return true
    if (doc.fileType?.startsWith("image/")) return true
    return false
  }

  // Open viewer modal at specific index
  const openImageViewer = (index) => {
    setActiveDocIndex(index)
    setZoomLevel(1)
    setRotation(0)
  }

  const closeImageViewer = () => {
    setActiveDocIndex(null)
    setZoomLevel(1)
    setRotation(0)
  }

  const currentPreviewDoc = activeDocIndex !== null ? docs[activeDocIndex] : null

  /* ── Status badge color map ── */
  const statusColor = {
    Pending:            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    "Needs correction": "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    Approved:           "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Rejected:           "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    Resubmitted:        "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  }

  const badgeCls = statusColor[application.status] ?? statusColor.Pending

  /* ── Section heading helper ── */
  const SectionTitle = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 mb-2.5">
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</h3>
    </div>
  )

  /* ── Info cell helper ── */
  const InfoCell = ({ label, value, mono = false, wide = false, icon: Icon }) => (
    <div className={`p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 ${wide ? "col-span-full" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className={`text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  )

  // Sector icon helper
  const getSectorIcon = () => {
    const cat = (application.category || "").toLowerCase()
    const sec = (application.sector || "").toLowerCase()
    if (cat === "senior" || sec.includes("senior")) return HeartHandshake
    if (cat === "pwd" || sec.includes("pwd") || sec.includes("disability")) return Accessibility
    if (cat === "women" || sec.includes("women")) return Users
    return GraduationCap
  }

  const SectorIcon = getSectorIcon()

  // Dynamic Sector Details Renderer
  const renderSectorDetails = () => {
    const cat = (application.category || "").toLowerCase()
    const sec = (application.sector || "").toLowerCase()
    const d = application.categoryDetails || {}

    if (cat === "senior" || sec.includes("senior")) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoCell label="Citizenship" value={d.citizenship || "Filipino"} />
          <InfoCell label="Religion" value={d.religion || "Roman Catholic"} />
          <InfoCell label="Pension Status" value={d.pension || "None"} />
          <InfoCell label="Living Arrangement" value={d.livingArrangement || "Living with Relatives"} />
          <InfoCell label="Occupation" value={d.occupation || "None"} />
          <InfoCell label="Annual Income" value={d.annualIncome || "Below ₱50,000"} />
          <InfoCell label="With Disability" value={d.withDisability || "No"} />
          <InfoCell label="Medical Condition" value={d.hasIllness || "None reported"} />
          {d.familyRows && Array.isArray(d.familyRows) && d.familyRows.length > 0 && d.familyRows[0].name && (
            <div className="col-span-full p-2.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Family Composition</p>
              <div className="text-[11px] text-foreground space-y-1">
                {d.familyRows.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center py-0.5 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-0">
                    <span className="font-medium">{f.name} ({f.relation})</span>
                    <span className="text-muted-foreground text-[10px]">{f.age} yrs · {f.occupation || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (cat === "pwd" || sec.includes("disability") || sec.includes("pwd")) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoCell label="Application Type" value={d.applicationType || "New Applicant"} />
          <InfoCell label="Disability Type" value={d.disabilityType || "Orthopedic / Physical Disability"} />
          <InfoCell label="Disability Cause" value={d.disabilityCause || "Congenital / Inborn"} />
          <InfoCell label="PWD ID Number" value={d.pwdNumber || "To be issued upon approval"} mono />
          <InfoCell label="Educational Attainment" value={d.educationalAttainment || application.education || "College Graduate"} />
          <InfoCell label="Employment Status" value={d.employmentStatus || "Employed"} />
          <InfoCell label="Date Applied" value={d.dateApplied || application.submitted || "2026-09-22"} mono />
        </div>
      )
    }

    if (cat === "women" || sec.includes("women")) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoCell label="Solo Parent" value={d.isSoloParent || "Yes"} />
          <InfoCell label="Number of Children" value={d.numberOfChildren || "2"} />
          <InfoCell label="Occupation" value={d.occupation || "Self-Employed / Vendor"} />
          <InfoCell label="Place of Birth" value={d.placeOfBirth || "Carmen, Cebu"} />
          <InfoCell label="Educational Attainment" value={d.educationalAttainment || "High School Graduate"} />
          <InfoCell label="Registration Date" value={d.dateOfRegistration || application.submitted || "2026-09-22"} mono />
          <InfoCell label="Spouse Name" value={d.spouseName || "N/A"} />
          <InfoCell label="Parent/Guardian" value={d.fatherName || d.motherName || "N/A"} />
        </div>
      )
    }

    // Default: Youth
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <InfoCell label="Educational attainment" value={d.educationalAttainment || application.education || "College Undergraduate"} />
        <InfoCell label="Out of school status" value={d.outOfSchool || (application.outOfSchool === "yes" ? "Yes" : "No")} />
        {d.schoolName && <InfoCell label="School / University" value={d.schoolName} wide />}
        {d.organization && <InfoCell label="Youth Organization / SK" value={d.organization} />}
        {d.targetAssistance && <InfoCell label="Target Assistance Program" value={d.targetAssistance} />}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div
          className="relative w-full max-w-2xl my-4 rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* ── Header ── */}
          <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-t-[5px] shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <UserAvatar
                  user={application}
                  avatarUrl={application.avatarUrl}
                  initials={application.initials}
                  name={application.name}
                  email={application.email}
                  size="size-10"
                  className="rounded-[5px] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-foreground font-heading">Application details</h2>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${badgeCls}`}>
                      {application.status || "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Ref: {application.reference || "MSWDO-2026-NR7FKNEAC2"}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(application.reference, "ref")}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Copy reference number"
                    >
                      {copiedKey === "ref" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-muted-foreground">Sector:</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                      <SectorIcon className="size-3" />
                      {application.sector || "Youth"}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      Submitted: {application.submitted || "Sep 22, 2026"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(application)}
                    className="p-1.5 rounded-[5px] text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900/60 border border-transparent transition-colors cursor-pointer"
                    title="Delete application record"
                    aria-label="Delete application"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="size-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">

            {/* 1. Personal Information */}
            <section>
              <SectionTitle label="Personal information" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <InfoCell label="Full name"     value={application.name        || "Neil Delante"} />
                <InfoCell
                  label="Date of birth"
                  value={application.birthDate ? `${application.birthDate}${applicantAge !== null ? ` (${applicantAge} yrs old)` : ""}` : "—"}
                  mono
                />
                <InfoCell label="Gender"        value={application.gender      || "Male"} />
                <InfoCell label="Civil status"  value={application.civilStatus || "Single"} />
                <InfoCell label="Address" value={application.address || "Barangay Poblacion, Carmen, Cebu"} icon={MapPin} wide />
              </div>
            </section>

            {/* 2. Contact Information */}
            <section>
              <SectionTitle label="Contact information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InfoCell label="Contact number" value={application.contact || "09086602701"} icon={Phone} mono />
                <InfoCell label="Email address"  value={application.email   || "nemo.delante@gmail.com"} icon={Mail} />
              </div>
            </section>

            {/* 3. Duplicate identity warning (if flag present) */}
            {application.hasDuplicate && (
              <section className="rounded-[5px] border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Possible duplicate identity</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      The same normalized first name, last name, and birthdate appear in other records.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {[
                    { name: application.name || "Neil Delante", ref: "Application · MSWDO-2026-CT8RLSSF3M", badge: "Approved", badgeCls: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" },
                    { name: application.name || "Neil Delante", ref: "Member · MSWDO-87656",                badge: "Active",   badgeCls: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-[5px] bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60">
                      <div>
                        <p className="text-xs font-bold text-foreground">{d.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{d.ref}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${d.badgeCls}`}>{d.badge}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={duplicateAcknowledged}
                    onChange={(e) => setDuplicateAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded-[3px] cursor-pointer"
                  />
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                    I reviewed these possible matches and confirmed this application can proceed.
                  </span>
                </label>
              </section>
            )}

            {/* 4. Dynamic Sector details */}
            <section>
              <SectionTitle icon={SectorIcon} label={`Sector details · ${application.sector || "Citizen"}`} />
              {renderSectorDetails()}
            </section>

            {/* 5. Interview / Assessment */}
            <section className="p-3.5 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CalendarCheck className="size-3.5 text-blue-600" />
                    Interview or assessment
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {scheduleSuccess ? `Scheduled: ${appointmentDate}` : "No appointment has been scheduled."}
                  </p>
                </div>
                {(canEdit || canApprove) && (
                  !isScheduling ? (
                    <Button size="sm" variant="outline" onClick={() => setIsScheduling(true)}
                      className="h-7 px-3 rounded-[5px] text-xs cursor-pointer bg-white dark:bg-zinc-800">
                      Schedule
                    </Button>
                  ) : (
                    <form onSubmit={handleScheduleSubmit} className="flex items-center gap-2 flex-wrap">
                      <input
                        type="datetime-local"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="px-2 py-1 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-foreground outline-none focus:border-blue-500"
                        required
                      />
                      <Button size="sm" type="submit" className="h-7 text-xs rounded-[5px]">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsScheduling(false)} className="h-7 text-xs rounded-[5px]">Cancel</Button>
                    </form>
                  )
                )}
              </div>
            </section>

            {/* 6. Dynamic Documents with Live Visual Image Thumbnails */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <SectionTitle label="Uploaded documentary requirements" />
                <span className={`text-[11px] font-semibold ${allVerified ? "text-emerald-600" : "text-blue-600 dark:text-blue-400"}`}>
                  {verifiedCount} / {docs.length} verified
                </span>
              </div>

              <div className="space-y-2">
                {docs.map((doc, idx) => {
                  const st = docStatuses[doc.id] || "Pending"
                  const hasImage = isImageDoc(doc)

                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      {/* Left: Thumbnail & Doc Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Interactive Visual Thumbnail */}
                        {hasImage ? (
                          <button
                            type="button"
                            onClick={() => openImageViewer(idx)}
                            className="size-12 rounded-[5px] overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 relative group shrink-0 cursor-pointer shadow-2xs"
                            title="Click to view image"
                          >
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="size-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="size-4 text-white drop-shadow" />
                            </div>
                          </button>
                        ) : (
                          <div
                            className={`size-12 rounded-[5px] flex items-center justify-center shrink-0 border ${
                              st === "Verified"
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                                : st === "Needs correction"
                                ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                                : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                            }`}
                          >
                            <FileText className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                            <span
                              className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                                st === "Verified"
                                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                  : st === "Needs correction"
                                  ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
                                  : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                              }`}
                            >
                              {st}
                            </span>
                          </div>

                          {doc.fileName && (
                            <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                              {doc.fileName}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              openImageViewer(idx)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 cursor-pointer"
                          >
                            <ImageIcon className="size-3" />
                            View image preview <ExternalLink className="size-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Verify & Flag controls (requires edit or approve permission) */}
                      {(canEdit || canApprove) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {st === "Verified" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold bg-emerald-600 text-white border border-emerald-600 select-none">
                              <CheckCircle2 className="size-3" />
                              Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDocStatus(doc.id, "Verified")}
                              className="px-2.5 py-1 rounded-[5px] text-[11px] font-semibold border transition-colors cursor-pointer bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 hover:border-emerald-300"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDocStatus(doc.id, "Needs correction")}
                            className={`px-2.5 py-1 rounded-[5px] text-[11px] font-semibold border transition-colors cursor-pointer ${
                              st === "Needs correction"
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 hover:border-red-300"
                            }`}
                          >
                            Flag
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-3 p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">Verification progress</span>
                  <span className={allVerified ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}>
                    {verifiedCount} of {docs.length} documents verified
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${allVerified ? "bg-emerald-500" : "bg-blue-600"}`}
                    style={{ width: `${docs.length ? (verifiedCount / docs.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 rounded-b-[5px] p-4 sm:p-5 space-y-3">
            {/* Checklist warnings (only shown when pending review) */}
            {!isApproved && !isRejected && (!allVerified || (application.hasDuplicate && !duplicateAcknowledged)) && (
              <div className="flex flex-col gap-1">
                {!allVerified && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Verify all required documents before approval.
                  </div>
                )}
                {application.hasDuplicate && !duplicateAcknowledged && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Acknowledge the possible duplicate identity before approval.
                  </div>
                )}
              </div>
            )}

            {/* Action Error Notification */}
            {actionError && (
              <div className="p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span className="truncate">{actionError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="p-1 rounded-[4px] hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isApproved ? (
                /* Already Approved: Hide Approve and Reject, allow Return for correction */
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Application Approved &amp; Enrolled in Members Registry</span>
                  </div>
                  {(canEdit || canApprove) && (
                    <div className="flex-1 sm:flex-none sm:ml-auto flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenReturnModal}
                        className="h-8 rounded-[5px] text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-800 hover:bg-amber-50 cursor-pointer gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        Return for correction
                      </Button>
                    </div>
                  )}
                </>
              ) : isRejected ? (
                /* Already Rejected: Hide Approve and Reject, allow Return for correction */
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold">
                    <XCircle className="size-4 text-red-600 shrink-0" />
                    <span>Application Rejected</span>
                  </div>
                  {(canEdit || canApprove) && (
                    <div className="flex-1 sm:flex-none sm:ml-auto flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenReturnModal}
                        className="h-8 rounded-[5px] text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-800 hover:bg-amber-50 cursor-pointer gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        Return for correction
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* Pending / Resubmitted / Needs correction: Show Return for correction, Approve, and Reject */
                <>
                  {/* Return for correction */}
                  {(canEdit || canApprove) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenReturnModal}
                      className="flex-1 sm:flex-none h-8 rounded-[5px] text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-800 hover:bg-amber-50 cursor-pointer gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      Return for correction
                    </Button>
                  )}

                  {/* Approve */}
                  {canApprove && (
                    <Button
                      type="button"
                      onClick={handleApprove}
                      disabled={!allVerified || (application.hasDuplicate && !duplicateAcknowledged) || isApproving}
                      className="flex-1 sm:flex-none h-8 rounded-[5px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-1.5"
                    >
                      {isApproving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Approve &amp; Create Account
                    </Button>
                  )}

                  {/* Reject — right side */}
                  {canApprove && (
                    <div className="flex-1 sm:flex-none sm:ml-auto flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleOpenRejectModal}
                        className="h-8 rounded-[5px] text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        Reject Application
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Advanced Document Image Inspection Lightbox ── */}
      {currentPreviewDoc && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={closeImageViewer}
        >
          <div
            className="relative max-w-4xl w-full h-[90vh] bg-zinc-950 text-white rounded-[6px] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="h-13 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="size-8 rounded-[4px] bg-zinc-800 flex items-center justify-center shrink-0 text-blue-400">
                  <ImageIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentPreviewDoc.name}</p>
                  <p className="text-[10px] text-zinc-400 truncate font-mono">
                    Document {activeDocIndex + 1} of {docs.length} · {currentPreviewDoc.fileName || "photo.jpg"}
                  </p>
                </div>
              </div>

              {/* Controls: Zoom In, Zoom Out, Rotate, In-Viewer Verify & Close */}
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
                  title="Reset view"
                >
                  Reset
                </button>
                <a
                  href={currentPreviewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer ml-1"
                  title="Open original in new window"
                >
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={closeImageViewer}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-2"
                  title="Close viewer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Central Canvas View */}
            <div className="flex-1 overflow-auto relative flex items-center justify-center p-4 bg-zinc-900/60 select-none">
              {/* Previous Button */}
              {docs.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocIndex((prev) => (prev - 1 + docs.length) % docs.length)
                    setZoomLevel(1)
                    setRotation(0)
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Previous document"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}

              {/* High-res Image with dynamic zoom and rotation */}
              <div
                className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={currentPreviewDoc.url}
                  alt={currentPreviewDoc.name}
                  className="max-h-[70vh] max-w-[85vw] object-contain rounded-[4px] shadow-2xl"
                />
              </div>

              {/* Next Button */}
              {docs.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocIndex((prev) => (prev + 1) % docs.length)
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

            {/* Bottom Quick-Action Bar */}
            <div className="h-14 px-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Current Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                    docStatuses[currentPreviewDoc.id] === "Verified"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : docStatuses[currentPreviewDoc.id] === "Needs correction"
                      ? "bg-red-950 text-red-300 border-red-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {docStatuses[currentPreviewDoc.id] || "Pending"}
                </span>
              </div>

              {/* Direct Verification Controls from within Viewer */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  type="button"
                  onClick={() => handleDocStatus(currentPreviewDoc.id, "Needs correction")}
                  className={`h-8 text-xs font-semibold rounded-[4px] cursor-pointer ${
                    docStatuses[currentPreviewDoc.id] === "Needs correction"
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  Flag as Needs Correction
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => handleDocStatus(currentPreviewDoc.id, "Verified")}
                  className={`h-8 text-xs font-semibold rounded-[4px] cursor-pointer ${
                    docStatuses[currentPreviewDoc.id] === "Verified"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-400 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  <Check className="size-3.5 mr-1" />
                  Mark as Verified
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Account Created & Default Credentials Dispatched ── */}
      {credentialsNotice && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/40 shadow-2xl p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="size-11 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-heading">
                  Applicant Account Created!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  The pre-application has been approved and automatically provisioned into{" "}
                  <span className="font-semibold text-foreground">public.applicant_users</span>.
                </p>
              </div>
            </div>

            {/* Email Dispatched Notice */}
            <div className={`p-3.5 rounded-[5px] border text-xs flex items-start gap-2.5 ${
              credentialsNotice.emailDispatch?.error
                ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
            }`}>
              <Mail className={`size-4 shrink-0 mt-0.5 ${credentialsNotice.emailDispatch?.error ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
              <div className="leading-relaxed">
                {credentialsNotice.emailDispatch?.sandbox ? (
                  <>
                    An official credentials email was generated for <span className="font-mono font-bold text-foreground">{credentialsNotice.email}</span>. Delivered to your admin inbox <span className="font-mono font-bold text-foreground">{credentialsNotice.emailDispatch.deliveredTo}</span> for testing.
                  </>
                ) : credentialsNotice.emailDispatch?.simulated ? (
                  <>
                    Portal credentials generated for <span className="font-mono font-bold text-foreground">{credentialsNotice.email}</span>. Automated dispatch simulated locally.
                  </>
                ) : credentialsNotice.emailDispatch?.error ? (
                  <>
                    Credentials generated, but automated email dispatch encountered an issue. Please manually copy the credentials below and provide them to <span className="font-mono font-bold text-foreground">{credentialsNotice.email}</span>.
                  </>
                ) : (
                  <>
                    An official automated notification containing these portal credentials and onboarding instructions has been dispatched to{" "}
                    <span className="font-mono font-bold text-foreground">{credentialsNotice.email}</span>.
                  </>
                )}
              </div>
            </div>

            {/* Credentials Card */}
            <div className="p-3.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Default Portal Credentials
              </p>

              <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <div>
                  <p className="text-[10px] text-muted-foreground">Default Username / Email</p>
                  <p className="text-xs font-mono font-semibold text-foreground select-all">{credentialsNotice.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(credentialsNotice.email, "email")}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title="Copy email"
                >
                  {copiedKey === "email" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <div>
                  <p className="text-[10px] text-muted-foreground">Unique Temporary Password</p>
                  <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 select-all">{credentialsNotice.temporaryPassword}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(credentialsNotice.temporaryPassword, "pass")}
                  className="p-1.5 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title="Copy password"
                >
                  {copiedKey === "pass" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <div>
                  <p className="text-[10px] text-muted-foreground">Client Beneficiary ID</p>
                  <p className="text-xs font-mono font-semibold text-foreground">{credentialsNotice.clientId}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-[3px] border border-emerald-200 dark:border-emerald-800">
                  applicant_user
                </span>
              </div>
            </div>

            {/* Note */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The approved applicant may now log in at <span className="font-mono text-foreground font-semibold">/signin</span> using their email and this unique temporary password. Upon first login, they will be required to validate and set their permanent password before accessing their beneficiary dashboard.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const allCreds = `MSWDO Carmen Portal Credentials\nUsername: ${credentialsNotice.email}\nTemporary Password: ${credentialsNotice.temporaryPassword}\nClient ID: ${credentialsNotice.clientId}`
                  navigator.clipboard.writeText(allCreds)
                  setCopiedKey("all")
                  setTimeout(() => setCopiedKey(null), 2000)
                }}
                className="h-8 rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {copiedKey === "all" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copiedKey === "all" ? "Copied All!" : "Copy Credentials"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setCredentialsNotice(null)
                  onClose()
                }}
                className="h-8 rounded-[5px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Return for Document Correction Confirmation ── */}
      {isReturnModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-[5px] shadow-2xl p-5 sm:p-6 space-y-4 my-auto overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
                  <RotateCcw className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-heading">
                    Return for Document Correction
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {application.reference || application.id} · {application.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Context Status Alert */}
            {isApproved ? (
              <div className="p-3.5 rounded-[5px] bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  This application is currently approved.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Returning it will update its status to <strong>Needs correction</strong>, unenroll the active approved record, and notify the applicant to review and resubmit their documents.
                </p>
              </div>
            ) : isRejected ? (
              <div className="p-3.5 rounded-[5px] bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  This application is currently rejected.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Returning it will update its status to <strong>Needs correction</strong>, allowing the applicant another opportunity to provide corrected documents.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-[5px] bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  Return pre-application for applicant correction.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  The applicant will be alerted with instructions to review and re-upload the necessary documents.
                </p>
              </div>
            )}

            {/* Quick document status toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  Flagged Documents for Resubmission:
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Click to toggle "Needs correction"
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-zinc-200 dark:border-zinc-800 rounded-[5px] p-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                {docs.map((doc) => {
                  const isFlagged = docStatuses[doc.id] === "Needs correction"
                  return (
                    <div
                      key={doc.id}
                      onClick={() =>
                        handleDocStatus(
                          doc.id,
                          isFlagged ? "Pending" : "Needs correction"
                        )
                      }
                      className={`flex items-center justify-between p-2 rounded-[4px] border text-xs cursor-pointer transition-colors ${
                        isFlagged
                          ? "bg-red-50/80 dark:bg-red-950/50 border-red-300 dark:border-red-900/70 text-red-900 dark:text-red-200"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-foreground hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`size-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                            isFlagged
                              ? "bg-red-600 border-red-600 text-white"
                              : "border-zinc-300 dark:border-zinc-600"
                          }`}
                        >
                          {isFlagged && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <span className="truncate font-medium">{doc.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-[3px] shrink-0 border ${
                          isFlagged
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                            : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {isFlagged ? "Needs correction" : docStatuses[doc.id] || "Pending"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Optional Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Caseworker Instructions / Remarks (Optional):
              </label>
              <textarea
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                placeholder="e.g. Please upload a clearer copy of your Barangay Certificate with visible official seal."
                rows={2}
                className="w-full text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReturnModalOpen(false)}
                className="h-8 rounded-[5px] text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReturnForCorrection}
                className="h-8 rounded-[5px] text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Confirm &amp; Return for Correction
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Reject Application Confirmation ── */}
      {isRejectModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-[5px] shadow-2xl p-5 sm:p-6 space-y-4 my-auto overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
                  <XCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-heading">
                    Reject Application
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {application.reference || application.id} · {application.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 rounded-[5px] bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 text-xs text-red-900 dark:text-red-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-red-800 dark:text-red-200">
                <AlertCircle className="size-4 text-red-600 shrink-0" />
                Are you sure you want to reject this application?
              </p>
              <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300/90">
                This will update the application status to <strong>Rejected</strong>. The applicant will be notified that their application has not been approved.
              </p>
            </div>

            {/* Optional Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason for Rejection (Optional):
              </label>
              <textarea
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Specify rejection reason or eligibility notes..."
                rows={2}
                className="w-full text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                className="h-8 rounded-[5px] text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                className="h-8 rounded-[5px] text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer gap-1.5"
              >
                <XCircle className="size-3.5" />
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
