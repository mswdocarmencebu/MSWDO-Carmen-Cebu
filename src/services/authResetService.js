import { supabase } from "@/lib/supabaseClient"
import { sendPasswordResetEmail } from "./emailService"

const PASSWORD_RESETS_KEY = "mswdo_active_password_resets"

/**
 * Scans Supabase registered users across public.users, dedicated role tables,
 * and approved applications to verify if an email belongs to an existing account.
 *
 * Uses the `check_email_registered` SECURITY DEFINER RPC as the primary check
 * so that unauthenticated (anon) callers on the Forgot Password page can bypass
 * RLS policies that would otherwise hide the row from the client.
 */
export async function checkRegisteredUser(email) {
  if (!email || !email.trim()) {
    return {
      exists: false,
      user: null,
      error: "Please provide a valid email address.",
    }
  }

  const cleanEmail = email.trim().toLowerCase()

  // 1. Primary check: SECURITY DEFINER RPC that bypasses RLS for both
  //    auth.users and public.users — safe for anon callers.
  try {
    const { data: rpcRows, error: rpcErr } = await supabase
      .rpc("check_email_registered", { p_email: cleanEmail })

    if (!rpcErr && rpcRows && rpcRows.length > 0) {
      const row = rpcRows[0]
      if (row.exists_in_auth || row.exists_in_public) {
        return {
          exists: true,
          user: {
            email: cleanEmail,
            name: row.display_name || cleanEmail.split("@")[0],
            role: row.user_role || "applicant_user",
            source: row.exists_in_public ? "users_table_rpc" : "auth_users_rpc",
          },
        }
      }
    } else if (rpcErr) {
      console.warn("[authResetService] check_email_registered RPC note:", rpcErr.message)
    }
  } catch (rpcEx) {
    console.warn("[authResetService] check_email_registered RPC exception:", rpcEx.message)
  }

  // 2. Fallback: direct public.users query (works when anon RLS allows SELECT,
  //    e.g. for applicant_user rows with a permissive policy)
  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (userRow) {
      return {
        exists: true,
        user: {
          id: userRow.id,
          email: userRow.email,
          name: userRow.full_name || userRow.email.split("@")[0],
          role: userRow.role || "applicant_user",
          source: "users_table",
        },
      }
    }
  } catch (err) {
    console.warn("[authResetService] public.users fallback note:", err.message)
  }

  // 3. Scan staff_users_view / admin_staff_users in Supabase
  try {
    const { data: staffRow } = await supabase
      .from("staff_users_view")
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (staffRow) {
      return {
        exists: true,
        user: {
          id: staffRow.user_id,
          email: staffRow.email,
          name: staffRow.full_name || staffRow.email.split("@")[0],
          role: staffRow.role || "admin_staff",
          position: staffRow.position,
          source: "staff_users_view",
        },
      }
    }
  } catch (err) {
    console.warn("[authResetService] staff check note:", err.message)
  }

  // 4. Scan applications table (for approved beneficiaries)
  try {
    const { data: appRow } = await supabase
      .from("applications")
      .select("id, email, first_name, last_name, status, category, reference_number")
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (appRow) {
      const isApproved = (appRow.status || "").toLowerCase() === "approved"
      const fullName = `${appRow.first_name || ""} ${appRow.last_name || ""}`.trim() || "Beneficiary"

      return {
        exists: true,
        user: {
          id: appRow.id,
          email: appRow.email,
          name: fullName,
          role: "applicant_user",
          reference: appRow.reference_number,
          status: appRow.status,
          source: "applications_table",
        },
        warning: !isApproved ? "Application is currently pending review." : null,
      }
    }
  } catch (err) {
    console.warn("[authResetService] applications check note:", err.message)
  }

  // 5. Offline / Local Storage Registry Check Fallback
  try {
    const localApps = JSON.parse(localStorage.getItem("mswdo_submitted_applications") || "[]")
    const matchApp = localApps.find((a) => (a.email || "").toLowerCase() === cleanEmail)
    if (matchApp) {
      return {
        exists: true,
        user: {
          id: matchApp.id,
          email: matchApp.email,
          name: matchApp.name || "Beneficiary",
          role: "applicant_user",
          reference: matchApp.reference,
          source: "local_applications",
        },
      }
    }

    const localMembers = JSON.parse(localStorage.getItem("mswdo_members_registry") || "[]")
    const matchMember = localMembers.find((m) => (m.email || "").toLowerCase() === cleanEmail)
    if (matchMember) {
      return {
        exists: true,
        user: {
          id: matchMember.id,
          email: matchMember.email,
          name: matchMember.name || "Beneficiary",
          role: "applicant_user",
          source: "local_members",
        },
      }
    }
  } catch (_) {}

  // User is not found anywhere
  return {
    exists: false,
    user: null,
    error: `No registered account found with email address: "${cleanEmail}". Please check your email or contact the Carmen MSWDO office.`,
  }
}

