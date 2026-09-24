# Resend Email Setup Guide (MSWDO Carmen Portal)

This guide documents the setup for automatically emailing login credentials to approved beneficiaries using **Resend** and **Supabase Edge Functions**.

> **Current Status:** Setup files are installed in **MOCK / INACTIVE** mode. No live emails are sent until you configure your Resend API key and toggle the feature flag.

---

## 📁 Setup Files Created

1. **`supabase/functions/send-credentials/index.ts`**
   - The Supabase Edge Function that receives the approval payload and calls Resend's REST API.
   - Contains the official MSWDO Carmen HTML email template.
   - Securely accesses `RESEND_API_KEY` from Supabase server secrets (never exposed to client browser).

2. **`supabase/functions/send-credentials/.env.example`**
   - Reference template for required Supabase secrets.

3. **`src/services/emailService.js`**
   - The frontend service wrapper.
   - Defaults to **Mock Mode** (`VITE_ENABLE_LIVE_EMAIL=false`), safely logging dispatches to the browser console.

---

## 🚀 How to Connect to Live (When Ready)

### Step 1: Create a Free Resend Account
1. Visit [resend.com](https://resend.com) and sign up (Free tier includes **3,000 emails/month**).
2. Go to **API Keys** → click **Create API Key**.
3. Name it `MSWDO Carmen Supabase` and copy the key (starts with `re_...`).

---

### Step 2: Set Secrets in Supabase
Set your Resend API key as a secret on Supabase so the Edge Function can access it securely:

**Via Supabase CLI:**
```bash
supabase secrets set RESEND_API_KEY="re_your_api_key_here"
supabase secrets set RESEND_SENDER_EMAIL="MSWDO Carmen <onboarding@resend.dev>"
```

**Or Via Supabase Dashboard:**
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**.
3. Add:
   - `RESEND_API_KEY` = `re_your_actual_key`
   - `RESEND_SENDER_EMAIL` = `MSWDO Carmen <onboarding@resend.dev>` *(or your verified custom domain)*

---

### Step 3: Deploy the Edge Function
From your project root terminal, run:

```bash
# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link your local project to your Supabase project
npx supabase link --project-ref your-project-ref-id

# Deploy the send-credentials function
npx supabase functions deploy send-credentials
```

---

### Step 4: Activate Live Email in the Frontend
When you are ready to send live emails from the application:

1. Open your `.env` file in the project root.
2. Add or toggle:
   ```env
   VITE_ENABLE_LIVE_EMAIL=true
   ```
3. In [`src/services/applicationService.js`](file:///c:/Users/admin/react-supabase-template/src/services/applicationService.js), you can import and call `sendApplicantCredentials`:
   ```javascript
   import { sendApplicantCredentials } from "./emailService"

   // Inside approveApplication():
   await sendApplicantCredentials({
     applicantName: application.name,
     email: email,
     temporaryPassword: tempPassword,
     clientId: clientId,
     sector: application.sector || application.category,
     reference: application.reference,
   })
   ```

---

### 📝 Notes on Testing with Resend Free Tier
* **Testing without a custom domain:** Resend provides a testing domain `onboarding@resend.dev`. When using this domain, Resend only allows sending to the email address registered with your Resend account.
* **Production custom domain:** Once ready for public launch, add MSWDO's custom domain (e.g., `carmen.gov.ph` or `mswdo-carmen.com`) under **Domains** in the Resend dashboard and add the 3 DKIM/SPF DNS records. Then update `RESEND_SENDER_EMAIL` to e.g. `MSWDO Carmen <no-reply@carmen.gov.ph>`.
