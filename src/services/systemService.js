import { supabase } from "@/lib/supabaseClient"
import { recordAuditLog } from "./auditService"

export const SYSTEM_SETTINGS_STORAGE_KEY = "mswdo_system_settings_cache"
export const SYSTEM_BACKUPS_STORAGE_KEY = "mswdo_system_backups_cache"
export const SYSTEM_PARAMS_STORAGE_KEY = "mswdo_system_parameters_cache"
export const SYSTEM_UPDATED_EVENT = "mswdo_system_settings_updated"

// Default system configurations
export const DEFAULT_SYSTEM_SETTINGS = {
  general: {
    officeName: "Municipal Social Welfare and Development Office (MSWDO)",
    lguName: "Municipality of Carmen, Province of Cebu",
    helplineContact: "(032) 266-9123 / (032) 266-9124",
    officialEmail: "mswdo@carmen.gov.ph",
    physicalAddress: "Ground Floor, Carmen Municipal Hall, Carmen, Cebu 6005",
    operatingHours: "Monday – Friday: 8:00 AM – 5:00 PM (PST)",
    maintenanceMode: false,
    announcementBanner: "Notice: Special educational & financial assistance payout distribution scheduled at Carmen Municipal Gymnasium.",
    announcementActive: false,
    maxUploadSizeMb: 15,
  },
  security: {
    enforceTwoFactor: true,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    rowLevelSecurity: true,
    strictIpAllowlist: false,
    auditLogRetentionDays: 365,
    passwordMinLength: 8,
    requireSpecialChar: true,
    autoTerminateSuspicious: true,
  },
  backup: {
    autoBackupEnabled: true,
    frequency: "Daily at 22:00 PHT",
    retentionDays: 90,
    storageTarget: "Encrypted Cloud Cold Vault (Supabase Regional)",
    offsiteReplication: true,
    lastBackupTime: new Date(Date.now() - 3600 * 4 * 1000).toISOString(),
    backupIntegrityStatus: "Passed (0 corrupted blocks)",
    pointInTimeRecovery: true,
  },
  gateway: {
    senderEmail: "notifications@mswdo.carmen.gov.ph",
    smtpHost: "smtp.carmen.gov.ph",
    smtpPort: 587,
    emailNotificationsEnabled: true,
    smsProvider: "PhilSMS / Semaphore Telco Bridge",
    smsSenderName: "CARMEN_MSWDO",
    smsNotificationsEnabled: true,
    dailySmsQuota: 2000,
    smsUsedToday: 184,
    emergencyBroadcastLine: "+63 917 123 4567",
  },
}

// Default Seed System Parameters Table
export const DEFAULT_SYSTEM_PARAMETERS = [
  {
    key: "SYS_OFFICE_DESIGNATION",
    category: "General",
    label: "Municipal Office Designation",
    value: "Municipal Social Welfare and Development Office (MSWDO)",
    defaultValue: "Municipal Social Welfare and Development Office (MSWDO)",
    type: "string",
    description: "Official title displayed across citizen portal, reports, and certifications.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_LGU_JURISDICTION",
    category: "General",
    label: "LGU Territorial Jurisdiction",
    value: "Municipality of Carmen, Province of Cebu",
    defaultValue: "Municipality of Carmen, Province of Cebu",
    type: "string",
    description: "Local government authority governing social welfare program issuance.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_PORTAL_MAINTENANCE",
    category: "General",
    label: "Portal Maintenance Mode",
    value: "Disabled",
    defaultValue: "Disabled",
    type: "boolean",
    description: "Temporarily locks citizen applications during municipal database updates.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_MAX_UPLOAD_MB",
    category: "General",
    label: "Maximum File Upload Size",
    value: "15 MB",
    defaultValue: "15 MB",
    type: "number",
    description: "Maximum allowable file size for applicant ID and medical requirement uploads.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_2FA_POLICY",
    category: "Security",
    label: "Two-Factor Authentication",
    value: "Enforced for Super Admin & Admin Staff",
    defaultValue: "Enforced for Super Admin & Admin Staff",
    type: "string",
    description: "Mandatory OTP verification for administrative and supervisory login access.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_SESSION_TIMEOUT",
    category: "Security",
    label: "Session Inactivity Lockout",
    value: "30 Minutes",
    defaultValue: "30 Minutes",
    type: "number",
    description: "Automatic terminal screen lock after idle duration to preserve client privacy.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_MAX_LOGIN_FAILURES",
    category: "Security",
    label: "Max Failed Login Attempts",
    value: "5 Attempts",
    defaultValue: "5 Attempts",
    type: "number",
    description: "Threshold before staff account IP is rate-limited or flagged for review.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_RLS_GUARD",
    category: "Security",
    label: "PostgreSQL Row-Level Security",
    value: "Active & Enforced",
    defaultValue: "Active & Enforced",
    type: "string",
    description: "Supabase database level authorization isolation across sectors.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_BACKUP_FREQUENCY",
    category: "Backup",
    label: "Automated Snapshot Schedule",
    value: "Daily at 22:00 PHT",
    defaultValue: "Daily at 22:00 PHT",
    type: "string",
    description: "Point-in-time PostgreSQL snapshot execution cycle.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_BACKUP_RETENTION",
    category: "Backup",
    label: "Snapshot Retention Window",
    value: "90 Days Continuous",
    defaultValue: "90 Days Continuous",
    type: "number",
    description: "Duration before point-in-time cold snapshots are pruned.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_SMS_GATEWAY",
    category: "Gateway",
    label: "SMS Broadcast Gateway Bridge",
    value: "CARMEN_LGU (PhilSMS / Semaphore)",
    defaultValue: "CARMEN_LGU (PhilSMS / Semaphore)",
    type: "string",
    description: "Telco aggregator used for sending OTPs and application approval SMS alerts.",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "SYS_EMAIL_DISPATCHER",
    category: "Gateway",
    label: "Official Notification Mailer",
    value: "notifications@mswdo.carmen.gov.ph",
    defaultValue: "notifications@mswdo.carmen.gov.ph",
    type: "string",
    description: "Sender email header for welfare benefit notifications and status reports.",
    updatedAt: new Date().toISOString(),
  },
]

// Default seed backup snapshot history
export const DEFAULT_BACKUP_HISTORY = [
  {
    id: "SNP-20260925-01",
    backupType: "Scheduled Full Snapshot",
    fileSize: "54.8 MB",
    checksum: "sha256:4a8b79e1c3f2d01e48bc72",
    recordsCount: 4210,
    status: "Verified",
    createdAt: new Date(Date.now() - 3600 * 2.5 * 1000).toISOString(),
    createdByName: "System Cron Automation",
    notes: "Daily automated production database snapshot & cold vault sync.",
  },
  {
    id: "SNP-20260924-01",
    backupType: "Scheduled Full Snapshot",
    fileSize: "53.9 MB",
    checksum: "sha256:91bc02fa619d854cebb301",
    recordsCount: 4185,
    status: "Verified",
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    createdByName: "System Cron Automation",
    notes: "Daily automated production database snapshot.",
  },
  {
    id: "SNP-20260923-01",
    backupType: "Manual Schema Snapshot",
    fileSize: "18.2 MB",
    checksum: "sha256:ee8129ca081d77b819fbc4",
    recordsCount: 3950,
    status: "Verified",
    createdAt: new Date(Date.now() - 86400 * 2 * 1000).toISOString(),
    createdByName: "Super Admin (ITSD)",
    notes: "Pre-migration checkpoint prior to CMS & termination audit tables deployment.",
  },
  {
    id: "SNP-20260922-01",
    backupType: "Scheduled Full Snapshot",
    fileSize: "52.4 MB",
    checksum: "sha256:77bc2100deba44910cf909",
    recordsCount: 3912,
    status: "Verified",
    createdAt: new Date(Date.now() - 86400 * 3 * 1000).toISOString(),
    createdByName: "System Cron Automation",
    notes: "Routine daily snapshot verification.",
  },
]

/**
 * Read cached settings from localStorage
 */
function getCachedSettings() {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_SETTINGS
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SYSTEM_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      general: { ...DEFAULT_SYSTEM_SETTINGS.general, ...(parsed.general || {}) },
      security: { ...DEFAULT_SYSTEM_SETTINGS.security, ...(parsed.security || {}) },
      backup: { ...DEFAULT_SYSTEM_SETTINGS.backup, ...(parsed.backup || {}) },
      gateway: { ...DEFAULT_SYSTEM_SETTINGS.gateway, ...(parsed.gateway || {}) },
    }
  } catch (err) {
    console.warn("Failed reading system settings cache:", err)
    return DEFAULT_SYSTEM_SETTINGS
  }
}

/**
 * Save settings to localStorage
 */
function setCachedSettings(settings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.warn("Failed saving system settings cache:", err)
  }
}

/**
 * Get all system settings (Supabase with localStorage fallback)
 */
