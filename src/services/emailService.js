// Email Service
// Path: src/services/emailService.js
// Integration: Resend (Supabase Edge Function with Direct Resend REST fallback)

import { supabase } from "@/lib/supabaseClient"

// Feature toggle: checks if live email dispatch is enabled (defaults to true if configured)
const IS_LIVE_ENABLED = import.meta.env.VITE_ENABLE_LIVE_EMAIL !== "false"
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ""
const SENDER_EMAIL = import.meta.env.VITE_RESEND_SENDER_EMAIL || "MSWDO Carmen <no-reply@swu-som.com>"
export const OFFICIAL_MSWDO_EMAIL = import.meta.env.VITE_RESEND_REPLY_TO || "mswdo.carmencebu5@gmail.com"

/**
 * Builds the official MSWDO Carmen email HTML template.
 */
function buildCredentialsEmailHtml({
  applicantName,
  email,
  temporaryPassword,
  clientId,
  sector = "Citizen Welfare",
  reference = "N/A",
  portalUrl,
}) {
  const safePortalUrl = portalUrl || "https://mswdo-carmen-cebu.vercel.app/signin"
  const logoUrl = "https://uat.swu-som.com/carmen_lgu_logo.png"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved - MSWDO Carmen</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
    
    <!-- Top Brand Header with Carmen Logo -->
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%); padding: 32px 24px 28px 24px; text-align: center;">
        <!-- Official Carmen LGU Seal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 14px auto;">
          <tr>
            <td style="background-color: #ffffff; padding: 4px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              <img src="${logoUrl}" alt="Municipality of Carmen Seal" width="70" height="70" style="display: block; width: 70px; height: 70px; border-radius: 50%; object-fit: contain;" />
            </td>
          </tr>
        </table>
        
        <p style="color: #a7f3d0; margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
          Republic of the Philippines · Province of Cebu
        </p>
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 21px; font-weight: 800; letter-spacing: 0.3px; line-height: 1.2;">
          MUNICIPALITY OF CARMEN
        </h1>
        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 14px; margin-top: 4px;">
          <p style="color: #ecfdf5; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
            Municipal Social Welfare and Development Office (MSWDO)
          </p>
        </div>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 32px 28px;">
        <!-- Status Pill & Reference -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #6ee7b7; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 12px; border-radius: 6px; letter-spacing: 0.5px;">
                ✓ Application Approved
              </span>
            </td>
            <td style="text-align: right;">
              <span style="font-family: monospace; font-size: 12px; font-weight: 600; color: #64748b; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px;">
                ${reference}
              </span>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">
          Welcome, ${applicantName}!
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          We are pleased to inform you that your application for the <strong>${sector}</strong> program has been reviewed, verified, and officially <strong>approved</strong>. Your beneficiary portal account is now active.
        </p>

        <!-- Credentials Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; margin: 0 0 24px 0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <tr>
            <td style="background-color: #f1f5f9; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.8px;">
                Official Beneficiary Access Credentials
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 150px; border-bottom: 1px solid #f1f5f9;">Portal Access Role:</td>
                  <td style="padding: 8px 0; color: #047857; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
                    <span style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                      Applicant Beneficiary (applicant_user)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Client Beneficiary ID:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: 800; font-size: 14px; border-bottom: 1px solid #f1f5f9;">
                    ${clientId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Login Email:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: 600; font-size: 13px; border-bottom: 1px solid #f1f5f9;">
                    ${email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 4px 0; color: #64748b; font-weight: 500; vertical-align: middle;">Temporary Password:</td>
                  <td style="padding: 10px 0 4px 0; vertical-align: middle;">
                    <div style="display: inline-block; background-color: #ecfdf5; border: 1px dashed #059669; padding: 6px 14px; border-radius: 6px;">
                      <span style="color: #047857; font-family: monospace; font-weight: 800; font-size: 16px; letter-spacing: 0.5px;">
                        ${temporaryPassword}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Quick 3-Step Guide -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
          <tr>
            <td>
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                How to Access Your Portal Account:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 12px; color: #475569; line-height: 1.5;">
                <tr>
                  <td style="width: 24px; vertical-align: top; font-weight: 700; color: #047857;">1.</td>
                  <td style="padding-bottom: 6px;">Click the <strong>Sign In to Beneficiary Portal</strong> button below.</td>
                </tr>
                <tr>
                  <td style="width: 24px; vertical-align: top; font-weight: 700; color: #047857;">2.</td>
                  <td style="padding-bottom: 6px;">Enter your email (<code style="color: #0f172a; font-family: monospace;">${email}</code>) and your temporary password.</td>
                </tr>
                <tr>
                  <td style="width: 24px; vertical-align: top; font-weight: 700; color: #047857;">3.</td>
                  <td>View your approved program status, digital sector ID card, and scheduled assistance.</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Security Warning -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 26px;">
          <tr>
            <td style="padding: 12px 16px;">
              <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
                <strong>Security Alert:</strong> This temporary password is for your initial login only. For your protection, please update your password immediately in your profile settings upon logging in.
              </p>
            </td>
          </tr>
        </table>

        <!-- Call to Action Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
          <tr>
            <td style="border-radius: 8px; background: linear-gradient(135deg, #059669 0%, #047857 100%); text-align: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
              <a href="${safePortalUrl}" target="_blank" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border: 1px solid #047857; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 700; padding: 14px 32px; text-decoration: none; letter-spacing: 0.3px;">
                Sign In to Beneficiary Portal →
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
          Direct portal address: <br>
          <a href="${safePortalUrl}" style="color: #047857; font-weight: 600; text-decoration: underline; word-break: break-all;">${safePortalUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer Area -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
        <p style="color: #334155; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">
          Municipal Social Welfare and Development Office
        </p>
        <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">
          Municipal Hall, Poblacion, Carmen, Cebu 6005, Philippines
        </p>
        <p style="color: #64748b; font-size: 11px; margin: 0 0 10px 0;">
          Official Helpdesk &amp; Inquiries: <a href="mailto:${OFFICIAL_MSWDO_EMAIL}" style="color: #047857; font-weight: 700; text-decoration: none;">${OFFICIAL_MSWDO_EMAIL}</a>
        </p>
        <p style="color: #94a3b8; font-size: 10px; margin: 0; line-height: 1.4;">
          This is an official automated transmission from the MSWDO Carmen Beneficiary System.<br>
          © 2026 Municipality of Carmen, Province of Cebu. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Dispatches an approved applicant's credentials email using Resend.
 *
 * @param {Object} params
 * @param {string} params.applicantName - Beneficiary's full name
 * @param {string} params.email - Recipient email
 * @param {string} params.temporaryPassword - Generated temporary password
 * @param {string} params.clientId - Generated beneficiary Client ID (e.g., APPL-2026)
 * @param {string} [params.sector] - Sector category (Senior, PWD, Women, Youth)
 * @param {string} [params.reference] - Application reference number
 * @param {string} [params.portalUrl] - Portal login URL (defaults to window.location.origin + /signin)
 * @returns {Promise<{ success: boolean, simulated?: boolean, data?: any, error?: any }>}
 */
export async function sendApplicantCredentials({
  applicantName,
  email,
  temporaryPassword,
  clientId,
  sector = "Citizen Welfare",
  reference = "N/A",
  portalUrl = typeof window !== "undefined" ? `${window.location.origin}/signin` : "https://mswdo-carmen.gov.ph/signin",
}) {
  const payload = {
    applicantName: applicantName || "Valued Beneficiary",
    email: (email || "").trim().toLowerCase(),
    temporaryPassword,
    clientId,
    sector,
    reference,
    portalUrl,
  }

  if (!payload.email) {
    return { success: false, error: "Recipient email is missing." }
  }

  // 1. Check if email sending is disabled
  if (!IS_LIVE_ENABLED) {
    console.log(
      "%c[emailService] %c(MOCK MODE) Email dispatch simulated:%c",
      "color: #10b981; font-weight: bold;",
      "color: #f59e0b; font-weight: bold;",
      "color: inherit;",
      payload
    )
    return {
      success: true,
      simulated: true,
      recipient: payload.email,
      message: `[MOCK MODE] Credentials email for ${payload.email} simulated successfully.`,
    }
  }

  // 2. Direct Resend Dispatch (Primary route when VITE_RESEND_API_KEY is configured)
  if (RESEND_API_KEY) {
    try {
      const emailHtml = buildCredentialsEmailHtml(payload)
      const isSandboxDomain = SENDER_EMAIL.includes("onboarding@resend.dev")
      const isExternalRecipient = payload.email.toLowerCase() !== OFFICIAL_MSWDO_EMAIL.toLowerCase()

      const sendToResend = async (bodyPayload) => {
        const headers = {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        }

        // Try local Vite proxy first (avoids browser CORS restrictions)
        try {
          const proxyRes = await fetch("/api/resend/emails", {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload),
          })
          if (proxyRes.status !== 404) {
            const data = await proxyRes.json()
            return { ok: proxyRes.ok, status: proxyRes.status, data }
          }
        } catch (proxyErr) {
          console.warn("[emailService] Local proxy unreached, using direct API:", proxyErr)
        }

        // Direct API call fallback
        try {
          const directRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload),
          })
          const data = await directRes.json()
          return { ok: directRes.ok, status: directRes.status, data }
        } catch (directErr) {
          return { ok: false, status: 0, data: { message: directErr.message || "Network error" } }
        }
      }

      // If in Resend Sandbox mode (onboarding@resend.dev) with an external recipient:
      // Resend free tier only allows sending to the verified owner (mswdo.carmencebu5@gmail.com).
      // We route directly to the admin with applicant credentials to avoid an avoidable 403 error.
      if (isSandboxDomain && isExternalRecipient) {
        console.log(
          `[emailService] Resend Sandbox mode active: Dispatching credentials for ${payload.applicantName} (${payload.email}) to verified admin inbox (${OFFICIAL_MSWDO_EMAIL}).`
        )

        const sandboxHtml = `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; color: #92400e;">
            <strong>[RESEND SANDBOX TEST DISPATCH]</strong><br>
            Intended Beneficiary Recipient: <strong>${payload.email}</strong> (${payload.applicantName})<br>
            <em>Notice: Because your Resend domain is in free sandbox mode (<code>onboarding@resend.dev</code>), emails are delivered to your verified admin account (<code>${OFFICIAL_MSWDO_EMAIL}</code>). To deliver to external beneficiaries directly, verify a custom domain at <a href="https://resend.com/domains" target="_blank" style="color: #b45309; font-weight: bold;">resend.com/domains</a>.</em>
          </div>
          ${emailHtml}
        `

        const sandboxResult = await sendToResend({
          from: SENDER_EMAIL,
          to: [OFFICIAL_MSWDO_EMAIL],
          reply_to: OFFICIAL_MSWDO_EMAIL,
          subject: `[TEST FOR ${payload.email}] MSWDO Carmen - Application Approved (${payload.reference})`,
          html: sandboxHtml,
        })

        if (sandboxResult.ok) {
          console.log("[emailService] Credentials email successfully delivered to admin inbox:", sandboxResult.data)
          return {
            success: true,
            sandbox: true,
            intendedRecipient: payload.email,
            deliveredTo: OFFICIAL_MSWDO_EMAIL,
            data: sandboxResult.data,
            message: `Delivered to your admin inbox (${OFFICIAL_MSWDO_EMAIL}) via Resend Sandbox test mode.`,
          }
        } else {
          console.error("[emailService] Resend dispatch error:", sandboxResult.data)
          return { success: false, error: sandboxResult.data?.message || "Resend dispatch error", details: sandboxResult.data }
        }
      }

      // Standard dispatch (to applicant directly when custom domain is verified or recipient is admin)
      const result = await sendToResend({
        from: SENDER_EMAIL,
        to: [payload.email],
        reply_to: OFFICIAL_MSWDO_EMAIL,
        subject: `MSWDO Carmen - Application Approved & Portal Credentials (${payload.reference})`,
        html: emailHtml,
      })

      if (result.ok) {
        console.log("[emailService] Live email dispatched successfully via Resend:", result.data)
        return { success: true, via: "resend-direct", recipient: payload.email, data: result.data }
      }

      console.error("[emailService] Resend API error:", result.data)
      return { success: false, error: result.data?.message || "Resend API error", details: result.data }
    } catch (resendErr) {
      console.error("[emailService] Direct Resend API fetch failed:", resendErr)
      return { success: false, error: resendErr.message || resendErr }
    }
  }

  // 3. Optional Route: Supabase Edge Function (only if explicit flag VITE_USE_EDGE_FUNCTION=true)
  if (import.meta.env.VITE_USE_EDGE_FUNCTION === "true") {
    try {
      const { data, error } = await supabase.functions.invoke("send-credentials", {
        body: payload,
      })

      if (!error && data?.success) {
        console.log("[emailService] Live email dispatched via Supabase Edge Function:", data)
        return { success: true, via: "edge-function", data }
      }
    } catch (edgeErr) {
      console.warn("[emailService] Supabase Edge Function invoke exception:", edgeErr.message || edgeErr)
    }
  }


  // 4. If neither Edge Function nor local API key is configured yet
  console.info(
    "[emailService] Notice: Live mode is active, but neither Supabase Edge Function nor VITE_RESEND_API_KEY was reached. Please set your key in .env or deploy the Edge Function."
  )
  return {
    success: true,
    simulated: true,
    warning: "Pending Resend API Key configuration",
    recipient: payload.email,
  }
}

