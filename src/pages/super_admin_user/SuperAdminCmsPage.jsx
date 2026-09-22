import React, { useState } from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  LayoutTemplate,
  Image,
  FileText,
  HelpCircle,
  Save,
  Eye,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SuperAdminCmsPage() {
  const [activeCmsSection, setActiveCmsSection] = useState("hero")

  const cmsSections = [
    { id: "hero", label: "Public Landing & Hero Banner", icon: Image },
    { id: "services", label: "Public Services Directory", icon: FileText },
    { id: "faqs", label: "Help Center & FAQs", icon: HelpCircle },
    { id: "documents", label: "Downloadable Application Forms", icon: LayoutTemplate },
  ]

  return (
    <SuperAdminUserLayout activeTab="cms">
      <div className="space-y-4">
        {/* Page Header with H1 Content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <LayoutTemplate className="size-3.5" />
                Content Management System · Super Admin Exclusive
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
            <Button variant="outline" size="sm" className="rounded-[5px] text-xs gap-1.5 cursor-pointer">
              <Eye className="size-3.5" />
              Preview Public Portal
            </Button>
            <Button variant="brand" size="sm" className="rounded-[5px] text-xs gap-1.5 cursor-pointer">
              <Save className="size-3.5" />
              Publish Changes
            </Button>
          </div>
        </div>

        {/* CMS Section Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {cmsSections.map((sec) => {
            const Icon = sec.icon
            const isSelected = activeCmsSection === sec.id
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveCmsSection(sec.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {sec.label}
              </button>
            )
          })}
        </div>

        {/* CMS Editor Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground font-heading">
                    Hero Showcase Banner Configuration
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[4px] border border-emerald-200 dark:border-emerald-800">
                    Live on Portal
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Banner Header Title</label>
                    <input
                      type="text"
                      defaultValue="Municipal Social Welfare and Development Office"
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Subtitle / Catchphrase</label>
                    <input
                      type="text"
                      defaultValue="Empowering Carmen families with compassionate social protection and accessible public welfare."
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Lead Hero Image URL</label>
                    <input
                      type="text"
                      defaultValue="/mswdo-community-hero-portrait.png"
                      className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Citizen Guidance Note</label>
                    <textarea
                      rows={3}
                      defaultValue="Residents of Carmen, Cebu may submit their applications for Senior Citizen IDs, PWD welfare, Solo Parent subsidies, and youth assistance directly online."
                      className="w-full p-2.5 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">CMS Publication Guidelines</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only <strong>Super Administrators (SA)</strong> possess rights to edit citizen-facing portal text, downloadable forms, or municipal advisories.
                </p>
                <div className="p-3 rounded-[5px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300">
                  All edits are logged in the <strong>Audit & Monitoring</strong> ledger before propagating to production edge caches.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminCmsPage
