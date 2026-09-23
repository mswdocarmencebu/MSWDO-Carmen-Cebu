import React, { useState } from "react"
import { X, HeartHandshake, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CreateBenefitProgramModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    amount: "₱1,000.00",
    description: "",
    requirements: "",
  })
  const [error, setError] = useState("")

  if (!isOpen) return null

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
      id: `BEN-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      sector: formData.sector,
      amount: formData.amount.trim() || "₱1,000.00",
      description: formData.description.trim() || `Social welfare assistance for ${formData.sector}`,
      requirements: formData.requirements.trim() || "Barangay Certificate of Indigency, Valid Government ID",
      status: "Active",
      createdAt: "Today",
    })

    // Reset and close
    setFormData({
      name: "",
      sector: "",
      amount: "₱1,000.00",
      description: "",
      requirements: "",
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
            <div className="size-10 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-heading">
                Create benefit program
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add an assistance program for an assigned sector.
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
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setError("")
              }}
              placeholder="e.g. Ayuda Sa Kabataan"
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
            />
          </div>

          {/* Sector & Default Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Sector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.sector}
                onChange={(e) => {
                  setFormData({ ...formData, sector: e.target.value })
                  setError("")
                }}
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors cursor-pointer"
              >
                <option value="">Select sector</option>
                <option value="Youth">Youth</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                <option value="Women">Women</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Default Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Default amount
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="₱1,000.00"
                className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="This 'Ayuda' is for Youth assistance and livelihood aid..."
              className="w-full px-3 py-2 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none"
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Requirements
            </label>
            <textarea
              rows={2}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. Valid ID, Barangay Indigency Certificate, Enrollment Form"
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
              Save Program
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBenefitProgramModal
