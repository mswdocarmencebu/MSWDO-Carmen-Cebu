import React, { useRef } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ChevronRight,
  UploadCloud,
  FileCheck,
  Trash2,
  Image as ImageIcon,
  FileText,
  Eye,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ApplyDocumentsStep({
  activeCategoryObj,
  requiredDocuments,
  uploadedFiles,
  onUploadFile,
  onRemoveFile,
  dataPrivacyAgreed,
  setDataPrivacyAgreed,
  onBackToDetails,
  onSubmit,
  isSubmitting,
  lastName,
  documentErrors = {},
}) {
  const fileInputRefs = useRef({})
  const [previewModal, setPreviewModal] = React.useState(null)

  const handleFileChange = (docKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

    const isImage = file.type.startsWith("image/")
    let previewUrl = null

    if (isImage) {
      previewUrl = URL.createObjectURL(file)
    }

    onUploadFile(docKey, {
      file,
      name: file.name,
      size: sizeFormatted,
      type: file.type,
      previewUrl,
      uploadedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })

    // Reset input so re-selecting same file triggers onChange
    e.target.value = ""
  }

  const handleRemove = (docKey) => {
    const existing = uploadedFiles[docKey]
    if (existing?.previewUrl) {
      try {
        URL.revokeObjectURL(existing.previewUrl)
      } catch {}
    }
    onRemoveFile(docKey)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Card className="rounded-[5px] border border-zinc-200/90 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardContent className="p-5 sm:p-8 space-y-6">
          <div className="border-b border-zinc-200/90 dark:border-zinc-800 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {activeCategoryObj.title}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground font-heading">
              Documentary requirements
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload clear photos or scans in JPG, PNG, WEBP, or PDF format. Each file may be up to 5 MB.
            </p>
          </div>

          {/* Document Upload Cards */}
          <div className="space-y-3.5">
            {requiredDocuments.map((doc) => {
              const fileData = uploadedFiles[doc.key]
              const hasDocError = !!documentErrors[doc.key]

              return (
                <div
                  key={doc.key}
                  id={`doc-card-${doc.key}`}
                  className={`p-4 rounded-[5px] border transition-all ${
                    fileData
                      ? "bg-blue-50/20 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/80"
                      : hasDocError
                      ? "bg-red-50/30 dark:bg-red-950/20 border-red-500 dark:border-red-800 ring-1 ring-red-500/50"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${hasDocError ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                          {doc.title}
                          {doc.required && <span className="text-red-500">*</span>}
                        </h4>
                        {doc.required ? (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${hasDocError ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300" : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"}`}>
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.desc}
                      </p>
                      {hasDocError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold pt-1">
                          ⚠️ This document is required. Please choose a file to upload.
                        </p>
                      )}

                      {/* Display thumbnail / preview if image is uploaded */}
                      {fileData && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                          {fileData.previewUrl ? (
                            <div className="relative group size-16 rounded-[5px] overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                              <img
                                src={fileData.previewUrl}
                                alt={fileData.name}
                                className="size-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModal({
                                    url: fileData.previewUrl,
                                    name: fileData.name,
                                  })
                                }
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                title="Click to view full image"
                              >
                                <Eye className="size-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="size-16 rounded-[5px] border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400">
                              <FileText className="size-6 text-blue-600" />
                              <span className="text-[9px] font-mono mt-0.5 uppercase">
                                {fileData.type?.includes("pdf") ? "PDF" : "DOC"}
                              </span>
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[200px] sm:max-w-xs">
                                {fileData.name}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Ready
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Size: <span className="font-mono font-medium text-foreground">{fileData.size}</span> · Uploaded at {fileData.uploadedAt}
                            </p>
                            {fileData.previewUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModal({
                                    url: fileData.previewUrl,
                                    name: fileData.name,
                                  })
                                }
                                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="size-3" />
                                View preview
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        ref={(el) => (fileInputRefs.current[doc.key] = el)}
                        onChange={(e) => handleFileChange(doc.key, e)}
                        className="hidden"
                      />

                      {fileData ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                            className="px-2.5 py-1 text-xs rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(doc.key)}
                            className="p-1.5 rounded-[5px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[doc.key]?.click()}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 hover:text-blue-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <UploadCloud className="size-3.5" />
                          Browse file
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data Privacy Act Declaration & Consent */}
          <div className="p-4 sm:p-5 rounded-[5px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-foreground">Data privacy consent</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                By submitting this form, you consent to the collection, processing, and storage of your personal data by the Municipal Social Welfare and Development Office for the purpose of welfare benefit assessment in accordance with the Data Privacy Act of 2012.
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-start gap-2.5">
              <input
                id="data-privacy-checkbox"
                type="checkbox"
                checked={dataPrivacyAgreed}
                onChange={(e) => setDataPrivacyAgreed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="data-privacy-checkbox"
                className="text-xs text-foreground font-medium leading-snug cursor-pointer select-none"
              >
                I have read the notice and consent to the stated use of my information.
              </label>
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onBackToDetails}
              className="h-10 px-5 text-sm font-medium rounded-[5px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!dataPrivacyAgreed || isSubmitting}
              className="h-10 sm:h-10.5 px-6 text-sm font-semibold rounded-[5px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:pointer-events-none text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Full Size Image Preview Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] p-3 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold truncate max-w-sm text-foreground">
                {previewModal.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1 rounded-[5px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
              <img
                src={previewModal.url}
                alt={previewModal.name}
                className="max-h-[68vh] w-auto object-contain rounded-[4px]"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ApplyDocumentsStep
