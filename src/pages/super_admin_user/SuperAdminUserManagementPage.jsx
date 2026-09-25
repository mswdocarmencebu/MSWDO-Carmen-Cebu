import React, { useState, useMemo, useEffect, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  ShieldAlert, Search, Plus, ShieldCheck, KeyRound, Lock,
  X, Upload, Users, UserCog, Shield,
  AlertCircle, CheckSquare, Square, RefreshCw, Eye, EyeOff, Pencil,
  ThumbsUp, Trash2, Loader2, Copy, Check, Mail,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText, UserAvatar } from "@/components/common"
import { useRouter } from "@/routes/RouterContext"
import {
  getStaffUsers, createStaffUser, updateStaffUser, deleteStaffUser,
  updateStaffPrivileges, toggleStaffActive, generateStaffTemporaryPassword,
  STAFF_ROLES, STAFF_POSITIONS, CATEGORIES,
} from "@/services/userService"

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function getInitials(name, email) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? "?"
}

function RoleBadge({ role }) {
  const isAdmin = role === "Admin" || role === "Admin Staff"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border whitespace-nowrap ${
      isAdmin
        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
        : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
    }`}>
      {role}
    </span>
  )
}

function StatusBadge({ isActive }) {
  return isActive
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">Inactive</span>
}

/* ─────────────────────────────────────────────
   Privilege Checkboxes (reusable)
───────────────────────────────────────────── */
const PRIVILEGE_ITEMS = [
  { key: "canView",    label: "View",    icon: Eye },
  { key: "canEdit",    label: "Edit",    icon: Pencil },
  { key: "canApprove", label: "Approve", icon: ThumbsUp },
  { key: "canDelete",  label: "Delete",  icon: Trash2 },
]

function PrivilegeSelector({ values, onChange }) {
  const allChecked = PRIVILEGE_ITEMS.every((p) => values[p.key])

  const toggleAll = () => {
    const next = !allChecked
    const update = {}
    PRIVILEGE_ITEMS.forEach((p) => { update[p.key] = next })
    onChange(update)
  }

  const toggle = (key) => onChange({ ...values, [key]: !values[key] })

  return (
    <div className="space-y-2">
      {/* Select All row */}
      <label className="flex items-center gap-2 cursor-pointer select-none group" onClick={toggleAll}>
        <div className={`size-4 rounded-[3px] border-2 flex items-center justify-center transition-colors ${
          allChecked
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400"
        }`}>
          {allChecked && <CheckSquare className="size-3" strokeWidth={3} />}
        </div>
        <span className="text-xs font-semibold text-foreground">Select All</span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        {PRIVILEGE_ITEMS.map(({ key, label, icon: Icon }) => {
          const checked = !!values[key]
          return (
            <label key={key} className="flex items-center gap-2 p-2.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div
                className={`size-4 rounded-[3px] border-2 flex items-center justify-center transition-colors shrink-0 ${
                  checked ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                }`}
                onClick={() => toggle(key)}
              >
                {checked && <CheckSquare className="size-3" strokeWidth={3} />}
              </div>
              <Icon className={`size-3.5 shrink-0 ${checked ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
              <span className="text-xs text-foreground">{label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Category Access Selector (reusable)
───────────────────────────────────────────── */
function CategorySelector({ selected, onChange }) {
  const allSelected = CATEGORIES.every((c) => selected.includes(c))

  const toggleAll = () => onChange(allSelected ? [] : [...CATEGORIES])
  const toggle    = (c) => onChange(
    selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]
  )

  return (
    <div className="space-y-2">
      {/* Select All row */}
      <label className="flex items-center gap-2 cursor-pointer select-none group" onClick={toggleAll}>
        <div className={`size-4 rounded-[3px] border-2 flex items-center justify-center transition-colors ${
          allSelected
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400"
        }`}>
          {allSelected && <CheckSquare className="size-3" strokeWidth={3} />}
        </div>
        <span className="text-xs font-semibold text-foreground">Select All</span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((c) => {
          const checked = selected.includes(c)
          return (
            <label key={c} className="flex items-center gap-2 p-2 rounded-[5px] border border-zinc-200 dark:border-zinc-700 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => toggle(c)}>
              <div className={`size-4 rounded-[3px] border-2 flex items-center justify-center transition-colors shrink-0 ${
                checked ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {checked && <CheckSquare className="size-3" strokeWidth={3} />}
              </div>
              <span className="text-xs text-foreground">{c}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Add User Modal
───────────────────────────────────────────── */
const EMPTY_FORM = {
  lastName: "", firstName: "", mi: "", birthDate: "",
  idNumber: "", contact: "", email: "", password: "",
  role: "", position: "",
  categories: [],
  canView: true, canEdit: false, canApprove: false, canDelete: false,
  govIdFile: null, selfieFile: null,
}

function AddUserModal({ isOpen, onClose, onSave }) {
  const [form, setForm]             = useState(EMPTY_FORM)
  const [error, setError]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(true)
  const [copied, setCopied]         = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, password: generateStaffTemporaryPassword() })
      setError("")
      setSuccessData(null)
      setCopied(false)
      setShowPassword(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const u = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError("") }

  const handleRegeneratePassword = () => {
    const nextPw = generateStaffTemporaryPassword()
    u("password", nextPw)
    setCopied(false)
  }

  const handleCopyPassword = () => {
    const pw = successData?.password || form.password
    if (pw) {
      navigator.clipboard.writeText(pw)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRoleChange = (role) => {
    setForm((f) => ({
      ...f,
      role,
      position: role === "Admin" ? "IT Staff" : "",
      // Admin gets full access by default
      canView:    true,
      canEdit:    role === "Admin",
      canApprove: role === "Admin",
      canDelete:  false,
    }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("First and last name are required."); return }
    if (!form.email.trim())                              { setError("Email address is required."); return }
    if (!form.role)                                      { setError("Please select a role."); return }
    if (form.role === "Staff" && !form.position)         { setError("Please select a position for Staff."); return }

    setLoading(true)
    try {
      const result = await createStaffUser({
        firstName:  form.firstName,
        lastName:   form.lastName,
        mi:         form.mi,
        birthDate:  form.birthDate || null,
        idNumber:   form.idNumber,
        contact:    form.contact,
        email:      form.email,
        password:   form.password,
        role:       form.role,
        position:   form.position,
        categories: form.categories,
        canView:    form.canView,
        canEdit:    form.canEdit,
        canApprove: form.canApprove,
        canDelete:  form.canDelete,
      })
      onSave(result)
      setSuccessData({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: result?.temporaryPassword || form.password,
        role: form.role,
        position: form.role === "Admin" ? "IT Staff" : form.position,
        idNumber: form.idNumber,
      })
    } catch (err) {
      setError(err.message || "Failed to create account.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
  const labelCls = "text-[11px] font-semibold text-foreground"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-4 rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-t-[5px] shrink-0 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Plus className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-heading">
                {successData ? "Staff Account Created" : "Add New User"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {successData
                  ? "Credentials generated and dispatched to official staff email."
                  : "Complete all required fields to create the account."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        {successData ? (
          /* ── Success Screen ── */
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
            {/* Icon */}
            <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Check className="size-7" strokeWidth={2.5} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Account Successfully Created</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Credentials have been emailed to <span className="font-semibold text-foreground">{successData.email}</span>. The staff member must change their password on first login.
              </p>
            </div>

            {/* Credentials card */}
            <div className="w-full max-w-sm rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-left divide-y divide-zinc-200 dark:divide-zinc-700 text-xs">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-foreground">{successData.name}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-muted-foreground">Role</span>
                <span className="font-semibold text-foreground">{successData.role}{successData.position ? ` · ${successData.position}` : ""}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">{successData.email}</span>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Temp. Password</span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {copied ? <><Check className="size-3" />Copied!</> : <><Copy className="size-3" />Copy</>}
                  </button>
                </div>
                <p className="font-mono text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[4px] px-2.5 py-1.5 text-foreground break-all select-all">
                  {showPassword ? successData.password : "•".repeat(successData.password?.length ?? 12)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/70 max-w-xs">
              Store this password securely. It will not be shown again after you close this dialog.
            </p>

            {/* Footer */}
            <div className="w-full pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-end">
              <Button type="button" variant="brand" size="sm" onClick={onClose} className="rounded-[5px] text-xs h-8 cursor-pointer">
                Done
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="p-4 sm:p-5 space-y-6">

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="size-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {/* ── Personal Information ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Personal Information</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                <div className="col-span-2 space-y-1">
                  <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.lastName} onChange={(e) => u("lastName", e.target.value)} placeholder="e.g. Dela Cruz" className={inputCls} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.firstName} onChange={(e) => u("firstName", e.target.value)} placeholder="e.g. Juan" className={inputCls} />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className={labelCls}>MI <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span></label>
                  <input type="text" maxLength={1} value={form.mi} onChange={(e) => u("mi", e.target.value.toUpperCase())} placeholder="A" className={`${inputCls} text-center`} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Birth Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.birthDate} onChange={(e) => u("birthDate", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer" />
              </div>
            </div>

            {/* ── Contact Information ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Contact Information</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={labelCls}>ID Number <span className="text-red-500">*</span></label>
                  <input type="text" value={form.idNumber} onChange={(e) => u("idNumber", e.target.value)} placeholder="e.g. 2024-00001" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Active Contact Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={form.contact} onChange={(e) => u("contact", e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
                  <p className="text-[10px] text-muted-foreground">Numbers, +, -, spaces, and parentheses only.</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} placeholder="e.g. juan@mswdo.gov.ph" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Temporary Password <span className="text-red-500">*</span></label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-800">
                    Auto-generated (Unique)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    readOnly
                    className="w-full pl-3 pr-24 py-2 text-xs font-mono font-bold rounded-[5px] border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 outline-none select-all"
                  />
                  <div className="absolute right-1.5 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      title="Generate new unique temporary password"
                      className="p-1.5 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      title="Copy temporary password"
                      className="p-1.5 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A unique temporary password has been auto-generated and will be dispatched to the staff member's email. They will be prompted to update it upon first login.
                </p>
              </div>
            </div>

            {/* ── Role & Position ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Role &amp; Position</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={labelCls}>Role <span className="text-red-500">*</span></label>
                  <select value={form.role} onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer">
                    <option value="">Select role…</option>
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Position <span className="text-red-500">*</span></label>
                  {form.role === "Admin" && (
                    <div className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 select-none">
                      IT Staff <span className="ml-1 text-[10px] text-muted-foreground">(auto-assigned)</span>
                    </div>
                  )}
                  {form.role === "Staff" && (
                    <select value={form.position} onChange={(e) => u("position", e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer">
                      <option value="">Select position…</option>
                      {STAFF_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                  {!form.role && (
                    <div className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-muted-foreground/60 select-none">
                      Select role first
                    </div>
                  )}
                </div>
              </div>
              {form.role === "Staff" && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-[5px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[10px] text-blue-700 dark:text-blue-300">
                  <Shield className="size-3.5 shrink-0 mt-0.5" />
                  <span>Staff role can be assigned to: Senior Citizen, PWD, Women's, Youth</span>
                </div>
              )}
            </div>

            {/* ── Application Category Access ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Application Category Access</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <CategorySelector
                selected={form.categories}
                onChange={(cats) => u("categories", cats)}
              />
              <p className="text-[10px] text-muted-foreground">This controls which applications the account can view, approve, or reject.</p>
            </div>

            {/* ── Access Privileges ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Access Privileges</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <PrivilegeSelector
                values={{ canView: form.canView, canEdit: form.canEdit, canApprove: form.canApprove, canDelete: form.canDelete }}
                onChange={(vals) => setForm((f) => ({ ...f, ...vals }))}
              />
              <p className="text-[10px] text-muted-foreground">These privileges determine what actions this account can perform in the system.</p>
            </div>

            {/* ── Document Verification ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Document Verification</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              {[
                { key: "govIdFile",  label: "Government ID",       required: true },
                { key: "selfieFile", label: "Selfie Verification", required: true },
              ].map((doc) => {
                const file    = form[doc.key]
                const preview = file ? URL.createObjectURL(file) : null
                return (
                  <div key={doc.key} className="space-y-1.5">
                    <label className={labelCls}>{doc.label} {doc.required && <span className="text-red-500">*</span>}</label>

                    {file ? (
                      /* ── Preview state ── */
                      <div className="relative rounded-[5px] border-2 border-blue-400 dark:border-blue-600 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={preview}
                          alt={doc.label}
                          className="w-full max-h-52 object-contain"
                          onLoad={() => URL.revokeObjectURL(preview)}
                        />
                        {/* File name bar */}
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-700">
                          <span className="text-[11px] text-foreground font-medium truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => u(doc.key, null)}
                            className="shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Empty / upload state ── */
                      <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-[5px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Drag &amp; drop or browse</span>
                        <span className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP · Max 10MB</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => u(doc.key, e.target.files?.[0] ?? null)} />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>

          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer">Cancel</Button>
            <Button type="submit" variant="brand" size="sm" disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5">
              {loading ? <><Loader2 className="size-3.5 animate-spin" />Creating…</> : "Create Account"}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Edit User & Permissions Modal
───────────────────────────────────────────── */
function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mi: "",
    birthDate: "",
    idNumber: "",
    contact: "",
    email: "",
    role: "",
    position: "",
    categories: [],
    canView: true,
    canEdit: false,
    canApprove: false,
    canDelete: false,
    isActive: true,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      const isRoleAdmin = user.position === "IT Staff" || user.role === "Admin"
      setForm({
        firstName:  user.firstName || "",
        lastName:   user.lastName || "",
        mi:         user.mi || "",
        birthDate:  user.birthDate || "",
        idNumber:   user.idNumber && user.idNumber !== "—" ? user.idNumber : "",
        contact:    user.contact && user.contact !== "—" ? user.contact : "",
        email:      user.email || "",
        role:       isRoleAdmin ? "Admin" : "Staff",
        position:   user.position || "IT Staff",
        categories: Array.isArray(user.categories) ? user.categories : [],
        canView:    user.canView ?? true,
        canEdit:    user.canEdit ?? false,
        canApprove: user.canApprove ?? false,
        canDelete:  user.canDelete ?? false,
        isActive:   user.isActive ?? true,
      })
      setError("")
    }
  }, [user, isOpen])

  if (!isOpen || !user) return null

  const u = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError("") }

  const handleRoleChange = (role) => {
    setForm((f) => ({
      ...f,
      role,
      position: role === "Admin" ? "IT Staff" : (f.position === "IT Staff" ? "" : f.position),
      canView:    true,
      canEdit:    role === "Admin" ? true : f.canEdit,
      canApprove: role === "Admin" ? true : f.canApprove,
    }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.")
      return
    }
    if (!form.role) {
      setError("Please select a role.")
      return
    }
    if (form.role === "Staff" && !form.position) {
      setError("Please select a position for Staff.")
      return
    }

    setLoading(true)
    try {
      await updateStaffUser(user.userId, {
        firstName:  form.firstName,
        lastName:   form.lastName,
        mi:         form.mi,
        birthDate:  form.birthDate || null,
        idNumber:   form.idNumber,
        contact:    form.contact,
        role:       form.role,
        position:   form.position,
        categories: form.categories,
        canView:    form.canView,
        canEdit:    form.canEdit,
        canApprove: form.canApprove,
        canDelete:  form.canDelete,
        isActive:   form.isActive,
      })
      onSave()
      onClose()
    } catch (err) {
      setError(err.message || "Failed to update staff account.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
  const labelCls = "text-[11px] font-semibold text-foreground"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-4 rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-t-[5px] shrink-0 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              avatarUrl={user?.avatarUrl}
              initials={getInitials(user?.name, user?.email)}
              name={user?.name}
              email={user?.email}
              size="size-10"
              className="rounded-[5px] shrink-0"
            />
            <div>
              <h2 className="text-sm font-bold text-foreground font-heading">Edit Staff User &amp; Permissions</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Modify role, position, category assignments, and action privileges.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="p-4 sm:p-5 space-y-6">

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="size-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {/* ── Personal Information ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Personal Information</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                <div className="col-span-2 space-y-1">
                  <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.lastName} onChange={(e) => u("lastName", e.target.value)} placeholder="e.g. Dela Cruz" className={inputCls} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.firstName} onChange={(e) => u("firstName", e.target.value)} placeholder="e.g. Juan" className={inputCls} />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className={labelCls}>MI <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span></label>
                  <input type="text" maxLength={1} value={form.mi} onChange={(e) => u("mi", e.target.value.toUpperCase())} placeholder="A" className={`${inputCls} text-center`} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Birth Date</label>
                <input type="date" value={form.birthDate} onChange={(e) => u("birthDate", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer" />
              </div>
            </div>

            {/* ── Contact & Account Details ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Contact &amp; Account</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={labelCls}>ID Number</label>
                  <input type="text" value={form.idNumber} onChange={(e) => u("idNumber", e.target.value)} placeholder="e.g. 2024-00001" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Active Contact Number</label>
                  <input type="tel" value={form.contact} onChange={(e) => u("contact", e.target.value)} placeholder="e.g. 09171234567" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Email Address <span className="text-[10px] font-normal text-muted-foreground">(System Login)</span></label>
                <input type="email" value={form.email} disabled className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 select-none cursor-not-allowed" />
                <p className="text-[10px] text-muted-foreground">User login email is bound to authentication credentials.</p>
              </div>
            </div>

            {/* ── Role & Position ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Role &amp; Position</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={labelCls}>Role <span className="text-red-500">*</span></label>
                  <select value={form.role} onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium">
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Position <span className="text-red-500">*</span></label>
                  {form.role === "Admin" && (
                    <div className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 select-none">
                      IT Staff <span className="ml-1 text-[10px] text-muted-foreground">(auto-assigned)</span>
                    </div>
                  )}
                  {form.role === "Staff" && (
                    <select value={form.position} onChange={(e) => u("position", e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer">
                      <option value="">Select position…</option>
                      {STAFF_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* ── Application Category Access ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Application Category Access</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <CategorySelector
                selected={form.categories}
                onChange={(cats) => u("categories", cats)}
              />
              <p className="text-[10px] text-muted-foreground">Controls which sectoral casework and applications this staff member can access.</p>
            </div>

            {/* ── Access Privileges ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Access Privileges (Permissions)</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <PrivilegeSelector
                values={{ canView: form.canView, canEdit: form.canEdit, canApprove: form.canApprove, canDelete: form.canDelete }}
                onChange={(vals) => setForm((f) => ({ ...f, ...vals }))}
              />
              <p className="text-[10px] text-muted-foreground">Determines allowed actions (View, Edit records, Approve casework, or Delete records).</p>
            </div>

            {/* ── Account Status ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Account Status</h3>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <label className="flex items-center justify-between p-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer select-none">
                <div>
                  <p className="text-xs font-semibold text-foreground">Active Account</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Inactive accounts cannot log in or perform casework.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => u("isActive", e.target.checked)}
                  className="size-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer">Cancel</Button>
            <Button type="submit" variant="brand" size="sm" disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5">
              {loading ? <><Loader2 className="size-3.5 animate-spin" />Saving Changes…</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Delete User Confirmation Modal
───────────────────────────────────────────── */
function DeleteUserModal({ isOpen, onClose, user, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) setError("")
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleDelete = async () => {
    setLoading(true)
    setError("")
    try {
      await deleteStaffUser(user.userId)
      onDeleted(user.userId)
      onClose()
    } catch (err) {
      setError(err.message || "Failed to delete account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="size-10 rounded-[5px] bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground font-heading">Delete Staff Account</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">This action is permanent and cannot be undone.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Are you sure you want to permanently remove this staff member?
          </p>

          <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
            <UserAvatar
              user={user}
              avatarUrl={user?.avatarUrl}
              initials={getInitials(user?.name, user?.email)}
              name={user?.name}
              email={user?.email}
              size="size-9"
              className="rounded-[5px] shrink-0"
            />
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-bold text-foreground">{user.name || user.email}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{user.email}</p>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-1.5 py-0.5 rounded-[3px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                  {user.position}
                </span>
                <span className="text-muted-foreground font-mono text-[10px]">ID: {user.idNumber}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            ⚠️ The account will be revoked immediately and all assigned access privileges will be removed.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer">
            Cancel
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5">
            {loading ? <><Loader2 className="size-3.5 animate-spin" />Deleting…</> : <><Trash2 className="size-3.5" />Delete User</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function SuperAdminUserManagementPage() {
  const { location } = useRouter()
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [isAddOpen, setIsAddOpen]   = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [search, setSearch]         = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [currentPage, setCurrentPage]   = useState(1)
  const [rowsPerPage, setRowsPerPage]   = useState(10)

  // Sync with URL query parameter from global search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get("search")
    if (searchParam !== null) {
      setSearch(searchParam)
      setCurrentPage(1)
    }
  }, [location.search])

  /* ── Load from Supabase ── */
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const data = await getStaffUsers()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  /* ── Stats ── */
  const adminCount = users.filter((u) => u.position === "IT Staff").length
  const staffCount = users.filter((u) => u.position !== "IT Staff").length
  const activeCount   = users.filter((u) => u.isActive).length
  const inactiveCount = users.filter((u) => !u.isActive).length

  /* ── Filter ── */
  const q = search.toLowerCase()
  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.idNumber.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q)
      const matchRole = !roleFilter || u.position === roleFilter
      return matchSearch && matchRole
    }),
    [users, q, roleFilter]
  )

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const displayed  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handleAddUser = async () => {
    await loadUsers()
    setCurrentPage(1)
  }

  const handleUserSaved = async () => {
    await loadUsers()
  }

  const handleUserDeleted = async (deletedUserId) => {
    setUsers((prev) => prev.filter((u) => u.userId !== deletedUserId))
    await loadUsers()
  }

  const handleToggleActive = async (u) => {
    try {
      await toggleStaffActive(u.userId, !u.isActive)
      setUsers((prev) => prev.map((x) => x.userId === u.userId ? { ...x, isActive: !u.isActive } : x))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <SuperAdminUserLayout activeTab="user-management">
      <div className="space-y-4">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <ShieldAlert className="size-3.5" />
                Access Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage staff credentials, assign roles, and configure account access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="rounded-[5px] text-xs gap-1.5 cursor-pointer h-8">
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="brand" size="sm" onClick={() => setIsAddOpen(true)} className="rounded-[5px] text-xs gap-1.5 cursor-pointer shrink-0">
              <Plus className="size-3.5" />
              Add Staff / User
            </Button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Admin Staff", count: adminCount,   icon: ShieldCheck, color: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400" },
            { label: "Field Staff",  count: staffCount,  icon: UserCog,     color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" },
            { label: "Active",      count: activeCount,  icon: Users,       color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" },
            { label: "Inactive",    count: inactiveCount,icon: Lock,        color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" },
          ].map((s) => (
            <Card key={s.label} className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                    {loading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : s.count}
                  </p>
                </div>
                <div className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Staff directory ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Staff directory</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{filtered.length} account{filtered.length !== 1 ? "s" : ""} match the current view</p>
            </div>
          </div>

          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            {/* Search + filter row */}
            <div className="px-4 pt-3 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  placeholder="Search by name, ID, email, or position…"
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setCurrentPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Positions</option>
                <option value="IT Staff">IT Staff (Admin)</option>
                {["Senior Citizen", "PWD", "Women's", "Youth"].map((p) => (
                  <option key={p} value={p}>{p} (Staff)</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">ID No.</th>
                      <th className="py-3 px-4 font-semibold">Contact</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Position</th>
                      <th className="py-3 px-4 font-semibold">Categories</th>
                      <th className="py-3 px-4 font-semibold">Privileges</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-xs text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Loading staff accounts…
                          </div>
                        </td>
                      </tr>
                    ) : displayed.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground/60">
                              <Users className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                No staff accounts found
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {search || roleFilter
                                  ? "No users match your search query or filter criteria."
                                  : "There are currently no staff accounts registered."}
                              </p>
                            </div>
                            {(search || roleFilter) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch("")
                                  setRoleFilter("")
                                  setCurrentPage(1)
                                }}
                                className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                              >
                                Clear search and filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : displayed.map((u) => {
                      const initials = getInitials(u.name, u.email)
                      return (
                        <tr key={u.userId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                user={u}
                                avatarUrl={u.avatarUrl}
                                initials={initials}
                                name={u.name}
                                email={u.email}
                                size="size-8"
                                fallbackClassName={
                                  initials === "?"
                                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 border-zinc-300 dark:border-zinc-600"
                                    : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                }
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                  <HighlightText text={u.name || u.email} highlight={search} />
                                </p>
                                {u.name && (
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    <HighlightText text={u.email} highlight={search} />
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                            <HighlightText text={u.idNumber} highlight={search} />
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            <HighlightText text={u.contact} highlight={search} />
                          </td>
                          <td className="py-3 px-4"><RoleBadge role={u.position === "IT Staff" ? "Admin" : "Staff"} /></td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <HighlightText text={u.position} highlight={search} />
                          </td>
                          {/* Categories */}
                          <td className="py-3 px-4">
                            {u.categories.length === 0 ? (
                              <span className="text-muted-foreground/60 text-[11px]">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {u.categories.map((c) => (
                                  <span key={c} className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          {/* Privileges (clickable to edit) */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              title="Click to edit permissions"
                              className="flex items-center gap-1 group cursor-pointer hover:opacity-85 transition-opacity"
                            >
                              {[
                                { label: "V", active: u.canView,    title: "View" },
                                { label: "E", active: u.canEdit,    title: "Edit" },
                                { label: "A", active: u.canApprove, title: "Approve" },
                                { label: "D", active: u.canDelete,  title: "Delete" },
                              ].map(({ label, active, title }) => (
                                <span key={label} title={title} className={`size-5 rounded-[3px] flex items-center justify-center text-[10px] font-bold border transition-colors ${
                                  active
                                    ? "bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 group-hover:border-blue-500"
                                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                                }`}>{label}</span>
                              ))}
                            </button>
                          </td>
                          <td className="py-3 px-4"><StatusBadge isActive={u.isActive} /></td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Edit User & Permissions"
                                onClick={() => setEditingUser(u)}
                                className="rounded-[5px] text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={u.isActive ? "Deactivate Account" : "Activate Account"}
                                onClick={() => handleToggleActive(u)}
                                className={`rounded-[5px] cursor-pointer ${
                                  u.isActive
                                    ? "text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                                    : "text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                }`}
                              >
                                <Lock className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Delete Staff Account"
                                onClick={() => setDeletingUser(u)}
                                className="rounded-[5px] text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={rowsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setRowsPerPage(n); setCurrentPage(1) }}
              itemLabel="staff"
            />
          </Card>
        </div>

      </div>

      {/* ── Add User Modal ── */}
      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddUser}
      />

      {/* ── Edit User & Permissions Modal ── */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={handleUserSaved}
      />

      {/* ── Delete User Confirmation Modal ── */}
      <DeleteUserModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
        onDeleted={handleUserDeleted}
      />
    </SuperAdminUserLayout>
  )
}

export default SuperAdminUserManagementPage
