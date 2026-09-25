import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { ApplicantUserLayout } from "@/layouts/applicant_user/ApplicantUserLayout"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import {
  fetchApplicantApplicationAndDocuments,
  addApplicantDocument,
  uploadDocumentToStorage,
  submitApplicantInquiry,
  getApplicantInquiries,
  getSectorLabel,
  isSectorMatch,
} from "@/services/applicationService"
import {
  getBenefitPrograms,
  getBenefitClaims,
  saveBenefitClaim,
} from "@/services/benefitService"
import { getMembers } from "@/services/memberService"
import { getAnnouncements } from "@/services/announcementService"

// Sub-Tab Components
import { ApplicantApplicationsTab } from "./ApplicantApplicationsTab"
import { ApplicantBenefitsTab } from "./ApplicantBenefitsTab"
import { ApplicantTrackingTab } from "./ApplicantTrackingTab"
import { ApplicantDocumentsTab } from "./ApplicantDocumentsTab"
import { ApplicantAnnouncementsTab } from "./ApplicantAnnouncementsTab"
import { ApplicantSupportTab } from "./ApplicantSupportTab"

// Modals
import {
  DocumentPreviewModal,
  UploadDocumentModal,
  ApplyBenefitModal,
  CaseDetailsModal,
} from "./ApplicantModals"

