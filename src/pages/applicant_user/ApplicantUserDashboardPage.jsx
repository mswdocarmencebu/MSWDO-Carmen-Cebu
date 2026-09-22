import React, { useState } from "react"
import { ApplicantUserLayout } from "@/layouts/applicant_user/ApplicantUserLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  HeartHandshake,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  HelpCircle,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"

export function ApplicantUserDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("applications")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const roleDetails = profile?.roleDetails

  const applicantMetrics = [
    { label: "Active Applications", value: "2 Cases", change: "In evaluation", icon: FileText },
    { label: "Granted Assistance", value: "3 Approved", change: "Current calendar year", icon: CheckCircle2 },
    { label: "Verification Status", value: "Verified", change: "Barangay LGU validated", icon: ShieldCheck },
    { label: "Pending Requirements", value: "1 Document", change: "Cedula / Proof of Indigency", icon: Clock },
  ]

  const myApplications = [
    {
      caseId: "MSWDO-AICS-2026-0421",
      program: "AICS - Medical & Hospitalization Support",
      dateApplied: "Feb 14, 2026",
      amountRequested: "₱ 15,000.00",
      status: "Under Review",
      officer: "Admin Staff Sarah Chen",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
    },
    {
      caseId: "MSWDO-ED-2026-0189",
      program: "Educational Assistance Program (Tertiary)",
      dateApplied: "Jan 20, 2026",
      amountRequested: "₱ 8,000.00",
      status: "Approved",
      officer: "Admin Staff Maria Santos",
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
    },
    {
      caseId: "MSWDO-SP-2025-0982",
      program: "Senior Citizen Special Social Pension Intake",
      dateApplied: "Nov 10, 2025",
      amountRequested: "Monthly Allowance",
      status: "Disbursed",
      officer: "Admin Staff Sarah Chen",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
    },
  ]

  const totalPages = Math.ceil(myApplications.length / rowsPerPage) || 1
  const displayedApplications = myApplications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <ApplicantUserLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-4">
        {/* Top Hero Card */}
        <div className="rounded-[5px] bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-white/15 backdrop-blur-xs text-xs font-semibold text-emerald-100 border border-white/20">
              <HeartHandshake className="size-3.5" />
              MSWDO Carmen Citizen Portal
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, {profile?.full_name || "Applicant"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Track your social welfare assistance applications, submit documentary requirements, and access Municipal Social Welfare & Development Office services online.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-8 pointer-events-none hidden md:block">
            <HeartHandshake className="size-64 text-white" />
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {applicantMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{metric.change}</p>
                  </div>
                  <div className="size-11 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Icon className="size-5.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Applications List */}
        <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-foreground">Recent Assistance Applications</h3>
                <p className="text-xs text-muted-foreground">Status and progress of your welfare assistance filings</p>
              </div>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-[5px] text-xs gap-1.5 shadow-xs cursor-pointer">
                <Plus className="size-3.5" />
                New Application
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-y border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Case Reference</th>
                    <th className="py-2.5 px-3 font-semibold">Program / Service</th>
                    <th className="py-2.5 px-3 font-semibold">Date Filed</th>
                    <th className="py-2.5 px-3 font-semibold">Assistance Value</th>
                    <th className="py-2.5 px-3 font-semibold">Caseworker</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {displayedApplications.map((app, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-foreground">{app.caseId}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{app.program}</td>
                      <td className="py-3 px-3 text-muted-foreground">{app.dateApplied}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{app.amountRequested}</td>
                      <td className="py-3 px-3 text-muted-foreground">{app.officer}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border ${app.badgeClass}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Global Data Table Pagination */}
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={myApplications.length}
              pageSize={rowsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setRowsPerPage(newSize)
                setCurrentPage(1)
              }}
              itemLabel="applications"
              className="px-0 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-transparent"
            />
          </CardContent>
        </Card>
      </div>
    </ApplicantUserLayout>
  )
}

export default ApplicantUserDashboardPage