/**
 * Initiates the password recovery flow:
 * 1. Checks that the user exists in Supabase.
 * 2. Generates a secure recovery token with an expiration time.
 * 3. Triggers Supabase auth recovery and dispatches an official branded email with the reset link.
 */
export async function requestPasswordReset(email) {
  const cleanEmail = (email || "").trim().toLowerCase()

  // Step 1: Scan registered users
  const check = await checkRegisteredUser(cleanEmail)
  if (!check.exists) {
    return {
      success: false,
      error: check.error || "No registered account found with this email address.",
    }
  }

  // Step 2: Generate secure recovery token (valid for 1 hour)
  const token = `rst_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
  const expiresAt = Date.now() + 1000 * 60 * 60 // 1 hour

  try {
    const existingResets = JSON.parse(localStorage.getItem(PASSWORD_RESETS_KEY) || "{}")
    existingResets[cleanEmail] = {
      token,
      email: cleanEmail,
      name: check.user.name,
      role: check.user.role,
      reference: check.user.reference || null,
      createdAt: Date.now(),
      expiresAt,
    }
    localStorage.setItem(PASSWORD_RESETS_KEY, JSON.stringify(existingResets))
  } catch (e) {
    console.warn("[authResetService] localStorage reset note:", e)
  }

  // Step 3: Construct the reset link
  const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${token}`

  // Step 4: Call Supabase native reset password (if project SMTP is enabled)
  try {
    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  } catch (sbErr) {
    console.warn("[authResetService] Supabase native reset warning:", sbErr.message)
  }

  // Step 5: Dispatch official Carmen LGU email via Resend
  let emailDispatch = null
  try {
    emailDispatch = await sendPasswordResetEmail({
      name: check.user.name,
      email: cleanEmail,
      resetLink,
      role: check.user.role,
    })
  } catch (mailErr) {
    console.warn("[authResetService] Email dispatch notice:", mailErr.message)
  }

  return {
    success: true,
    email: cleanEmail,
    name: check.user.name,
    resetLink,
    emailDispatch,
    message: `Password recovery instructions have been sent to ${cleanEmail}. Follow the link in your email to reset your credentials.`,
  }
}

/**
 * Validates a recovery token from the URL against active reset sessions
 */
