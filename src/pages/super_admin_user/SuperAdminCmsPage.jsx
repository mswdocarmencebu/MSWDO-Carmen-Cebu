import React, { useState, useEffect, useMemo, useRef } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  LayoutTemplate,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Save,
  Eye,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Accessibility,
  GraduationCap,
  Users,
  Sparkles,
  ShieldCheck,
  Check,
  Globe,
  FileSpreadsheet,
  FileCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useStaffPermissions } from "@/hooks/useStaffPermissions"
import {
  getAllCmsSections,
  saveCmsSection,
  uploadCmsAsset,
  DEFAULT_CMS_CONTENT,
} from "@/services/cmsService"

/* ─────────────────────────────────────────────
   Icon helper for services
───────────────────────────────────────────── */
function getServiceIconComponent(iconName) {
  switch (iconName) {
    case "Accessibility":
      return Accessibility
    case "GraduationCap":
      return GraduationCap
    case "Users":
      return Users
    case "FileText":
      return FileText
    case "HeartHandshake":
    default:
      return HeartHandshake
  }
}

/* ─────────────────────────────────────────────
   Main SuperAdminCmsPage Component
───────────────────────────────────────────── */
export function SuperAdminCmsPage() {
  const { user: currentAuthUser, profile: currentAuthProfile } = useAuth()
  const { canEdit, canApprove } = useStaffPermissions()

  // State
  const [sections, setSections] = useState(DEFAULT_CMS_CONTENT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [activeTab, setActiveTab] = useState("hero")
  const [search, setSearch] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Modals
  const [editingService, setEditingService] = useState(null)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)

  // Hero form local edit state
  const [heroForm, setHeroForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    municipalTitle: "",
    officeName: "",
    guidanceNote: "",
    ctaText: "",
    ctaLink: "",
    isPublished: true,
  })
  const [isUploadingHeroImg, setIsUploadingHeroImg] = useState(false)
  const heroFileInputRef = useRef(null)

  // Toast Helper
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load Data
  const loadCmsData = async () => {
    setIsLoading(true)
    try {
      const data = await getAllCmsSections()
      if (data) {
        setSections(data)
        if (data.hero) {
          setHeroForm({
            title: data.hero.title || "",
            subtitle: data.hero.subtitle || "",
            imageUrl: data.hero.imageUrl || "/mswdo-community-hero-portrait.png",
            municipalTitle: data.hero.data?.municipalTitle || "MSWDO Carmen, Cebu 6005",
            officeName: data.hero.data?.officeName || "Municipal Social Welfare and Development Office",
            guidanceNote: data.hero.data?.guidanceNote || "",
            ctaText: data.hero.data?.ctaText || "Apply for Welfare Assistance",
            ctaLink: data.hero.data?.ctaLink || "/apply",
            isPublished: data.hero.isPublished ?? true,
          })
        }
      }
    } catch (err) {
      console.error("Failed to load CMS data:", err)
      showToast("Could not load latest CMS data.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCmsData()
  }, [])

  // Section Counts
  const serviceItems = sections.services?.data?.items || []
  const faqItems = sections.faqs?.data?.items || []
  const docItems = sections.documents?.data?.items || []

  // Filtered lists based on search
  const q = search.toLowerCase().trim()

  const filteredServices = useMemo(() => {
    if (!q) return serviceItems
    return serviceItems.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    )
  }, [serviceItems, q])

  const filteredFaqs = useMemo(() => {
    if (!q) return faqItems
    return faqItems.filter(
      (f) =>
        f.question?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.answer?.toLowerCase().includes(q)
    )
  }, [faqItems, q])

  const filteredDocs = useMemo(() => {
    if (!q) return docItems
    return docItems.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    )
  }, [docItems, q])

  // Tab definitions matching Termination Page UI
  const tabs = [
    { id: "hero", label: "Hero Banner", count: heroForm.isPublished ? "Live" : "Draft", icon: ImageIcon },
    { id: "services", label: "Public Services", count: filteredServices.length, icon: FileText },
    { id: "faqs", label: "Help Center & FAQs", count: filteredFaqs.length, icon: HelpCircle },
    { id: "documents", label: "Downloadable Forms", count: filteredDocs.length, icon: LayoutTemplate },
  ]

  // Handle Save Hero Section
  const handleSaveHero = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await saveCmsSection("hero", {
        title: heroForm.title,
        subtitle: heroForm.subtitle,
        imageUrl: heroForm.imageUrl,
        isPublished: heroForm.isPublished,
        data: {
          municipalTitle: heroForm.municipalTitle,
          officeName: heroForm.officeName,
          guidanceNote: heroForm.guidanceNote,
          ctaText: heroForm.ctaText,
          ctaLink: heroForm.ctaLink,
          liveBadgeText: "Live on Citizen Portal",
        },
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Hero Showcase Banner updated and published to citizen portal.")
      await loadCmsData()
    } catch (err) {
      console.error("Save hero error:", err)
      showToast("Failed to save hero changes: " + err.message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Hero Image Upload (auto-saves and publishes immediately!)
  const handleHeroImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingHeroImg(true)
    try {
      const asset = await uploadCmsAsset(file, "cms/hero")
      if (asset?.publicUrl) {
        const newUrl = asset.publicUrl
        setHeroForm((prev) => ({ ...prev, imageUrl: newUrl }))

        // Auto-save immediately so the upload goes live without needing separate save
        await saveCmsSection("hero", {
          title: heroForm.title,
          subtitle: heroForm.subtitle,
          imageUrl: newUrl,
          storagePath: asset.storagePath,
          isPublished: heroForm.isPublished,
          data: {
            municipalTitle: heroForm.municipalTitle,
            officeName: heroForm.officeName,
            guidanceNote: heroForm.guidanceNote,
            ctaText: heroForm.ctaText,
            ctaLink: heroForm.ctaLink,
            liveBadgeText: "Live on Citizen Portal",
          },
          user: {
            id: currentAuthUser?.id,
            name: currentAuthProfile?.full_name || currentAuthUser?.email,
          },
        })

        showToast("Hero banner image uploaded, saved, and published live!")
        await loadCmsData()
      }
    } catch (err) {
      console.error("Hero upload error:", err)
      showToast("Failed to upload image: " + err.message, "error")
    } finally {
      setIsUploadingHeroImg(false)
      if (e.target) e.target.value = ""
    }
  }

  // Reset Hero Image to default
  const handleResetHeroImage = async () => {
    const defaultUrl = "/mswdo-community-hero-portrait.png"
    setHeroForm((prev) => ({ ...prev, imageUrl: defaultUrl }))
    try {
      await saveCmsSection("hero", {
        ...sections.hero,
        imageUrl: defaultUrl,
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Hero image reset to official default portrait.")
      await loadCmsData()
    } catch (err) {
      console.error("Reset hero error:", err)
    }
  }

  // Apply Direct URL
  const handleApplyHeroImageUrl = async (customUrl) => {
    if (!customUrl?.trim()) return
    const trimmed = customUrl.trim()
    setHeroForm((prev) => ({ ...prev, imageUrl: trimmed }))
    try {
      await saveCmsSection("hero", {
        ...sections.hero,
        imageUrl: trimmed,
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Direct hero image URL applied and published.")
      await loadCmsData()
    } catch (err) {
      console.error("Apply URL error:", err)
    }
  }

  // Save Services Section Items
  const handleSaveServiceItems = async (nextItems) => {
    setIsSaving(true)
    try {
      await saveCmsSection("services", {
        title: sections.services?.title || "Municipal Social Welfare Services Directory",
        subtitle: sections.services?.subtitle,
        isPublished: true,
        data: { items: nextItems },
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Services directory updated and saved.")
      await loadCmsData()
      setIsServiceModalOpen(false)
      setEditingService(null)
    } catch (err) {
      console.error("Save services error:", err)
      showToast("Failed to save services: " + err.message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Save FAQ Items
  const handleSaveFaqItems = async (nextItems) => {
    setIsSaving(true)
    try {
      await saveCmsSection("faqs", {
        title: sections.faqs?.title || "Citizen Help Center & Frequently Asked Questions",
        subtitle: sections.faqs?.subtitle,
        isPublished: true,
        data: { items: nextItems },
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Help Center FAQs updated and saved.")
      await loadCmsData()
      setIsFaqModalOpen(false)
      setEditingFaq(null)
    } catch (err) {
      console.error("Save FAQs error:", err)
      showToast("Failed to save FAQs: " + err.message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Save Document Items
  const handleSaveDocItems = async (nextItems) => {
    setIsSaving(true)
    try {
      await saveCmsSection("documents", {
        title: sections.documents?.title || "Downloadable Municipal Application Forms & Checklists",
        subtitle: sections.documents?.subtitle,
        isPublished: true,
        data: { items: nextItems },
        user: {
          id: currentAuthUser?.id,
          name: currentAuthProfile?.full_name || currentAuthUser?.email,
        },
      })
      showToast("Downloadable forms updated and saved.")
      await loadCmsData()
      setIsDocModalOpen(false)
      setEditingDoc(null)
    } catch (err) {
      console.error("Save documents error:", err)
      showToast("Failed to save documents: " + err.message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SuperAdminUserLayout activeTab="cms">
      <div className="space-y-4">

        {/* ── Toast notification ── */}
        {toastMessage && (
          <div
            className={`p-3 rounded-[5px] text-xs flex items-center justify-between border shadow-2xs transition-all ${
              toastMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200"
                : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "error" ? (
                <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
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

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <LayoutTemplate className="size-3.5" />
                Content Management System
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              CMS
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage public website content, citizen application guidance, home showcase banners, and municipal service descriptions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer bg-white dark:bg-zinc-900"
            >
              <Eye className="size-3.5 text-blue-600 dark:text-blue-400" />
              Preview Public Portal
            </Button>
            <Button
              variant="brand"
              size="sm"
              disabled={isSaving || !canEdit}
              onClick={() => {
                if (activeTab === "hero") handleSaveHero()
                else showToast("Section is up-to-date and saved to database.")
              }}
              className="rounded-[5px] text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Publish Changes
            </Button>
          </div>
        </div>

        {/* ── Top Metric Stat Cards (Clickable like Termination page) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              id: "hero",
              label: "Hero Showcase",
              count: heroForm.isPublished ? "Live" : "Draft",
              icon: ImageIcon,
              color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
              sub: "Citizen login & home banner",
            },
            {
              id: "services",
              label: "Public Services",
              count: `${serviceItems.length} Programs`,
              icon: FileText,
              color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
              sub: "Welfare & relief programs",
            },
            {
              id: "faqs",
              label: "Help & FAQs",
              count: `${faqItems.length} Q&As`,
              icon: HelpCircle,
              color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
              sub: "Citizen guidance center",
            },
            {
              id: "documents",
              label: "Downloadable Forms",
              count: `${docItems.length} Forms`,
              icon: LayoutTemplate,
              color: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
              sub: "Printable PDFs & sheets",
            },
          ].map((s) => {
            const Icon = s.icon
            const isCardActive = activeTab === s.id
            return (
              <Card
                key={s.id}
                onClick={() => {
                  setActiveTab(s.id)
                  setSearch("")
                }}
                className={`rounded-[5px] border bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer transition-all ${
                  isCardActive
                    ? "border-blue-500/90 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600"
                }`}
              >
                <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{s.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground font-heading mt-0.5">
                      {isLoading ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : s.count}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.sub}</p>
                  </div>
                  <div className={`size-10 rounded-[5px] flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── Tabbed records card (Identical UI pattern to Termination page) ── */}
        <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">

          {/* ── Tab bar header (Clean docked tabs with counter badges) ── */}
          <div className="flex items-center justify-between px-4 pt-2.5 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSearch("")
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

            {/* Right side live sync status */}
            <div className="hidden sm:flex items-center gap-2 pb-2 text-[11px] text-muted-foreground shrink-0">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10.5px]">Supabase CMS Sync</span>
            </div>
          </div>

          {/* ── Toolbar / Search & Filter row (Only for tabs with lists) ── */}
          {activeTab !== "hero" && (
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    activeTab === "services"
                      ? "Search public services or sector…"
                      : activeTab === "faqs"
                        ? "Search questions or answers…"
                        : "Search downloadable form title or code…"
                  }
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
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

              {/* Action Buttons Right Aligned */}
              <div className="flex items-center gap-2">
                {activeTab === "services" && (
                  <Button
                    variant="brand"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditingService(null)
                      setIsServiceModalOpen(true)
                    }}
                    className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="size-3.5" />
                    Add Service
                  </Button>
                )}

                {activeTab === "faqs" && (
                  <Button
                    variant="brand"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditingFaq(null)
                      setIsFaqModalOpen(true)
                    }}
                    className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="size-3.5" />
                    Add FAQ
                  </Button>
                )}

                {activeTab === "documents" && (
                  <Button
                    variant="brand"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditingDoc(null)
                      setIsDocModalOpen(true)
                    }}
                    className="h-8 rounded-[5px] text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="size-3.5" />
                    Upload Form
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 1: Public Landing & Hero Banner
          ═══════════════════════════════════════════ */}
          {activeTab === "hero" && (
            <CardContent className="p-4 sm:p-6 space-y-6">
              <form onSubmit={handleSaveHero} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Form Fields */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold text-foreground font-heading">
                      Hero Banner &amp; Headline Content
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-muted-foreground font-medium">Published on portal</span>
                      <input
                        type="checkbox"
                        checked={heroForm.isPublished}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                        className="size-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Main Headline Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Main Portal Headline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={heroForm.title}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Social welfare support, made easier to access."
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Subtitle / Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Subtitle / Catchphrase Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={heroForm.subtitle}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="e.g. Apply for programs, monitor requests, and receive assistance updates..."
                      className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Municipal Titles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Municipal Title Header</label>
                      <input
                        type="text"
                        value={heroForm.municipalTitle}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, municipalTitle: e.target.value }))}
                        placeholder="e.g. MSWDO Carmen, Cebu 6005"
                        className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Office Name</label>
                      <input
                        type="text"
                        value={heroForm.officeName}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, officeName: e.target.value }))}
                        placeholder="e.g. Municipal Social Welfare and Development Office"
                        className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Citizen Guidance Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Citizen Guidance &amp; Application Note
                    </label>
                    <textarea
                      rows={3}
                      value={heroForm.guidanceNote}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, guidanceNote: e.target.value }))}
                      placeholder="Instructions and reminders shown to citizens..."
                      className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Call-to-action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Primary Action Button Text</label>
                      <input
                        type="text"
                        value={heroForm.ctaText}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                        placeholder="e.g. Apply for Welfare Assistance"
                        className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Primary Action Target Link</label>
                      <input
                        type="text"
                        value={heroForm.ctaLink}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, ctaLink: e.target.value }))}
                        placeholder="e.g. /apply"
                        className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      type="submit"
                      variant="brand"
                      disabled={isSaving || !canEdit}
                      className="rounded-[5px] text-xs h-8 cursor-pointer gap-1.5"
                    >
                      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      Save Hero Section
                    </Button>
                  </div>
                </div>

                {/* Right Column: Hero Image & Storage Upload */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold text-foreground font-heading">
                      Hero Portrait Image &amp; Storage
                    </h3>
                    {heroForm.imageUrl && heroForm.imageUrl !== "/mswdo-community-hero-portrait.png" && (
                      <button
                        type="button"
                        onClick={handleResetHeroImage}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>

                  {/* Image Preview Box */}
                  <div className="relative rounded-[5px] border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-950 aspect-[4/3] flex items-center justify-center group shadow-xs">
                    <img
                      src={heroForm.imageUrl || "/mswdo-community-hero-portrait.png"}
                      alt="Hero Banner Preview"
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => heroFileInputRef.current?.click()}
                        className="rounded-[5px] text-xs bg-white text-zinc-900 hover:bg-zinc-100 border-none cursor-pointer shadow-md"
                      >
                        <Upload className="size-3 mr-1" />
                        Replace Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetHeroImage}
                        className="rounded-[5px] text-xs bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 cursor-pointer shadow-md"
                      >
                        <RotateCcw className="size-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* File Upload Input */}
                  <input
                    type="file"
                    ref={heroFileInputRef}
                    accept="image/*"
                    onChange={handleHeroImageChange}
                    className="hidden"
                  />

                  {/* Storage Upload Trigger Box */}
                  <div
                    onClick={() => heroFileInputRef.current?.click()}
                    className="p-3.5 rounded-[5px] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/20 text-center cursor-pointer transition-colors"
                  >
                    {isUploadingHeroImg ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-1">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Uploading &amp; compressing image to Supabase Storage…</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="size-5 text-blue-600 dark:text-blue-400 mx-auto" />
                        <p className="text-xs font-semibold text-foreground">Click to upload new banner portrait</p>
                        <p className="text-[10px] text-muted-foreground">
                          Auto-compressed &amp; synced to Supabase Storage and citizen login screen
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Direct Image URL input with Apply button */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Direct Image URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={heroForm.imageUrl}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://... or /mswdo-community-hero-portrait.png"
                        className="flex-1 h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 font-mono transition-colors"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyHeroImageUrl(heroForm.imageUrl)}
                        className="rounded-[5px] text-xs h-9 px-3 cursor-pointer shrink-0"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" />
                      Live Citizen Showcase Sync
                    </p>
                    <p className="text-[10.5px] leading-relaxed">
                      Image uploads immediately update the Login Page showcase (`AuthShowcase`) and citizen landing view in real time.
                    </p>
                  </div>
                </div>

              </form>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════
              TAB 2: Public Services Directory
          ═══════════════════════════════════════════ */}
          {activeTab === "services" && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Service Program</th>
                      <th className="py-3 px-4 font-semibold">Target Sector</th>
                      <th className="py-3 px-4 font-semibold">Eligibility &amp; Requirements</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                          {q ? "No services match your search query." : "No services added yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((srv) => {
                        const Icon = getServiceIconComponent(srv.icon)
                        return (
                          <tr key={srv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex items-start gap-2.5">
                                <div className="size-8 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground text-xs leading-snug">{srv.title}</p>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{srv.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                {srv.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-sm">
                              <p className="text-foreground text-[11px] font-medium">{srv.eligibility}</p>
                              {Array.isArray(srv.requirements) && srv.requirements.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  {srv.requirements.length} requirement documents specified
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                                  srv.isActive
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                {srv.isActive ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    setEditingService(srv)
                                    setIsServiceModalOpen(true)
                                  }}
                                  className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Edit Service"
                                >
                                  <Edit2 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    if (window.confirm(`Delete service "${srv.title}"?`)) {
                                      handleSaveServiceItems(serviceItems.filter((item) => item.id !== srv.id))
                                    }
                                  }}
                                  className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-red-600 cursor-pointer"
                                  title="Delete Service"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════
              TAB 3: Help Center & FAQs
          ═══════════════════════════════════════════ */}
          {activeTab === "faqs" && (
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredFaqs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    {q ? "No FAQs match your search query." : "No FAQ items added yet."}
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => (
                    <div key={faq.id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {faq.category}
                            </span>
                            <h4 className="text-xs font-bold text-foreground">{faq.question}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => {
                              setEditingFaq(faq)
                              setIsFaqModalOpen(true)
                            }}
                            className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit FAQ"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => {
                              if (window.confirm(`Delete FAQ "${faq.question}"?`)) {
                                handleSaveFaqItems(faqItems.filter((item) => item.id !== faq.id))
                              }
                            }}
                            className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-red-600 cursor-pointer"
                            title="Delete FAQ"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          )}

          {/* ═══════════════════════════════════════════
              TAB 4: Downloadable Application Forms
          ═══════════════════════════════════════════ */}
          {activeTab === "documents" && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Form Title &amp; Description</th>
                      <th className="py-3 px-4 font-semibold">Form Code</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">File Format &amp; Size</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                          {q ? "No forms match your search query." : "No downloadable documents registered yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="flex items-start gap-2.5">
                              <div className="size-8 rounded-[5px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-xs leading-snug">{doc.title}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{doc.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {doc.code}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                              {doc.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                            {doc.format} · {doc.fileSize}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-7 px-2 rounded-[5px] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Download / View Document"
                                >
                                  <Download className="size-3" />
                                  <span>View</span>
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEdit}
                                onClick={() => {
                                  setEditingDoc(doc)
                                  setIsDocModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Form"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEdit}
                                onClick={() => {
                                  if (window.confirm(`Delete form "${doc.title}"?`)) {
                                    handleSaveDocItems(docItems.filter((item) => item.id !== doc.id))
                                  }
                                }}
                                className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-red-600 cursor-pointer"
                                title="Delete Form"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}

        </Card>

      </div>

      {/* ══════════════════════════════════════════════════
          MODAL 1: Add / Edit Service Modal
      ══════════════════════════════════════════════════ */}
      {isServiceModalOpen && (
        <ServiceEditModal
          isOpen={isServiceModalOpen}
          service={editingService}
          onClose={() => {
            setIsServiceModalOpen(false)
            setEditingService(null)
          }}
          onSave={(savedService) => {
            const exists = serviceItems.some((s) => s.id === savedService.id)
            const next = exists
              ? serviceItems.map((s) => (s.id === savedService.id ? savedService : s))
              : [...serviceItems, { ...savedService, id: `srv-${Date.now()}` }]
            handleSaveServiceItems(next)
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 2: Add / Edit FAQ Modal
      ══════════════════════════════════════════════════ */}
      {isFaqModalOpen && (
        <FaqEditModal
          isOpen={isFaqModalOpen}
          faq={editingFaq}
          onClose={() => {
            setIsFaqModalOpen(false)
            setEditingFaq(null)
          }}
          onSave={(savedFaq) => {
            const exists = faqItems.some((f) => f.id === savedFaq.id)
            const next = exists
              ? faqItems.map((f) => (f.id === savedFaq.id ? savedFaq : f))
              : [...faqItems, { ...savedFaq, id: `faq-${Date.now()}` }]
            handleSaveFaqItems(next)
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 3: Add / Edit Document Form Modal
      ══════════════════════════════════════════════════ */}
      {isDocModalOpen && (
        <DocumentEditModal
          isOpen={isDocModalOpen}
          doc={editingDoc}
          onClose={() => {
            setIsDocModalOpen(false)
            setEditingDoc(null)
          }}
          onSave={(savedDoc) => {
            const exists = docItems.some((d) => d.id === savedDoc.id)
            const next = exists
              ? docItems.map((d) => (d.id === savedDoc.id ? savedDoc : d))
              : [...docItems, { ...savedDoc, id: `doc-${Date.now()}` }]
            handleSaveDocItems(next)
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 4: Public Portal Live Preview Modal
      ══════════════════════════════════════════════════ */}
      {isPreviewOpen && (
        <PortalPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hero={heroForm}
          services={serviceItems}
          faqs={faqItems}
          documents={docItems}
        />
      )}

    </SuperAdminUserLayout>
  )
}

/* ─────────────────────────────────────────────
   Modal: Edit / Add Service
───────────────────────────────────────────── */
function ServiceEditModal({ isOpen, service, onClose, onSave }) {
  const [title, setTitle] = useState(service?.title || "")
  const [category, setCategory] = useState(service?.category || "General")
  const [description, setDescription] = useState(service?.description || "")
  const [eligibility, setEligibility] = useState(service?.eligibility || "")
  const [requirementsText, setRequirementsText] = useState(
    Array.isArray(service?.requirements) ? service.requirements.join("\n") : ""
  )
  const [icon, setIcon] = useState(service?.icon || "HeartHandshake")
  const [isActive, setIsActive] = useState(service?.isActive ?? true)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const requirements = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)

    onSave({
      ...(service || {}),
      title: title.trim(),
      category,
      description: description.trim(),
      eligibility: eligibility.trim(),
      requirements,
      icon,
      isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[88vh] rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Pinned Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 shrink-0">
          <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground font-heading">
              {service ? "Edit Public Service Program" : "Add New Public Service Program"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define welfare program qualifications, required files, and citizen criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form wrapping scrollable body + pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Program / Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Citizen Social Protection & OSCA Services"
                className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Target Sector <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="General">General / All Citizens</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                  <option value="Youth">Youth &amp; Students</option>
                  <option value="Women">Women &amp; Solo Parents</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Program Icon</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="HeartHandshake">Heart Handshake (Welfare / Seniors)</option>
                  <option value="Accessibility">Accessibility (PWD)</option>
                  <option value="GraduationCap">Graduation Cap (Youth / Education)</option>
                  <option value="Users">Users (Women / Families)</option>
                  <option value="FileText">Document / Standard</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Public Service Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of benefits and assistance packages..."
                className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Eligibility Standards <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="e.g. Filipino citizen, at least 60 years old, permanent resident of Carmen, Cebu."
                className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">Required Documents Checklist</label>
                <span className="text-[10px] text-muted-foreground">One requirement per line</span>
              </div>
              <textarea
                rows={3}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="PSA Birth Certificate or Voter Certificate&#10;1x1 ID Photos (2 pcs)&#10;Barangay Certificate of Residency"
                className="w-full p-2.5 text-xs font-mono rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none leading-relaxed"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-foreground">Active and visible to citizens on public portal</span>
            </label>
          </div>

          {/* Pinned Footer */}
          <div className="p-3.5 sm:p-4 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer gap-1.5 shadow-xs"
            >
              <Check className="size-3.5" />
              Save Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Edit / Add FAQ
───────────────────────────────────────────── */
function FaqEditModal({ isOpen, faq, onClose, onSave }) {
  const [question, setQuestion] = useState(faq?.question || "")
  const [category, setCategory] = useState(faq?.category || "General")
  const [answer, setAnswer] = useState(faq?.answer || "")
  const [order, setOrder] = useState(faq?.order || 1)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...(faq || {}),
      question: question.trim(),
      category,
      answer: answer.trim(),
      order: Number(order) || 1,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[88vh] rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Pinned Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 shrink-0">
          <div className="size-10 rounded-[5px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <HelpCircle className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground font-heading">
              {faq ? "Edit FAQ Item" : "Add FAQ Item"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Provide clear answers to common citizen welfare inquiries.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form wrapping scrollable body + pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Frequently Asked Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How long does the online application evaluation take?"
                className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Application">Application Process</option>
                  <option value="Benefits">Benefits &amp; Claiming</option>
                  <option value="Requirements">Requirements &amp; Docs</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Display Sort Order</label>
                <input
                  type="number"
                  min="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Official Answer / Explanation <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Provide a thorough, easy-to-read explanation for citizens..."
                className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="p-3.5 sm:p-4 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer gap-1.5 shadow-xs"
            >
              <Check className="size-3.5" />
              Save FAQ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Edit / Upload Downloadable Document Form
───────────────────────────────────────────── */
function DocumentEditModal({ isOpen, doc, onClose, onSave }) {
  const [title, setTitle] = useState(doc?.title || "")
  const [code, setCode] = useState(doc?.code || "MSWDO-FORM-01")
  const [category, setCategory] = useState(doc?.category || "General")
  const [description, setDescription] = useState(doc?.description || "")
  const [url, setUrl] = useState(doc?.url || "")
  const [format, setFormat] = useState(doc?.format || "PDF")
  const [fileSize, setFileSize] = useState(doc?.fileSize || "150 KB")
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef(null)

  if (!isOpen) return null

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const asset = await uploadCmsAsset(file, "cms/forms")
      if (asset?.publicUrl) {
        setUrl(asset.publicUrl)
        setFileSize(asset.fileSize)
        setFormat(file.name.endsWith(".docx") || file.name.endsWith(".doc") ? "DOCX" : "PDF")
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "))
        }
      }
    } catch (err) {
      console.error("Doc upload error:", err)
      alert("Failed to upload file: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...(doc || {}),
      title: title.trim(),
      code: code.trim(),
      category,
      description: description.trim(),
      url: url.trim(),
      format,
      fileSize,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[88vh] rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Pinned Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 shrink-0">
          <div className="size-10 rounded-[5px] bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <LayoutTemplate className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground font-heading">
              {doc ? "Edit Downloadable Form" : "Upload Downloadable Form"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Register downloadable citizen PDF forms, checklists, and templates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Hidden File Picker */}
        <input
          type="file"
          ref={fileRef}
          accept=".pdf,.doc,.docx,.jpg,.png"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Form wrapping scrollable body + pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* File Upload Box */}
            <div
              onClick={() => fileRef.current?.click()}
              className="p-3.5 rounded-[5px] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-purple-500 bg-purple-50/20 dark:bg-purple-950/15 text-center cursor-pointer transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-purple-600 dark:text-purple-400 py-1.5">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="font-medium">Uploading document to Supabase Storage…</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="size-5 text-purple-600 dark:text-purple-400 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    {url ? "Click to replace file (PDF or DOCX)" : "Click to upload document file (PDF or DOCX)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Saved directly to Supabase Storage with public citizen download URL
                  </p>
                </div>
              )}
            </div>

            {/* Current Attached File Indicator (if url exists) */}
            {url && (
              <div className="p-2.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                    {format || "FILE"}
                  </span>
                  <span className="text-[11px] text-foreground font-medium truncate">
                    {fileSize ? `${fileSize}` : "Document Attached"}
                  </span>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 inline-flex items-center gap-1 shrink-0 transition-colors"
                >
                  <ExternalLink className="size-3" />
                  <span>Preview File</span>
                </a>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Form Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Citizen (OSCA) Member Registration Sheet"
                className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Form Reference Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MSWDO-OSCA-02"
                  className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Sector / Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="General">General Intake</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                  <option value="Youth">Youth</option>
                  <option value="Women">Women &amp; Solo Parents</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description &amp; Instructions</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary of what this printable form is used for..."
                className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Format (e.g. PDF)</label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="PDF"
                  className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">File Size</label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="e.g. 180 KB"
                  className="w-full h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Storage Download URL <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://... or uploaded storage path"
                  className="flex-1 h-9 px-3 text-xs leading-normal rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
                />
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 shrink-0 transition-colors"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="size-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Test Link</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="p-3.5 sm:p-4 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="rounded-[5px] text-xs h-8.5 px-4 cursor-pointer gap-1.5 shadow-xs"
            >
              <Check className="size-3.5" />
              Save Document Form
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal: Public Portal Live Preview Modal
───────────────────────────────────────────── */
function PortalPreviewModal({ isOpen, onClose, hero, services, faqs, documents }) {
  const [previewTab, setPreviewTab] = useState("hero")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[92vh] rounded-[5px] bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Preview Topbar */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="size-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono bg-zinc-800/80 px-2.5 py-1 rounded-[4px] border border-zinc-700">
              <Globe className="size-3 text-emerald-400" />
              <span>https://mswdo.carmen-cebu.gov.ph</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-[4px]">
              {["hero", "services", "faqs", "forms"].map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPreviewTab(pt)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-[3px] capitalize cursor-pointer transition-colors ${
                    previewTab === pt ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-6 space-y-6">

          {/* PREVIEW: Hero Banner */}
          {previewTab === "hero" && (
            <div className="relative rounded-[5px] overflow-hidden min-h-[440px] flex flex-col justify-between p-6 sm:p-8 border border-zinc-800 bg-zinc-900 shadow-xl">
              <img
                src={hero.imageUrl || "/mswdo-community-hero-portrait.png"}
                alt="Hero Preview"
                className="absolute inset-0 w-full h-full object-cover object-top opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="/carmen_lgu_logo.png" alt="LGU Logo" className="size-9 object-contain" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{hero.municipalTitle}</h3>
                    <p className="text-[10px] text-zinc-400">{hero.officeName}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {hero.isPublished ? "Public Live" : "Draft"}
                </span>
              </div>

              <div className="relative z-10 max-w-xl space-y-3 mt-12">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {hero.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {hero.subtitle}
                </p>
                {hero.guidanceNote && (
                  <p className="text-xs text-zinc-400 bg-black/40 backdrop-blur-xs p-3 rounded border border-white/10">
                    ℹ️ {hero.guidanceNote}
                  </p>
                )}
                <div className="pt-2 flex items-center gap-2">
                  <span className="px-4 py-2 rounded-[5px] bg-blue-600 text-white text-xs font-bold shadow-md">
                    {hero.ctaText || "Apply for Assistance"}
                  </span>
                  <span className="px-3.5 py-2 rounded-[5px] bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold">
                    Track Application
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW: Services */}
          {previewTab === "services" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading">Public Welfare Programs Directory</h2>
                <p className="text-xs text-zinc-400">Available social safety net services for Carmen constituents.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {services.map((s) => {
                  const Icon = getServiceIconComponent(s.icon)
                  return (
                    <div key={s.id} className="p-4 rounded-[5px] bg-zinc-900 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {s.category}
                        </span>
                        <div className="size-7 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center">
                          <Icon className="size-3.5" />
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white">{s.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{s.description}</p>
                      <div className="pt-1 border-t border-zinc-800/80 text-[10.5px] text-zinc-300">
                        <strong>Eligibility:</strong> {s.eligibility}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PREVIEW: FAQs */}
          {previewTab === "faqs" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-center">
                <h2 className="text-lg font-bold text-white font-heading">Frequently Asked Questions</h2>
                <p className="text-xs text-zinc-400">Frequently answered questions about welfare applications and claiming.</p>
              </div>

              <div className="space-y-2.5">
                {faqs.map((f, i) => (
                  <div key={f.id} className="p-3.5 rounded-[5px] bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold text-xs">Q{i + 1}:</span>
                      <h4 className="text-xs font-bold text-white">{f.question}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed pl-6">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIEW: Downloadable Forms */}
          {previewTab === "forms" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading">Downloadable Municipal Forms</h2>
                <p className="text-xs text-zinc-400">Printable intake sheets, affidavits, and checklists.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-[5px] bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {d.code}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{d.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{d.description}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{d.format} · {d.fileSize}</p>
                    </div>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 inline-flex items-center gap-1"
                    >
                      <Download className="size-3" />
                      Get
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Preview Footer */}
        <div className="px-4 py-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Live portal preview rendered from Supabase CMS data.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-[5px] text-xs h-7 text-zinc-200 border-zinc-700 cursor-pointer">
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}
