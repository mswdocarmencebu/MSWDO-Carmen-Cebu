import React from "react"

export function YouthDetailsForm({ youthDetails, setYouthDetails }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-2">
        <h4 className="text-base font-extrabold text-foreground font-heading">
          Youth Welfare Details
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Educational Attainment <span className="text-red-500">*</span>
          </label>
          <select
            value={youthDetails.educationalAttainment || ""}
            onChange={(e) => setYouthDetails({ ...youthDetails, educationalAttainment: e.target.value })}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="">Select Attainment</option>
            <option value="Elementary Undergraduate">Elementary Undergraduate</option>
            <option value="Elementary Graduate">Elementary Graduate</option>
            <option value="Junior High School">Junior High School</option>
            <option value="Senior High School">Senior High School</option>
            <option value="Vocational / TVET">Vocational / TVET</option>
            <option value="College Undergraduate">College Undergraduate</option>
            <option value="College Graduate">College Graduate</option>
            <option value="Post Graduate">Post Graduate</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Are you out-of-school? <span className="text-red-500">*</span>
          </label>
          <select
            value={youthDetails.outOfSchool || "No, Currently Enrolled"}
            onChange={(e) => setYouthDetails({ ...youthDetails, outOfSchool: e.target.value })}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="No, Currently Enrolled">No, Currently Enrolled</option>
            <option value="Yes, Out-of-School Youth (OSY)">Yes, Out-of-School Youth (OSY)</option>
            <option value="Working Student">Working Student</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Name of School (if applicable)</label>
        <input
          type="text"
          value={youthDetails.schoolName || ""}
          onChange={(e) => setYouthDetails({ ...youthDetails, schoolName: e.target.value })}
          placeholder="e.g. Carmen National High School / Cebu Technological University"
          className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Youth Organization / SK Affiliation</label>
          <input
            type="text"
            value={youthDetails.organization}
            onChange={(e) => setYouthDetails({ ...youthDetails, organization: e.target.value })}
            placeholder="e.g. Katipunan ng Kabataan (KK)"
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Target Program</label>
          <select
            value={youthDetails.targetAssistance}
            onChange={(e) => setYouthDetails({ ...youthDetails, targetAssistance: e.target.value })}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="Educational Assistance / Scholarship">Educational Assistance / Scholarship</option>
            <option value="Skills Training & Livelihood">Skills Training & Livelihood</option>
            <option value="Emergency Relief Aid">Emergency Relief Aid</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default YouthDetailsForm
