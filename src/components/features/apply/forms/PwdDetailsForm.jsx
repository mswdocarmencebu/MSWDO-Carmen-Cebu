import React from "react"

const APPLICATION_TYPES = ["New Applicant", "Renewal"]

const DISABILITY_TYPES = [
  "Deaf/Hard of Hearing",
  "Intellectual Disability",
  "Learning Disability",
  "Mental Disability",
  "Physical Disability (Orthopedic)",
  "Orthopedic / Physical Disability",
  "Psychosocial Disability",
  "Speech and Language Impairment",
  "Visual Disability",
  "Cancer (RA11215)",
  "Rare Disease (RA10747)",
]

const DISABILITY_CAUSES = [
  "ADHD",
  "Cerebral Palsy (Inborn)",
  "Down Syndrome",
  "Congenital Others",
  "Congenital / Inborn",
  "Chronic Illness",
  "Cerebral Palsy (Acquired)",
  "Injury",
  "Acquired Others",
]

const EDUCATIONAL_ATTAINMENT = [
  "None",
  "Kindergarten",
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Vocational",
  "Post Graduate Program",
]

const EMPLOYMENT_STATUS = [
  "Employed",
  "Unemployed",
  "Self-employed",
]

const OCCUPATION_CATEGORIES = [
  "Managers",
  "Professionals",
  "Technicians and Associate Professionals",
  "Clerical Support Workers",
  "Service and Sales Workers",
  "Skilled Agricultural, Forestry and Fishery Workers",
  "Craft and Related Trades Workers",
  "Plant and Machine Operators and Assemblers",
  "Elementary Occupations",
  "Armed Forces Occupations",
  "Others / None",
]

const ACCOMPLISHED_BY_OPTIONS = [
  "Applicant",
  "Guardian",
  "Representative",
]

// Helper to match option values case-insensitively so existing localStorage or uppercase states work smoothly
const findMatchingOption = (val, options) => {
  if (!val) return ""
  const match = options.find((opt) => opt.toLowerCase() === String(val).trim().toLowerCase())
  return match || val
}

