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
        .select("id, email, full_name, role, created_at")
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
        if (superAdminData) {
          roleDetails = superAdminData
        } else {
          const { data: itsdData } = await supabase
            .from("itsd_users")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
          roleDetails = itsdData
        }
      } else if (role === "admin_staff") {
        const { data: adminStaffData } = await supabase
          .from("admin_staff_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        if (adminStaffData) {
          roleDetails = adminStaffData
        } else {
          const { data: invData } = await supabase
            .from("inventory_staff_users")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
          roleDetails = invData
        }
      } else {
        const { data: applicantData } = await supabase
          .from("applicant_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        if (applicantData) {
          roleDetails = applicantData
        } else {
          const { data: endUserData } = await supabase
            .from("end_users")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
          roleDetails = endUserData
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

      // Explicit signal that permanent / real password is in place:
      const hasPermanentPassword =
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
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          if (currentSession?.user) {
            await fetchUserData(currentSession.user.id)
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
            await fetchUserData(newSession.user.id)
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
      const cleanIdentifier = identifier.trim().toLowerCase()
      let email = cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@mswdo.carmen.gov.ph`
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Fallback for existing seed accounts with @itams.edu if alias was used
      if (signInError && !cleanIdentifier.includes("@")) {
        const fallbackEmail = `${cleanIdentifier}@itams.edu`
        const fallbackRes = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password,
        })
        if (!fallbackRes.error) {
          data = fallbackRes.data
          signInError = null
        }
      }

      // Fallback: Check if identifier is a Client Beneficiary ID (e.g., APPL-8290)
      if (signInError && !cleanIdentifier.includes("@")) {
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
              if (!idRes.error) {
                data = idRes.data
                signInError = null
              }
            }
          }
        } catch {}
      }

      if (signInError) throw signInError

      setUser(data.user)
      setSession(data.session)
      const userProfile = await fetchUserData(data.user.id)

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
    isAuthenticated: Boolean(user),
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

export default AuthContext