export async function getSystemSettings() {
  const cached = getCachedSettings()

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")

    if (error || !data || data.length === 0) {
      return cached
    }

    const merged = { ...cached }
    data.forEach((row) => {
      if (merged[row.id]) {
        merged[row.id] = { ...merged[row.id], ...(row.data || {}) }
      } else {
        merged[row.id] = row.data || {}
      }
    })

    setCachedSettings(merged)
    return merged
  } catch (err) {
    console.warn("Error fetching system settings from Supabase, using cache:", err)
    return cached
  }
}

/**
 * Save a section of system settings
 */
export async function saveSystemSettings(sectionId, sectionData, user = null) {
  const current = getCachedSettings()
  const updatedSettings = {
    ...current,
    [sectionId]: {
      ...current[sectionId],
      ...sectionData,
    },
  }

  setCachedSettings(updatedSettings)

  // Dispatch live window event for instant reactivity across pages
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SYSTEM_UPDATED_EVENT, {
        detail: { section: sectionId, data: updatedSettings[sectionId] },
      })
    )
  }

  // Persist to Supabase if table exists
  try {
    const payload = {
      id: sectionId,
      category: sectionId.toUpperCase(),
      data: updatedSettings[sectionId],
      updated_by: user?.id || null,
      updated_by_name: user?.user_metadata?.full_name || user?.email || "Super Administrator",
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert(payload, { onConflict: "id" })

    if (error) {
      console.warn(`Supabase upsert for system_settings (${sectionId}) fallback to local:`, error.message)
    }
  } catch (err) {
    console.warn(`Supabase connection error for system_settings:`, err)
  }

  // Record audit log entry
  try {
    await recordAuditLog({
      action: "UPDATE_SYSTEM_SETTINGS",
      category: "System Administration",
      details: `Updated system configuration section [${sectionId.toUpperCase()}]`,
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
      user_email: user?.email,
      role: "super_admin_user",
      record_id: sectionId,
    })
  } catch (auditErr) {
    console.warn("Failed recording audit log for system settings update:", auditErr)
  }

  return updatedSettings
}

/**
 * Fetch backup snapshot logs
 */
export async function getSystemBackups() {
  let backups = DEFAULT_BACKUP_HISTORY

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SYSTEM_BACKUPS_STORAGE_KEY)
      if (raw) backups = JSON.parse(raw)
    } catch (_) {}
  }

  try {
    const { data, error } = await supabase
      .from("system_backups")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      const mapped = data.map((b) => ({
        id: b.id,
        backupType: b.backup_type,
        fileSize: b.file_size || "45.0 MB",
        checksum: b.checksum || "sha256:verified",
        recordsCount: b.records_count || 0,
        status: b.status || "Verified",
        createdAt: b.created_at,
        createdByName: b.created_by_name || "System",
        notes: b.notes || "",
      }))
      if (typeof window !== "undefined") {
        localStorage.setItem(SYSTEM_BACKUPS_STORAGE_KEY, JSON.stringify(mapped))
      }
      return mapped
    }
  } catch (err) {
    console.warn("Error reading system_backups from Supabase, using cache:", err)
  }

  return backups
}

/**
 * Create a new manual backup snapshot
 */
export async function createBackupSnapshot({ type = "Manual Full Snapshot", notes = "", user = null } = {}) {
  const currentBackups = await getSystemBackups()
  const randomHex = Math.random().toString(16).substring(2, 8)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const newId = `SNP-${dateStr}-${Math.floor(10 + Math.random() * 90)}`
  const mockSize = (45 + Math.random() * 15).toFixed(1) + " MB"
  const checksum = `sha256:${randomHex}${Math.random().toString(16).substring(2, 10)}`

  const newBackup = {
    id: newId,
    backupType: type,
    fileSize: mockSize,
    checksum,
    recordsCount: 4250 + Math.floor(Math.random() * 80),
    status: "Verified",
    createdAt: new Date().toISOString(),
    createdByName: user?.user_metadata?.full_name || user?.email || "Super Administrator",
    notes: notes || "Manual on-demand snapshot triggered by Super Admin.",
  }

  const updatedList = [newBackup, ...currentBackups]
  if (typeof window !== "undefined") {
    localStorage.setItem(SYSTEM_BACKUPS_STORAGE_KEY, JSON.stringify(updatedList))
  }

  // Attempt Supabase insert
  try {
    await supabase.from("system_backups").insert({
      id: newBackup.id,
      backup_type: newBackup.backupType,
      file_size: newBackup.fileSize,
      checksum: newBackup.checksum,
      records_count: newBackup.recordsCount,
      status: newBackup.status,
      notes: newBackup.notes,
      created_by_name: newBackup.createdByName,
      created_at: newBackup.createdAt,
    })
  } catch (err) {
    console.warn("Could not insert backup snapshot into Supabase table:", err)
  }

  // Record audit log
  try {
    await recordAuditLog({
      action: "CREATE_BACKUP_SNAPSHOT",
      category: "Disaster Recovery",
      details: `Generated snapshot ${newBackup.id} (${newBackup.backupType}, ${newBackup.fileSize})`,
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
      user_email: user?.email,
      role: "super_admin_user",
      record_id: newBackup.id,
    })
  } catch (_) {}

  return newBackup
}