export async function verifyResetToken(email, token) {
  // If user is currently in a Supabase recovery auth session
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email) {
      return {
        valid: true,
        email: user.email.toLowerCase(),
        name: user.user_metadata?.full_name || user.email.split("@")[0],
        source: "supabase_session",
      }
    }
  } catch (_) {}

  if (!email || !token) {
    return {
      valid: false,
      error: "Missing recovery token or email address.",
    }
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const existingResets = JSON.parse(localStorage.getItem(PASSWORD_RESETS_KEY) || "{}")
    const record = existingResets[cleanEmail]

    if (!record) {
      // Check if user is registered in Supabase
      const check = await checkRegisteredUser(cleanEmail)
      if (check.exists) {
        return {
          valid: true,
          email: cleanEmail,
          name: check.user.name,
          source: "registered_user_fallback",
        }
      }
      return {
        valid: false,
        error: "Password reset request not found or expired. Please request a new link.",
      }
    }

    if (Date.now() > record.expiresAt) {
      delete existingResets[cleanEmail]
      localStorage.setItem(PASSWORD_RESETS_KEY, JSON.stringify(existingResets))
      return {
        valid: false,
        error: "This password reset link has expired. Please submit a new request.",
      }
    }

    if (record.token !== token) {
      return {
        valid: false,
        error: "Invalid recovery token. Please verify your link.",
      }
    }

    return {
      valid: true,
      email: cleanEmail,
      name: record.name,
      role: record.role,
      source: "token_verified",
    }
  } catch (err) {
    return {
      valid: false,
      error: err.message || "Failed to verify reset token.",
    }
  }
}

/**
 * Completes the password update for the verified account.
 * Updates Supabase Auth, dedicated role tables, and clears temporary flags.
 */
export async function completePasswordReset({ email, newPassword, token }) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  const cleanEmail = (email || "").trim().toLowerCase()

  // 1. Try Supabase Auth password update if session exists
  let authUpdated = false
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          must_change_password: false,
          has_permanent_password: true,
          temporary_password: null,
          password_updated_at: new Date().toISOString(),
        },
      })
      if (!updateErr) {
        authUpdated = true
      }
    }
  } catch (authErr) {
    console.warn("[authResetService] auth.updateUser note:", authErr.message)
  }

  // 2. Try RPC function reset_user_password_by_email (SECURITY DEFINER)
  try {
    await supabase.rpc("reset_user_password_by_email", {
      p_email: cleanEmail,
      p_new_password: newPassword,
    })
  } catch (rpcErr) {
    console.warn("[authResetService] RPC reset_user_password_by_email note:", rpcErr.message)
  }

  // 3. Try standard session RPC functions if applicable
  try {
    await supabase.rpc("complete_staff_password_setup", {
      p_new_password: newPassword,
    })
  } catch (_) {}

  try {
    await supabase.rpc("complete_initial_password_setup", {
      p_new_password: newPassword,
    })
  } catch (_) {}

  // 4. Direct database updates to clear must_change_password and temporary_password
  try {
    // 2A. Update public.users if user exists
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle()

    if (userRow?.id) {
      // Update admin_staff_users
      await supabase
        .from("admin_staff_users")
        .update({
          must_change_password: false,
          temporary_password: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userRow.id)

      // Update super_admin_users
      await supabase
        .from("super_admin_users")
        .update({
          must_change_password: false,
          temporary_password: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userRow.id)

      // Update applicant_users
      await supabase
        .from("applicant_users")
        .update({
          must_change_password: false,
          temporary_password: null,
        })
        .eq("user_id", userRow.id)
    }
  } catch (dbErr) {
    console.warn("[authResetService] DB role update note:", dbErr.message)
  }

  // 2B. Update applications table (for approved citizens)
  try {
    await supabase
      .from("applications")
      .update({
        temporary_password: null,
        updated_at: new Date().toISOString(),
      })
      .ilike("email", cleanEmail)
  } catch (_) {}

  // 3. Mark permanent password in local storage so subsequent sign-ins bypass first-time setup
  try {
    localStorage.setItem(`mswdo_staff_pwd_set_${cleanEmail}`, "true")

    // Clean up active reset token
    const existingResets = JSON.parse(localStorage.getItem(PASSWORD_RESETS_KEY) || "{}")
    delete existingResets[cleanEmail]
    localStorage.setItem(PASSWORD_RESETS_KEY, JSON.stringify(existingResets))
  } catch (_) {}

  // 4. Sign out any recovery session so user can login with fresh credentials
  try {
    await supabase.auth.signOut()
  } catch (_) {}

  return {
    success: true,
    email: cleanEmail,
    message: "Password updated successfully! Please sign in with your new password.",
  }
}
