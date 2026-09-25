import React, { useState, useEffect } from "react"
import {
  X,
  Edit2,
  Printer,
  Download,
  Link2,
  Archive,
  User,
  FolderOpen,
  History,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateMember, archiveMember, linkDuplicateMembers } from "@/services/memberService"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import { UserAvatar } from "@/components/common"

export function MemberDetailModal({
  member,
  allMembers = [],
  isOpen,
  onClose,
  onMemberUpdated,
  onMemberArchived,
  onRefresh,
  canEdit: propCanEdit,
  canDelete: propCanDelete,
}) {
  const staffPerms = useStaffPermissions()
  const canEdit = propCanEdit !== undefined ? propCanEdit : staffPerms.canEdit
  const canDelete = propCanDelete !== undefined ? propCanDelete : staffPerms.canDelete

  const [activeTab, setActiveTab] = useState("overview")

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Archive Dialog state
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [archiveReason, setArchiveReason] = useState("Relocated outside municipality")
  const [isArchiving, setIsArchiving] = useState(false)

  // Link Duplicate Dialog state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedDuplicateId, setSelectedDuplicateId] = useState("")
  const [duplicateSearch, setDuplicateSearch] = useState("")
  const [isLinking, setIsLinking] = useState(false)

  // Document Lightbox state
  const [previewDoc, setPreviewDoc] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Print Mode state
  const [isPrintPreview, setIsPrintPreview] = useState(false)

  // Sync edit form on member change
  useEffect(() => {
    if (member) {
      setEditForm({
        name: member.name || "",
        email: member.email === "—" ? "" : member.email || "",
        contact: member.contact === "—" ? "" : member.contact || "",
        address: member.address === "—" ? "" : member.address || "",
        civilStatus: member.civilStatus === "—" ? "Single" : member.civilStatus || "Single",
        occupation: member.occupation === "—" ? "Resident" : member.occupation || "Resident",
        category: member.category || "General",
        status: member.status || "Active",
      })
      setIsEditing(false)
      setIsArchiveModalOpen(false)
      setIsLinkModalOpen(false)
      setIsPrintPreview(false)
      setPreviewDoc(null)
    }
  }, [member])

  if (!isOpen || !member) return null

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await updateMember(member.id, editForm)
      if (updated) {
        onMemberUpdated?.(updated)
      } else {
        // Fallback update
        onMemberUpdated?.({ ...member, ...editForm, updated: "Just now" })
      }
      setIsEditing(false)
      onRefresh?.()
    } catch (err) {
      console.error("Save edit error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Archive
  const handleConfirmArchive = async () => {
    setIsArchiving(true)
    try {
      const success = await archiveMember(member, archiveReason)
      if (success) {
        onMemberArchived?.(member.id)
        setIsArchiveModalOpen(false)
        onClose()
        onRefresh?.()
      }
    } catch (err) {
      console.error("Archive error:", err)
    } finally {
      setIsArchiving(false)
    }
  }

  // Handle Link Duplicate
  const handleConfirmLink = async () => {
    if (!selectedDuplicateId) return
    setIsLinking(true)
    try {
      await linkDuplicateMembers(member.id, selectedDuplicateId)
      onMemberUpdated?.({ ...member, hasDuplicates: true, duplicateOf: selectedDuplicateId })
      setIsLinkModalOpen(false)
      onRefresh?.()
    } catch (err) {
      console.error("Link error:", err)
    } finally {
      setIsLinking(false)
    }
  }

  // Potential duplicate members for linking (excluding current member)
  const candidateDuplicates = allMembers.filter(
    (m) =>
      m.id !== member.id &&
      m.memberId !== member.memberId &&
      (!duplicateSearch ||
        m.name?.toLowerCase().includes(duplicateSearch.toLowerCase()) ||
        m.memberId?.toLowerCase().includes(duplicateSearch.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Modal Header ── */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar */}
            <UserAvatar
              user={member}
              avatarUrl={member.avatarUrl}
              initials={member.initials || member.name?.substring(0, 2) || "MB"}
              name={member.name}
              email={member.email}
              size="size-11 sm:size-12"
              className="text-sm sm:text-base font-bold shadow-xs uppercase"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground font-heading truncate">
                  {member.name}
                </h2>
                {member.applicationId && (
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    Enrolled Beneficiary
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
                <span>ID: {member.memberId}</span>
                <span>•</span>
                <span className="text-[11px]">{member.uid}</span>
              </p>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {member.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border ${
                    member.status === "Terminated" || member.isTerminated
                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                      : member.status === "Active"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : member.status === "Archived" || member.isArchived
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {member.status === "Terminated" || member.isTerminated ? "Terminated" : member.status}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close details"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Action Toolbar (View, Edit, Print, Link Duplicate, Archive) ── */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-2 shrink-0">
          {/* Edit Button */}
          {canEdit && (
            <Button
              size="sm"
              variant={isEditing ? "brand" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800"
            >
              <Edit2 className="size-3.5" />
              <span>{isEditing ? "Cancel Edit" : "Edit"}</span>
            </Button>
          )}

          {/* Print Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPrintPreview(true)}
            className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer bg-white dark:bg-zinc-800"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </Button>

          {/* Link Duplicate Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <Link2 className="size-3.5" />
              <span>Link duplicate</span>
            </button>
          )}

          {/* Archive Button */}
          {canDelete && member.status !== "Archived" && !member.isArchived && (
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              <Archive className="size-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>

        {/* ── Prominent Termination Alert Banner ── */}
        {(member.status === "Terminated" || member.isTerminated) && (
          <div className="mx-4 sm:mx-5 mt-3 p-3.5 rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-900 dark:text-red-200 shrink-0">
            <UserX className="size-4.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-800 dark:text-red-300 uppercase tracking-wider text-[11px]">
                  Beneficiary Account Terminated
                </span>
                {member.terminatedAt && (
                  <span className="text-[10.5px] text-red-600/80 dark:text-red-400/80 font-mono">
                    {new Date(member.terminatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-red-700 dark:text-red-300">
                Reason: <span className="font-semibold">{member.terminationReason || "Administrative policy termination"}</span>
              </p>
              <p className="text-[10.5px] text-red-600/90 dark:text-red-400/90">
                Portal sign-in and welfare disbursements for this beneficiary account are currently revoked. To reinstate this account, visit the Account Control / Termination portal.
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs Bar ── */}
        {!isEditing && (
          <div className="px-4 sm:px-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center gap-6 shrink-0 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "overview"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <User className="size-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "documents"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <FolderOpen className="size-3.5" />
              <span>Documents</span>
              {member.documents?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  {member.documents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "history"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <History className="size-3.5" />
              <span>History</span>
            </button>
          </div>
        )}

        {/* ── Modal Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="p-3 rounded-[5px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Edit2 className="size-4 shrink-0 text-blue-600" />
                <span>Editing beneficiary details. Changes will persist directly to the MSWDO database.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Full Name *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="h-8.5 text-xs rounded-[5px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Contact Number *</label>
                  <Input
                    value={editForm.contact}
                    onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                    className="h-8.5 text-xs rounded-[5px] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="h-8.5 text-xs rounded-[5px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Category / Sector</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                    <option value="Women's Welfare">Women's Welfare</option>
                    <option value="Youth">Youth</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Complete Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="h-8.5 text-xs rounded-[5px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Civil Status</label>
                  <select
                    value={editForm.civilStatus}
                    onChange={(e) => setEditForm({ ...editForm, civilStatus: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Occupation</label>
                  <Input
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    className="h-8.5 text-xs rounded-[5px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Membership Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="rounded-[5px] text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  disabled={isSaving}
                  className="rounded-[5px] text-xs h-8 gap-1.5"
                >
                  <Save className="size-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* TAB: OVERVIEW */}
              {activeTab === "overview" && (
                <>
                  {/* Personal Information */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      PERSONAL INFORMATION
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          BIRTH DATE
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {member.birthDate || "—"}
                        </p>
                      </div>

                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <User className="size-3" />
                          GENDER
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {member.gender || "—"}
                        </p>
                      </div>

                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Users2 className="size-3" />
                          CIVIL STATUS
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {member.civilStatus || "—"}
                        </p>
                      </div>

                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Briefcase className="size-3" />
                          OCCUPATION
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {member.occupation || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      CONTACT INFORMATION
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Mail className="size-3" />
                          EMAIL
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1 break-all">
                          {member.email}
                        </p>
                      </div>

                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Phone className="size-3" />
                          CONTACT NUMBER
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1 font-mono">
                          {member.contact && member.contact !== "—" ? member.contact : "—"}
                        </p>
                      </div>

                      <div className="sm:col-span-2 p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="size-3" />
                          ADDRESS
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {member.address || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sector-Specific Program Details */}
                  {member.categoryDetails && Object.keys(member.categoryDetails).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        PROGRAM SECTOR PARTICULARS
                      </p>
                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        {member.categoryDetails.disabilityType && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Disability Type</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.disabilityType}</span>
                          </div>
                        )}
                        {member.categoryDetails.disabilityCause && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Disability Cause</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.disabilityCause}</span>
                          </div>
                        )}
                        {member.categoryDetails.educationalAttainment && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Education</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.educationalAttainment}</span>
                          </div>
                        )}
                        {member.categoryDetails.schoolName && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">School</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.schoolName}</span>
                          </div>
                        )}
                        {member.categoryDetails.pension && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pension Status</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.pension}</span>
                          </div>
                        )}
                        {member.categoryDetails.isSoloParent && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Solo Parent</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.isSoloParent}</span>
                          </div>
                        )}
                        {member.categoryDetails.numberOfChildren && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Children</span>
                            <span className="font-semibold text-foreground">{member.categoryDetails.numberOfChildren}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Record Details */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      RECORD DETAILS
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          SOURCE APPLICATION
                        </p>
                        <p className="text-xs font-semibold text-foreground mt-1">
                          {member.sourceApplication || "Online Program Application"}
                        </p>
                      </div>

                      <div className="p-3 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          MEMBER SINCE
                        </p>
                        <p className="text-xs font-semibold text-foreground mt-1 font-mono">
                          {member.updated || "Sep 22, 2026"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Attached Files & Verification Documents</p>
                    <span className="text-[11px] text-muted-foreground">{member.documents?.length || 0} files</span>
                  </div>

                  {member.documents?.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-[5px] text-muted-foreground text-xs">
                      No documents currently attached to this member record.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {member.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-8 rounded-[5px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {doc.name || doc.title || doc.fileName || `Document ${idx + 1}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "Uploaded Document"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {doc.status || "Verified"}
                            </span>
                            {(doc.url || doc.previewUrl) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewDoc(doc)}
                                className="h-7 text-xs cursor-pointer"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground">Audit Timeline & Activity History</p>
                  <div className="space-y-3 pl-2 border-l-2 border-zinc-200 dark:border-zinc-800">
                    <div className="relative pl-4">
                      <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-blue-600 ring-4 ring-white dark:ring-zinc-900" />
                      <p className="text-xs font-semibold text-foreground">Member record verified and active</p>
                      <p className="text-[10px] text-muted-foreground">{member.updated} • Authorized by Super Admin</p>
                    </div>
                    {member.applicationId && (
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-zinc-900" />
                        <p className="text-xs font-semibold text-foreground">Enrolled automatically from approved application</p>
                        <p className="text-[10px] text-muted-foreground">System workflow • Status: Approved</p>
                      </div>
                    )}
                    <div className="relative pl-4">
                      <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-zinc-400 ring-4 ring-white dark:ring-zinc-900" />
                      <p className="text-xs font-semibold text-foreground">Member ID assigned: {member.memberId}</p>
                      <p className="text-[10px] text-muted-foreground">MSWDO Registry System</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ARCHIVE CONFIRMATION MODAL ── */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Archive className="size-5" />
              <h3 className="text-sm font-bold text-foreground">Archive Beneficiary Record</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to archive <strong>{member.name}</strong> ({member.memberId})?
              This record will be stored in the dedicated <strong>archives</strong> vault.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reason for Archiving *</label>
              <select
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full h-8.5 px-3 rounded-[5px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground outline-none"
              >
                <option value="Relocated outside municipality">Relocated outside municipality</option>
                <option value="Deceased">Deceased</option>
                <option value="Duplicate entry / consolidated">Duplicate entry / consolidated</option>
                <option value="Exceeded program eligibility">Exceeded program eligibility</option>
                <option value="Voluntary withdrawal">Voluntary withdrawal</option>
                <option value="Other administrative reason">Other administrative reason</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsArchiveModalOpen(false)}
                className="h-8 text-xs rounded-[5px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isArchiving}
                onClick={handleConfirmArchive}
                className="h-8 text-xs rounded-[5px] bg-red-600 hover:bg-red-700"
              >
                {isArchiving ? "Archiving..." : "Archive Record"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LINK DUPLICATE MODAL ── */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Link2 className="size-5" />
                <h3 className="text-sm font-bold text-foreground">Link Duplicate Beneficiary</h3>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select another member record to link as a duplicate of <strong>{member.name}</strong> ({member.memberId}).
            </p>

            <Input
              placeholder="Search candidate duplicates by name or ID..."
              value={duplicateSearch}
              onChange={(e) => setDuplicateSearch(e.target.value)}
              className="h-8.5 text-xs rounded-[5px]"
            />

            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800">
              {candidateDuplicates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No matching candidate members found.</p>
              ) : (
                candidateDuplicates.slice(0, 10).map((cand) => (
                  <label
                    key={cand.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${selectedDuplicateId === cand.id ? "bg-purple-50 dark:bg-purple-950/40 border border-purple-200" : ""
                      }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{cand.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{cand.memberId} • {cand.category}</p>
                    </div>
                    <input
                      type="radio"
                      name="dupCandidate"
                      value={cand.id}
                      checked={selectedDuplicateId === cand.id}
                      onChange={() => setSelectedDuplicateId(cand.id)}
                      className="cursor-pointer"
                    />
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkModalOpen(false)}
                className="h-8 text-xs rounded-[5px]"
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                disabled={!selectedDuplicateId || isLinking}
                onClick={handleConfirmLink}
                className="h-8 text-xs rounded-[5px] bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLinking ? "Linking..." : "Confirm Link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT OFFICIAL BENEFICIARY CERTIFICATE & SLIP MODAL ── */}
      {isPrintPreview && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-zinc-900 rounded-[5px] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            {/* Action Bar (Print / Close) */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="size-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Official Certificate Preview</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="brand"
                  onClick={() => window.print()}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Printer className="size-3.5" />
                  Print Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPrintPreview(false)}
                  className="h-8 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-6 border border-zinc-300 rounded-[5px] space-y-6 text-zinc-900 bg-white">
              {/* Header */}
              <div className="text-center space-y-1 border-b border-zinc-200 pb-4">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Republic of the Philippines</p>
                <p className="text-xs font-bold uppercase text-zinc-700">Province of Cebu • Municipality of Carmen</p>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-blue-900 font-heading">
                  MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT OFFICE
                </h1>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-2 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Beneficiary Name</span>
                    <span className="text-base font-extrabold text-zinc-900">{member.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Member ID</span>
                      <span className="font-mono font-bold text-blue-700">{member.memberId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Welfare Category</span>
                      <span className="font-semibold text-zinc-800">{member.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Date of Birth</span>
                      <span className="font-semibold text-zinc-800">{member.birthDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Contact</span>
                      <span className="font-mono text-zinc-800">{member.contact || "—"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Registered Address</span>
                    <span className="font-medium text-zinc-800">{member.address}</span>
                  </div>
                </div>

                {/* Photo & Seal Block */}
                <div className="text-center p-3 border border-zinc-200 rounded-[5px] bg-zinc-50 space-y-2">
                  <div className="size-20 mx-auto rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                    {member.initials}
                  </div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">OFFICIAL SEAL</p>
                  <p className="text-[8px] font-mono text-zinc-400">{member.uid?.substring(0, 16)}</p>
                </div>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-zinc-400 pb-1 mb-1 font-semibold">
                    {member.name}
                  </div>
                  <p className="text-[10px] text-zinc-500">Beneficiary Signature</p>
                </div>
                <div>
                  <div className="border-b border-zinc-400 pb-1 mb-1 font-semibold text-blue-900">
                    MSWDO Officer-in-Charge
                  </div>
                  <p className="text-[10px] text-zinc-500">Municipal Social Welfare &amp; Development</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT LIGHTBOX MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-zinc-950 rounded-[5px] overflow-hidden border border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-white">
              <span className="text-xs font-semibold truncate">{previewDoc.name || previewDoc.fileName}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={previewDoc.url || previewDoc.previewUrl}
                alt="Document Preview"
                style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease" }}
                className="max-h-[70vh] object-contain rounded select-none shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberDetailModal
