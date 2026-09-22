import React from "react"

export function PwdDetailsForm({ pwdDetails, setPwdDetails }) {
  const update = (field, value) => {
    setPwdDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Application Type <span className="text-red-500">*</span>
            </label>
            <select
              value={pwdDetails.applicationType || "New Applicant"}
              onChange={(e) => update("applicationType", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="New Applicant">New Applicant</option>
              <option value="Renewal">Renewal</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              PWD Number (If Renewal)
            </label>
            <input
              type="text"
              value={pwdDetails.pwdNumber || ""}
              onChange={(e) => update("pwdNumber", e.target.value)}
              placeholder="RR-PPMM-BBB-NNNNNNN"
              disabled={pwdDetails.applicationType !== "Renewal"}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 disabled:opacity-60 text-sm focus:border-blue-600 outline-none font-mono placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Date Applied
            </label>
            <input
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Type of Disability <span className="text-red-500">*</span>
            </label>
            <select
              value={pwdDetails.disabilityType || ""}
              onChange={(e) => update("disabilityType", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Disability Type</option>
              <option value="Deaf/Hard of Hearing">Deaf/Hard of Hearing</option>
              <option value="Intellectual Disability">Intellectual Disability</option>
              <option value="Learning Disability">Learning Disability</option>
              <option value="Mental Disability">Mental Disability</option>
              <option value="Physical Disability (Orthopedic)">Physical Disability (Orthopedic)</option>
              <option value="Psychosocial Disability">Psychosocial Disability</option>
              <option value="Speech and Language Impairment">Speech and Language Impairment</option>
              <option value="Visual Disability">Visual Disability</option>
              <option value="Cancer (RA11215)">Cancer (RA11215)</option>
              <option value="Rare Disease (RA10747)">Rare Disease (RA10747)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Cause of Disability <span className="text-red-500">*</span>
            </label>
            <select
              value={pwdDetails.disabilityCause || ""}
              onChange={(e) => update("disabilityCause", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Cause</option>
              <optgroup label="Congenital / Inborn">
                <option value="ADHD">ADHD</option>
                <option value="Cerebral Palsy (Inborn)">Cerebral Palsy</option>
                <option value="Down Syndrome">Down Syndrome</option>
                <option value="Congenital Others">Others</option>
              </optgroup>
              <optgroup label="Acquired">
                <option value="Chronic Illness">Chronic Illness</option>
                <option value="Cerebral Palsy (Acquired)">Cerebral Palsy</option>
                <option value="Injury">Injury</option>
                <option value="Acquired Others">Others</option>
              </optgroup>
            </select>
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
            <label className="text-xs font-medium text-foreground">Educational Attainment</label>
            <select
              value={pwdDetails.educationalAttainment || ""}
              onChange={(e) => update("educationalAttainment", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Attainment</option>
              <option value="None">None</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="Elementary">Elementary</option>
              <option value="Junior High School">Junior High School</option>
              <option value="Senior High School">Senior High School</option>
              <option value="College">College</option>
              <option value="Vocational">Vocational</option>
              <option value="Post Graduate Program">Post Graduate Program</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Status of Employment</label>
            <select
              value={pwdDetails.statusOfEmployment || ""}
              onChange={(e) => update("statusOfEmployment", e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Select Status</option>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Self-employed">Self-employed</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Occupation Category</label>
          <select
            value={pwdDetails.occupationCategory || ""}
            onChange={(e) => update("occupationCategory", e.target.value)}
            className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="">Select Occupation</option>
            <option value="Managers">Managers</option>
            <option value="Professionals">Professionals</option>
            <option value="Technicians and Associate Professionals">Technicians and Associate Professionals</option>
            <option value="Clerical Support Workers">Clerical Support Workers</option>
            <option value="Service and Sales Workers">Service and Sales Workers</option>
            <option value="Skilled Agricultural, Forestry and Fishery Workers">Skilled Agricultural, Forestry and Fishery Workers</option>
            <option value="Craft and Related Trades Workers">Craft and Related Trades Workers</option>
            <option value="Plant and Machine Operators and Assemblers">Plant and Machine Operators and Assemblers</option>
            <option value="Elementary Occupations">Elementary Occupations</option>
            <option value="Armed Forces Occupations">Armed Forces Occupations</option>
            <option value="Others / None">Others / None</option>
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
            <label className="text-xs font-medium text-foreground">Organization Affiliated</label>
            <input
              type="text"
              value={pwdDetails.organizationAffiliated || ""}
              onChange={(e) => update("organizationAffiliated", e.target.value)}
              placeholder="Name of PWD association or group"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Contact Person</label>
            <input
              type="text"
              value={pwdDetails.orgContactPerson || ""}
              onChange={(e) => update("orgContactPerson", e.target.value)}
              placeholder="Representative name"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Office Address</label>
            <input
              type="text"
              value={pwdDetails.orgOfficeAddress || ""}
              onChange={(e) => update("orgOfficeAddress", e.target.value)}
              placeholder="Address of organization office"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Tel. Nos.</label>
            <input
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
            <label className="text-xs font-medium text-foreground">SSS No.</label>
            <input
              type="text"
              value={pwdDetails.sssNo || ""}
              onChange={(e) => update("sssNo", e.target.value)}
              placeholder="00-0000000-0"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">GSIS No.</label>
            <input
              type="text"
              value={pwdDetails.gsisNo || ""}
              onChange={(e) => update("gsisNo", e.target.value)}
              placeholder="0000000000"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Pag-IBIG No.</label>
            <input
              type="text"
              value={pwdDetails.pagibigNo || ""}
              onChange={(e) => update("pagibigNo", e.target.value)}
              placeholder="0000-0000-0000"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">PhilHealth No.</label>
            <input
              type="text"
              value={pwdDetails.philhealthNo || ""}
              onChange={(e) => update("philhealthNo", e.target.value)}
              placeholder="00-000000000-0"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none font-mono"
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
            <label className="text-xs font-medium text-foreground">
              Father's Name <span className="text-muted-foreground text-[11px]">(Last, First, Middle)</span>
            </label>
            <input
              type="text"
              value={pwdDetails.fatherName || ""}
              onChange={(e) => update("fatherName", e.target.value)}
              placeholder="e.g. Dela Cruz, Juan, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Mother's Name <span className="text-muted-foreground text-[11px]">(Last, First, Middle)</span>
            </label>
            <input
              type="text"
              value={pwdDetails.motherName || ""}
              onChange={(e) => update("motherName", e.target.value)}
              placeholder="e.g. Dela Cruz, Maria, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Guardian's Name <span className="text-muted-foreground text-[11px]">(If applicable)</span>
            </label>
            <input
              type="text"
              value={pwdDetails.guardianName || ""}
              onChange={(e) => update("guardianName", e.target.value)}
              placeholder="e.g. Dela Cruz, Pedro, Santos"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Accomplished By</label>
              <select
                value={pwdDetails.accomplishedBy || "Applicant"}
                onChange={(e) => update("accomplishedBy", e.target.value)}
                className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
              >
                <option value="Applicant">Applicant</option>
                <option value="Guardian">Guardian</option>
                <option value="Representative">Representative</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Name of Certifying Physician
              </label>
              <input
                type="text"
                value={pwdDetails.certifyingPhysician || ""}
                onChange={(e) => update("certifyingPhysician", e.target.value)}
                placeholder="Physician Name & License No."
                className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwdDetailsForm
