import React, { useState } from "react"
import { AdminStaffLayout } from "@/layouts/admin_staff/AdminStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  Users,
  ClipboardList,
  FolderCheck,
  Building2,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/common"

export function AdminStaffDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("cases")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const roleDetails = profile?.roleDetails

  const staffMetrics = [
    { label: "Intake Cases Today", value: "38 Cases", change: "+12 from yesterday", icon: ClipboardList },
    { label: "Registered Beneficiaries", value: "4,290", change: "Barangay clusters", icon: Users },
    { label: "Pending Verification", value: "14 Cases", change: "Awaiting approval", icon: Clock },
    { label: "Disbursed Grants (Month)", value: "₱ 840K", change: "AICS & Social Pension", icon: CheckCircle2 },
  ]

  const caseQueue = [
    {
      caseNo: "CAS-2026-0891",
      beneficiary: "Corazon Dela Cruz",
      barangay: "Barangay Poblacion",
      service: "AICS Medical Assistance",
      amount: "₱ 12,500.00",
      status: "Verified - For Approval",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
    },
    {
      caseNo: "CAS-2026-0892",
      beneficiary: "Eduardo Manalo",
      barangay: "Barangay Tubod",
      service: "Disaster / Calamity Relief",
      amount: "Emergency Food Packs",
      status: "Dispatched",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
    },
    {
      caseNo: "CAS-2026-0893",
      beneficiary: "Glenda Ramos",
      barangay: "Barangay Salvacion",
      service: "Solo Parent Livelihood Grant",
      amount: "₱ 10,000.00",
      status: "Requirements Review",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
    },
    {
      caseNo: "CAS-2026-0894",
      beneficiary: "Rogelio Santos",
      barangay: "Barangay San Jose",
      service: "PWD Assistive Device Grant",
      amount: "Wheelchair Requisition",
      status: "Approved",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
    },
  ]

  const totalPages = Math.ceil(caseQueue.length / rowsPerPage) || 1
  const displayedCases = caseQueue.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <AdminStaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-4">
        {/* Top Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100 border border-white/20">
              <Users className="size-3.5" />
              MSWDO Staff Operations Console
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Officer: {profile?.full_name || "Admin Staff"}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Municipal Social Welfare and Development Office • Carmen LGU. Manage beneficiary intake records, assess financial and welfare relief eligibility, and coordinate barangay distribution.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-8 pointer-events-none hidden md:block">
            <Users className="size-64 text-white" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{metric.change}</p>
                  </div>
                  <div className="size-11 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="size-5.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Active Case Queue */}
        <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-foreground">Intake Case Management Queue</h3>
                <p className="text-xs text-muted-foreground">Recent welfare intake forms, assistance assessment, and barangay validations</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-[5px] text-xs gap-1.5 cursor-pointer">
                  <Filter className="size-3.5" />
                  Filter Barangay
                </Button>
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs gap-1.5 shadow-xs cursor-pointer">
                  <Plus className="size-3.5" />
                  New Case Intake
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground border-y border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Case #</th>
                    <th className="py-2.5 px-3 font-semibold">Beneficiary Name</th>
                    <th className="py-2.5 px-3 font-semibold">Barangay</th>
                    <th className="py-2.5 px-3 font-semibold">Service Type</th>
                    <th className="py-2.5 px-3 font-semibold">Grant / Relief</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {displayedCases.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-foreground">{item.caseNo}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{item.beneficiary}</td>
                      <td className="py-3 px-3 text-muted-foreground">{item.barangay}</td>
                      <td className="py-3 px-3 text-foreground">{item.service}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{item.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border ${item.badge}`}>
                          {item.status}
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
              totalItems={caseQueue.length}
              pageSize={rowsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setRowsPerPage(newSize)
                setCurrentPage(1)
              }}
              itemLabel="cases"
              className="px-0 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-transparent"
            />
          </CardContent>
        </Card>
      </div>
    </AdminStaffLayout>
  )
}

export default AdminStaffDashboardPage
