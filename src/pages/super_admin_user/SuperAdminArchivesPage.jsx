import React, { useState, useEffect, useMemo, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Archive,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  User,
  FileText,
  ShieldAlert,
  FolderArchive,
  Users,
  Info,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useAuth } from "@/hooks/useAuth"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import {
  getArchives,
  updateArchiveEntry,
  deleteArchiveEntry,
  restoreArchiveEntry,
  clearAllArchives,
  ARCHIVES_CHANGED_EVENT,
} from "@/services/archiveService"

const CATEGORY_OPTIONS = [
  "Senior Citizen",
  "PWD",
  "Solo Parent",
  "AICS",
  "General",
  "Other",
]

const RECORD_TYPES = [
  { value: "all", label: "All Record Types" },
  { value: "member", label: "Member Beneficiary" },
  { value: "applicant_user", label: "Applicant Account" },
  { value: "staff_user", label: "Staff Account" },
  { value: "application", label: "Application Form" },
  { value: "other", label: "Other / Custom" },
]

/* ─────────────────────────────────────────────
   Badge Helpers
───────────────────────────────────────────── */
function RecordTypeBadge({ type = "" }) {
  const t = String(type).toLowerCase()
  if (t.includes("member")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        Member
      </span>
    )
  }
  if (t.includes("staff")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
        Staff Account
      </span>
    )
  }
  if (t.includes("applicant") || t.includes("user")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        Applicant User
      </span>
    )
  }
  if (t.includes("application")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
        Application
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
      {type || "Archived Item"}
    </span>
  )
}

function CategoryBadge({ category = "" }) {
  const c = String(category).toLowerCase()
  let color = "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"

  if (c.includes("senior")) {
    color = "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
  } else if (c.includes("pwd") || c.includes("disability")) {
    color = "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
  } else if (c.includes("solo")) {
    color = "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
  } else if (c.includes("aics")) {
    color = "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${color}`}>
      {category || "General"}
    </span>
  )
}

function StatusBadge({ status = "Archived" }) {
  const s = String(status).toLowerCase()
  if (s.includes("active") || s.includes("restored")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        Restored
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
      Archived
    </span>
  )
}

