import React from "react"

export function BasicInfoForm({ basicInfo, setBasicInfo, categoryId, fieldErrors = {} }) {
  const getInputClass = (fieldName) => {
    const hasError = !!fieldErrors[fieldName]
    return `w-full h-10 px-3 rounded-[5px] border ${
      hasError
        ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/20"
        : "border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    } text-sm outline-none transition-colors`
  }

  const getSelectClass = (fieldName) => {
    const hasError = !!fieldErrors[fieldName]
    return `w-full h-10 px-3 rounded-[5px] border ${
      hasError
        ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/20"
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    } text-sm outline-none cursor-pointer transition-colors`
  }

  const getTextareaClass = (fieldName) => {
    const hasError = !!fieldErrors[fieldName]
    return `w-full p-2.5 rounded-[5px] border ${
      hasError
        ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/20"
        : "border-zinc-200 dark:border-zinc-800 bg-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    } text-sm outline-none resize-y transition-colors`
  }

  const calculateAge = (dobString) => {
    if (!dobString) return null
    const birthDate = new Date(dobString)
    if (isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const currentAge = calculateAge(basicInfo.dob)

  const getAgeRequirementInfo = () => {
    switch (categoryId) {
      case "senior":
        return {
          reqLabel: "60+ years old",
          isValid: currentAge !== null ? currentAge >= 60 : null,
        }
      case "youth":
        return {
          reqLabel: "15 to 30 years old",
          isValid: currentAge !== null ? currentAge >= 15 && currentAge <= 30 : null,
        }
      case "women":
        return {
          reqLabel: "18+ years old",
          isValid: currentAge !== null ? currentAge >= 18 : null,
        }
      case "pwd":
        return {
          reqLabel: "All ages eligible",
          isValid: currentAge !== null ? currentAge >= 0 : null,
        }
      default:
        return null
    }
  }

  const ageRule = getAgeRequirementInfo()

  return (
    <div className="space-y-4">
      <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-2">
        <h4 className="text-base font-extrabold text-foreground font-heading">
          Basic Information
        </h4>
      </div>

      {/* Row 1: First Name, Middle Name, Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1" id="field-firstName">
          <label className={`text-xs font-medium ${fieldErrors.firstName ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="input-firstName"
            type="text"
            value={basicInfo.firstName}
            onChange={(e) => setBasicInfo({ ...basicInfo, firstName: e.target.value })}
            placeholder="e.g. Maria"
            className={getInputClass("firstName")}
          />
          {fieldErrors.firstName && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Middle Name</label>
          <input
            id="input-middleName"
            type="text"
            value={basicInfo.middleName}
            onChange={(e) => setBasicInfo({ ...basicInfo, middleName: e.target.value })}
            placeholder="e.g. Santos"
            className={getInputClass("middleName")}
          />
        </div>

        <div className="space-y-1" id="field-lastName">
          <label className={`text-xs font-medium ${fieldErrors.lastName ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="input-lastName"
            type="text"
            value={basicInfo.lastName}
            onChange={(e) => setBasicInfo({ ...basicInfo, lastName: e.target.value })}
            placeholder="e.g. Dela Cruz"
            className={getInputClass("lastName")}
          />
          {fieldErrors.lastName && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Row 2: Date of Birth, Gender, Civil Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1" id="field-dob">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium ${fieldErrors.dob ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
              Date of Birth <span className="text-red-500">*</span>
            </label>
            {currentAge !== null && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px] border ${
                ageRule?.isValid === false
                  ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              }`}>
                Age: {currentAge} yrs
              </span>
            )}
          </div>
          <input
            id="input-dob"
            type="date"
            value={basicInfo.dob}
            onChange={(e) => setBasicInfo({ ...basicInfo, dob: e.target.value })}
            className={getInputClass("dob")}
          />
          {fieldErrors.dob ? (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-tight">{fieldErrors.dob}</p>
          ) : ageRule ? (
            <p className={`text-[10px] ${
              ageRule.isValid === false ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
            }`}>
              Sector Requirement: {ageRule.reqLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-1" id="field-gender">
          <label className={`text-xs font-medium ${fieldErrors.gender ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="input-gender"
            value={categoryId === "women" ? (basicInfo.gender || "Female") : basicInfo.gender}
            onChange={(e) => setBasicInfo({ ...basicInfo, gender: e.target.value })}
            className={getSelectClass("gender")}
          >
            {categoryId === "women" ? (
              <option value="Female">Female</option>
            ) : (
              <>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </>
            )}
          </select>
          {fieldErrors.gender && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.gender}</p>
          )}
        </div>

        <div className="space-y-1" id="field-civilStatus">
          <label className={`text-xs font-medium ${fieldErrors.civilStatus ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            Civil Status <span className="text-red-500">*</span>
          </label>
          <select
            id="input-civilStatus"
            value={basicInfo.civilStatus}
            onChange={(e) => setBasicInfo({ ...basicInfo, civilStatus: e.target.value })}
            className={getSelectClass("civilStatus")}
          >
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
            <option value="Solo Parent">Solo Parent</option>
          </select>
          {fieldErrors.civilStatus && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.civilStatus}</p>
          )}
        </div>
      </div>

      {/* Row 3: Complete Address */}
      <div className="space-y-1" id="field-completeAddress">
        <label className={`text-xs font-medium ${fieldErrors.completeAddress ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
          Complete Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="input-completeAddress"
          rows={2}
          value={basicInfo.completeAddress}
          onChange={(e) => setBasicInfo({ ...basicInfo, completeAddress: e.target.value })}
          placeholder="Purok, Barangay, Municipality of Carmen, Cebu"
          className={getTextareaClass("completeAddress")}
        />
        {fieldErrors.completeAddress && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.completeAddress}</p>
        )}
      </div>

      {/* Row 4: Contact Number & Email Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1" id="field-contactNumber">
          <label className={`text-xs font-medium ${fieldErrors.contactNumber ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            id="input-contactNumber"
            type="tel"
            value={basicInfo.contactNumber}
            onChange={(e) => setBasicInfo({ ...basicInfo, contactNumber: e.target.value })}
            placeholder="09171234567"
            className={getInputClass("contactNumber")}
          />
          {fieldErrors.contactNumber && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.contactNumber}</p>
          )}
        </div>

        <div className="space-y-1" id="field-email">
          <label className={`text-xs font-medium ${fieldErrors.email ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}`}>
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="input-email"
            type="email"
            value={basicInfo.email}
            onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
            placeholder="Required for account creation upon approval"
            className={getInputClass("email")}
          />
          {fieldErrors.email && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{fieldErrors.email}</p>
          )}
        </div>
      </div>
    </div>
  )
}


export default BasicInfoForm
