import React from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { BasicInfoForm } from "./forms/BasicInfoForm"
import { SeniorDetailsForm } from "./forms/SeniorDetailsForm"
import { YouthDetailsForm } from "./forms/YouthDetailsForm"
import { PwdDetailsForm } from "./forms/PwdDetailsForm"
import { WomenDetailsForm } from "./forms/WomenDetailsForm"

export function ApplyDetailsStep({
  activeCategoryObj,
  onBackToCategory,
  basicInfo,
  setBasicInfo,
  seniorDetails,
  setSeniorDetails,
  familyRows,
  onAddFamilyRow,
  onRemoveFamilyRow,
  onFamilyChange,
  youthDetails,
  setYouthDetails,
  pwdDetails,
  setPwdDetails,
  womenDetails,
  setWomenDetails,
  onContinue,
  fieldErrors = {},
}) {
  const Icon = activeCategoryObj.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Active Category Header Banner */}
      <div className="p-4 rounded-[5px] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className={`size-9 rounded-[5px] flex items-center justify-center shrink-0 border ${activeCategoryObj.iconBg}`}
          >
            <Icon className="size-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              APPLYING FOR
            </span>
            <h4 className="text-base font-extrabold text-foreground">
              {activeCategoryObj.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToCategory}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer underline underline-offset-4"
        >
          Change
        </button>
      </div>

      {/* Form Body Card */}
      <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardContent className="p-5 sm:p-8 space-y-6">
          {/* Common Basic Information */}
          <BasicInfoForm
            basicInfo={basicInfo}
            setBasicInfo={setBasicInfo}
            categoryId={activeCategoryObj?.id}
            fieldErrors={fieldErrors}
          />

          {/* Category-Specific Forms */}
          {activeCategoryObj.id === "senior" && (
            <SeniorDetailsForm
              seniorDetails={seniorDetails}
              setSeniorDetails={setSeniorDetails}
              familyRows={familyRows}
              onAddFamilyRow={onAddFamilyRow}
              onRemoveFamilyRow={onRemoveFamilyRow}
              onFamilyChange={onFamilyChange}
            />
          )}

          {activeCategoryObj.id === "youth" && (
            <YouthDetailsForm
              youthDetails={youthDetails}
              setYouthDetails={setYouthDetails}
            />
          )}

          {activeCategoryObj.id === "pwd" && (
            <PwdDetailsForm
              pwdDetails={pwdDetails}
              setPwdDetails={setPwdDetails}
            />
          )}

          {activeCategoryObj.id === "women" && (
            <WomenDetailsForm
              womenDetails={womenDetails}
              setWomenDetails={setWomenDetails}
            />
          )}

          {/* Bottom Navigation Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onBackToCategory}
              className="h-10 px-5 text-sm font-medium rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="h-10 sm:h-10.5 px-6 text-sm font-semibold rounded-[5px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              Continue
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ApplyDetailsStep
