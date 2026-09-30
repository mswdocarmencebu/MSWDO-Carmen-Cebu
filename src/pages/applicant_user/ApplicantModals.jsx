import React, { useState, useMemo, useEffect } from "react"
import { isSectorMatch } from "@/services/applicationService"
import {
  X,
  ExternalLink,
  Download,
  Upload,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  HeartHandshake,
  DollarSign,
  Tag,
  Clock,
  Sparkles,
  Camera,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// =============================================================================
// 1. DOCUMENT PREVIEW MODAL
// =============================================================================
export function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null

  const isImage =
    doc.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
    doc.url?.includes("image") ||
    doc.fileType?.includes("image")

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl max-w-3xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">{doc.name || "Submitted Requirement"}</h4>
            <p className="text-[11px] text-muted-foreground font-mono">{doc.fileName || "document_file.pdf"}</p>
          </div>
          <div className="flex items-center gap-2">
            {doc.url && (
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
                title="Open in new window"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center min-h-[340px]">
          {isImage ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="max-h-[65vh] object-contain rounded-[4px] shadow-xs"
            />
          ) : (
            <iframe
              src={doc.url}
              title={doc.name}
              className="w-full h-[65vh] rounded-[4px] border border-zinc-200 dark:border-zinc-800 bg-white"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Verification:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {doc.status || "Verified"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {doc.url && (
              <a
                href={doc.url}
                download={doc.fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[4px] border border-zinc-300 dark:border-zinc-700 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium"
              >
                <Download className="size-3.5" />
                Download
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-[4px] text-xs cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// 2. UPLOAD NEW / REPLACEMENT DOCUMENT MODAL
// =============================================================================
export function UploadDocumentModal({ isOpen, onClose, onUploadSuccess, userEmail, intakeRef }) {
  const [category, setCategory] = useState("Identification & Civil Status")
  const [docName, setDocName] = useState("")
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (!isOpen) return null

  const categories = [
    {
      id: "Identification & Civil Status",
      examples: "Valid Government ID, PSA Birth Certificate, Voter Stub",
    },
    {
      id: "Indigency & Socio-Economic",
      examples: "Barangay Certificate of Indigency, Certificate of Low Income",
    },
    {
      id: "Medical & Health Records",
      examples: "Medical Certificate, PWD Assessment, Doctor's Prescription",
    },
    {
      id: "Sector-Specific Proof",
      examples: "Enrollment Certificate / COR (Youth), OSCA Booklet, Solo Parent ID",
    },
    {
      id: "General & Additional Submissions",
      examples: "Incident Affidavit, Case Study Attachment, Correction Proof",
    },
  ]

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg("File size must not exceed 10MB.")
        return
      }
      setFile(selected)
      setErrorMsg("")
      if (!docName) {
        setDocName(selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setErrorMsg("")

    try {
      await onUploadSuccess({
        file,
        category,
        title: docName.trim() || file.name,
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-foreground">Upload Document Requirement</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500 font-medium"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.examples})
                </option>
              ))}
            </select>
          </div>

          {/* Document Name */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Document Title / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Updated Certificate of Indigency"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500"
            />
          </div>

          {/* File Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Select File (JPG, PNG, or PDF)</label>
            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-[5px] p-4 text-center hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 transition-colors">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="applicant-file-input"
              />
              <label
                htmlFor="applicant-file-input"
                className="cursor-pointer space-y-1 block"
              >
                <Upload className="size-6 text-blue-600 dark:text-blue-400 mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  {file ? file.name : "Click to browse or drag file here"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Supported formats: PDF, JPG, PNG up to 10MB
                </p>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Notes for Caseworker (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Replacement for blurry ID uploaded earlier..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-[4px] text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={isUploading || !file}
              className="h-8 rounded-[4px] text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              {isUploading ? "Uploading..." : "Save & Submit Document"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// 3. APPLY / CLAIM WELFARE BENEFIT MODAL
// =============================================================================
export function ApplyBenefitModal({
  isOpen,
  onClose,
  initialProgram = null,
  programs = [],
  applicantName = "",
  clientId = "",
  sectorLabel = "",
  barangay = "",
  onSubmitClaim,
}) {
  // Restrict programs strictly to applicant's approved sector (e.g. Youth, PWD, Senior, Women)
  // Strict: Never fallback to all programs or mock data when no dynamic programs exist
  const eligiblePrograms = useMemo(() => {
    if (!Array.isArray(programs)) return []
    if (!sectorLabel) return programs
    return programs.filter((p) => isSectorMatch(p.sector, sectorLabel))
  }, [programs, sectorLabel])

  const [selectedProgCode, setSelectedProgCode] = useState(
    initialProgram?.code || eligiblePrograms[0]?.code || ""
  )
  const [amount, setAmount] = useState(
    initialProgram?.amount || eligiblePrograms[0]?.amount || ""
  )
  const [purpose, setPurpose] = useState("Medical & Health Subsidy")
  const [remarks, setRemarks] = useState("")
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const activeProg =
    eligiblePrograms.find((p) => p.code === selectedProgCode) || eligiblePrograms[0]

  const isMedical =
    purpose === "Medical & Health Subsidy" ||
    Boolean(activeProg?.name?.toLowerCase().includes("medical")) ||
    Boolean(activeProg?.name?.toLowerCase().includes("health"))

  // Reset prescription file when modal opens
  useEffect(() => {
    if (!isOpen) {
      setPrescriptionFile(null)
    }
  }, [isOpen])

  // Keep selected program aligned when modal opens or initialProgram/eligiblePrograms change
  useEffect(() => {
    if (!isOpen) return
    const defaultProg =
      (initialProgram && eligiblePrograms.find((p) => p.code === initialProgram.code)) ||
      eligiblePrograms[0]

    if (defaultProg) {
      setSelectedProgCode(defaultProg.code)
      setAmount(defaultProg.amount || "")
    } else {
      setSelectedProgCode("")
      setAmount("")
    }
  }, [isOpen, initialProgram, eligiblePrograms])

  if (!isOpen) return null

  const purposes = [
    "Medical & Health Subsidy",
    "Educational Tuition & School Supplies",
    "Assistive Device & Mobility Support",
    "Living Allowance / Food Crisis",
    "Burial Assistance",
    "Disaster / Calamity Relief",
    "Livelihood Assistance",
  ]

  const handleProgramChange = (code) => {
    setSelectedProgCode(code)
    const prog = eligiblePrograms.find((p) => p.code === code)
    if (prog?.amount) {
      setAmount(prog.amount)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg("")

    // Strictly validate prescription proof for medical assistance
    if (isMedical && !prescriptionFile) {
      setErrorMsg("Proof required: Please upload a photo of the doctor's prescription.")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await onSubmitClaim({
        benefit: activeProg?.name || "Municipal Welfare Subsidy",
        amount: amount || activeProg?.amount || "₱1,000.00",
        purpose,
        remarks: remarks.trim(),
        programCode: selectedProgCode,
        prescriptionFile,
      })

      if (res?.success) {
        onClose()
      } else {
        setErrorMsg(res?.error || "Failed to submit assistance request.")
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-foreground">Apply for Municipal Welfare Assistance</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pre-filled Beneficiary Identity Card */}
          <div className="p-3 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-800 dark:text-blue-300">
                Beneficiary: {applicantName}
              </span>
              <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {clientId}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Sector: <strong className="text-foreground">{sectorLabel}</strong></span>
              <span>•</span>
              <span>Barangay: <strong className="text-foreground">{barangay}</strong></span>
            </div>
          </div>

          {/* Welfare Program Selection (Filtered strictly to applicant's sector) */}
          {eligiblePrograms.length === 0 ? (
            <div className="p-4 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 text-center space-y-1 my-1">
              <p className="text-xs font-semibold text-foreground">
                No Active Welfare Programs Found
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                There are currently no active welfare assistance programs open for the {sectorLabel || "welfare"} sector.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Welfare Program / Grant</label>
              <select
                value={selectedProgCode}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500 font-medium"
              >
                {eligiblePrograms.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.sector}) — {p.amount}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assistance Purpose */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Assistance Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500"
              >
                {purposes.map((pur) => (
                  <option key={pur} value={pur}>
                    {pur}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Requested Subsidy Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground font-mono outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Proof: Doctor's Prescription (Required for Medical Assistance) */}
          {isMedical && (
            <div className="space-y-1.5 p-3 rounded-[5px] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <FileText className="size-3.5 text-amber-600 dark:text-amber-400" />
                  Proof: Doctor's Prescription <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Please attach a clear photo or scanned copy of the doctor's prescription for verification.
              </p>

              <div className="border border-dashed border-amber-300 dark:border-amber-700 rounded-[5px] p-3 text-center bg-white dark:bg-zinc-900/60 transition-colors">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  id="prescription-file-input"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) {
                        setErrorMsg("Prescription file size must not exceed 10MB.")
                        return
                      }
                      setPrescriptionFile(f)
                      setErrorMsg("")
                    }
                  }}
                />
                <label
                  htmlFor="prescription-file-input"
                  className="cursor-pointer space-y-1 block"
                >
                  {prescriptionFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span className="truncate max-w-[240px]">{prescriptionFile.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({Math.round(prescriptionFile.size / 1024)} KB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <Camera className="size-5 text-amber-600 dark:text-amber-400 mx-auto" />
                      <p className="text-xs font-medium text-foreground">
                        Click to upload doctor's prescription photo
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        JPG, PNG, or PDF up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Justification / Remarks */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Statement of Need / Justification <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="State the circumstances necessitating this welfare assistance for MSWDO evaluation..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Directly processed by Carmen MSWDO staff.
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-8 rounded-[4px] text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={isSubmitting || !remarks.trim() || eligiblePrograms.length === 0}
                className="h-8 rounded-[4px] text-xs font-semibold gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// 4. CASE DETAILS MODAL
// =============================================================================
export function CaseDetailsModal({ caseItem, onClose }) {
  if (!caseItem) return null

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-foreground">Welfare Case Details</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">
                {caseItem.caseId}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${caseItem.badgeClass}`}>
                {caseItem.status}
              </span>
            </div>
            <h3 className="font-bold text-foreground text-sm">{caseItem.program}</h3>
            <p className="text-[11px] text-muted-foreground">Type: {caseItem.type}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-muted-foreground block font-medium">Date Filed</span>
              <span className="font-semibold text-foreground mt-0.5 block">{caseItem.dateApplied}</span>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-muted-foreground block font-medium">Assistance / Amount</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{caseItem.amountRequested}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-foreground block">Casework Evaluation / Notes</span>
            <p className="p-3 rounded-[4px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-muted-foreground italic leading-relaxed">
              "{caseItem.notes}"
            </p>
          </div>

          <div className="p-3 rounded-[4px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
            <span className="font-bold block">Assigned Casework Officer:</span>
            <p>{caseItem.officer}</p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-[4px] text-xs cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