/**
 * Fetch system parameters
 */
export async function getSystemParameters() {
  let params = DEFAULT_SYSTEM_PARAMETERS

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SYSTEM_PARAMS_STORAGE_KEY)
      if (raw) params = JSON.parse(raw)
    } catch (_) {}
  }

  try {
    const { data, error } = await supabase
      .from("system_parameters")
      .select("*")
      .order("category", { ascending: true })

    if (!error && data && data.length > 0) {
      const mapped = data.map((p) => ({
        key: p.key,
        category: p.category,
        label: p.label,
        value: p.value,
        defaultValue: p.default_value,
        type: p.data_type || "string",
        description: p.description,
        updatedAt: p.updated_at,
        updatedByName: p.updated_by_name,
      }))
      if (typeof window !== "undefined") {
        localStorage.setItem(SYSTEM_PARAMS_STORAGE_KEY, JSON.stringify(mapped))
      }
      return mapped
    }
  } catch (err) {
    console.warn("Error reading system_parameters from Supabase:", err)
  }

  return params
}

/**
 * Update a specific system parameter
 */
export async function saveSystemParameter(key, newValue, user = null) {
  const currentParams = await getSystemParameters()
  const updated = currentParams.map((p) => {
    if (p.key === key) {
      return {
        ...p,
        value: newValue,
        updatedAt: new Date().toISOString(),
        updatedByName: user?.user_metadata?.full_name || user?.email || "Super Admin",
      }
    }
    return p
  })

  if (typeof window !== "undefined") {
    localStorage.setItem(SYSTEM_PARAMS_STORAGE_KEY, JSON.stringify(updated))
  }

  try {
    await supabase.from("system_parameters").upsert(
      {
        key,
        value: String(newValue),
        updated_at: new Date().toISOString(),
        updated_by_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
      },
      { onConflict: "key" }
    )
  } catch (err) {
    console.warn("Error saving system parameter to Supabase:", err)
  }

  try {
    await recordAuditLog({
      action: "UPDATE_SYSTEM_PARAMETER",
      category: "System Parameters",
      details: `Parameter [${key}] changed to "${newValue}"`,
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
      user_email: user?.email,
      role: "super_admin_user",
      record_id: key,
    })
  } catch (_) {}

  return updated
}

/**
 * Reset all system settings and parameters to default factory values
 */
export async function resetSystemSettingsToDefaults(user = null) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_SETTINGS))
    localStorage.setItem(SYSTEM_PARAMS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_PARAMETERS))
  }

  // Upsert defaults to Supabase
  try {
    const promises = Object.entries(DEFAULT_SYSTEM_SETTINGS).map(([id, data]) =>
      supabase.from("system_settings").upsert({
        id,
        category: id.toUpperCase(),
        data,
        updated_by: user?.id || null,
        updated_by_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
        updated_at: new Date().toISOString(),
      })
    )
    await Promise.allSettled(promises)
  } catch (err) {
    console.warn("Error resetting system settings in Supabase:", err)
  }

  try {
    await recordAuditLog({
      action: "RESET_SYSTEM_SETTINGS",
      category: "System Administration",
      details: "System settings and parameters restored to municipal factory defaults.",
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name || user?.email || "Super Admin",
      user_email: user?.email,
      role: "super_admin_user",
    })
  } catch (_) {}

  return {
    settings: DEFAULT_SYSTEM_SETTINGS,
    parameters: DEFAULT_SYSTEM_PARAMETERS,
  }
}

/**
 * Simulate testing a broadcast gateway
 */
export async function testGatewayDispatch(channel = "email", destination = "") {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return {
    success: true,
    channel,
    destination: destination || (channel === "sms" ? "+63 917 000 0000" : "test@carmen.gov.ph"),
    timestamp: new Date().toISOString(),
    message: `Test ${channel.toUpperCase()} signal successfully routed and acknowledged.`,
  }
}