export function ApplicantUserDashboardPage() {
  const { profile, user } = useAuth()
  const { navigate } = useRouter()
  const { tab: routeTab } = useParams()
  const [searchParams] = useSearchParams()

  // Resolve active tab
  const normalizeTab = (t) => {
    if (!t) return "applications"
    const lower = t.toLowerCase()
    if (lower === "services" || lower === "benefits") return "services"
    if (lower === "status" || lower === "tracking") return "status"
    if (lower === "documents" || lower === "docs") return "documents"
    if (lower === "announcements" || lower === "bulletins") return "announcements"
    if (lower === "support" || lower === "inquiries" || lower === "help") return "support"
    return "applications"
  }

  const initialTab = normalizeTab(routeTab || searchParams.get("tab") || "applications")
  const [activeTab, setActiveTab] = useState(initialTab)

  // Sync tab with URL parameter changes
  useEffect(() => {
    const nextTab = normalizeTab(routeTab || searchParams.get("tab"))
    if (nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [routeTab, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    navigate(`/dashboard/applicant/${newTab}`)
  }

  // Real data state
  const [intakeApp, setIntakeApp]       = useState(null)
  const [memberRecord, setMemberRecord] = useState(null)
  const [documents, setDocuments]       = useState([])
  const [programs, setPrograms]         = useState([])
  const [claims, setClaims]             = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [inquiries, setInquiries]       = useState([])
  const [loadingData, setLoadingData]   = useState(true)

  // Modals state
  const [previewDoc, setPreviewDoc]                       = useState(null)
  const [isUploadModalOpen, setIsUploadModalOpen]         = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen]           = useState(false)
  const [selectedProgramForApply, setSelectedProgramForApply] = useState(null)
  const [selectedCaseForDetails, setSelectedCaseForDetails]   = useState(null)

  const roleDetails   = profile?.roleDetails
  const userEmail     = profile?.email || user?.email || ""

  // ─── Memoize derived identifiers so they don't change on every render ───────
  // Changing these every render was causing loadAllApplicantData's useCallback
  // to produce a new function reference on every render, which re-triggered the
  // useEffect, causing an infinite fetch → setState → render → fetch loop.
  const clientId = useMemo(
    () =>
      roleDetails?.client_id ||
      memberRecord?.memberId ||
      (intakeApp?.reference_number
        ? `APPL-${intakeApp.reference_number.slice(-4)}`
        : "APPL-MUNICIPAL"),
    [roleDetails?.client_id, memberRecord?.memberId, intakeApp?.reference_number]
  )

  const applicantName = useMemo(
    () =>
      profile?.full_name ||
      memberRecord?.name ||
      (intakeApp?.first_name
        ? `${intakeApp.first_name} ${intakeApp.last_name || ""}`.trim()
        : "Citizen Beneficiary"),
    [profile?.full_name, memberRecord?.name, intakeApp?.first_name, intakeApp?.last_name]
  )

  // Resolve approved category & sector
  const rawCategory =
    memberRecord?.category ||
    intakeApp?.category ||
    intakeApp?.sector ||
    roleDetails?.category ||
    ""
  const sectorLabel = getSectorLabel(rawCategory) || "Youth"

  // Check if applicant is approved
  const intakeStatus  = (intakeApp?.status || "").toLowerCase()
  const isMemberActive = memberRecord && (memberRecord.status || "").toLowerCase() === "active"
  const isApproved =
    intakeStatus === "approved" ||
    isMemberActive ||
    Boolean(roleDetails?.is_approved) ||
    (Boolean(intakeApp) && !["pending", "needs correction", "rejected", "terminated"].includes(intakeStatus))

  const barangay =
    intakeApp?.complete_address || memberRecord?.barangay || roleDetails?.barangay || "Barangay Poblacion, Carmen, Cebu"

  // Filter programs matching this applicant's sector
  const applicantPrograms = useMemo(() => {
    if (!sectorLabel) return programs
    return programs.filter((p) => isSectorMatch(p.sector, sectorLabel))
  }, [programs, sectorLabel])

  // Use a ref for clientId/applicantName inside the loader so we never need them
  // in the useCallback dependency array (which would cause new fn ref every render)
  const clientIdRef      = useRef(clientId)
  const applicantNameRef = useRef(applicantName)
  useEffect(() => { clientIdRef.current = clientId },      [clientId])
  useEffect(() => { applicantNameRef.current = applicantName }, [applicantName])

  // ─── Primary data loader ─────────────────────────────────────────────────────
  // Depends ONLY on userEmail — stable after login. clientId/applicantName are
  // read from refs inside so they never cause a new function reference.
  const loadAllApplicantData = useCallback(async () => {
    if (!userEmail) return
    setLoadingData(true)

    try {
      const [appRes, allPrograms, allClaims, allAnnouncements, allMembers] = await Promise.all([
        fetchApplicantApplicationAndDocuments(userEmail),
        getBenefitPrograms(),
        getBenefitClaims(),
        getAnnouncements(),
        getMembers().catch(() => []),
      ])

      if (appRes?.application) setIntakeApp(appRes.application)
      setDocuments(appRes?.documents || [])
      setPrograms(allPrograms || [])

      // Find matching member record
      const cId = clientIdRef.current.toLowerCase()
      const myMember = (allMembers || []).find((m) => {
        const mEmail = (m.email || "").toLowerCase()
        const uEmail = userEmail.toLowerCase()
        const mId    = (m.memberId || m.member_id || "").toLowerCase()
        return (mEmail && uEmail && mEmail === uEmail) || (cId && mId && mId === cId)
      })
      if (myMember) setMemberRecord(myMember)

      // Filter claims for this applicant
      const cleanName = applicantNameRef.current.toLowerCase()
      const myClaims = (allClaims || []).filter((c) => {
        const mId   = (c.memberId || c.member_id || "").toLowerCase()
        const mName = (c.memberName || c.member_name || "").toLowerCase()
        return (
          mId === cId ||
          (mName && cleanName && (mName.includes(cleanName) || cleanName.includes(mName)))
        )
      })
      setClaims(myClaims)
      setAnnouncements(allAnnouncements || [])

      const myInquiries = getApplicantInquiries(userEmail)
      setInquiries(myInquiries)
    } catch (err) {
      console.warn("Could not load full applicant dataset:", err)
    } finally {
      setLoadingData(false)
    }
  }, [userEmail]) // ← ONLY userEmail, stable after login

  // ─── Run loader once on mount (and when userEmail becomes available) ─────────
  // Do NOT listen to raw "storage" events — avatar writes trigger storage events
  // and would cause a full Supabase re-fetch on every avatar resolution.
  const lastFetchRef = useRef(0)
  useEffect(() => {
    loadAllApplicantData()
    lastFetchRef.current = Date.now()

    // Re-fetch on specific app-level events only (NOT generic "storage")
    const handleAppUpdate = () => {
      // Throttle to avoid hammering Supabase
      if (Date.now() - lastFetchRef.current > 5_000) {
        loadAllApplicantData()
        lastFetchRef.current = Date.now()
      }
    }

    window.addEventListener("mswdo_application_storage_changed", handleAppUpdate)
    window.addEventListener("mswdo_benefits_updated", handleAppUpdate)
    window.addEventListener("mswdo_inquiries_updated", handleAppUpdate)
    window.addEventListener("application_status_updated", handleAppUpdate)
    window.addEventListener("mswdo_members_updated", handleAppUpdate)
    // ⚠️ Do NOT add "storage" here — avatar cache writes to localStorage fire
    //    "storage" and would trigger a full reload on every avatar resolution.

    return () => {
      window.removeEventListener("mswdo_application_storage_changed", handleAppUpdate)
      window.removeEventListener("mswdo_benefits_updated", handleAppUpdate)
      window.removeEventListener("mswdo_inquiries_updated", handleAppUpdate)
      window.removeEventListener("application_status_updated", handleAppUpdate)
      window.removeEventListener("mswdo_members_updated", handleAppUpdate)
    }
  }, [loadAllApplicantData])

  // Handle document upload
  const handleUploadDocument = async ({ file, category, title, notes }) => {
    const refCode = intakeApp?.reference_number || clientId || "APPL-REQ"
    const docKey  = title.toLowerCase().replace(/[^a-z0-9]/g, "_")

    const uploadResult = await uploadDocumentToStorage(file, refCode, docKey)
    const fileUrl = uploadResult?.publicUrl || URL.createObjectURL(file)

    const newDoc = {
      id: `doc-${Date.now()}`,
      key: docKey,
      title,
      name: title,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category,
      url: fileUrl,
      previewUrl: fileUrl,
      status: "Verified",
      notes: notes || "",
      uploadedAt: new Date().toISOString(),
    }

    const res = await addApplicantDocument(userEmail, newDoc)
    if (res?.success) {
      setDocuments(res.documents || [newDoc, ...documents])
    }
    return res
  }

  // Handle apply for welfare benefit claim
  const handleApplyBenefitClaim = async ({ benefit, amount, purpose, remarks, programCode }) => {
    const claimNum = `CLM-${Date.now().toString().slice(-5)}`
    const newClaim = {
      id: claimNum,
      claimNumber: claimNum,
      memberId: clientId,
      memberName: applicantName,
      email: userEmail,
      sector: sectorLabel,
      benefit,
      amount,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      releaseMethod: "Cash Disbursement",
      referenceNo: `VOUCHER-${Date.now().toString().slice(-4)}`,
      remarks: remarks || `Purpose: ${purpose}`,
      status: "Pending",
    }

    await saveBenefitClaim(newClaim)
    setClaims((prev) => [newClaim, ...prev])
    return { success: true, claim: newClaim }
  }

  // Handle citizen inquiry submission
  const handleSubmitInquiry = async (inquiryData) => {
    const res = submitApplicantInquiry(inquiryData)
    if (res?.success) {
      setInquiries((prev) => [res.inquiry, ...prev])
    }
    return res
  }

  return (
    <ApplicantUserLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {/* Tab 1: My Applications & Overview */}
      {activeTab === "applications" && (
        <ApplicantApplicationsTab
          profile={profile}
          intakeApp={intakeApp}
          claims={claims}
          documents={documents}
          sectorLabel={sectorLabel}
          clientId={clientId}
          userEmail={userEmail}
          onNavigateTab={handleTabChange}
          onViewDoc={(doc) => setPreviewDoc(doc)}
          onOpenApplyModal={() => {
            setSelectedProgramForApply(null)
            setIsApplyModalOpen(true)
          }}
          onViewCaseDetails={(caseItem) => setSelectedCaseForDetails(caseItem)}
        />
      )}

      {/* Tab 2: Welfare Programs & Benefits */}
      {activeTab === "services" && (
        <ApplicantBenefitsTab
          programs={applicantPrograms}
          allPrograms={programs}
          claims={claims}
          sectorLabel={sectorLabel}
          clientId={clientId}
          applicantName={applicantName}
          isApproved={isApproved}
          intakeStatus={intakeApp?.status || (isMemberActive ? "Approved" : "Pending")}
          loading={loadingData}
          onOpenApplyModal={(prog) => {
            setSelectedProgramForApply(prog)
            setIsApplyModalOpen(true)
          }}
          onNavigateTab={handleTabChange}
        />
      )}

      {/* Tab 3: Process & Payout Tracking */}
      {activeTab === "status" && (
        <ApplicantTrackingTab
          intakeApp={intakeApp}
          claims={claims}
          sectorLabel={sectorLabel}
          clientId={clientId}
          applicantName={applicantName}
        />
      )}

      {/* Tab 4: Categorized Uploaded Documents */}
      {activeTab === "documents" && (
        <ApplicantDocumentsTab
          documents={documents}
          loading={loadingData}
          intakeRef={intakeApp?.reference_number || clientId}
          onViewDoc={(doc) => setPreviewDoc(doc)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* Tab 5: Official LGU Announcements */}
      {activeTab === "announcements" && (
        <ApplicantAnnouncementsTab
          announcements={announcements}
          loading={loadingData}
          sectorLabel={sectorLabel}
        />
      )}

      {/* Tab 6: Citizen Support & Inquiries */}
      {activeTab === "support" && (
        <ApplicantSupportTab
          inquiries={inquiries}
          userEmail={userEmail}
          applicantName={applicantName}
          clientId={clientId}
          onSubmitInquiry={handleSubmitInquiry}
        />
      )}

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadDocument}
        userEmail={userEmail}
        intakeRef={intakeApp?.reference_number || clientId}
      />

      <ApplyBenefitModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        initialProgram={selectedProgramForApply}
        programs={applicantPrograms.length > 0 ? applicantPrograms : programs}
        applicantName={applicantName}
        clientId={clientId}
        sectorLabel={sectorLabel}
        barangay={barangay}
        onSubmitClaim={handleApplyBenefitClaim}
      />

      <CaseDetailsModal
        caseItem={selectedCaseForDetails}
        onClose={() => setSelectedCaseForDetails(null)}
      />
    </ApplicantUserLayout>
  )
}

export default ApplicantUserDashboardPage