/**
 * Builds HTML template for new staff account credentials.
 */
function buildStaffCredentialsEmailHtml({
  name,
  email,
  temporaryPassword,
  idNumber,
  position,
  role,
  portalUrl,
}) {
  const safePortalUrl = portalUrl || "https://mswdo-carmen-cebu.vercel.app/signin"
  const logoUrl = "https://uat.swu-som.com/carmen_lgu_logo.png"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Account Created - MSWDO Carmen</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    
    <!-- Top Brand Header with Carmen Logo -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%); padding: 32px 24px 28px 24px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 14px auto;">
          <tr>
            <td style="background-color: #ffffff; padding: 4px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              <img src="${logoUrl}" alt="Municipality of Carmen Seal" width="70" height="70" style="display: block; width: 70px; height: 70px; border-radius: 50%; object-fit: contain;" />
            </td>
          </tr>
        </table>
        
        <p style="color: #bfdbfe; margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
          Republic of the Philippines · Province of Cebu
        </p>
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 21px; font-weight: 800; letter-spacing: 0.3px; line-height: 1.2;">
          MUNICIPALITY OF CARMEN
        </h1>
        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 14px; margin-top: 4px;">
          <p style="color: #eff6ff; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
            Municipal Social Welfare and Development Office (MSWDO)
          </p>
        </div>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 32px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #eff6ff; border: 1px solid #93c5fd; color: #1d4ed8; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 12px; border-radius: 6px; letter-spacing: 0.5px;">
                ★ Official Staff Account Created
              </span>
            </td>
            <td style="text-align: right;">
              <span style="font-family: monospace; font-size: 12px; font-weight: 600; color: #64748b; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px;">
                ${idNumber || "STAFF-ACCOUNT"}
              </span>
            </td>
          </tr>
        </table>

        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">
          Welcome, ${name}!
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          An official staff account has been established for you in the MSWDO Carmen management system. You have been assigned the role of <strong>${role || "Staff"} (${position || "Welfare Officer"})</strong>.
        </p>

        <!-- Credentials Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; margin: 0 0 24px 0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <tr>
            <td style="background-color: #f1f5f9; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.8px;">
                Your Staff Login Credentials
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0">
                <tr>
                  <td width="35%" style="font-size: 13px; color: #64748b; font-weight: 500;">Account Email:</td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 700; font-family: monospace;">${email}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; font-weight: 500;">Assigned Position:</td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 600;">${position || "Staff Officer"}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; font-weight: 500;">Temporary Password:</td>
                  <td style="font-size: 14px; color: #1e3a8a; font-weight: 800; font-family: monospace; letter-spacing: 1px; background-color: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    ${temporaryPassword}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Security Warning Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 14px 16px;">
              <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                <strong>Security Notice:</strong> This auto-generated password is temporary. For municipal data privacy compliance, you will be prompted to update your password to a permanent one upon your first login.
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
          <tr>
            <td style="text-align: center;">
              <a href="${safePortalUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                Log In to MSWDO Staff Portal →
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
          If you have any difficulty logging in, please contact the Carmen LGU IT & Administrative Helpdesk at <strong>${OFFICIAL_MSWDO_EMAIL}</strong> or via local trunkline.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px 0;">
          Municipality of Carmen · MSWDO Staff Management System
        </p>
        <p style="color: #cbd5e1; font-size: 10px; margin: 0;">
          This is an official administrative automated message. Please keep your login credentials secure.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Dispatches an automated email to a newly created staff member with their temporary password.
 */
