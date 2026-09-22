import React from "react"

export function WomenDetailsForm({ womenDetails, setWomenDetails }) {
  const update = (field, value) => {
    setWomenDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-2">
        <h4 className="text-base font-extrabold text-foreground font-heading">
          Women's Welfare Details
        </h4>
      </div>

      {/* Row 1: Date of Registration, Place of Birth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Date of Registration
          </label>
          <input
            type="date"
            value={womenDetails.dateOfRegistration || ""}
            onChange={(e) => update("dateOfRegistration", e.target.value)}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Place of Birth
          </label>
          <input
            type="text"
            value={womenDetails.placeOfBirth || ""}
            onChange={(e) => update("placeOfBirth", e.target.value)}
            placeholder="e.g. Carmen, Cebu"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Row 2: Educational Attainment, Name of Spouse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Educational Attainment
          </label>
          <select
            value={womenDetails.educationalAttainment || ""}
            onChange={(e) => update("educationalAttainment", e.target.value)}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="">Select Attainment</option>
            <option value="None">None</option>
            <option value="Elementary">Elementary</option>
            <option value="Junior High School">Junior High School</option>
            <option value="Senior High School">Senior High School</option>
            <option value="College Level">College Level</option>
            <option value="College Graduate">College Graduate</option>
            <option value="Vocational">Vocational</option>
            <option value="Post Graduate">Post Graduate</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Name of Spouse
          </label>
          <input
            type="text"
            value={womenDetails.spouseName || ""}
            onChange={(e) => update("spouseName", e.target.value)}
            placeholder="Full name of spouse (if applicable)"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Row 3: Name of Father, Name of Mother */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Name of Father
          </label>
          <input
            type="text"
            value={womenDetails.fatherName || ""}
            onChange={(e) => update("fatherName", e.target.value)}
            placeholder="Father's full name"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Name of Mother
          </label>
          <input
            type="text"
            value={womenDetails.motherName || ""}
            onChange={(e) => update("motherName", e.target.value)}
            placeholder="Mother's full name"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Row 4: Are you a Solo Parent?, Number of Children */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Are you a Solo Parent? <span className="text-red-500">*</span>
          </label>
          <select
            value={womenDetails.isSoloParent || "No"}
            onChange={(e) => update("isSoloParent", e.target.value)}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Number of Children
          </label>
          <input
            type="number"
            min="0"
            value={womenDetails.numberOfChildren ?? ""}
            onChange={(e) => update("numberOfChildren", e.target.value)}
            placeholder="0"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Row 5: Current Occupation / Livelihood */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Current Occupation / Livelihood
        </label>
        <input
          type="text"
          value={womenDetails.occupation || ""}
          onChange={(e) => update("occupation", e.target.value)}
          placeholder="e.g. Sari-sari store owner, Vendor, Housewife, None"
          className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
        />
      </div>
    </div>
  )
}

export default WomenDetailsForm
