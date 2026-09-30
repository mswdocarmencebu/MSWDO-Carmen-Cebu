import React, { useState } from "react"
import {
  X,
  HeartHandshake,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"

export function ClaimDetailModal({
  claim,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  canApprove: propCanApprove,
  canDelete: propCanDelete,
}) {
  const staffPerms = useStaffPermissions()
  const canApprove = propCanApprove !== undefined ? propCanApprove : staffPerms.canApprove
  const canDelete = propCanDelete !== undefined ? propCanDelete : staffPerms.canDelete
  const [showImagePreview, setShowImagePreview] = useState(false)

  if (!isOpen || !claim) return null

  const getStatusBadge = (status) => {
    switch (status) {
      case "Processed":
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "Rejected":
        return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
      case "Cancelled":
        return "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
      default:
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[5px] bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground font-heading">
                  Claim Voucher Details
                </h2>
                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${getStatusBadge(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {claim.claimNumber || claim.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onDelete && canDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onDelete(claim)
                }}
                className="p-1.5 rounded-[5px] text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Delete Claim Record"
              >
                <Trash2 className="size-4 text-red-500" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* Summary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                <User className="size-3 text-blue-500" />
                Beneficiary Member
              </p>
              <p className="font-bold text-foreground text-sm">{claim.memberName}</p>
              <p className="font-mono text-muted-foreground text-[11px] mt-0.5">{claim.memberId}</p>
            </div>

            <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                <span className=" text-emerald-500 font-bold">₱</span>
                Benefit Grant & Amount
              </p>
              <p className="font-bold text-foreground text-sm">{claim.benefit}</p>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{claim.amount}</p>
            </div>
          </div>

          {/* Release & Voucher Info */}
          <div className="p-3.5 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Disbursement Metadata
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Release Method</span>
                <span className="font-semibold text-foreground">{claim.releaseMethod || "Cash"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Release / Recorded Date</span>
                <span className="font-semibold text-foreground font-mono">{claim.date || claim.releaseDate || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Reference Voucher</span>
                <span className="font-semibold text-foreground font-mono">{claim.referenceNo || "N/A"}</span>
              </div>
            </div>

            {claim.remarks && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] text-muted-foreground block">Staff Remarks / Evaluation Notes:</span>
                <p className="text-xs text-foreground mt-0.5 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-[4px] border border-zinc-200/50 dark:border-zinc-700/50">
                  {claim.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Doctor's Prescription Proof (Medical Assistance) */}
          {claim.prescriptionUrl ? (
            <div className="p-3.5 rounded-[5px] border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-[4px] bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                    <FileText className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Doctor's Prescription Proof
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full">
                        Attached
                      </span>
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Medical evaluation document uploaded by the applicant
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1 px-2.5 rounded-[4px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:text-blue-600 cursor-pointer"
                    onClick={() => setShowImagePreview(true)}
                  >
                    <Eye className="size-3" />
                    Enlarge Proof
                  </Button>
                  <a
                    href={claim.prescriptionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                  >
                    <ExternalLink className="size-3" />
                    Full Screen
                  </a>
                </div>
              </div>

              {/* Thumbnail Container */}
              <div
                onClick={() => setShowImagePreview(true)}
                className="relative group rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden cursor-pointer max-h-56 flex items-center justify-center p-2 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                title="Click to zoom in"
              >
                <img
                  src={claim.prescriptionUrl}
                  alt="Doctor's Prescription"
                  className="max-h-52 w-auto object-contain rounded-[4px] transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                  <Eye className="size-4" />
                  Click to inspect prescription
                </div>
              </div>
            </div>
          ) : (
            (claim.benefit?.toLowerCase().includes("medical") ||
              claim.benefit?.toLowerCase().includes("health") ||
              claim.remarks?.toLowerCase().includes("medical")) && (
              <div className="p-3 rounded-[5px] border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <FileText className="size-4 text-amber-600 shrink-0" />
                <span>No doctor's prescription proof was attached to this claim.</span>
              </div>
            )
          )}

          {/* Status Quick Action Buttons */}
          {canApprove && (
            <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 space-y-2">
              <span className="text-[11px] font-bold text-foreground block">Update Claim Status:</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs rounded-[5px] cursor-pointer ${claim.status === "Processed"
                    ? "bg-blue-600 text-white border-blue-600 font-bold"
                    : "text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    }`}
                  onClick={() => {
                    onUpdateStatus(claim.id, "Processed")
                    onClose()
                  }}
                >
                  <CheckCircle2 className="size-3.5 " />
                  Mark Processed
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs rounded-[5px] cursor-pointer ${claim.status === "Pending"
                    ? "bg-amber-600 text-white border-amber-600 font-bold"
                    : "text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    }`}
                  onClick={() => {
                    onUpdateStatus(claim.id, "Pending")
                    onClose()
                  }}
                >
                  <RotateCcw className="size-3.5 " />
                  Mark Pending
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs rounded-[5px] cursor-pointer ${claim.status === "Rejected"
                    ? "bg-red-600 text-white border-red-600 font-bold"
                    : "text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                    }`}
                  onClick={() => {
                    onUpdateStatus(claim.id, "Rejected")
                    onClose()
                  }}
                >
                  <XCircle className="size-3.5 " />
                  Reject
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs rounded-[5px] cursor-pointer ${claim.status === "Cancelled"
                    ? "bg-zinc-700 text-white border-zinc-700 font-bold"
                    : "text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  onClick={() => {
                    onUpdateStatus(claim.id, "Cancelled")
                    onClose()
                  }}
                >
                  Cancel Claim
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end bg-zinc-50/50 dark:bg-zinc-800/30">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-[5px] text-xs cursor-pointer"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Full-Screen Doctor Prescription Lightbox */}
      {showImagePreview && claim.prescriptionUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[6px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-foreground">
                  Doctor's Prescription — {claim.memberName} ({claim.claimNumber || claim.id})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={claim.prescriptionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="size-3.5" />
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setShowImagePreview(false)}
                  className="p-1 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Body with full image view */}
            <div className="p-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 overflow-auto max-h-[calc(90vh-65px)]">
              <img
                src={claim.prescriptionUrl}
                alt="Doctor's prescription full resolution"
                className="max-w-full max-h-[75vh] object-contain rounded shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ClaimDetailModal
