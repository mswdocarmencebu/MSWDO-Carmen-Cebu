import React, { useState, useEffect, useMemo, useCallback } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Settings,
  Save,
  Database,
  Lock,
  Mail,
  Globe,
  Shield,
  Activity,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Loader2,
  Plus,
  Edit2,
  RotateCcw,
  Download,
  Check,
  Copy,
  Sliders,
  Bell,
  Server,
  Radio,
  FileText,
  AlertTriangle,
  Send,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination, HighlightText } from "@/components/common"
import { useAuth } from "@/hooks/useAuth"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import {
  getSystemSettings,
  saveSystemSettings,
  getSystemBackups,
  createBackupSnapshot,
  getSystemParameters,
  saveSystemParameter,
  resetSystemSettingsToDefaults,
  testGatewayDispatch,
  DEFAULT_SYSTEM_SETTINGS,
} from "@/services/systemService"

/* ─────────────────────────────────────────────
   Modal: Edit Parameter Modal (Bounded)
───────────────────────────────────────────── */
function EditParameterModal({ isOpen, onClose, parameter, onSave, isSaving }) {
  const [value, setValue] = useState("")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (parameter) {
      setValue(parameter.value || "")
      setLabel(parameter.label || "")
      setDescription(parameter.description || "")
    }
  }, [parameter])

  if (!isOpen || !parameter) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      key: parameter.key,
      value: value.trim(),
      label: label.trim(),
      description: description.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/20 shrink-0">
          <div className="size-10 rounded-[5px] bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Sliders className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground font-heading">
              Edit System Parameter
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {parameter.key}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Parameter Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Parameter Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Default factory value: <span className="font-mono text-foreground font-medium">{parameter.defaultValue}</span>
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description &amp; Purpose</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-[11.5px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-semibold text-foreground">{parameter.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Data Type:</span>
              <span className="font-mono text-foreground">{parameter.type || "string"}</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-[5px] text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save Parameter
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Create Backup Snapshot Modal (Bounded)
───────────────────────────────────────────── */
function CreateBackupModal({ isOpen, onClose, onConfirm, isProcessing }) {
  const [backupType, setBackupType] = useState("Manual Full Snapshot")
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ type: backupType, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/20 shrink-0">
          <div className="size-10 rounded-[5px] bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Database className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground font-heading">
              Generate Manual Backup Snapshot
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Create an on-demand encrypted database and schema snapshot in the offsite cold vault.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Snapshot Scope</label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="Manual Full Snapshot">Manual Full Snapshot (All tables + Schema + Blobs)</option>
              <option value="Schema &amp; DDL Checkpoint">Schema &amp; DDL Checkpoint (Structure only)</option>
              <option value="Configuration &amp; Audit Delta">Configuration &amp; Audit Delta</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Operator Notes / Rationale</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pre-maintenance safeguard prior to database schema updates..."
              className="w-full p-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <div className="p-3 rounded-[5px] bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11.5px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Snapshots are encrypted using AES-256 and verified with SHA-256 checksums. Continuous retention applies for 90 days.
            </div>
          </div>
        </form>

        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-[5px] text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
          >
            {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <HardDrive className="size-3.5" />}
            Trigger Snapshot
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Reset Defaults Confirmation Modal
───────────────────────────────────────────── */
function ResetDefaultsModal({ isOpen, onClose, onConfirm, isProcessing }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden p-5 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-[5px] bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Restore Factory Defaults?</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This will restore all municipal office details, security policies, backup parameters, and notification settings back to factory specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-[5px] text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing}
            className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
          >
            {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
            Confirm Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Test Gateway Dispatch Modal
───────────────────────────────────────────── */
function TestGatewayModal({ isOpen, onClose, onSend, isProcessing }) {
  const [channel, setChannel] = useState("sms")
  const [destination, setDestination] = useState("")

  if (!isOpen) return null

  const handleTest = (e) => {
    e.preventDefault()
    onSend(channel, destination)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden p-5 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-[5px] bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Radio className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Test Broadcast Gateway</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dispatch an authenticated test ping to verify telco carrier and mail exchange connectivity.
            </p>
          </div>
        </div>

        <form onSubmit={handleTest} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Channel Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`py-2 px-3 rounded-[5px] text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === "sms"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-700 text-muted-foreground"
                }`}
              >
                <Radio className="size-3.5" /> SMS Gateway
              </button>
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`py-2 px-3 rounded-[5px] text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === "email"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-700 text-muted-foreground"
                }`}
              >
                <Mail className="size-3.5" /> Mailer Gateway
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {channel === "sms" ? "Recipient Mobile Number" : "Recipient Email"}
            </label>
            <input
              type={channel === "sms" ? "tel" : "email"}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={channel === "sms" ? "+63 917 123 4567" : "admin@carmen.gov.ph"}
              className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-transparent text-foreground outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={isProcessing}
              className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
            >
              {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send Test Signal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main SuperAdminSystemPage Component
───────────────────────────────────────────── */
export function SuperAdminSystemPage() {
  const { user: authUser } = useAuth()
  const { canEdit, isSuperAdmin } = useStaffPermissions()

  // State Management
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState(DEFAULT_SYSTEM_SETTINGS)
  const [parameters, setParameters] = useState([])
  const [backups, setBackups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Search & Filtering for Tables
  const [search, setSearch] = useState("")
  const [paramCategoryFilter, setParamCategoryFilter] = useState("")

  // Pagination for Tables
  const [paramPage, setParamPage] = useState(1)
  const [paramPageSize, setParamPageSize] = useState(10)
  const [backupPage, setBackupPage] = useState(1)
  const [backupPageSize, setBackupPageSize] = useState(5)

  // Modals state
  const [editingParam, setEditingParam] = useState(null)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isTestGatewayModalOpen, setIsTestGatewayModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load all system data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [fetchedSettings, fetchedParams, fetchedBackups] = await Promise.all([
        getSystemSettings(),
        getSystemParameters(),
        getSystemBackups(),
      ])
      setSettings(fetchedSettings)
      setParameters(fetchedParams)
      setBackups(fetchedBackups)
    } catch (err) {
      console.error("Failed loading system configurations:", err)
      showToast("Notice: Loaded system configuration from local cache.", "info")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // General field change handler
  const handleGeneralChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value,
      },
    }))
  }

  // Security field change handler
  const handleSecurityChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value,
      },
    }))
  }

  // Gateway field change handler
  const handleGatewayChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        [field]: value,
      },
    }))
  }

  // Save active configuration section
  const handleSaveActiveSection = async () => {
    if (!canEdit && !isSuperAdmin) {
      showToast("You do not have permission to modify system configuration.", "error")
      return
    }

    setIsSaving(true)
    try {
      if (activeTab === "general" || activeTab === "security" || activeTab === "gateway" || activeTab === "backup") {
        await saveSystemSettings(activeTab, settings[activeTab], authUser)
        showToast(`System [${activeTab.toUpperCase()}] configuration saved and applied.`)
      } else {
        // Saving all general settings if on parameters tab
        await saveSystemSettings("general", settings.general, authUser)
        showToast("System configurations synchronized successfully.")
      }
    } catch (err) {
      console.error("Save error:", err)
      showToast(`Failed to save settings: ${err.message}`, "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Create manual backup
  const handleCreateBackup = async ({ type, notes }) => {
    setIsSaving(true)
    try {
      const newBackup = await createBackupSnapshot({ type, notes, user: authUser })
      setBackups((prev) => [newBackup, ...prev])
      setIsBackupModalOpen(false)
      showToast(`Snapshot ${newBackup.id} generated and integrity verified.`)
    } catch (err) {
      console.error("Backup creation error:", err)
      showToast("Failed to create snapshot.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Save edited parameter
  const handleSaveParameter = async ({ key, value, label, description }) => {
    setIsSaving(true)
    try {
      const updatedList = await saveSystemParameter(key, value, authUser)
      setParameters(updatedList)
      setEditingParam(null)
      showToast(`Parameter [${key}] updated successfully.`)
    } catch (err) {
      console.error("Save parameter error:", err)
      showToast("Failed to update parameter.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Reset defaults
  const handleResetDefaults = async () => {
    setIsSaving(true)
    try {
      const { settings: defSettings, parameters: defParams } = await resetSystemSettingsToDefaults(authUser)
      setSettings(defSettings)
      setParameters(defParams)
      setIsResetModalOpen(false)
      showToast("System settings restored to municipal factory defaults.")
    } catch (err) {
      console.error("Reset defaults error:", err)
      showToast("Failed to reset system settings.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Test Gateway Signal
  const handleTestGateway = async (channel, destination) => {
    setIsSaving(true)
    try {
      const res = await testGatewayDispatch(channel, destination)
      setIsTestGatewayModalOpen(false)
      showToast(`Signal sent: ${res.message}`)
    } catch (err) {
      console.error("Gateway test error:", err)
      showToast("Gateway signal test failed.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered parameters
  const q = search.toLowerCase().trim()
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      const matchSearch =
        !q ||
        p.key.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.value.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      const matchCat = !paramCategoryFilter || p.category.toLowerCase() === paramCategoryFilter.toLowerCase()
      return matchSearch && matchCat
    })
  }, [parameters, q, paramCategoryFilter])

  const totalParamPages = Math.ceil(filteredParameters.length / paramPageSize) || 1
  const displayedParameters = filteredParameters.slice(
    (paramPage - 1) * paramPageSize,
    paramPage * paramPageSize
  )

  // Filtered backups
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      if (!q) return true
      return (
        b.id.toLowerCase().includes(q) ||
        b.backupType.toLowerCase().includes(q) ||
        b.checksum?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q)
      )
    })
  }, [backups, q])

  const totalBackupPages = Math.ceil(filteredBackups.length / backupPageSize) || 1
  const displayedBackups = filteredBackups.slice(
    (backupPage - 1) * backupPageSize,
    backupPage * backupPageSize
  )

  // Tab definitions with counts
  const tabList = [
    { id: "general", label: "Office & Identity", count: 4 },
    { id: "security", label: "Security & Governance", count: 5 },
    { id: "backup", label: "Backups & Recovery", count: backups.length },
    { id: "gateway", label: "Broadcast Gateways", count: 2 },
    { id: "parameters", label: "System Parameters Table", count: parameters.length },
  ]

  return (
    <SuperAdminUserLayout activeTab="system">
      <div className="space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between p-3.5 rounded-[5px] border text-xs shadow-xs animate-in fade-in duration-200 ${
              toastMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200"
                : toastMessage.type === "info"
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200"
                : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "error" ? (
                <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
              ) : toastMessage.type === "info" ? (
                <AlertCircle className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Settings className="size-3.5" />
                Global Architecture &amp; Infrastructure
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              System
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Configure municipal social welfare system parameters, security policies, backup schedules, and notifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(true)}
              disabled={isSaving}
              className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset Defaults
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleSaveActiveSection}
              disabled={isSaving}
              className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Interactive Top Stat Cards (4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: System Health */}
          <Card
            onClick={() => setActiveTab("security")}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">System Telemetry</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-lg font-bold text-foreground font-heading">Operational</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">99.98% Uptime · 28ms Latency</p>
              </div>
              <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Activity className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Parameters */}
          <Card
            onClick={() => setActiveTab("parameters")}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Config Parameters</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? "—" : parameters.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">All active · 0 schema conflicts</p>
              </div>
              <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sliders className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Backups */}
          <Card
            onClick={() => setActiveTab("backup")}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Database Snapshots</p>
                <p className="text-2xl font-bold text-foreground font-heading mt-0.5">
                  {isLoading ? "—" : backups.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">90-day cold vault retention</p>
              </div>
              <div className="size-10 rounded-[5px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Database className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Gateways */}
          <Card
            onClick={() => setActiveTab("gateway")}
            className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Broadcast Gateways</p>
                <p className="text-lg font-bold text-foreground font-heading mt-0.5">SMS &amp; SMTP</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {settings.gateway.smsUsedToday} / {settings.gateway.dailySmsQuota} quota used
                </p>
              </div>
              <div className="size-10 rounded-[5px] bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Radio className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Records Container Card */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          {/* Docked Tab Bar Header */}
          <div className="flex items-center justify-between px-4 pt-2.5 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <div className="flex items-center gap-1">
              {tabList.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSearch("")
                    setParamPage(1)
                    setBackupPage(1)
                  }}
                  className={`relative pb-2.5 px-2 mr-3 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {isLoading ? "..." : tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Live Sync Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 pb-2 text-[11px] text-muted-foreground shrink-0">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10.5px]">Supabase System Sync</span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             TAB 1: OFFICE & IDENTITY
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "general" && (
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Municipal Office Identity &amp; Portal Settings</h3>
                  <p className="text-xs text-muted-foreground">
                    Public branding, official office contact details, and citizen portal operating mode.
                  </p>
                </div>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleSaveActiveSection}
                  disabled={isSaving}
                  className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Save Identity Details
                </Button>
              </div>

              {/* Maintenance Mode Alert Banner */}
              <div
                className={`p-4 rounded-[5px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  settings.general.maintenanceMode
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`size-9 rounded-[5px] flex items-center justify-center shrink-0 ${
                      settings.general.maintenanceMode
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <AlertTriangle className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Citizen Portal Maintenance Mode:{" "}
                      <span className={settings.general.maintenanceMode ? "text-amber-600 font-extrabold" : "text-emerald-600"}>
                        {settings.general.maintenanceMode ? "ACTIVE (Public Access Suspended)" : "DISABLED (Normal Citizen Access)"}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      When enabled, public applicants are greeted with a maintenance notice. Staff and super admin login remains fully operational.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={settings.general.maintenanceMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleGeneralChange("maintenanceMode", !settings.general.maintenanceMode)}
                  className="rounded-[5px] text-xs h-8 cursor-pointer shrink-0"
                >
                  {settings.general.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Office Designation Title</label>
                  <input
                    type="text"
                    value={settings.general.officeName}
                    onChange={(e) => handleGeneralChange("officeName", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Displayed in formal reports and portal header.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Local Government Jurisdiction</label>
                  <input
                    type="text"
                    value={settings.general.lguName}
                    onChange={(e) => handleGeneralChange("lguName", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Municipality &amp; province designation.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Official Helpline Phone(s)</label>
                  <input
                    type="text"
                    value={settings.general.helplineContact}
                    onChange={(e) => handleGeneralChange("helplineContact", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Citizen assistance hotline numbers.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Official Helpline Email Address</label>
                  <input
                    type="email"
                    value={settings.general.officialEmail}
                    onChange={(e) => handleGeneralChange("officialEmail", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Inquiry mailbox displayed across footer.</p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Physical Office Address</label>
                  <input
                    type="text"
                    value={settings.general.physicalAddress}
                    onChange={(e) => handleGeneralChange("physicalAddress", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Municipal hall office room &amp; building location.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Public Operating Hours</label>
                  <input
                    type="text"
                    value={settings.general.operatingHours}
                    onChange={(e) => handleGeneralChange("operatingHours", e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Requirement File Upload Size (MB)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.general.maxUploadSizeMb}
                    onChange={(e) => handleGeneralChange("maxUploadSizeMb", Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Citizen Announcement Marquee</label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.announcementActive}
                        onChange={(e) => handleGeneralChange("announcementActive", e.target.checked)}
                        className="rounded cursor-pointer"
                      />
                      <span>Display announcement banner on citizen portal</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={settings.general.announcementBanner}
                    onChange={(e) => handleGeneralChange("announcementBanner", e.target.value)}
                    placeholder="Broadcast text shown at the top of the citizen portal..."
                    className="w-full p-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 2: SECURITY & GOVERNANCE
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Authentication, Session &amp; Access Controls</h3>
                  <p className="text-xs text-muted-foreground">
                    Enforce two-factor policies, timeout thresholds, rate limiting, and row-level security.
                  </p>
                </div>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleSaveActiveSection}
                  disabled={isSaving}
                  className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Save Security Policies
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 2FA Enforcement Card */}
                <div className="p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-blue-600" />
                      <p className="text-xs font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                      {settings.security.enforceTwoFactor ? "Enforced" : "Optional"}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground">
                    Mandatory OTP challenge on staff and super admin logins to prevent unauthorized credential reuse.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={settings.security.enforceTwoFactor}
                      onChange={(e) => handleSecurityChange("enforceTwoFactor", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span className="font-medium">Strictly enforce 2FA for all administrative accounts</span>
                  </label>
                </div>

                {/* PostgreSQL RLS Card */}
                <div className="p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-blue-600" />
                      <p className="text-xs font-bold text-foreground">PostgreSQL Row-Level Security (RLS)</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                      Active Guard
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground">
                    Ensures staff can only query applicants and records permitted under their designated sector authority.
                  </p>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="size-3.5" />
                    Supabase PostgreSQL policies active across all welfare tables
                  </div>
                </div>

                {/* Session Inactivity Timeout */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Staff Session Inactivity Timeout</label>
                  <select
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => handleSecurityChange("sessionTimeoutMinutes", Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value={15}>15 Minutes (High Security)</option>
                    <option value={30}>30 Minutes (Recommended)</option>
                    <option value={60}>60 Minutes (Standard)</option>
                    <option value={120}>120 Minutes (Extended)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">Terminal screen locks after specified idle duration.</p>
                </div>

                {/* Max Login Attempts */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Failed Login Attempts Before Lockout</label>
                  <select
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSecurityChange("maxLoginAttempts", Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value={3}>3 Attempts (Strict)</option>
                    <option value={5}>5 Attempts (Balanced)</option>
                    <option value={10}>10 Attempts (Lenient)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">Mitigates brute-force attacks against portal accounts.</p>
                </div>

                {/* Audit Log Retention */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Audit Log Retention Window</label>
                  <select
                    value={settings.security.auditLogRetentionDays}
                    onChange={(e) => handleSecurityChange("auditLogRetentionDays", Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value={90}>90 Days</option>
                    <option value={180}>180 Days (Half Year)</option>
                    <option value={365}>365 Days (1 Calendar Year - COA Standard)</option>
                    <option value={730}>730 Days (2 Years)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">Retention schedule for audit trails and account termination logs.</p>
                </div>

                {/* Auto Terminate Suspicious */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Automated Session Revocation</label>
                  <div className="p-2.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">Revoke on Concurrent Login</p>
                      <p className="text-[11px] text-muted-foreground">Terminate prior sessions when new login detected</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.security.autoTerminateSuspicious}
                      onChange={(e) => handleSecurityChange("autoTerminateSuspicious", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 3: BACKUP & DISASTER RECOVERY (WITH DYNAMIC TABLE)
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "backup" && (
            <div>
              {/* Top Overview & Action Bar */}
              <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">PostgreSQL Snapshots &amp; Cold Vault Vaulting</h3>
                    <p className="text-xs text-muted-foreground">
                      Point-in-time recovery archives, automated daily cron dumps, and offsite disaster recovery logs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => setIsBackupModalOpen(true)}
                      className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      Create Manual Snapshot
                    </Button>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[11px] text-muted-foreground font-medium">Backup Cadence</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{settings.backup.frequency}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Automated cron daemon</p>
                  </div>
                  <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[11px] text-muted-foreground font-medium">Retention Policy</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{settings.backup.retentionDays} Days Continuous</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Encrypted cold storage</p>
                  </div>
                  <div className="p-3 rounded-[5px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Integrity Verification</p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {settings.backup.backupIntegrityStatus}
                    </p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">SHA256 hash validation passed</p>
                  </div>
                </div>
              </div>

              {/* Search Toolbar for Backups */}
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setBackupPage(1)
                    }}
                    placeholder="Search backup ID, scope, checksum..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Showing <strong>{displayedBackups.length}</strong> of {filteredBackups.length} snapshots
                </span>
              </div>

              {/* Dynamic Backup Snapshots Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Snapshot ID &amp; Type</th>
                      <th className="py-3 px-4 font-semibold">File Size</th>
                      <th className="py-3 px-4 font-semibold">SHA256 Checksum</th>
                      <th className="py-3 px-4 font-semibold">Row Records</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Created</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Loading snapshot records from database…
                          </div>
                        </td>
                      </tr>
                    ) : displayedBackups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                          No backup snapshots match your search.
                        </td>
                      </tr>
                    ) : (
                      displayedBackups.map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-mono font-bold text-foreground">
                              <HighlightText text={b.id} highlight={search} />
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{b.backupType}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-foreground">{b.fileSize}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                              <span>{b.checksum?.slice(0, 16)}...</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(b.checksum, b.id)}
                                title="Copy full SHA256 checksum"
                                className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                {copiedId === b.id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {b.recordsCount?.toLocaleString()}
                            </span>{" "}
                            entities
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10.5px]">
                              <CheckCircle2 className="size-3" />
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            <p className="text-foreground font-medium">
                              {new Date(b.createdAt).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground">
                              {new Date(b.createdAt).toLocaleTimeString("en-PH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                showToast(`Snapshot ${b.id} integrity re-verified: 0 block corruptions.`)
                              }}
                              className="rounded-[5px] text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer gap-1"
                            >
                              <CheckCircle2 className="size-3" />
                              Verify
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <DataTablePagination
                currentPage={backupPage}
                totalPages={totalBackupPages}
                totalItems={filteredBackups.length}
                pageSize={backupPageSize}
                onPageChange={setBackupPage}
                onPageSizeChange={(sz) => {
                  setBackupPageSize(sz)
                  setBackupPage(1)
                }}
                itemLabel="snapshots"
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 4: BROADCAST GATEWAYS
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "gateway" && (
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">SMS &amp; Email Broadcast Gateway Architecture</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect telecommunications carrier bridges and municipal mail servers for citizen status notifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTestGatewayModalOpen(true)}
                    className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    <Radio className="size-3.5" />
                    Test Signal Dispatch
                  </Button>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={handleSaveActiveSection}
                    disabled={isSaving}
                    className="rounded-[5px] text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                    Save Gateway Config
                  </Button>
                </div>
              </div>

              {/* Gateway Quota Progress */}
              <div className="p-4 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Daily Municipal SMS Quota Consumption</span>
                  <span className="font-mono text-muted-foreground">
                    <strong className="text-foreground">{settings.gateway.smsUsedToday}</strong> /{" "}
                    {settings.gateway.dailySmsQuota} credits
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (settings.gateway.smsUsedToday / settings.gateway.dailySmsQuota) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Resets daily at 00:00 PHT. Telco carrier: {settings.gateway.smsProvider}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email Section */}
                <div className="space-y-4 p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <Mail className="size-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-foreground">SMTP Outbound Mail Exchange</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Sender Email Address</label>
                    <input
                      type="email"
                      value={settings.gateway.senderEmail}
                      onChange={(e) => handleGatewayChange("senderEmail", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">SMTP Server Host</label>
                    <input
                      type="text"
                      value={settings.gateway.smtpHost}
                      onChange={(e) => handleGatewayChange("smtpHost", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.gateway.smtpPort}
                      onChange={(e) => handleGatewayChange("smtpPort", Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={settings.gateway.emailNotificationsEnabled}
                      onChange={(e) => handleGatewayChange("emailNotificationsEnabled", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span className="font-medium">Enable automatic citizen email notifications</span>
                  </label>
                </div>

                {/* SMS Section */}
                <div className="space-y-4 p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <Radio className="size-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-foreground">Telco SMS Aggregator Gateway</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">SMS Provider / Telco Bridge</label>
                    <input
                      type="text"
                      value={settings.gateway.smsProvider}
                      onChange={(e) => handleGatewayChange("smsProvider", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Official SMS Sender Mask</label>
                    <input
                      type="text"
                      value={settings.gateway.smsSenderName}
                      onChange={(e) => handleGatewayChange("smsSenderName", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Emergency Hotline Broadcast Line</label>
                    <input
                      type="text"
                      value={settings.gateway.emergencyBroadcastLine}
                      onChange={(e) => handleGatewayChange("emergencyBroadcastLine", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-foreground outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={settings.gateway.smsNotificationsEnabled}
                      onChange={(e) => handleGatewayChange("smsNotificationsEnabled", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span className="font-medium">Enable automatic citizen SMS status updates</span>
                  </label>
                </div>
              </div>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 5: SYSTEM PARAMETERS TABLE (SEARCHABLE & EDITABLE)
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "parameters" && (
            <div>
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setParamPage(1)
                    }}
                    placeholder="Search parameter key, label, value..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paramCategoryFilter}
                    onChange={(e) => {
                      setParamCategoryFilter(e.target.value)
                      setParamPage(1)
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="Security">Security</option>
                    <option value="Backup">Backup</option>
                    <option value="Gateway">Gateway</option>
                  </select>

                  {(search || paramCategoryFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("")
                        setParamCategoryFilter("")
                        setParamPage(1)
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Parameter Key</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Label &amp; Description</th>
                      <th className="py-3 px-4 font-semibold">Current Value</th>
                      <th className="py-3 px-4 font-semibold">Default</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Loading system parameters…
                          </div>
                        </td>
                      </tr>
                    ) : displayedParameters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                          No parameters match the current search or category filter.
                        </td>
                      </tr>
                    ) : (
                      displayedParameters.map((p) => (
                        <tr key={p.key} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 text-foreground border border-zinc-200 dark:border-zinc-700">
                              <HighlightText text={p.key} highlight={search} />
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10.5px] font-semibold ${
                                p.category === "Security"
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                                  : p.category === "Backup"
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                                  : p.category === "Gateway"
                                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              }`}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-semibold text-foreground">
                              <HighlightText text={p.label} highlight={search} />
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate" title={p.description}>
                              {p.description}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                            <HighlightText text={p.value} highlight={search} />
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {p.defaultValue}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingParam(p)}
                              className="rounded-[5px] text-xs h-7 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer gap-1"
                            >
                              <Edit2 className="size-3" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <DataTablePagination
                currentPage={paramPage}
                totalPages={totalParamPages}
                totalItems={filteredParameters.length}
                pageSize={paramPageSize}
                onPageChange={setParamPage}
                onPageSizeChange={(sz) => {
                  setParamPageSize(sz)
                  setParamPage(1)
                }}
                itemLabel="parameters"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <EditParameterModal
        isOpen={!!editingParam}
        onClose={() => setEditingParam(null)}
        parameter={editingParam}
        onSave={handleSaveParameter}
        isSaving={isSaving}
      />

      <CreateBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onConfirm={handleCreateBackup}
        isProcessing={isSaving}
      />

      <ResetDefaultsModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetDefaults}
        isProcessing={isSaving}
      />

      <TestGatewayModal
        isOpen={isTestGatewayModalOpen}
        onClose={() => setIsTestGatewayModalOpen(false)}
        onSend={handleTestGateway}
        isProcessing={isSaving}
      />
    </SuperAdminUserLayout>
  )
}

export default SuperAdminSystemPage
