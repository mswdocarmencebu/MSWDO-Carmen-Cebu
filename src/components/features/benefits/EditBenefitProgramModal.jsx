import React, { useState, useEffect } from "react"
import { X, HeartHandshake, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EditBenefitProgramModal({
  isOpen,
  onClose,
  onSave,
  program,
}) {
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    amount: "₱1,000.00",
    description: "",
    requirements: "",
    status: "Active",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || "",
        sector: program.sector || "Youth",
        amount: program.amount || "₱1,000.00",
        description: program.description || "",
        requirements: program.requirements || "Barangay Certificate of Indigency, Valid Government ID",
        status: program.status || "Active",
      })
      setError("")
    }
  }, [program])

  if (!isOpen || !program) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Program name is required.")
      return
    }
    if (!formData.sector) {
      setError("Please select an applicant sector.")
      return
    }

    onSave({
      id: program.id || program.code,
      dbId: program.dbId,
      code: program.code || program.id,
      name: formData.name.trim(),
      sector: formData.sector,
      amount: formData.amount.trim() || "₱1,000.00",
      description: formData.description.trim() || `Social welfare assistance for ${formData.sector}`,
      requirements: formData.requirements.trim() || "Barangay Certificate of Indigency, Valid Government ID",
      status: formData.status,
    })

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
            <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-heading">
                Edit Benefit Program
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {program.code || program.id}
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
            <div className="flex items-center gap-2 p-2.5 rounded-[5px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Program Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Program name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              placeholder="e.g. Ayuda Sa Kabataan"
            />
          </div>

          {/* Sector & Amount in a 2-col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target sector <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.sector}
                onChange={(e) => setFormData((p) => ({ ...p, sector: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
              >
                <option value="Youth">Youth Welfare</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="PWD">Person with Disability (PWD)</option>
                <option value="Women">Women's Welfare</option>
                <option value="General">General / All Sectors</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Assistance amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.amount}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
                placeholder="₱1,000.00"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Program Status</label>
            <div className="flex items-center gap-2">
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="flex-1 px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
              >
                <option value="Active">Active (Available for Processing)</option>
                <option value="Inactive">Inactive (Deactivated)</option>
                <option value="Archived">Archived</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`rounded-[5px] text-xs h-8 px-3 shrink-0 cursor-pointer font-medium ${formData.status === "Active"
                  ? "text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  }`}
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    status: p.status === "Active" ? "Inactive" : "Active",
                  }))
                }
              >
                {formData.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description / Purpose</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              placeholder="Program overview and qualification criteria..."
            />
          </div>

          {/* Documentary Requirements */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Documentary requirements</label>
            <textarea
              rows={2}
              value={formData.requirements}
              onChange={(e) => setFormData((p) => ({ ...p, requirements: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              placeholder="e.g. Barangay Certificate of Indigency, Valid ID..."
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200/80 dark:border-zinc-800">
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default EditBenefitProgramModal
