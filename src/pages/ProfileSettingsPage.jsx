import React, { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  User,
  ShieldCheck,
  KeyRound,
  Settings,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  HeartHandshake,
  Users2,
  Camera,
  Trash2,
  Phone,
  Building2,
  Shield,
  Loader2,
  CheckCheck,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SignOutDialog } from "@/components/common/SignOutDialog"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import { AdminStaffLayout } from "@/layouts/admin_staff/AdminStaffLayout"
import { ApplicantUserLayout } from "@/layouts/applicant_user/ApplicantUserLayout"
import { registerUserAvatar } from "@/services/avatarService"

export function ProfileSettingsPage() {
  const { user, profile, role, signOut, updateProfileState, refreshProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const currentTab = searchParams.get("tab") || "overview"
  const setTab = (tabId) => setSearchParams({ tab: tabId })

  // Personal details
  const [fullName, setFullName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [position, setPosition] = useState("")
  const [officeAssignment, setOfficeAssignment] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null)

  // Password form
  const [newPassword, setNewPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  // Sign out modal
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Sync profile state
  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || "")
      setContactNumber(
        profile?.roleDetails?.contact_number ||
        user?.user_metadata?.contact_number ||
        ""
      )
      setPosition(
        profile?.roleDetails?.position ||
        profile?.roleDetails?.staff_tier ||
        profile?.roleDetails?.admin_level ||
        user?.user_metadata?.position ||
        ""
      )
      setOfficeAssignment(
        profile?.roleDetails?.office_assignment ||
        profile?.roleDetails?.assigned_cluster ||
        profile?.roleDetails?.barangay ||
        user?.user_metadata?.office_assignment ||
        ""
      )
      const savedAvatar =
        profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        (user?.id ? localStorage.getItem(`mswdo_avatar_${user.id}`) : null) ||
        (user?.email ? localStorage.getItem(`mswdo_avatar_${user.email.toLowerCase()}`) : null) ||
        ""
      setAvatarUrl(savedAvatar)
    }
  }, [profile, user])

  const displayName = fullName || profile?.full_name || user?.email?.split("@")[0] || "User"
  const userEmail = profile?.email || user?.email || ""
  const createdAtFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—"

  // Role configuration
  const roleMeta = {
    super_admin_user: {
      name: "Super Admin",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      accentGrad: "from-blue-600 via-sky-600 to-indigo-700",
      icon: ShieldCheck,
      permissions: [
        { label: "Policy & Program Configuration", allowed: true },
        { label: "Staff & User Account Provisioning", allowed: true },
        { label: "Financial Grant & Disbursement Audit", allowed: true },
        { label: "RLS & Audit Trail Oversight", allowed: true },
        { label: "Cross-Barangay Assistance Coordination", allowed: true },
      ],
    },
    admin_staff: {
      name: "Admin Staff",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      accentGrad: "from-blue-700 via-indigo-600 to-blue-800",
      icon: Users2,
      permissions: [
        { label: "Beneficiary Intake & Profile Management", allowed: true },
        { label: "AICS & Welfare Assistance Assessment", allowed: true },
        { label: "Indigency & Document Verification", allowed: true },
        { label: "Disbursement Roll Processing", allowed: true },
        { label: "System Security & Master Admin", allowed: false },
      ],
    },
    applicant_user: {
      name: "Applicant",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      accentGrad: "from-emerald-700 via-teal-600 to-emerald-800",
      icon: HeartHandshake,
      permissions: [
        { label: "Application Filing & Status Tracking", allowed: true },
        { label: "Documentary Requirement Submissions", allowed: true },
        { label: "Service Requests & Inquiries", allowed: true },
        { label: "Barangay Intake Override", allowed: false },
        { label: "Administrative Controls", allowed: false },
      ],
    },
    itsd: {
      name: "Super Admin",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      accentGrad: "from-blue-600 via-sky-600 to-indigo-700",
      icon: ShieldCheck,
      permissions: [
        { label: "Policy & Program Configuration", allowed: true },
        { label: "Staff & User Account Provisioning", allowed: true },
        { label: "Financial Grant & Disbursement Audit", allowed: true },
        { label: "RLS & Audit Trail Oversight", allowed: true },
        { label: "Cross-Barangay Assistance Coordination", allowed: true },
      ],
    },
    inventory_staff: {
      name: "Admin Staff",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      accentGrad: "from-blue-700 via-indigo-600 to-blue-800",
      icon: Users2,
      permissions: [
        { label: "Beneficiary Intake & Profile Management", allowed: true },
        { label: "AICS & Welfare Assistance Assessment", allowed: true },
        { label: "Indigency & Document Verification", allowed: true },
        { label: "Disbursement Roll Processing", allowed: true },
        { label: "System Security & Master Admin", allowed: false },
      ],
    },
    end_user: {
      name: "Applicant",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      accentGrad: "from-emerald-700 via-teal-600 to-emerald-800",
      icon: HeartHandshake,
      permissions: [
        { label: "Application Filing & Status Tracking", allowed: true },
        { label: "Documentary Requirement Submissions", allowed: true },
        { label: "Service Requests & Inquiries", allowed: true },
        { label: "Barangay Intake Override", allowed: false },
        { label: "Administrative Controls", allowed: false },
      ],
    },
  }

  const currentRole = roleMeta[role] || roleMeta.applicant_user
  const RoleIcon = currentRole.icon
  const isSuperAdmin = role === "super_admin_user" || role === "itsd"
  const isAdminStaff = role === "admin_staff" || role === "inventory_staff"

  // Password strength
  const passwordChecks = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
  }), [newPassword])

  const passedChecksCount = Object.values(passwordChecks).filter(Boolean).length
  const isStrengthValid = passedChecksCount >= 4 && passwordChecks.minLength
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmitPassword = isStrengthValid && isMatch && currentPassword.length > 0 && !isUpdatingPassword

  const strengthLabel = useMemo(() => {
    if (!newPassword) return { text: "", barClass: "bg-zinc-200 dark:bg-zinc-700", width: "0%" }
    if (passedChecksCount <= 2) return { text: "Weak", barClass: "bg-rose-500", width: "33%" }
    if (passedChecksCount <= 3) return { text: "Fair", barClass: "bg-amber-500", width: "66%" }
    return { text: "Strong", barClass: "bg-blue-500", width: "100%" }
  }, [newPassword, passedChecksCount])

  // Avatar upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Please select an image file (PNG, JPG, or WEBP)." })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Image must be under 5MB." })
      return
    }
    setIsUploadingAvatar(true)
    setProfileMessage(null)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target.result
        setAvatarUrl(base64Data)
        if (user?.id) localStorage.setItem(`mswdo_avatar_${user.id}`, base64Data)
        if (userEmail) localStorage.setItem(`mswdo_avatar_${userEmail.toLowerCase()}`, base64Data)
        let finalUrl = base64Data
        try {
          const fileExt = file.name.split(".").pop() || "jpg"
          const filePath = `avatars/${user?.id || "profile"}_${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from("application-documents")
            .upload(filePath, file, { upsert: true, cacheControl: "3600" })
          if (!uploadError) {
            const { data: pubData } = supabase.storage
              .from("application-documents")
              .getPublicUrl(filePath)
            if (pubData?.publicUrl) {
              finalUrl = pubData.publicUrl
              setAvatarUrl(finalUrl)
              if (user?.id) localStorage.setItem(`mswdo_avatar_${user.id}`, finalUrl)
              if (userEmail) localStorage.setItem(`mswdo_avatar_${userEmail.toLowerCase()}`, finalUrl)
            }
          }
        } catch (_) { }
        await supabase.auth.updateUser({ data: { avatar_url: finalUrl } })
        if (user?.id) {
          try { await supabase.from("users").update({ avatar_url: finalUrl }).eq("id", user.id) } catch (_) { }
        }
        updateProfileState?.({ avatar_url: finalUrl })
        registerUserAvatar({
          userId: user?.id,
          email: userEmail,
          name: fullName || displayName,
          avatarUrl: finalUrl,
        })
        setIsUploadingAvatar(false)
        setProfileMessage({ type: "success", text: "Profile picture updated." })
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setIsUploadingAvatar(false)
      setProfileMessage({ type: "error", text: err.message || "Upload failed." })
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    setProfileMessage(null)
    try {
      setAvatarUrl("")
      if (user?.id) localStorage.removeItem(`mswdo_avatar_${user.id}`)
      if (userEmail) localStorage.removeItem(`mswdo_avatar_${userEmail.toLowerCase()}`)
      await supabase.auth.updateUser({ data: { avatar_url: null } })
      if (user?.id) {
        try { await supabase.from("users").update({ avatar_url: null }).eq("id", user.id) } catch (_) { }
      }
      updateProfileState?.({ avatar_url: null })
      setProfileMessage({ type: "success", text: "Profile picture removed." })
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message || "Remove failed." })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Update personal details
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setIsUpdatingProfile(true)
    setProfileMessage(null)
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          contact_number: contactNumber.trim(),
          position: position.trim(),
          office_assignment: officeAssignment.trim(),
        },
      })
      if (authError) throw authError

      if (user?.id) {
        try { await supabase.from("users").update({ full_name: fullName.trim() }).eq("id", user.id) } catch (_) { }
        if (isSuperAdmin) {
          try {
            await supabase.from("super_admin_users")
              .update({ office_assignment: officeAssignment.trim(), admin_level: position.trim() || undefined })
              .eq("user_id", user.id)
          } catch (_) { }
        } else if (isAdminStaff) {
          try {
            await supabase.from("admin_staff_users")
              .update({ contact_number: contactNumber.trim(), position: position.trim(), assigned_cluster: officeAssignment.trim(), updated_at: new Date().toISOString() })
              .eq("user_id", user.id)
          } catch (_) { }
        } else {
          try {
            await supabase.from("applicant_users").update({ barangay: officeAssignment.trim() }).eq("user_id", user.id)
          } catch (_) { }
        }
      }

      updateProfileState?.({
        full_name: fullName.trim(),
        roleDetails: {
          ...(profile?.roleDetails || {}),
          contact_number: contactNumber.trim(),
          position: position.trim(),
          office_assignment: officeAssignment.trim(),
          assigned_cluster: officeAssignment.trim(),
          barangay: officeAssignment.trim(),
        },
      })
      // Do NOT call refreshProfile() here — it re-fetches public.users from DB which may
      // have stale data for applicants (RLS prevents them from writing full_name there),
      // causing the auth.updateUser change to be overwritten and the field to snap back.
      setProfileMessage({ type: "success", text: "Profile details updated." })
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message || "Update failed." })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Please enter your current password to continue." })
      return
    }
    if (!isStrengthValid) {
      setPasswordMessage({ type: "error", text: "New password does not meet strength requirements." })
      return
    }
    if (!isMatch) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." })
      return
    }
    if (currentPassword === newPassword) {
      setPasswordMessage({ type: "error", text: "New password must be different from your current password." })
      return
    }

    setIsUpdatingPassword(true)
    try {
      // 1. Verify current password via RPC (bcrypt compare — no new login attempt)
      let isCurrentPasswordValid = false
      try {
        const { data: verified, error: verifyRpcError } = await supabase.rpc(
          "verify_user_password",
          { p_password: currentPassword }
        )
        if (verifyRpcError) throw verifyRpcError
        isCurrentPasswordValid = verified === true
      } catch (rpcErr) {
        // RPC not deployed yet — fallback to re-auth
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: userEmail?.trim(),
          password: currentPassword,
        })
        isCurrentPasswordValid = !signInErr
      }

      if (!isCurrentPasswordValid) {
        setPasswordMessage({ type: "error", text: "Current password is incorrect. Please try again." })
        setIsUpdatingPassword(false)
        return
      }

      // 2. Update to new password
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          must_change_password: false,
          has_permanent_password: true,
          temporary_password: null,
          password_updated_at: new Date().toISOString(),
        },
      })
      if (pwdError) throw pwdError

      try { await supabase.rpc("reset_user_password_by_email", { p_email: userEmail, p_new_password: newPassword }) } catch (_) { }
      try { await supabase.rpc("complete_staff_password_setup", { p_new_password: newPassword }) } catch (_) { }
      try { await supabase.rpc("complete_initial_password_setup", { p_new_password: newPassword }) } catch (_) { }

      if (user?.id) {
        const pwdPatch = { must_change_password: false, temporary_password: null, updated_at: new Date().toISOString() }
        try { await supabase.from("admin_staff_users").update(pwdPatch).eq("user_id", user.id) } catch (_) { }
        try { await supabase.from("super_admin_users").update(pwdPatch).eq("user_id", user.id) } catch (_) { }
        try { await supabase.from("applicant_users").update({ must_change_password: false, temporary_password: null }).eq("user_id", user.id) } catch (_) { }
        localStorage.setItem(`mswdo_staff_pwd_set_${user.id}`, "true")
      }
      if (userEmail) localStorage.setItem(`mswdo_staff_pwd_set_${userEmail.toLowerCase()}`, "true")

      setPasswordMessage({ type: "success", text: "Password updated successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to update password." })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutModal(false)
    navigate("/signin")
  }

  const LayoutComponent = isSuperAdmin
    ? SuperAdminUserLayout
    : isAdminStaff
      ? AdminStaffLayout
      : ApplicantUserLayout

  const tabs = [
    { id: "overview", label: "Profile & Identity", icon: User },
    { id: "credentials", label: "Credentials & Access", icon: KeyRound },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "settings", label: "Account Settings", icon: Settings },
  ]

  const InlineAlert = ({ message }) => {
    if (!message) return null
    const isSuccess = message.type === "success"
    return (
      <div className={`flex items-center gap-2.5 p-3 rounded-[5px] text-xs font-medium border ${isSuccess
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
        }`}>
        {isSuccess ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
        <span>{message.text}</span>
      </div>
    )
  }

  return (
    <LayoutComponent activeTab="profile">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
      <SignOutDialog
        open={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isSigningOut}
      />

      <div className="space-y-5">
        {/* Header Banner */}
        <div className={`p-6 sm:p-7 rounded-[5px] bg-gradient-to-r ${currentRole.accentGrad} text-white shadow-md relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <RoleIcon className="size-40" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="size-16 sm:size-[72px] rounded-[5px] bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-extrabold text-2xl shadow overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white rounded-[5px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Camera className="size-4" />
                  <span className="text-[10px] font-bold">Change</span>
                </button>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{displayName}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[5px] bg-white/20 border border-white/30">
                    <RoleIcon className="size-3" />
                    {currentRole.name}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">{userEmail}</p>
                <div className="flex items-center gap-3 text-[11px] text-white/70 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="size-3" /> Member since {createdAtFormatted}</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> RLS Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-px">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-[5px] border-b-2 transition-colors cursor-pointer shrink-0 ${currentTab === id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: Profile & Identity ── */}
        {currentTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Personal Details Form */}
              <div className="lg:col-span-2">
                <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Personal Details</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your name, contact, and office information.</p>
                  </div>
                  <InlineAlert message={profileMessage} />
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Full Legal Name <span className="text-red-500">*</span></label>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          required
                          className="h-9 rounded-[5px] text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Primary Email</label>
                        <div className="flex items-center gap-2 h-9 px-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span>{userEmail}</span>
                          <span className="ml-auto text-[10px] font-semibold text-zinc-400">Read-only</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Phone className="size-3.5" />Contact Number</label>
                        <Input
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="e.g. 09XXXXXXXXX"
                          className="h-9 rounded-[5px] text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {isSuperAdmin ? <Shield className="size-3.5" /> : <Users2 className="size-3.5" />}
                          {isSuperAdmin ? "Admin Level" : isAdminStaff ? "Staff Position / Title" : "Category"}
                        </label>
                        <Input
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="e.g. Youth, AICS Officer"
                          className="h-9 rounded-[5px] text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Building2 className="size-3.5" />
                          {isAdminStaff ? "Assigned Office / Cluster" : isSuperAdmin ? "Office Assignment" : "Barangay"}
                        </label>
                        <Input
                          value={officeAssignment}
                          onChange={(e) => setOfficeAssignment(e.target.value)}
                          placeholder="e.g. Poblacion & Cluster Barangays"
                          className="h-9 rounded-[5px] text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="brand"
                      size="sm"
                      disabled={isUpdatingProfile || !fullName.trim()}
                      className="h-9 rounded-[5px] text-xs font-semibold cursor-pointer"
                    >
                      {isUpdatingProfile ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
                      {isUpdatingProfile ? "Saving…" : "Save Changes"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Right: Avatar + Role Card */}
              <div className="space-y-5">
                {/* Avatar */}
                <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-foreground">Profile Picture</h3>
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-20 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center text-2xl font-black text-muted-foreground">
                      {avatarUrl ? <img src={avatarUrl} alt={displayName} className="size-full object-cover" /> : displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs rounded-[5px] cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Camera className="size-3.5 mr-1" />}
                        Upload
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-[5px] text-red-500 hover:text-red-600 hover:border-red-300 cursor-pointer"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">JPG, PNG, or WEBP · max 5MB</p>
                  </div>
                </div>

                {/* Role Info */}
                <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-foreground">Role & Access</h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: "Role", value: currentRole.name },
                      ...(position ? [{ label: isSuperAdmin ? "Admin Level" : "Position", value: position }] : []),
                      ...(officeAssignment ? [{ label: isAdminStaff ? "Assigned Office" : isSuperAdmin ? "Office" : "Barangay", value: officeAssignment }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-medium text-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Credentials & Access ── */}
        {currentTab === "credentials" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Login Credentials Info */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Authentication Credentials</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Your system login identity details.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Primary Login Email", value: userEmail, icon: Mail },
                    { label: "System Username", value: userEmail?.split("@")[0] || "—", icon: User },
                    { label: "Password Mechanism", value: "Bcrypt (GoTrue Managed)", icon: Lock },
                    { label: "Security Policy", value: "PostgreSQL RLS Protected", icon: Shield },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="size-3.5 shrink-0" />
                        <span>{label}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTab("password")}
                  className="h-8 text-xs rounded-[5px] cursor-pointer font-semibold"
                >
                  <KeyRound className="size-3.5 mr-1.5" />Change Password
                </Button>
              </div>

              {/* RBAC Permissions */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Access Permissions</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Enforced on the {currentRole.name} role.</p>
                </div>
                <div className="space-y-2">
                  {currentRole.permissions.map(({ label, allowed }) => (
                    <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <span className="text-xs text-foreground">{label}</span>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${allowed
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        }`}>
                        {allowed ? <CheckCheck className="size-3" /> : <X className="size-3" />}
                        {allowed ? "Permitted" : "Restricted"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <ShieldCheck className="size-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Account Status</p>
                    <p className="text-[11px] text-muted-foreground">Active · {currentRole.name} · RLS Enforced</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Change Password ── */}
        {currentTab === "password" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <div className="max-w-xl mx-auto">
              <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-foreground">Change Password</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Set a new secure password for your account.</p>
                </div>

                <InlineAlert message={passwordMessage} />

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="h-10 rounded-[5px] text-sm pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800" />

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-10 rounded-[5px] text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Strength Bar */}
                    {newPassword && (
                      <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Strength</span>
                          <span className={`font-semibold ${strengthLabel.barClass.replace("bg-", "text-")}`}>{strengthLabel.text}</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strengthLabel.barClass} transition-all duration-300 rounded-full`}
                            style={{ width: strengthLabel.width }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {[
                        { key: "minLength", label: "8+ characters" },
                        { key: "hasUpper", label: "Uppercase letter" },
                        { key: "hasLower", label: "Lowercase letter" },
                        { key: "hasNumber", label: "Number" },
                        { key: "hasSpecial", label: "Special symbol" },
                      ].map(({ key, label }) => (
                        <div key={key} className={`flex items-center gap-1.5 text-[11px] ${passwordChecks[key] ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                          {passwordChecks[key] ? <CheckCircle2 className="size-3.5 shrink-0" /> : <div className="size-3.5 rounded-full border-2 border-current shrink-0" />}
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className={`h-10 rounded-[5px] text-sm pr-10 ${confirmPassword && !isMatch ? "border-red-400 focus-visible:ring-red-400" : ""
                          } ${isMatch ? "border-emerald-400 focus-visible:ring-emerald-400" : ""
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirmPassword && !isMatch && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Passwords do not match
                      </p>
                    )}
                    {isMatch && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="brand"
                    disabled={!canSubmitPassword}
                    className="w-full h-10 rounded-[5px] text-sm font-semibold cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <><Loader2 className="size-4 animate-spin mr-2" />Updating…</>
                    ) : (
                      <><KeyRound className="size-4 mr-2" />Update Password</>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Account Settings ── */}
        {currentTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <div className="max-w-xl mx-auto space-y-5">
              {/* Sign out */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-3">
                <h2 className="text-sm font-bold text-foreground">Session</h2>
                <p className="text-xs text-muted-foreground">
                  You are currently signed in as <strong>{userEmail}</strong>. Signing out will end your active session.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignOutModal(true)}
                  className="h-9 text-xs rounded-[5px] cursor-pointer font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  <LogOut className="size-3.5 mr-1.5" />Sign Out of Account
                </Button>
              </div>

              {/* Account info summary */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-3">
                <h2 className="text-sm font-bold text-foreground">Account Summary</h2>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Name", value: displayName },
                    { label: "Email", value: userEmail },
                    { label: "Role", value: currentRole.name },
                    { label: "Member Since", value: createdAtFormatted },
                    { label: "Status", value: "Active & Verified" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </LayoutComponent>
  )
}

export default ProfileSettingsPage