/* ─────────────────────────────────────────────
   Modal: Edit Archive Entry (Update)
───────────────────────────────────────────── */
function EditArchiveModal({ isOpen, onClose, target, onUpdated, isProcessing }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("General")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen && target) {
      setTitle(target.title || "")
      setCategory(target.category || "General")
      setReason(target.reason || "")
      setNotes(target.original_data?.notes || target.notes || "")
    }
  }, [isOpen, target])

  if (!isOpen || !target) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdated(target.id || target.record_id, {
      title: title.trim(),
      category,
      reason: reason.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] max-w-md w-full p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <Edit2 className="size-4 text-primary" />
            <span>Edit Archive Record</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Record Title / Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Program Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Archiving Reason
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Casework Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="text-xs rounded-[5px] h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing}
              className="text-xs rounded-[5px] h-8 bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5"
            >
              {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
              <span>Update Record</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Archive Detail (Inspect Snapshot)
───────────────────────────────────────────── */
function ArchiveDetailModal({ isOpen, onClose, target, onRestore, onDelete }) {
  if (!isOpen || !target) return null

  const snapshotData = target.original_data || {}
  const hasSnapshot = Object.keys(snapshotData).length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] max-w-2xl w-full p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="size-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {target.title || "Archived Record"}
              </h3>
              <p className="text-[11px] text-zinc-500">
                Archived on{" "}
                {target.archived_at
                  ? new Date(target.archived_at).toLocaleString()
                  : "Unknown date"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Primary Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-[5px] border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">Record Type</span>
            <div className="mt-1">
              <RecordTypeBadge type={target.record_type} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">Category</span>
            <div className="mt-1">
              <CategoryBadge category={target.category} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">Reference ID</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 block mt-1 truncate">
              {target.member_id || target.record_id || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">Archived By</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium block mt-1">
              {target.archived_by_name || "System Administrator"}
            </span>
          </div>
        </div>

        {/* Reason Box */}
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-[5px] text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
            Archiving Reason & Determination
          </span>
          <p className="text-amber-800 dark:text-amber-300">{target.reason || "No explicit reason specified."}</p>
          {snapshotData.notes && (
            <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 italic">
              Note: {snapshotData.notes}
            </p>
          )}
        </div>

        {/* Snapshot Payload Viewer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileText className="size-3.5 text-zinc-400" />
              <span>Original Beneficiary Snapshot</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {hasSnapshot ? `${Object.keys(snapshotData).length} fields captured` : "Empty snapshot"}
            </span>
          </div>
          <div className="bg-zinc-900 text-zinc-100 p-3 rounded-[5px] text-[11px] font-mono overflow-x-auto max-h-52">
            <pre>{JSON.stringify(snapshotData, null, 2)}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              onDelete(target)
            }}
            className="text-xs rounded-[5px] h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 flex items-center gap-1"
          >
            <Trash2 className="size-3.5" />
            <span>Purge Record</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-[5px] h-8"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose()
                onRestore(target)
              }}
              className="text-xs rounded-[5px] h-8 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Restore to Active</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Restore Confirmation
───────────────────────────────────────────── */
function RestoreArchiveModal({ isOpen, onClose, target, onConfirm, isProcessing }) {
  if (!isOpen || !target) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] max-w-md w-full p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
            <RotateCcw className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Restore Archived Record
            </h3>
            <p className="text-xs text-zinc-500">Reactivate beneficiary or user account</p>
          </div>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700 text-xs space-y-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{target.title}</p>
          <p className="text-zinc-500 font-mono text-[11px]">
            ID: {target.member_id || target.record_id || target.id}
          </p>
          <div className="pt-1 flex items-center gap-1.5">
            <RecordTypeBadge type={target.record_type} />
            <CategoryBadge category={target.category} />
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Restoring this record will unarchive the beneficiary or reactivate the user account,
          returning them to the active members directory and granting full program eligibility.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="text-xs rounded-[5px] h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={() => onConfirm(target)}
            className="text-xs rounded-[5px] h-8 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
          >
            {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
            <span>Confirm & Restore</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Delete / Purge Single Record
───────────────────────────────────────────── */
function DeleteArchiveModal({ isOpen, onClose, target, onConfirm, isProcessing }) {
  if (!isOpen || !target) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] max-w-md w-full p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
            <Trash2 className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Permanently Purge Record
            </h3>
            <p className="text-xs text-zinc-500">Irreversible archive deletion</p>
          </div>
        </div>

        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-[5px] text-xs space-y-1">
          <p className="font-semibold text-red-900 dark:text-red-200">{target.title}</p>
          <p className="text-red-700/80 dark:text-red-400 font-mono text-[11px]">
            ID: {target.member_id || target.record_id || target.id}
          </p>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Are you sure you want to permanently purge this entry from the municipal archive vault?
          This snapshot cannot be recovered once removed.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="text-xs rounded-[5px] h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={() => onConfirm(target.id || target.record_id)}
            className="text-xs rounded-[5px] h-8 bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
            <span>Purge Entry</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Clear All Archives Vault
───────────────────────────────────────────── */
function ClearArchivesModal({ isOpen, onClose, onConfirm, isProcessing, totalCount }) {
  const [confirmWord, setConfirmWord] = useState("")

  useEffect(() => {
    if (isOpen) setConfirmWord("")
  }, [isOpen])

  if (!isOpen) return null

  const isConfirmed = confirmWord.trim().toUpperCase() === "CLEAR"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] max-w-md w-full p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Clear Entire Archives Vault
            </h3>
            <p className="text-xs text-zinc-500">Purge all {totalCount} archived records</p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          This operation will permanently purge all archived beneficiary snapshots and history
          from both the database and local registries. Active members and live user accounts will
          not be affected.
        </p>

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Type <span className="font-bold text-red-600">CLEAR</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="CLEAR"
            className="w-full text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="text-xs rounded-[5px] h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isConfirmed || isProcessing}
            onClick={onConfirm}
            className="text-xs rounded-[5px] h-8 bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
            <span>Clear All Archives</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Page: SuperAdminArchivesPage
───────────────────────────────────────────── */
export function SuperAdminArchivesPage() {
  const { canEdit, canDelete } = useStaffPermissions()

  const [archives, setArchives] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recordTypeFilter, setRecordTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null)
  const [selectedItemForRestore, setSelectedItemForRestore] = useState(null)
  const [selectedItemForDelete, setSelectedItemForDelete] = useState(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const showToast = (type, text) => {
    setFeedback({ type, text })
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev))
    }, 5000)
  }

  // Load records
  const loadArchivesData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getArchives()
      setArchives(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("[SuperAdminArchivesPage] fetch error:", err)
      showToast("error", "Failed to load archived records.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArchivesData()

    const handleArchivesChanged = () => {
      loadArchivesData()
    }

    window.addEventListener(ARCHIVES_CHANGED_EVENT, handleArchivesChanged)
    return () => {
      window.removeEventListener(ARCHIVES_CHANGED_EVENT, handleArchivesChanged)
    }
  }, [loadArchivesData])

  // Filtered archives
  const filteredArchives = useMemo(() => {
    return archives.filter((item) => {
      // Record type filter
      if (recordTypeFilter !== "all") {
        const t = (item.record_type || "").toLowerCase()
        if (recordTypeFilter === "other") {
          if (
            t.includes("member") ||
            t.includes("applicant") ||
            t.includes("staff") ||
            t.includes("application")
          ) {
            return false
          }
        } else if (!t.includes(recordTypeFilter)) {
          return false
        }
      }

      // Category filter
      if (categoryFilter !== "all") {
        const c = (item.category || "").toLowerCase()
        if (!c.includes(categoryFilter.toLowerCase())) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        const s = (item.status || "archived").toLowerCase()
        if (!s.includes(statusFilter.toLowerCase())) {
          return false
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = item.title?.toLowerCase().includes(q)
        const matchesId =
          item.member_id?.toLowerCase().includes(q) ||
          item.record_id?.toLowerCase().includes(q)
        const matchesReason = item.reason?.toLowerCase().includes(q)
        const matchesCategory = item.category?.toLowerCase().includes(q)
        const matchesAuthor = item.archived_by_name?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesId && !matchesReason && !matchesCategory && !matchesAuthor) {
          return false
        }
      }

      return true
    })
  }, [archives, recordTypeFilter, categoryFilter, statusFilter, searchQuery])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredArchives.length / rowsPerPage))
  const paginatedArchives = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredArchives.slice(start, start + rowsPerPage)
  }, [filteredArchives, currentPage, rowsPerPage])

  // Metrics summary
  const metrics = useMemo(() => {
    const total = archives.length
    const membersCount = archives.filter((x) => (x.record_type || "").includes("member")).length
    const usersCount = archives.filter(
      (x) => (x.record_type || "").includes("user") || (x.record_type || "").includes("staff")
    ).length
    const appsCount = archives.filter((x) => (x.record_type || "").includes("application")).length
    return { total, membersCount, usersCount, appsCount }
  }, [archives])

  // 1. Update Handlers
  const handleUpdateArchive = async (id, fields) => {
    setIsProcessing(true)
    try {
      await updateArchiveEntry(id, fields)
      setSelectedItemForEdit(null)
      showToast("success", "Archive record updated successfully.")
      await loadArchivesData()
    } catch (err) {
      showToast("error", err.message || "Failed to update archive record.")
    } finally {
      setIsProcessing(false)
    }
  }

  // 2. Restore Handlers
  const handleRestoreArchive = async (target) => {
    setIsProcessing(true)
    try {
      await restoreArchiveEntry(target)
      setSelectedItemForRestore(null)
      showToast("success", `"${target.title}" was restored back to active directory.`)
      await loadArchivesData()
    } catch (err) {
      showToast("error", err.message || "Failed to restore record.")
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. Delete / Purge Handlers
  const handleDeleteArchive = async (id) => {
    setIsProcessing(true)
    try {
      await deleteArchiveEntry(id)
      setSelectedItemForDelete(null)
      showToast("success", "Archived record permanently purged from vault.")
      await loadArchivesData()
    } catch (err) {
      showToast("error", err.message || "Failed to delete archive record.")
    } finally {
      setIsProcessing(false)
    }
  }

  // 4. Clear All Handlers
  const handleClearAllArchives = async () => {
    setIsProcessing(true)
    try {
      await clearAllArchives()
      setIsClearModalOpen(false)
      showToast("success", "Archives vault successfully cleared.")
      await loadArchivesData()
    } catch (err) {
      showToast("error", err.message || "Failed to clear archives vault.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <SuperAdminUserLayout activeTab="archives">
      <div className="space-y-4">
        {/* Toast Feedback Notice */}
        {feedback && (
          <div
            className={`p-3 rounded-[5px] border text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-red-600" />
              )}
              <span className="font-medium">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-primary/10 text-primary text-xs font-semibold">
                <Archive className="size-3.5" />
                Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Archived Records Vault
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Centralized municipal archive repository. Inspect original snapshots, manage retained
              records, and restore beneficiaries back to active registries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadArchivesData}
              disabled={isLoading}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {archives.length > 0 && canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearModalOpen(true)}
                className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900"
              >
                <Trash2 className="size-3.5" />
                Clear Vault
              </Button>
            )}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Archives
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : metrics.total}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total archived entries
              </p>
            </div>
            <div className="size-10 rounded-[5px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderArchive className="size-5" />
            </div>
          </div>

          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Archived Members
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : metrics.membersCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Archived beneficiaries
              </p>
            </div>
            <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
          </div>

          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                User Accounts
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : metrics.usersCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Applicant & staff accounts
              </p>
            </div>
            <div className="size-10 rounded-[5px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <User className="size-5" />
            </div>
          </div>

          <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Applications / Forms
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-1 leading-tight">
                {isLoading ? "—" : metrics.appsCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Archived application records
              </p>
            </div>
            <div className="size-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="p-3 sm:p-3.5 rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by title, beneficiary ID, reason, or caseworker..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={recordTypeFilter}
              onChange={(e) => {
                setRecordTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="archived">Archived</option>
              <option value="restored">Restored</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-medium">
                <tr>
                  <th className="py-2.5 px-3.5">Archived Record / Beneficiary</th>
                  <th className="py-2.5 px-3">Type & Sector</th>
                  <th className="py-2.5 px-3">Archiving Reason</th>
                  <th className="py-2.5 px-3">Archived By & Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span className="text-xs">Loading archived records from vault...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedArchives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderArchive className="size-7 text-zinc-300 dark:text-zinc-700" />
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          No archived records found
                        </p>
                        <p className="text-[11px] text-zinc-500 max-w-sm">
                          {searchQuery || recordTypeFilter !== "all" || categoryFilter !== "all"
                            ? "Try adjusting your search criteria or clearing filters."
                            : "Records archived from members directory, terminations, or applications will automatically appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedArchives.map((item) => {
                    const recId = item.id || item.record_id || `arch-${Math.random()}`
                    const identifier = item.member_id || item.record_id || "N/A"
                    const dateFormatted = item.archived_at
                      ? new Date(item.archived_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"

                    return (
                      <tr
                        key={recId}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Title & Beneficiary */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                              <Archive className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                <HighlightText text={item.title || "Untitled"} query={searchQuery} />
                              </p>
                              <p className="text-[11px] text-zinc-500 font-mono truncate">
                                ID: <HighlightText text={identifier} query={searchQuery} />
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type & Category */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <RecordTypeBadge type={item.record_type} />
                            <CategoryBadge category={item.category} />
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="text-zinc-700 dark:text-zinc-300 truncate" title={item.reason}>
                            <HighlightText text={item.reason || "—"} query={searchQuery} />
                          </p>
                          {item.original_data?.notes && (
                            <p
                              className="text-[10px] text-zinc-400 italic truncate"
                              title={item.original_data.notes}
                            >
                              Note: {item.original_data.notes}
                            </p>
                          )}
                        </td>

                        {/* Archived By & Date */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {item.archived_by_name || "Admin"}
                          </p>
                          <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="size-3" />
                            <span>{dateFormatted}</span>
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Snapshot Details */}
                            <button
                              onClick={() => setSelectedItemForDetail(item)}
                              title="View Snapshot & Metadata"
                              className="p-1 rounded-[4px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* Edit Record */}
                            {canEdit && (
                              <button
                                onClick={() => setSelectedItemForEdit(item)}
                                title="Edit Record Details"
                                className="p-1 rounded-[4px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                            )}

                            {/* Restore */}
                            {canEdit && (
                              <button
                                onClick={() => setSelectedItemForRestore(item)}
                                title="Restore to Active Directory"
                                className="p-1 rounded-[4px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="size-3.5" />
                              </button>
                            )}

                            {/* Delete / Purge */}
                            {canDelete && (
                              <button
                                onClick={() => setSelectedItemForDelete(item)}
                                title="Permanently Purge Record"
                                className="p-1 rounded-[4px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredArchives.length > 0 && (
            <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800">
              <DataTablePagination
                totalItems={filteredArchives.length}
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(val) => {
                  setRowsPerPage(val)
                  setCurrentPage(1)
                }}
              />
            </div>
          )}
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-3.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-500">
          <Info className="size-4 shrink-0 text-zinc-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              Archiving Architecture &amp; Audit Compliance
            </p>
            <p className="leading-relaxed text-[11px]">
              Records stored in the Archives Vault reference the <code>public.archives</code> table
              and local client caches. Restoring any record reverses the archived status and
              re-populates the beneficiary or user back into the active database without creating
              duplicate identities.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditArchiveModal
        isOpen={Boolean(selectedItemForEdit)}
        onClose={() => setSelectedItemForEdit(null)}
        target={selectedItemForEdit}
        onUpdated={handleUpdateArchive}
        isProcessing={isProcessing}
      />

      <ArchiveDetailModal
        isOpen={Boolean(selectedItemForDetail)}
        onClose={() => setSelectedItemForDetail(null)}
        target={selectedItemForDetail}
        onRestore={setSelectedItemForRestore}
        onDelete={setSelectedItemForDelete}
      />

      <RestoreArchiveModal
        isOpen={Boolean(selectedItemForRestore)}
        onClose={() => setSelectedItemForRestore(null)}
        target={selectedItemForRestore}
        onConfirm={handleRestoreArchive}
        isProcessing={isProcessing}
      />

      <DeleteArchiveModal
        isOpen={Boolean(selectedItemForDelete)}
        onClose={() => setSelectedItemForDelete(null)}
        target={selectedItemForDelete}
        onConfirm={handleDeleteArchive}
        isProcessing={isProcessing}
      />

      <ClearArchivesModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAllArchives}
        isProcessing={isProcessing}
        totalCount={archives.length}
      />
    </SuperAdminUserLayout>
  )
}
