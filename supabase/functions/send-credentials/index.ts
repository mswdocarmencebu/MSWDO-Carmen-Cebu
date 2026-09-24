// Supabase Edge Function: send-credentials
// Path: supabase/functions/send-credentials/index.ts
// Platform: Resend (https://resend.com)
//
// Description: Dispatches official MSWDO Carmen beneficiary approval notice
// with generated portal credentials (Client ID, temporary password, and login link).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers to permit invocations from the frontend app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface SendCredentialsRequest {
  applicantName: string
  email: string
  temporaryPassword: string
  clientId: string
  sector?: string
  reference?: string
  portalUrl?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight options
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload: SendCredentialsRequest = await req.json()
    const {
      applicantName,
      email,
      temporaryPassword,
      clientId,
      sector = "Citizen Welfare",
      reference = "N/A",
      portalUrl = "https://mswdo-carmen.gov.ph/signin",
    } = payload

    // Basic validation
    if (!email || !temporaryPassword || !clientId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (email, temporaryPassword, clientId)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const senderEmail = Deno.env.get("RESEND_SENDER_EMAIL") || "MSWDO Carmen <no-reply@swu-som.com>"

    // If API key is not configured, return simulated response for development
    if (!resendApiKey) {
      console.warn("[send-credentials] RESEND_API_KEY not configured. Simulating dispatch.")
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Simulated dispatch: RESEND_API_KEY is not set yet in Supabase secrets.",
          recipient: email,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const safePortalUrl = portalUrl || "https://mswdo-carmen-cebu.vercel.app/signin"
    const logoUrl = "https://uat.swu-som.com/carmen_lgu_logo.png"

    // HTML Email Template with official MSWDO Carmen branding
    const emailHtml = `
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
          Official Helpdesk &amp; Inquiries: <a href="mailto:mswdo.carmencebu5@gmail.com" style="color: #047857; font-weight: 700; text-decoration: none;">mswdo.carmencebu5@gmail.com</a>
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

    // Call Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [email],
        reply_to: "mswdo.carmencebu5@gmail.com",
        subject: `MSWDO Carmen - Application Approved & Portal Credentials (${reference})`,
        html: emailHtml,
      }),
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("[send-credentials] Resend API error:", resendResult)
      return new Response(
        JSON.stringify({ error: resendResult }),
        { status: resendResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: resendResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[send-credentials] Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
