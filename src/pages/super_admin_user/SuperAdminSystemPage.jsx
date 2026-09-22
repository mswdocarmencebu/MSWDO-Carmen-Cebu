import React from "react"
import { SuperAdminUserLayout } from "@/layouts/super_admin_user/SuperAdminUserLayout"
import {
  Settings,
  Save,
  Database,
  Lock,
  Mail,
  Globe,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SuperAdminSystemPage() {
  return (
    <SuperAdminUserLayout activeTab="system">
      <div className="space-y-4">
        {/* Page Header with H1 Content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Settings className="size-3.5" />
                Global Architecture & Infrastructure
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              System
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Configure municipal social welfare system parameters, security policies, backup schedules, and notifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button variant="brand" size="sm" className="rounded-[5px] text-xs gap-1.5 cursor-pointer">
              <Save className="size-3.5" />
              Save Configuration
            </Button>
          </div>
        </div>

        {/* System Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Municipal Office Metadata */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Globe className="size-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">Municipal Office Identity</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Office Designation</label>
                  <input
                    type="text"
                    defaultValue="Municipal Social Welfare and Development Office (MSWDO)"
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Local Government Unit</label>
                  <input
                    type="text"
                    defaultValue="Municipality of Carmen, Province of Cebu"
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Official Helpline / Contact</label>
                  <input
                    type="text"
                    defaultValue="(032) 266-9123 / mswdo@carmen.gov.ph"
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access Policies */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Lock className="size-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">Security & Session Governance</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="font-semibold text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-muted-foreground">Mandatory for Super Admin & Admin Staff</p>
                  </div>
                  <span className="text-emerald-600 font-bold text-[11px]">Enforced</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="font-semibold text-foreground">Session Inactivity Timeout</p>
                    <p className="text-[11px] text-muted-foreground">Automatically lock staff terminals</p>
                  </div>
                  <span className="text-foreground font-medium text-[11px]">30 Minutes</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="font-semibold text-foreground">Row-Level Security (RLS)</p>
                    <p className="text-[11px] text-muted-foreground">Supabase PostgreSQL policy guard</p>
                  </div>
                  <span className="text-emerald-600 font-bold text-[11px]">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Backup & Disaster Recovery */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Database className="size-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">Database Backup & Recovery</h3>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Automated point-in-time snapshots and daily encrypted database backups stored in regional offsite cold vaults.
                </p>
                <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <p className="text-muted-foreground">Last Backup: <strong className="text-foreground">Today at 22:00 PHT</strong></p>
                  <p className="text-muted-foreground">Retention Window: <strong className="text-foreground">90 Days Continuous</strong></p>
                  <p className="text-emerald-600 font-medium text-[11px]">Integrity Check: Passed (0 Corrupted Blocks)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email & SMS Notification Gateway */}
          <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Mail className="size-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">SMS & Email Broadcast Gateway</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Sender Email Address</label>
                  <input
                    type="text"
                    defaultValue="notifications@mswdo.carmen.gov.ph"
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">SMS Broadcast Gateway</label>
                  <input
                    type="text"
                    defaultValue="CARMEN_LGU (PhilSMS / Semaphore Telco Bridge)"
                    className="w-full h-9 px-3 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminUserLayout>
  )
}

export default SuperAdminSystemPage
