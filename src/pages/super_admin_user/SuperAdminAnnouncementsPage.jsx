import React, { useState, useMemo, useEffect } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import {
  getAnnouncements,
  saveAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  deleteAnnouncement,
} from "@/services/announcementService"

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const SECTORS = [
  "Senior Citizen",
  "Person with Disability (PWD)",
  "Women",
  "Youth",
  "Solo Parent",
  "General",
]

function toDateInputValue(str) {
  if (!str) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const d = new Date(str)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}

/* ─────────────────────────────────────────────
   Publish Announcement Modal
───────────────────────────────────────────── */
function PublishAnnouncementModal({
  isOpen,
  onClose,
  onSave,
  initial = null,
  isSaving = false,
}) {
  const blank = {
    title: "",
    message: "",
    audience: [],
    expiry: "",
    pinned: false,
    status: "Published",
  }
  const [form, setForm] = useState(blank)
  const [error, setError] = useState("")

  // Sync when `initial` changes or modal opens
  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        expiry: toDateInputValue(initial.expiry),
        audience: Array.isArray(initial.audience) ? initial.audience : [],
        pinned: Boolean(initial.pinned),
        status: initial.status || "Published",
      })
    } else {
      setForm(blank)
    }
    setError("")
  }, [isOpen, initial])

  if (!isOpen) return null

  const toggleSector = (s) => {
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(s)
        ? f.audience.filter((x) => x !== s)
        : [...f.audience, s],
    }))
    setError("")
  }

  const handleSelectAllSectors = () => {
    setForm((f) => ({
      ...f,
      audience: f.audience.length === SECTORS.length ? [] : [...SECTORS],
    }))
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }
    if (!form.message.trim()) {
      setError("Message is required.")
      return
    }
    if (form.audience.length === 0) {
      setError("Select at least one target audience sector.")
      return
    }

    onSave({
      ...form,
      title: form.title.trim(),
      message: form.message.trim(),
    })
  }

  const isEdit = !!initial

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Megaphone className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-heading">
                {isEdit ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compose an update and choose which applicant categories should receive it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={120}
              value={form.title}
              disabled={isSaving}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value })
                setError("")
              }}
              placeholder="e.g. Schedule of Cash Assistance Payout"
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors disabled:opacity-60"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {form.title.length}/120 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={4000}
              value={form.message}
              disabled={isSaving}
              onChange={(e) => {
                setForm({ ...form, message: e.target.value })
                setError("")
              }}
              placeholder="Write the full message or bulletin for beneficiaries…"
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none disabled:opacity-60"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {form.message.length}/4000 characters
            </p>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllSectors}
                disabled={isSaving}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {form.audience.length === SECTORS.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => {
                const isSelected = form.audience.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggleSector(s)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Expiry date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Expiry Date</label>
            <input
              type="date"
              value={form.expiry}
              disabled={isSaving}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-60"
            />
            <p className="text-[10px] text-muted-foreground">
              Leave blank if the announcement does not expire.
            </p>
          </div>

          {/* Pin + Status row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Pin toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={form.pinned}
                disabled={isSaving}
                onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 ${
                  form.pinned ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                    form.pinned ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-foreground font-medium flex items-center gap-1">
                <Pin className="size-3.5 text-amber-500" />
                Pin announcement to top
              </span>
            </label>

            {/* Status */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground">Status:</label>
              <select
                value={form.status}
                disabled={isSaving}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-60"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={isSaving}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Publish Announcement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Delete Announcement Confirmation Modal
───────────────────────────────────────────── */
function DeleteAnnouncementModal({
  isOpen,
  onClose,
  onConfirm,
  announcement,
  isDeleting,
}) {
  if (!isOpen || !announcement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 flex items-start gap-3">
          <div className="size-10 rounded-[5px] bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-sm font-bold text-foreground font-heading">
              Delete announcement?
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Announcement <span className="font-semibold text-foreground">"{announcement.title}"</span> will be permanently deleted from the database.
            </p>
            <div className="mt-2.5 p-2 rounded-[4px] bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 font-medium">
              This will not be recovered once deleted!
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-800/20 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            className="rounded-[5px] text-xs h-8 cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            className="rounded-[5px] text-xs h-8 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
            onClick={onConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete permanently"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (status === "Published") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
      Draft
    </span>
  )
}

/* ─────────────────────────────────────────────
   Main Announcements Page
───────────────────────────────────────────── */
export function SuperAdminAnnouncementsPage() {
  const { location } = useRouter()
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Search & pagination
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Sync with URL query parameter from global search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearch(searchParam)
      setCurrentPage(1)
    }
  }, [location.search])

  // Load announcements dynamically from database
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getAnnouncements()
      // STRICT: If no data from database, sets [] — no mock fallbacks
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load announcements:", err)
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener("storage", handleSync)
    window.addEventListener("focus", handleSync)
    return () => {
      window.removeEventListener("storage", handleSync)
      window.removeEventListener("focus", handleSync)
    }
  }, [])

  /* ── Stats (dynamically 0 if no records exist) ── */
  const published = announcements.filter((a) => a.status === "Published").length
  const drafts = announcements.filter((a) => a.status === "Draft").length
  const pinned = announcements.filter((a) => a.pinned).length

  /* ── Filtered search ── */
  const q = search.toLowerCase().trim()
  const filtered = useMemo(
    () =>
      announcements.filter(
        (a) =>
          !q ||
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.message && a.message.toLowerCase().includes(q)) ||
          (Array.isArray(a.audience) &&
            a.audience.some((s) => s.toLowerCase().includes(q)))
      ),
    [announcements, q]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  /* ── CRUD Handlers ── */
  const handleSave = async (formData) => {
    setIsSaving(true)
    try {
      if (editTarget) {
        // Update existing announcement
        const updatedOptimistic = {
          ...editTarget,
          ...formData,
        }
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === editTarget.id || (editTarget.dbId && a.dbId === editTarget.dbId)
              ? updatedOptimistic
              : a
          )
        )
        setIsModalOpen(false)
        setEditTarget(null)

        const saved = await updateAnnouncement(editTarget, formData)
        if (saved) {
          setAnnouncements((prev) =>
            prev.map((a) =>
              a.id === editTarget.id || (editTarget.dbId && a.dbId === editTarget.dbId)
                ? saved
                : a
            )
          )
        }
      } else {
        // Create new announcement
        const tempId = `temp-${Date.now()}`
        const optimisticNew = {
          ...formData,
          id: tempId,
          code: tempId,
          createdAt: "Today",
        }
        setAnnouncements((prev) => [optimisticNew, ...prev])
        setIsModalOpen(false)

        const saved = await saveAnnouncement(formData)
        if (saved) {
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === tempId ? saved : a))
          )
        }
      }
    } catch (err) {
      console.error("Error saving announcement:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "Published" ? "Draft" : "Published"
    // Optimistic UI update
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: nextStatus } : a))
    )
    try {
      await toggleAnnouncementStatus(item)
    } catch (err) {
      console.error("Error toggling status:", err)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const target = deleteTarget

    // Optimistic UI update: instantly remove from list
    setAnnouncements((prev) =>
      prev.filter(
        (a) =>
          a.id !== target.id && (target.dbId ? a.dbId !== target.dbId : true)
      )
    )
    setDeleteTarget(null)

    try {
      await deleteAnnouncement(target)
    } catch (err) {
      console.error("Error deleting announcement:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setIsModalOpen(true)
  }

  const formatExpiry = (raw) => {
    if (!raw) return null
    if (raw.includes("-")) {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
    }
    return raw
  }

  return (
    <SuperAdminUserLayout activeTab="announcements">
      <div className="space-y-4">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Megaphone className="size-3.5" />
                Public Information
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Announcements
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Publish and manage updates for applicants and beneficiaries across your assigned sectors.
            </p>
          </div>
          <Button
            variant="brand"
            size="sm"
            className="rounded-[5px] text-xs gap-1.5 cursor-pointer shrink-0"
            onClick={() => {
              setEditTarget(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="size-3.5" />
            Publish Announcement
          </Button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Published</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? "-" : published}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Visible to selected audiences
                </p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Eye className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Drafts</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? "-" : drafts}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Saved but not published
                </p>
              </div>
              <div className="size-10 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                <EyeOff className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pinned updates</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? "-" : pinned}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Prioritized for applicants
                </p>
              </div>
              <div className="size-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Pin className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Content Table ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Published content</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Review, edit, publish, unpublish, or delete updates for applicants.
              </p>
            </div>
          </div>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            {/* Search bar inside card */}
            <div className="px-4 pt-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search announcements by title or content…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("")
                      setCurrentPage(1)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Title</th>
                      <th className="py-3 px-4 font-semibold">Audience</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Message preview</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {/* 1. Loading State */}
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="size-6 animate-spin text-blue-600" />
                            <p className="text-xs">Loading announcements from database…</p>
                          </div>
                        </td>
                      </tr>
                    ) : announcements.length === 0 ? (
                      /* 2. Empty Database State: STRICT NO FALLBACKS */
                      <tr>
                        <td colSpan={5} className="py-14 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                            <div className="size-12 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                              <Megaphone className="size-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              No announcements found
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                              There are currently no announcements in the database. Publish one to notify applicants and citizens about social programs, schedules, and aid.
                            </p>
                            <Button
                              variant="brand"
                              size="sm"
                              className="rounded-[5px] text-xs gap-1.5 cursor-pointer"
                              onClick={() => {
                                setEditTarget(null)
                                setIsModalOpen(true)
                              }}
                            >
                              <Plus className="size-3.5" />
                              Publish Announcement
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : displayed.length === 0 ? (
                      /* 3. Search Filter Result Empty */
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-xs text-muted-foreground"
                        >
                          No announcements match your search query "{search}".
                        </td>
                      </tr>
                    ) : (
                      /* 4. Data Rows */
                      displayed.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          {/* Title */}
                          <td className="py-3 px-4 max-w-[220px]">
                            <div className="flex items-start gap-1.5">
                              {a.pinned && (
                                <Pin className="size-3 text-amber-500 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-foreground leading-snug">
                                  <HighlightText text={a.title} highlight={search} />
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {a.pinned && (
                                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                      Pinned
                                    </span>
                                  )}
                                  {a.createdAt && (
                                    <span className="text-[10px] text-muted-foreground">
                                      • <HighlightText text={a.createdAt} highlight={search} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Audience + expiry */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(a.audience) && a.audience.length > 0 ? (
                                a.audience.map((sec) => (
                                  <span
                                    key={sec}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  >
                                    <HighlightText text={sec} highlight={search} />
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  All sectors
                                </span>
                              )}
                            </div>
                            {a.expiry && (
                              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="size-3 text-muted-foreground" />
                                Expires {formatExpiry(a.expiry)}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <StatusBadge status={a.status} />
                          </td>

                          {/* Message preview */}
                          <td className="py-3 px-4 text-muted-foreground max-w-[220px]">
                            <p className="line-clamp-2 leading-relaxed">
                              <HighlightText text={a.message} highlight={search} />
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer gap-1"
                                onClick={() => openEdit(a)}
                              >
                                <Edit2 className="size-3" />
                                Edit
                              </Button>

                              {/* Publish / Unpublish Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-[5px] text-xs h-7 px-2 cursor-pointer ${
                                  a.status === "Published"
                                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                }`}
                                onClick={() => handleToggleStatus(a)}
                              >
                                {a.status === "Published" ? "Unpublish" : "Publish"}
                              </Button>

                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-[5px] text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer gap-1"
                                onClick={() => setDeleteTarget(a)}
                              >
                                <Trash2 className="size-3" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>

            {!isLoading && announcements.length > 0 && (
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={rowsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={(n) => {
                  setRowsPerPage(n)
                  setCurrentPage(1)
                }}
                itemLabel="announcements"
              />
            )}
          </Card>
        </div>
      </div>

      {/* ── Publish / Edit Announcement Modal ── */}
      <PublishAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditTarget(null)
        }}
        onSave={handleSave}
        initial={editTarget}
        isSaving={isSaving}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteAnnouncementModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        announcement={deleteTarget}
        isDeleting={isDeleting}
      />
    </SuperAdminUserLayout>
  )
}

export default SuperAdminAnnouncementsPage
