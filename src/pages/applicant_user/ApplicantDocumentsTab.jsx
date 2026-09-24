import React, { useState, useMemo } from "react"
import {
  FileCheck2,
  File,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Plus,
  Search,
  Upload,
  FolderArchive,
  Image,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function getDocCategory(doc) {
  if (doc.category) return doc.category
  const combined = `${doc.key || ""} ${doc.name || doc.title || ""} ${doc.fileName || ""}`.toLowerCase()

  if (combined.includes("id") || combined.includes("birth") || combined.includes("psa") || combined.includes("nso") || combined.includes("voter") || combined.includes("passport")) {
    return "Identification & Civil Status"
  }
  if (combined.includes("indigency") || combined.includes("income") || combined.includes("brgy") || combined.includes("clearance") || combined.includes("financial")) {
    return "Indigency & Socio-Economic"
  }
  if (combined.includes("medical") || combined.includes("disability") || combined.includes("doctor") || combined.includes("health") || combined.includes("prescription") || combined.includes("pwd")) {
    return "Medical & Health Records"
  }
  if (combined.includes("school") || combined.includes("enroll") || combined.includes("cor") || combined.includes("osca") || combined.includes("solo") || combined.includes("senior") || combined.includes("youth") || combined.includes("request_form")) {
    return "Sector-Specific Proof"
  }
  return "General & Additional Submissions"
}

export function ApplicantDocumentsTab({
  documents = [],
  loading = false,
  intakeRef = "",
  onViewDoc,
  onOpenUploadModal,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", label: "All Documents" },
    { id: "Identification & Civil Status", label: "Identification" },
    { id: "Indigency & Socio-Economic", label: "Indigency & Income" },
    { id: "Medical & Health Records", label: "Medical" },
    { id: "Sector-Specific Proof", label: "Sector Proof" },
    { id: "General & Additional Submissions", label: "Other" },
  ]

  // Enriched documents with category
  const enrichedDocs = useMemo(() => {
    return documents.map((doc, idx) => ({
      ...doc,
      id: doc.id || `doc-${idx}`,
      resolvedCategory: getDocCategory(doc),
      url: doc.url || doc.previewUrl || "",
      name: doc.name || doc.title || "Submitted Requirement",
      fileName: doc.fileName || "document_file.pdf",
      status: doc.status || "Verified",
    }))
  }, [documents])

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return enrichedDocs.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.resolvedCategory.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (selectedCategory === "all") return true
      return doc.resolvedCategory === selectedCategory
    })
  }, [enrichedDocs, searchTerm, selectedCategory])

  const verifiedCount = enrichedDocs.filter((d) => (d.status || "").toLowerCase() === "verified").length
  const needsCorrectionCount = enrichedDocs.filter((d) => (d.status || "").toLowerCase() === "needs correction").length

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">Uploaded Documents</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified requirements and attachments on file with Carmen MSWDO.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {intakeRef && (
            <div className="px-2.5 py-1 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono">
              <span className="text-muted-foreground font-sans text-[11px] mr-1">Case:</span>
              <span className="font-semibold text-foreground">{intakeRef}</span>
            </div>
          )}
          <Button
            size="sm"
            variant="brand"
            onClick={onOpenUploadModal}
            className="rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer shadow-sm h-8 px-3"
          >
            <Plus className="size-3.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* 3 Simple KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Total Requirements</span>
          <span className="text-sm font-bold text-foreground">{enrichedDocs.length} Files</span>
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Verified by MSWDO</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-blue-600" />
            {verifiedCount} Verified
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Action Required</span>
          <span className="text-sm font-bold text-foreground flex items-center gap-1">
            {needsCorrectionCount > 0 ? (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {needsCorrectionCount} Needs Correction
              </span>
            ) : (
              <span className="text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Complete
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[4px] text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground outline-none focus:border-blue-500 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Document Cards Grid */}
      {loading ? (
        <div className="p-8 text-center space-y-2 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800">
          <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading submitted requirements...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-[5px] border border-dashed border-zinc-200 dark:border-zinc-800">
          <FolderArchive className="size-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-semibold text-foreground">No Documents Found</p>
          <p className="text-[11px] text-muted-foreground">No files match the selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc, idx) => {
            const isVerified = (doc.status || "").toLowerCase() === "verified"
            const isCorrection = (doc.status || "").toLowerCase() === "needs correction"
            const hasUrl = Boolean(doc.url)

            return (
              <Card
                key={doc.id || idx}
                className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-2xs hover:shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between bg-white dark:bg-zinc-900"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {doc.resolvedCategory}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isVerified
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : isCorrection
                          ? "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300"
                          : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="size-3 text-blue-600" />
                      ) : isCorrection ? (
                        <AlertCircle className="size-3 text-rose-600" />
                      ) : (
                        <Clock className="size-3 text-amber-600" />
                      )}
                      {doc.status}
                    </span>
                  </div>

                  {/* Document Title & File Info */}
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {doc.fileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                        <Image className="size-4" />
                      ) : (
                        <File className="size-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Attached
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasUrl ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDoc(doc)}
                            className="h-7 text-[11px] px-2.5 rounded-[4px] gap-1 cursor-pointer border-zinc-300 dark:border-zinc-700 hover:border-blue-600 text-foreground hover:text-blue-600"
                          >
                            <Eye className="size-3" />
                            View
                          </Button>
                          <a
                            href={doc.url}
                            download={doc.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 px-2 rounded-[4px] border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                            title="Download document"
                          >
                            <Download className="size-3" />
                          </a>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          On File
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ApplicantDocumentsTab