export function PwdDetailsForm({ pwdDetails = {}, setPwdDetails, fieldErrors = {} }) {
  const currentAppType = findMatchingOption(pwdDetails.applicationType, APPLICATION_TYPES) || "New Applicant"
  const isRenewal = currentAppType.toLowerCase() === "renewal"

  const update = (field, value) => {
    // Dropdown selects, dates, and phone numbers must preserve exact value
    const exactCaseFields = [
      "applicationType",
      "disabilityType",
      "disabilityCause",
      "educationalAttainment",
      "statusOfEmployment",
      "occupationCategory",
      "accomplishedBy",
      "dateApplied",
      "orgTelNos",
    ]

    const formattedValue = exactCaseFields.includes(field)
      ? value
      : typeof value === "string"
        ? value.toUpperCase()
        : value

    setPwdDetails((prev) => {
      const updated = {
        ...prev,
        [field]: formattedValue,
      }
      // If switching from Renewal to New Applicant, clear the PWD number
      if (field === "applicationType" && formattedValue !== "Renewal") {
        updated.pwdNumber = ""
      }
      return updated
    })
  }

  const getSelectClass = (fieldName) => {
    const hasError = !!fieldErrors?.[fieldName]
    return `w-full h-10 px-3 rounded-[5px] border ${
      hasError
        ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-600 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-600"
    } text-sm outline-none cursor-pointer transition-colors`
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Main Form Title / Notice */}
      <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-2">
        <h4 className="text-base font-extrabold text-foreground font-heading">
          PWD Application Details (DOH Form 4.0)
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Philippine Persons with Disability Registration & Assessment Form
        </p>
      </div>

      {/* ── 1. Application Information ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Application Information
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="space-y-1" id="field-applicationType">
            <label htmlFor="input-applicationType" className="text-xs font-medium text-foreground">
              Application Type <span className="text-red-500">*</span>
            </label>
            <select
              id="input-applicationType"
              value={currentAppType}
              onChange={(e) => update("applicationType", e.target.value)}
              className={getSelectClass("applicationType")}
            >
              <option value="New Applicant">New Applicant</option>
              <option value="Renewal">Renewal</option>
            </select>
            {fieldErrors?.applicationType && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.applicationType}</p>
            )}
          </div>

          <div className="space-y-1" id="field-pwdNumber">
            <label htmlFor="input-pwdNumber" className="text-xs font-medium text-foreground">
              PWD Number {isRenewal ? <span className="text-red-500">* (Required for Renewal)</span> : "(If Renewal)"}
            </label>
            <input
              id="input-pwdNumber"
              type="text"
              value={pwdDetails.pwdNumber || ""}
              onChange={(e) => update("pwdNumber", e.target.value)}
              placeholder={isRenewal ? "RR-PPMM-BBB-NNNNNNN" : "Only required for Renewal"}
              disabled={!isRenewal}
              className={`w-full h-10 px-3 rounded-[5px] border ${
                fieldErrors?.pwdNumber
                  ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                  : "border-zinc-200 dark:border-zinc-800 focus:border-blue-600"
              } ${
                !isRenewal
                  ? "bg-zinc-100 dark:bg-zinc-800/40 opacity-60 cursor-not-allowed text-muted-foreground"
                  : "bg-white dark:bg-zinc-900"
              } text-sm outline-none font-mono placeholder:text-muted-foreground/60 uppercase transition-colors`}
            />
            {fieldErrors?.pwdNumber && isRenewal && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.pwdNumber}</p>
            )}
          </div>

          <div className="space-y-1" id="field-dateApplied">
            <label htmlFor="input-dateApplied" className="text-xs font-medium text-foreground">
              Date Applied
            </label>
            <input
              id="input-dateApplied"
              type="date"
              value={pwdDetails.dateApplied || ""}
              onChange={(e) => update("dateApplied", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Disability Information ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Disability Information
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1" id="field-disabilityType">
            <label htmlFor="input-disabilityType" className="text-xs font-medium text-foreground">
              Type of Disability <span className="text-red-500">*</span>
            </label>
            <select
              id="input-disabilityType"
              value={findMatchingOption(pwdDetails.disabilityType, DISABILITY_TYPES)}
              onChange={(e) => update("disabilityType", e.target.value)}
              className={getSelectClass("disabilityType")}
            >
              <option value="">Select Disability Type</option>
              <option value="Deaf/Hard of Hearing">Deaf/Hard of Hearing</option>
              <option value="Intellectual Disability">Intellectual Disability</option>
              <option value="Learning Disability">Learning Disability</option>
              <option value="Mental Disability">Mental Disability</option>
              <option value="Physical Disability (Orthopedic)">Physical Disability (Orthopedic)</option>
              <option value="Orthopedic / Physical Disability">Orthopedic / Physical Disability</option>
              <option value="Psychosocial Disability">Psychosocial Disability</option>
              <option value="Speech and Language Impairment">Speech and Language Impairment</option>
              <option value="Visual Disability">Visual Disability</option>
              <option value="Cancer (RA11215)">Cancer (RA11215)</option>
              <option value="Rare Disease (RA10747)">Rare Disease (RA10747)</option>
            </select>
            {fieldErrors?.disabilityType && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.disabilityType}</p>
            )}
          </div>

          <div className="space-y-1" id="field-disabilityCause">
            <label htmlFor="input-disabilityCause" className="text-xs font-medium text-foreground">
              Cause of Disability <span className="text-red-500">*</span>
            </label>
            <select
              id="input-disabilityCause"
              value={findMatchingOption(pwdDetails.disabilityCause, DISABILITY_CAUSES)}
              onChange={(e) => update("disabilityCause", e.target.value)}
              className={getSelectClass("disabilityCause")}
            >
              <option value="">Select Cause</option>
              <optgroup label="Congenital / Inborn">
                <option value="ADHD">ADHD</option>
                <option value="Cerebral Palsy (Inborn)">Cerebral Palsy</option>
                <option value="Down Syndrome">Down Syndrome</option>
                <option value="Congenital Others">Others</option>
                <option value="Congenital / Inborn">Congenital / Inborn</option>
              </optgroup>
              <optgroup label="Acquired">
                <option value="Chronic Illness">Chronic Illness</option>
                <option value="Cerebral Palsy (Acquired)">Cerebral Palsy</option>
                <option value="Injury">Injury</option>
                <option value="Acquired Others">Others</option>
              </optgroup>
            </select>
            {fieldErrors?.disabilityCause && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.disabilityCause}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Employment & Occupation ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Employment &amp; Occupation
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="input-educationalAttainment" className="text-xs font-medium text-foreground">
              Educational Attainment
            </label>
            <select
              id="input-educationalAttainment"
              value={findMatchingOption(pwdDetails.educationalAttainment, EDUCATIONAL_ATTAINMENT)}
              onChange={(e) => update("educationalAttainment", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Attainment</option>
              {EDUCATIONAL_ATTAINMENT.map((att) => (
                <option key={att} value={att}>
                  {att}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="input-statusOfEmployment" className="text-xs font-medium text-foreground">
              Status of Employment
            </label>
            <select
              id="input-statusOfEmployment"
              value={findMatchingOption(pwdDetails.statusOfEmployment, EMPLOYMENT_STATUS)}
              onChange={(e) => update("statusOfEmployment", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Status</option>
              {EMPLOYMENT_STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="input-occupationCategory" className="text-xs font-medium text-foreground">
            Occupation Category
          </label>
          <select
            id="input-occupationCategory"
            value={findMatchingOption(pwdDetails.occupationCategory, OCCUPATION_CATEGORIES)}
            onChange={(e) => update("occupationCategory", e.target.value)}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="">Select Occupation</option>
            {OCCUPATION_CATEGORIES.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 4. Organization Information ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Organization Information
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="input-orgAffiliated" className="text-xs font-medium text-foreground">
              Organization Affiliated
            </label>
            <input
              id="input-orgAffiliated"
              type="text"
              value={pwdDetails.organizationAffiliated || ""}
              onChange={(e) => update("organizationAffiliated", e.target.value)}
              placeholder="Name of PWD association or group"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-orgContactPerson" className="text-xs font-medium text-foreground">
              Contact Person
            </label>
            <input
              id="input-orgContactPerson"
              type="text"
              value={pwdDetails.orgContactPerson || ""}
              onChange={(e) => update("orgContactPerson", e.target.value)}
              placeholder="Representative name"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="input-orgOfficeAddress" className="text-xs font-medium text-foreground">
              Office Address
            </label>
            <input
              id="input-orgOfficeAddress"
              type="text"
              value={pwdDetails.orgOfficeAddress || ""}
              onChange={(e) => update("orgOfficeAddress", e.target.value)}
              placeholder="Address of organization office"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-orgTelNos" className="text-xs font-medium text-foreground">
              Tel. Nos.
            </label>
            <input
              id="input-orgTelNos"
              type="tel"
              value={pwdDetails.orgTelNos || ""}
              onChange={(e) => update("orgTelNos", e.target.value)}
              placeholder="e.g. (032) 123-4567"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 5. ID Reference Numbers ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          ID Reference Numbers
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="input-sssNo" className="text-xs font-medium text-foreground">
              SSS No.
            </label>
            <input
              id="input-sssNo"
              type="text"
              value={pwdDetails.sssNo || ""}
              onChange={(e) => update("sssNo", e.target.value)}
              placeholder="00-0000000-0"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-gsisNo" className="text-xs font-medium text-foreground">
              GSIS No.
            </label>
            <input
              id="input-gsisNo"
              type="text"
              value={pwdDetails.gsisNo || ""}
              onChange={(e) => update("gsisNo", e.target.value)}
              placeholder="0000000000"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-pagibigNo" className="text-xs font-medium text-foreground">
              Pag-IBIG No.
            </label>
            <input
              id="input-pagibigNo"
              type="text"
              value={pwdDetails.pagibigNo || ""}
              onChange={(e) => update("pagibigNo", e.target.value)}
              placeholder="0000-0000-0000"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-philhealthNo" className="text-xs font-medium text-foreground">
              PhilHealth No.
            </label>
            <input
              id="input-philhealthNo"
              type="text"
              value={pwdDetails.philhealthNo || ""}
              onChange={(e) => update("philhealthNo", e.target.value)}
              placeholder="00-000000000-0"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono uppercase"
            />
          </div>
        </div>
      </div>

      {/* ── 6. Family Background & Accomplishment ── */}
      <div className="space-y-3.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Family Background &amp; Accomplishment
        </h5>
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label htmlFor="input-fatherName" className="text-xs font-medium text-foreground">
              Father's Name <span className="text-muted-foreground text-[11px]">(Last, First, Middle)</span>
            </label>
            <input
              id="input-fatherName"
              type="text"
              value={pwdDetails.fatherName || ""}
              onChange={(e) => update("fatherName", e.target.value)}
              placeholder="e.g. Dela Cruz, Juan, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-motherName" className="text-xs font-medium text-foreground">
              Mother's Name <span className="text-muted-foreground text-[11px]">(Last, First, Middle)</span>
            </label>
            <input
              id="input-motherName"
              type="text"
              value={pwdDetails.motherName || ""}
              onChange={(e) => update("motherName", e.target.value)}
              placeholder="e.g. Dela Cruz, Maria, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-guardianName" className="text-xs font-medium text-foreground">
              Guardian's Name <span className="text-muted-foreground text-[11px]">(If applicable)</span>
            </label>
            <input
              id="input-guardianName"
              type="text"
              value={pwdDetails.guardianName || ""}
              onChange={(e) => update("guardianName", e.target.value)}
              placeholder="e.g. Dela Cruz, Pedro, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="input-accomplishedBy" className="text-xs font-medium text-foreground">
                Accomplished By
              </label>
              <select
                id="input-accomplishedBy"
                value={findMatchingOption(pwdDetails.accomplishedBy, ACCOMPLISHED_BY_OPTIONS) || "Applicant"}
                onChange={(e) => update("accomplishedBy", e.target.value)}
                className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
              >
                {ACCOMPLISHED_BY_OPTIONS.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-certifyingPhysician" className="text-xs font-medium text-foreground">
                Name of Certifying Physician
              </label>
              <input
                id="input-certifyingPhysician"
                type="text"
                value={pwdDetails.certifyingPhysician || ""}
                onChange={(e) => update("certifyingPhysician", e.target.value)}
                placeholder="Physician Name & License No."
                className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none uppercase"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwdDetailsForm
