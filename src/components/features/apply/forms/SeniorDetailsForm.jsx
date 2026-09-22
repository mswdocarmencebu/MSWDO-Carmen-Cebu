import React from "react"
import { Plus, Trash2 } from "lucide-react"

export function SeniorDetailsForm({
  seniorDetails,
  setSeniorDetails,
  familyRows,
  onAddFamilyRow,
  onRemoveFamilyRow,
  onFamilyChange,
}) {
  return (
    <div className="space-y-6 pt-2">
      {/* I. General Information */}
      <div className="space-y-3.5">
        <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-1.5">
          <h4 className="text-sm font-bold text-foreground">
            I. General Information
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Citizenship</label>
            <input
              type="text"
              value={seniorDetails.citizenship}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, citizenship: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Religion</label>
            <input
              type="text"
              value={seniorDetails.religion}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, religion: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Birthplace</label>
            <input
              type="text"
              value={seniorDetails.birthplace}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, birthplace: e.target.value })}
              placeholder="Municipality / City"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Name of Benefactor</label>
            <input
              type="text"
              value={seniorDetails.benefactor}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, benefactor: e.target.value })}
              placeholder="Full name of caregiver or sponsor"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Receiving Pension From?</label>
            <select
              value={seniorDetails.pension}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, pension: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="None / Select">None / Select</option>
              <option value="Social Pension (DSWD)">Social Pension (DSWD)</option>
              <option value="SSS">SSS</option>
              <option value="GSIS">GSIS</option>
              <option value="PVAO">PVAO</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Living Arrangement</label>
            <select
              value={seniorDetails.livingArrangement}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, livingArrangement: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="Select Arrangement">Select Arrangement</option>
              <option value="Living Alone">Living Alone</option>
              <option value="Living with Spouse">Living with Spouse</option>
              <option value="Living with Children">Living with Children</option>
              <option value="Living with Relatives">Living with Relatives</option>
            </select>
          </div>
        </div>
      </div>

      {/* II. Economic Status */}
      <div className="space-y-3.5">
        <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-1.5">
          <h4 className="text-sm font-bold text-foreground">
            II. Economic Status
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Occupation</label>
            <input
              type="text"
              value={seniorDetails.occupation}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, occupation: e.target.value })}
              placeholder="e.g. Farmer / Retired / None"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Annual Income</label>
            <input
              type="text"
              value={seniorDetails.annualIncome}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, annualIncome: e.target.value })}
              placeholder="0.00"
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Regular Support from Family?</label>
          <select
            value={seniorDetails.regularSupport}
            onChange={(e) => setSeniorDetails({ ...seniorDetails, regularSupport: e.target.value })}
            className="w-full sm:w-1/2 h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>

      {/* III. Health Condition */}
      <div className="space-y-3.5">
        <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-1.5">
          <h4 className="text-sm font-bold text-foreground">
            III. Health Condition
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">With Disability?</label>
            <select
              value={seniorDetails.withDisability}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, withDisability: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Has Existing Illness?</label>
            <select
              value={seniorDetails.hasIllness}
              onChange={(e) => setSeniorDetails({ ...seniorDetails, hasIllness: e.target.value })}
              className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
      </div>

      {/* IV. Family Composition Table */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-200/90 dark:border-zinc-800 pb-1.5">
          <h4 className="text-sm font-bold text-foreground">
            IV. Family Composition
          </h4>
          <button
            type="button"
            onClick={onAddFamilyRow}
            className="px-2.5 py-1 text-xs font-semibold rounded-[5px] border border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="size-3.5" />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-[5px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
              <tr>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800">NAME</th>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800">RELATION</th>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800 w-16">AGE</th>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800">STATUS</th>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800">OCCUPATION</th>
                <th className="p-2.5 border-r border-zinc-200 dark:border-zinc-800">INCOME</th>
                <th className="p-2.5 text-center w-12">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {familyRows.map((row) => (
                <tr key={row.id}>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => onFamilyChange(row.id, "name", e.target.value)}
                      placeholder="Full Name"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="text"
                      value={row.relation}
                      onChange={(e) => onFamilyChange(row.id, "relation", e.target.value)}
                      placeholder="e.g. Son / Daughter"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="number"
                      value={row.age}
                      onChange={(e) => onFamilyChange(row.id, "age", e.target.value)}
                      placeholder="Age"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="text"
                      value={row.status}
                      onChange={(e) => onFamilyChange(row.id, "status", e.target.value)}
                      placeholder="Civil Status"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="text"
                      value={row.occupation}
                      onChange={(e) => onFamilyChange(row.id, "occupation", e.target.value)}
                      placeholder="Occupation"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                    <input
                      type="text"
                      value={row.income}
                      onChange={(e) => onFamilyChange(row.id, "income", e.target.value)}
                      placeholder="Income"
                      className="w-full p-1 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveFamilyRow(row.id)}
                      disabled={familyRows.length <= 1}
                      className="text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SeniorDetailsForm
