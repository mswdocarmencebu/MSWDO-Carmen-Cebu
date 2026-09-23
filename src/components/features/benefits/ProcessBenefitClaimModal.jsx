import React, { useState, useMemo } from "react"
import { X, Coins, AlertCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEFAULT_ACTIVE_MEMBERS = [
  { id: "MSWDO-87656", name: "Neil M Delante", category: "Youth" },
  { id: "MSWDO-97172", name: "Shen M Delante", category: "Person with Disability (PWD)" },
]

const RELEASE_METHODS = ["Cash", "Check", "Bank Transfer", "Goods / In-kind", "Service Referral"]

function normalizeSector(val = "") {
  const s = String(val).toLowerCase().trim()
  if (s.includes("pwd") || s.includes("disabilit")) return "pwd"
  if (s.includes("senior") || s.includes("elderly") || s.includes("aged")) return "senior"
  if (s.includes("youth") || s.includes("kabataan") || s.includes("child") || s.includes("student")) return "youth"
  if (s.includes("women") || s.includes("woman") || s.includes("solo parent") || s.includes("mother")) return "women"
  if (s.includes("general") || s.includes("all") || s.includes("universal") || s.includes("community")) return "general"
  return s
}

function isProgramEligible(programSector, memberCategory) {
  if (!memberCategory) return true
  const normProg = normalizeSector(programSector)
  const normMem = normalizeSector(memberCategory)
  if (normProg === "general" || !normProg) return true
  return normProg === normMem
}

export function ProcessBenefitClaimModal({ isOpen, onClose, onSave, programs = [], members = [] }) {
  const [formData, setFormData] = useState({
    memberId: "",
    benefitId: "",
    amount: "",
    releaseMethod: "Cash",
    releaseDate: "",
    referenceNo: "",
    remarks: "",
  })
  const [error, setError] = useState("")

  const activeMembersList = useMemo(() => {
    if (Array.isArray(members) && members.length > 0) {
      const filtered = members
        .filter((m) => (m.status || "").toLowerCase() === "active" || (!m.status && !m.isArchived))
        .map((m) => ({
          id: m.memberId || m.id,
          name: m.name,
          category: m.category || m.sector || "General",
        }))
      if (filtered.length > 0) return filtered
    }
    return DEFAULT_ACTIVE_MEMBERS
  }, [members])

  const selectedMember = activeMembersList.find((m) => m.id === formData.memberId)
  const selectedProgram = programs.find((p) => p.id === formData.benefitId || p.code === formData.benefitId)

  // Separate programs into eligible and ineligible according to the selected member's sector
  const { eligiblePrograms, ineligiblePrograms } = useMemo(() => {
    if (!selectedMember) {
      return { eligiblePrograms: programs, ineligiblePrograms: [] }
    }
    const eligible = []
    const ineligible = []
    programs.forEach((p) => {
      if (isProgramEligible(p.sector, selectedMember.category)) {
        eligible.push(p)
      } else {
        ineligible.push(p)
      }
    })
    return { eligiblePrograms: eligible, ineligiblePrograms: ineligible }
  }, [programs, selectedMember])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    if (field === "memberId") {
      const chosenMember = activeMembersList.find((m) => m.id === value)
      // If a program was already selected, check if it's eligible for this new member
      if (formData.benefitId && chosenMember) {
        const curProg = programs.find((p) => p.id === formData.benefitId || p.code === formData.benefitId)
        if (curProg && !isProgramEligible(curProg.sector, chosenMember.category)) {
          // Ineligible program automatically cleared
          setFormData((prev) => ({
            ...prev,
            memberId: value,
            benefitId: "",
            amount: "",
          }))
          setError(
            `Notice: Previously chosen "${curProg.name}" (${curProg.sector}) was cleared because it is restricted from ${chosenMember.category} members.`
          )
          return
        }
      }
    }

    if (field === "benefitId") {
      const prog = programs.find((p) => p.id === value || p.code === value)
      if (prog && selectedMember && !isProgramEligible(prog.sector, selectedMember.category)) {
        setError(
          `"${prog.name}" is designated for ${prog.sector} and cannot be selected by a ${selectedMember.category} member.`
        )
        return
      }
      if (prog) {
        setFormData((prev) => ({ ...prev, benefitId: value, amount: prog.amount }))
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.memberId) { setError("Please select a member."); return }
    if (!formData.benefitId) { setError("Please select a benefit program."); return }
    if (!formData.amount.trim()) { setError("Claim amount is required."); return }
    if (!formData.releaseDate) { setError("Release date is required."); return }
    if (!formData.referenceNo.trim()) { setError("Reference / voucher number is required."); return }

    if (selectedMember && selectedProgram) {
      if (!isProgramEligible(selectedProgram.sector, selectedMember.category)) {
        setError(
          `Cannot process claim: "${selectedProgram.name}" (${selectedProgram.sector}) does not match beneficiary's registered sector (${selectedMember.category}).`
        )
        return
      }
    }

    onSave({
      id: `CLM-${Date.now().toString().slice(-5)}`,
      memberId: formData.memberId,
      memberName: selectedMember?.name ?? formData.memberId,
      benefit: selectedProgram?.name ?? formData.benefitId,
      amount: formData.amount,
      releaseMethod: formData.releaseMethod,
      releaseDate: formData.releaseDate,
      referenceNo: formData.referenceNo,
      remarks: formData.remarks,
      status: "Pending",
    })

    setFormData({
      memberId: "",
      benefitId: "",
      amount: "",
      releaseMethod: "Cash",
      releaseDate: "",
      referenceNo: "",
      remarks: "",
    })
    setError("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-[5px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-heading">
                Process benefit claim
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record and release a benefit to an active member with sector-matching validation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Member */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.memberId}
              onChange={(e) => handleChange("memberId", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
            >
              <option value="">Select active member</option>
              {activeMembersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.id} ({m.category})
                </option>
              ))}
            </select>

            {/* Member Sector Banner */}
            {selectedMember && (
              <div className="flex items-center justify-between p-2 rounded-[5px] bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                    Beneficiary Sector:
                  </span>
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    {selectedMember.category}
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Sector restriction active
                </span>
              </div>
            )}
          </div>

          {/* Benefit Program */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Benefit Program <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.benefitId}
              onChange={(e) => handleChange("benefitId", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
            >
              <option value="">Select benefit</option>
              {eligiblePrograms.length > 0 && (
                <optgroup label={selectedMember ? `Eligible for ${selectedMember.category}` : "Available Programs"}>
                  {eligiblePrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.sector} ({p.amount})
                    </option>
                  ))}
                </optgroup>
              )}
              {ineligiblePrograms.length > 0 && (
                <optgroup label={`Ineligible (Restricted to other sectors)`}>
                  {ineligiblePrograms.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled
                      className="text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800/80 font-normal"
                    >
                      ⛔ {p.name} ({p.sector} only — Not eligible)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Ineligible warning hint */}
            {selectedMember && ineligiblePrograms.length > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1">
                <span className="mt-0.5">⚠️</span>
                <span>
                  {ineligiblePrograms.length} {ineligiblePrograms.length === 1 ? "program" : "programs"} ({[...new Set(ineligiblePrograms.map((p) => p.sector))].join(", ")}) disabled. Beneficiary is registered under <strong>{selectedMember.category}</strong>.
                </span>
              </p>
            )}
          </div>

          {/* Amount & Release Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Claim amount / value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="₱1,000.00"
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Release method <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.releaseMethod}
                onChange={(e) => handleChange("releaseMethod", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
              >
                {RELEASE_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Release Date & Reference No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Release date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.releaseDate}
                onChange={(e) => handleChange("releaseDate", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reference / voucher no. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.referenceNo}
                onChange={(e) => handleChange("referenceNo", e.target.value)}
                placeholder="e.g. VCH-2026-001"
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Optional notes about this claim release..."
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="rounded-[5px] text-xs h-8 cursor-pointer"
            >
              Record Claim
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProcessBenefitClaimModal
