import { createContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { recordUserLogin, recordUserLogout } from "@/services/auditService"
import { requestPasswordReset } from "@/services/authResetService"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Helper to fetch base user record and dedicated role table details
  const fetchUserData = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    try {
      // 1. Fetch base user record from public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name, role, is_terminated, terminated_at, termination_reason, created_at")
        .eq("id", userId)
        .maybeSingle()

      if (userError && userError.code !== "PGRST116") {
        console.warn("Could not fetch user record:", userError.message)
      }

      // Determine auth user: check fresh getUser() for updated metadata, fallback to getSession()
      let authUser = null
      try {
        const { data: authUserData } = await supabase.auth.getUser()
        authUser = authUserData?.user || null
      } catch (_) {}
      if (!authUser) {
        authUser = (await supabase.auth.getSession()).data.session?.user || null
      }

      let rawRole = userData?.role || authUser?.user_metadata?.role || "applicant_user"

      // Normalize role: map legacy keys if present
      let role = rawRole
      if (rawRole === "itsd") role = "super_admin_user"
      else if (rawRole === "inventory_staff") role = "admin_staff"
      else if (rawRole === "end_user") role = "applicant_user"

      let roleDetails = null

      // 2. Fetch specific role details from the dedicated role table safely with maybeSingle()
      if (role === "super_admin_user") {
        const { data: superAdminData } = await supabase
          .from("super_admin_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = superAdminData || {
          user_id: userId,
          admin_level: authUser?.user_metadata?.admin_level || "Executive Super Admin",
          can_manage_users: true,
        }
      } else if (role === "admin_staff") {
        const { data: adminStaffData } = await supabase
          .from("admin_staff_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = adminStaffData || {
          user_id: userId,
          staff_tier: authUser?.user_metadata?.staff_tier || "Lead Intake Officer",
          badge_number: authUser?.user_metadata?.badge_number || "MSWDO-STF-014",
        }
      } else {
        const { data: applicantData } = await supabase
          .from("applicant_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = applicantData || {
          user_id: userId,
          category: authUser?.user_metadata?.category || "Citizen Beneficiary",
          barangay: authUser?.user_metadata?.barangay || "Barangay Poblacion, Carmen",
          client_id: authUser?.user_metadata?.client_id || `APPL-${userId.slice(0, 4).toUpperCase()}`,
          is_approved: Boolean(authUser?.user_metadata?.is_approved),
        }
      }

      // Check if user has already set a permanent password / real password
      const userEmail = userData?.email || authUser?.email
      const localIdKey = `mswdo_staff_pwd_set_${userId}`
      const localEmailKey = userEmail ? `mswdo_staff_pwd_set_${userEmail.toLowerCase()}` : null
      let isMarkedPermanentLocally = false
      try {
        isMarkedPermanentLocally =
          localStorage.getItem(localIdKey) === "true" ||
          (localEmailKey ? localStorage.getItem(localEmailKey) === "true" : false)
      } catch (_) {}

      const userMetadata = authUser?.user_metadata || {}

      const isSenior =
        userMetadata.is_senior === true ||
        roleDetails?.category?.toLowerCase().includes("senior") ||
        userData?.category?.toLowerCase().includes("senior")

      // Explicit signal that permanent / real password is in place:
      const hasPermanentPassword =
        isSenior ||
        isMarkedPermanentLocally ||
        userMetadata.has_permanent_password === true ||
        userMetadata.must_change_password === false

      // Only require password change if NOT marked permanent AND explicitly requested
      let mustChangePassword = false
      if (!hasPermanentPassword) {
        if (userMetadata.must_change_password === true) {
          mustChangePassword = true
        } else if (
          roleDetails?.must_change_password === true &&
          (roleDetails?.temporary_password != null || userMetadata.must_change_password !== false)
        ) {
          mustChangePassword = true
        }
      }

      // Synchronize roleDetails so it never contradicts the profile
      if (roleDetails) {
        roleDetails.must_change_password = mustChangePassword
        if (!mustChangePassword) {
          roleDetails.temporary_password = null
        }
      }

      const userAvatar =
        userData?.avatar_url ||
        userMetadata?.avatar_url ||
        (userEmail ? localStorage.getItem(`mswdo_avatar_${userEmail.toLowerCase()}`) : null) ||
        (userId ? localStorage.getItem(`mswdo_avatar_${userId}`) : null)

      // Check termination status
      let isTerminated = Boolean(userData?.is_terminated)
      let terminationReason = userData?.termination_reason || null

      if (!isTerminated) {
        try {
          const localTerms = JSON.parse(localStorage.getItem("mswdo_user_terminations_cache") || "[]")
          const termMatch = localTerms.find(
            (x) =>
              (x.userId && x.userId === userId) ||
              (userEmail && x.email && x.email.toLowerCase() === userEmail.toLowerCase())
          )
          if (termMatch && termMatch.action === "Terminated") {
            isTerminated = true
            terminationReason = termMatch.reason || "Administrative policy enforcement"
          }
        } catch (_) {}
      }

      const combined = {
        ...(userData || {}),
        // Auth metadata (user_metadata) is always writable by the user via supabase.auth.updateUser().
        // public.users may be stale for applicants (RLS blocks their writes there),
        // so prefer auth metadata full_name over the DB value.
        full_name: userMetadata?.full_name || userData?.full_name || userEmail?.split("@")[0],
        email: userEmail,
        avatar_url: userAvatar,
        role,
        roleDetails,
        must_change_password: mustChangePassword,
        is_terminated: isTerminated,
        termination_reason: terminationReason,
      }

      setProfile(combined)
      return combined
    } catch (err) {
      console.warn("User data fetch error:", err.message)
      return null
    }
  }, [])

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (isMounted) {
          if (currentSession?.user) {
            setSession(currentSession)
            setUser(currentSession.user)
            const loadedProfile = await fetchUserData(currentSession.user.id)
            if (loadedProfile?.is_terminated) {
              await supabase.auth.signOut()
              if (isMounted) {
                setSession(null)
                setUser(null)
                setProfile(null)
                setError("Your account has been terminated and access has been revoked. Please contact MSWDO Carmen administration.")
              }
              return
            }
          } else {
            try {
              const backup = JSON.parse(localStorage.getItem("mswdo_active_session_backup") || "null")
              if (backup?.user && backup?.profile) {
                setUser(backup.user)
                setSession(backup.session || { user: backup.user })
                setProfile(backup.profile)
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Auth initialization notice:", err.message)
          setError(err.message)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    // Listen to live Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (isMounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (!newSession?.user) {
            setProfile(null)
          } else if (event === "USER_UPDATED") {
            // Password / metadata change — only patch user object, do NOT re-fetch
            // roleDetails from DB. This prevents a race where DB still has
            // must_change_password=true while the in-memory flag was already cleared
            // by markPasswordChanged(). Profile stays untouched; ProtectedRoute reads
            // the already-updated in-memory profile.
          } else {
            const loadedProfile = await fetchUserData(newSession.user.id)
            if (loadedProfile?.is_terminated) {
              await supabase.auth.signOut()
              if (isMounted) {
                setSession(null)
                setUser(null)
                setProfile(null)
                setError("Your account has been terminated and access has been revoked. Please contact MSWDO Carmen administration.")
              }
            }
          }

          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchUserData])

  // Sign In method directly calling Supabase
  const signIn = useCallback(async ({ identifier, password }) => {
    setError(null)
    setLoading(true)
    setIsAuthenticating(true)

    try {
      const rawInput = identifier.trim()
      const cleanIdentifier = rawInput.toLowerCase()
      const noSpaceUpper = rawInput.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      const noSpaceLower = noSpaceUpper.toLowerCase()
      const cleanPassDigits = String(password).replace(/\D/g, "")

      let data = null
      let signInError = null

      // Candidate emails to attempt with Supabase Auth
      const candidateEmails = cleanIdentifier.includes("@")
        ? [cleanIdentifier]
        : [
            `${noSpaceLower}@senior.mswdo.carmen.gov.ph`,
            `${cleanIdentifier}@mswdo.carmen.gov.ph`,
            `${cleanIdentifier}@itams.edu`,
          ]

      // 1. Try candidate emails against Supabase Auth
      for (const candEmail of candidateEmails) {
        try {
          const res = await supabase.auth.signInWithPassword({
            email: candEmail,
            password,
          })
          if (!res.error && res.data?.user) {
            data = res.data
            signInError = null
            break
          }
          if (cleanPassDigits && cleanPassDigits !== password) {
            const digitRes = await supabase.auth.signInWithPassword({
              email: candEmail,
              password: cleanPassDigits,
            })
            if (!digitRes.error && digitRes.data?.user) {
              data = digitRes.data
              signInError = null
              break
            }
          }
          signInError = res.error
        } catch (e) {
          signInError = e
        }
      }

      // 2. Fallback: Check if identifier is a Client Beneficiary ID (e.g., APPL-8290)
      if ((!data || signInError) && !cleanIdentifier.includes("@")) {
        try {
          const { data: applUser } = await supabase
            .from("applicant_users")
            .select("user_id")
            .ilike("client_id", cleanIdentifier)
            .maybeSingle()

          if (applUser?.user_id) {
            const { data: uRec } = await supabase
              .from("users")
              .select("email")
              .eq("id", applUser.user_id)
              .maybeSingle()

            if (uRec?.email) {
              const idRes = await supabase.auth.signInWithPassword({
                email: uRec.email,
                password,
              })
              if (!idRes.error && idRes.data?.user) {
                data = idRes.data
                signInError = null
              }
            }
          }
        } catch {}
      }

      // 3. Fallback: Senior Citizen Authentication Resolution (by Full Name without whitespace + Numerical DOB)
      if (!data || signInError) {
        try {
          let matchedSenior = null

          // Look up in mswdo_senior_auth_registry
          try {
            const seniorRegistry = JSON.parse(localStorage.getItem("mswdo_senior_auth_registry") || "{}")
            if (seniorRegistry[noSpaceUpper]) {
              matchedSenior = seniorRegistry[noSpaceUpper]
            }
          } catch (_) {}

          // Look up in mswdo_submitted_applications
          if (!matchedSenior) {
            try {
              const localApps = JSON.parse(localStorage.getItem("mswdo_submitted_applications") || "[]")
              matchedSenior = localApps.find((a) => {
                const isSen = a.category === "senior" || a.sector?.toLowerCase().includes("senior") || a.isSenior
                if (!isSen) return false
                const appUsername = (a.seniorUsername || "").toUpperCase()
                const first = (a.firstName || a.first_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                const middle = (a.middleName || a.middle_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                const last = (a.lastName || a.last_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                const fn1 = `${first}${middle}${last}`
                const fn2 = `${first}${last}`
                const rawName = (a.name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                const appEmail = (a.email || "").toLowerCase()
                return (
                  appUsername === noSpaceUpper ||
                  fn1 === noSpaceUpper ||
                  fn2 === noSpaceUpper ||
                  rawName === noSpaceUpper ||
                  appEmail === cleanIdentifier ||
                  appEmail === `${noSpaceLower}@senior.mswdo.carmen.gov.ph`
                )
              })
            } catch (_) {}
          }

          // Look up in Supabase applications table if not found locally
          if (!matchedSenior) {
            try {
              const { data: dbApps } = await supabase
                .from("applications")
                .select("*")
              if (dbApps && dbApps.length > 0) {
                matchedSenior = dbApps.find((a) => {
                  const isSen = a.category === "senior" || a.sector?.toLowerCase().includes("senior")
                  if (!isSen) return false
                  const first = (a.first_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                  const middle = (a.middle_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                  const last = (a.last_name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                  const fn1 = `${first}${middle}${last}`
                  const fn2 = `${first}${last}`
                  const rawName = (a.name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                  return (
                    fn1 === noSpaceUpper ||
                    fn2 === noSpaceUpper ||
                    rawName === noSpaceUpper ||
                    (a.email && a.email.toLowerCase() === `${noSpaceLower}@senior.mswdo.carmen.gov.ph`)
                  )
                })
              }
            } catch (_) {}
          }

          if (matchedSenior) {
            // Calculate expected DOB digits MMDDYYYY
            const rawDob = matchedSenior.birthDate || matchedSenior.dob || matchedSenior.date_of_birth
            let expectedDobDigits = ""
            if (rawDob) {
              const match = String(rawDob).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
              if (match) {
                const y = match[1]
                const m = match[2].padStart(2, "0")
                const d = match[3].padStart(2, "0")
                expectedDobDigits = `${m}${d}${y}`
              } else {
                expectedDobDigits = String(rawDob).replace(/\D/g, "")
              }
            }

            const expectedPass =
              matchedSenior.password ||
              matchedSenior.temporaryPassword ||
              matchedSenior.temporary_password ||
              expectedDobDigits

            const expectedPassDigits = String(expectedPass).replace(/\D/g, "")

            const isPasswordValid =
              password === expectedPass ||
              cleanPassDigits === expectedPass ||
              cleanPassDigits === expectedPassDigits ||
              (expectedDobDigits && cleanPassDigits === expectedDobDigits)

            if (isPasswordValid) {
              const seniorEmail =
                matchedSenior.email || `${noSpaceLower}@senior.mswdo.carmen.gov.ph`
              const seniorUserId =
                matchedSenior.id || matchedSenior.appId || `senior_${noSpaceLower}`
              const seniorFullName =
                matchedSenior.name ||
                matchedSenior.applicantName ||
                `${matchedSenior.first_name || matchedSenior.firstName || ""} ${matchedSenior.last_name || matchedSenior.lastName || ""}`.trim() ||
                noSpaceUpper
              const seniorClientId =
                matchedSenior.clientId ||
                matchedSenior.client_id ||
                `APPL-${(matchedSenior.reference || seniorUserId).slice(-6).toUpperCase()}`

              // Attempt auth login in Supabase
              try {
                const sLogin = await supabase.auth.signInWithPassword({
                  email: seniorEmail,
                  password: expectedPass,
                })
                if (!sLogin.error && sLogin.data?.user) {
                  data = sLogin.data
                  signInError = null
                }
              } catch (_) {}

              // If Supabase auth couldn't issue session directly, activate local senior applicant session:
              if (!data?.user) {
                const seniorUserObj = {
                  id: seniorUserId,
                  email: seniorEmail,
                  user_metadata: {
                    full_name: seniorFullName,
                    role: "applicant_user",
                    category: "Senior Citizen",
                    is_senior: true,
                    must_change_password: false,
                    client_id: seniorClientId,
                  },
                }
                const seniorSession = {
                  access_token: `senior_token_${Date.now()}`,
                  user: seniorUserObj,
                }
                const seniorProfile = {
                  id: seniorUserId,
                  full_name: seniorFullName,
                  email: seniorEmail,
                  role: "applicant_user",
                  category: "Senior Citizen",
                  is_senior: true,
                  must_change_password: false,
                  roleDetails: {
                    user_id: seniorUserId,
                    category: "Senior Citizen",
                    client_id: seniorClientId,
                    is_approved: true,
                    must_change_password: false,
                  },
                }

                localStorage.setItem(
                  "mswdo_active_session_backup",
                  JSON.stringify({
                    user: seniorUserObj,
                    session: seniorSession,
                    profile: seniorProfile,
                  })
                )

                setUser(seniorUserObj)
                setSession(seniorSession)
                setProfile(seniorProfile)
                setIsAuthenticating(false)
                setLoading(false)

                return { success: true, user: seniorUserObj, profile: seniorProfile }
              }
            }
          }
        } catch (senCatch) {
          console.warn("Senior login check error:", senCatch)
        }
      }

      if (signInError) throw signInError

      const userProfile = await fetchUserData(data.user.id)

      // CRITICAL TERMINATION CHECK: If user is terminated, immediately block and sign out
      if (userProfile?.is_terminated) {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
        setIsAuthenticating(false)
        setLoading(false)

        const reasonNote = userProfile.termination_reason
          ? ` Reason: ${userProfile.termination_reason}.`
          : ""
        const terminatedMsg = `Your account has been terminated and access to the MSWDO portal is restricted.${reasonNote} Please contact MSWDO Carmen administration for assistance.`
        setError(terminatedMsg)
        return { success: false, error: terminatedMsg, isTerminated: true }
      }

      setUser(data.user)
      setSession(data.session)

      // Record audit log for login user monitoring
      recordUserLogin(data.user, userProfile).catch(() => {})

      // Keep isAuthenticating true for a brief moment to ensure the loading screen covers
      // the route transition and dashboard initial render seamlessly with no blank flicker
      setTimeout(() => {
        setIsAuthenticating(false)
      }, 700)

      return { success: true, user: data.user, profile: userProfile }
    } catch (err) {
      const errMsg = err.message || "Invalid login credentials."
      console.warn("Supabase signInWithPassword notice:", errMsg)
      setError(errMsg)
      setIsAuthenticating(false)
      return { success: false, error: errMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchUserData])

  // Password Reset with registered user scan and official Carmen LGU email delivery
  const resetPassword = useCallback(async (email) => {
    setError(null)
    try {
      const res = await requestPasswordReset(email)
      if (!res.success) {
        setError(res.error)
        return { success: false, error: res.error }
      }
      return { success: true, message: res.message, ...res }
    } catch (err) {
      const errMsg = err.message || "Failed to process password reset request."
      setError(errMsg)
      return { success: false, error: errMsg }
    }
  }, [])

  // Sign Out directly calling Supabase
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        recordUserLogout(user, profile).catch(() => {})
      }
      await supabase.auth.signOut()
      try {
        localStorage.removeItem("mswdo_active_session_backup")
      } catch (_) {}
      setUser(null)
      setProfile(null)
      setSession(null)
      setError(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const rawCurrentRole = profile?.role || user?.user_metadata?.role || "applicant_user"
  const currentRole =
    rawCurrentRole === "itsd"
      ? "super_admin_user"
      : rawCurrentRole === "inventory_staff"
      ? "admin_staff"
      : rawCurrentRole === "end_user"
      ? "applicant_user"
      : rawCurrentRole

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    user,
    profile,
    role: currentRole,
    roleDetails: profile?.roleDetails || null,
    isSuperAdminUser: currentRole === "super_admin_user",
    isAdminStaff: currentRole === "admin_staff",
    isApplicantUser: currentRole === "applicant_user",
    // Backwards compatibility aliases
    isITSD: currentRole === "super_admin_user",
    isInventoryStaff: currentRole === "admin_staff",
    isEndUser: currentRole === "applicant_user",
    session,
    loading,
    isAuthenticating,
    error,
    clearError,
    isTerminated: Boolean(profile?.is_terminated),
    isAuthenticated: Boolean(user) && !profile?.is_terminated,
    signIn,
    resetPassword,
    signOut,
    markPasswordChanged: () => {
      if (user?.id) {
        try {
          localStorage.setItem(`mswdo_staff_pwd_set_${user.id}`, "true")
        } catch (_) {}
      }
      if (user?.email) {
        try {
          localStorage.setItem(`mswdo_staff_pwd_set_${user.email.toLowerCase()}`, "true")
        } catch (_) {}
      }
      setUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              user_metadata: {
                ...(prevUser.user_metadata || {}),
                must_change_password: false,
                has_permanent_password: true,
              },
            }
          : prevUser
      )
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              must_change_password: false,
              roleDetails: {
                ...(prev.roleDetails || {}),
                must_change_password: false,
                temporary_password: null,
              },
            }
          : prev
      )
    },
    refreshProfile: () => (user?.id ? fetchUserData(user.id) : null),
    updateProfileState: (patch) => {
      setProfile((prev) => (prev ? { ...prev, ...patch } : patch))
      setUser((prev) =>
        prev
          ? {
              ...prev,
              user_metadata: { ...(prev.user_metadata || {}), ...patch },
            }
          : prev
      )
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { useAuth } from "@/hooks/useAuth"
export default AuthContext