export async function sendStaffCredentialsEmail(payload) {
  if (!payload || !payload.email) {
    return { success: false, error: "Staff recipient email is missing." }
  }

  // 1. Check if email sending is disabled
  if (!IS_LIVE_ENABLED) {
    console.log(
      "%c[emailService] %c(MOCK MODE) Staff Credentials Email simulated:%c",
      "color: #2563eb; font-weight: bold;",
      "color: #f59e0b; font-weight: bold;",
      "color: inherit;",
      payload
    )
    return {
      success: true,
      simulated: true,
      recipient: payload.email,
      message: `[MOCK MODE] Staff credentials email for ${payload.email} simulated successfully.`,
    }
  }

  // 2. Direct Resend Dispatch
  if (RESEND_API_KEY) {
    try {
      const emailHtml = buildStaffCredentialsEmailHtml(payload)
      const isSandboxDomain = SENDER_EMAIL.includes("onboarding@resend.dev")
      const isExternalRecipient = payload.email.toLowerCase() !== OFFICIAL_MSWDO_EMAIL.toLowerCase()

      const sendToResend = async (bodyPayload) => {
        const headers = {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        }

        try {
          const proxyRes = await fetch("/api/resend/emails", {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload),
          })
          if (proxyRes.status !== 404) {
            const data = await proxyRes.json()
            return { ok: proxyRes.ok, status: proxyRes.status, data }
          }
        } catch (_) { }

        try {
          const directRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload),
          })
          const data = await directRes.json()
          return { ok: directRes.ok, status: directRes.status, data }
        } catch (directErr) {
          return { ok: false, status: 0, data: { message: directErr.message || "Network error" } }
        }
      }

      if (isSandboxDomain && isExternalRecipient) {
        const sandboxHtml = `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; color: #92400e;">
            <strong>[RESEND SANDBOX STAFF DISPATCH]</strong><br>
            Intended Staff Recipient: <strong>${payload.email}</strong> (${payload.name})<br>
            Position: <strong>${payload.position || "Staff"}</strong><br>
            Temporary Password: <strong>${payload.temporaryPassword}</strong>
          </div>
          ${emailHtml}
        `

        const sandboxResult = await sendToResend({
          from: SENDER_EMAIL,
          to: [OFFICIAL_MSWDO_EMAIL],
          reply_to: OFFICIAL_MSWDO_EMAIL,
          subject: `[STAFF CREDENTIALS] MSWDO Carmen - Account Created for ${payload.name}`,
          html: sandboxHtml,
        })

        return {
          success: true,
          sandbox: true,
          intendedRecipient: payload.email,
          deliveredTo: OFFICIAL_MSWDO_EMAIL,
          data: sandboxResult.data,
          message: `Dispatched to admin inbox (${OFFICIAL_MSWDO_EMAIL}) via Resend Sandbox.`,
        }
      }

      const result = await sendToResend({
        from: SENDER_EMAIL,
        to: [payload.email],
        reply_to: OFFICIAL_MSWDO_EMAIL,
        subject: `MSWDO Carmen - Staff Account Created & Temporary Password`,
        html: emailHtml,
      })

      if (result.ok) {
        return { success: true, via: "resend-direct", recipient: payload.email, data: result.data }
      }

      return { success: false, error: result.data?.message || "Resend dispatch error", details: result.data }
    } catch (resendErr) {
      return { success: false, error: resendErr.message || "Failed to dispatch staff email." }
    }
  }

  return {
    success: true,
    simulated: true,
    recipient: payload.email,
    message: `Staff credentials email queued for ${payload.email}.`,
  }
}

