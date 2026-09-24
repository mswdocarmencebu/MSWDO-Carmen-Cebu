import React, { useState } from "react"
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Building,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ApplicantSupportTab({
  inquiries = [],
  userEmail = "",
  applicantName = "",
  clientId = "",
  onSubmitInquiry,
}) {
  const [category, setCategory] = useState("Assistance Status Follow-up")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  const categories = [
    "Assistance Status Follow-up",
    "Document Correction & Requirements",
    "Municipal Hall Appointment Query",
    "Sector Beneficiary ID Assistance",
    "Emergency Crisis Assistance (AICS)",
    "General Public Inquiry",
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    const res = await onSubmitInquiry({
      email: userEmail,
      name: applicantName,
      clientId,
      category,
      subject: subject.trim() || `${category} - ${applicantName}`,
      message: message.trim(),
    })
    setIsSubmitting(false)

    if (res?.success) {
      setSubmittedSuccess(true)
      setSubject("")
      setMessage("")
      setTimeout(() => setSubmittedSuccess(false), 5000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[5px] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[5px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 shrink-0">
            <HelpCircle className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Citizen Support & Helpdesk</h2>
            <p className="text-xs text-muted-foreground">
              Send inquiries, request assistance updates, and communicate directly with MSWDO Carmen staff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
          <Phone className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>Hotline: (032) 345-2044</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Inquiry Submission Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs bg-white dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground">Submit a Citizen Inquiry</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  From: {clientId}
                </span>
              </div>

              {submittedSuccess && (
                <div className="p-3 rounded-[5px] bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                  <span>
                    Your inquiry has been submitted! An official tracking ticket has been registered in your history below.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Inquiry Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Subject (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule for Social Pension release"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2 text-foreground outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Detailed Message <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your question, request, or concern in detail for the MSWDO social worker..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[5px] p-2.5 text-foreground outline-none focus:border-blue-500 leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Inquiries are answered during Carmen Municipal Hall operating hours (Mon-Fri).
                  </span>
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={isSubmitting || !message.trim()}
                    className="rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="size-3.5" />
                    {isSubmitting ? "Sending..." : "Submit Inquiry"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Past Inquiries History */}
          <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs bg-white dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-foreground">My Submitted Inquiries</h3>
                <span className="text-xs text-muted-foreground">{inquiries.length} Tickets</span>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1 bg-zinc-50 dark:bg-zinc-800/30 rounded-[5px]">
                  <MessageSquare className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="font-medium text-foreground">No Inquiries Submitted Yet</p>
                  <p>When you submit a question above, you can track caseworker replies here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id || inq.ticketNumber}
                      className="p-3.5 rounded-[5px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              {inq.ticketNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold">
                              {inq.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground mt-1">{inq.subject}</h4>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <CheckCircle2 className="size-3 text-blue-600" />
                          {inq.status || "Received"}
                        </span>
                      </div>

                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-900 p-2.5 rounded-[4px] border border-zinc-200/60 dark:border-zinc-800">
                        {inq.message}
                      </p>

                      {inq.response && (
                        <div className="p-2.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
                          <div className="flex items-center gap-1 font-bold">
                            <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
                            <span>MSWDO Carmen Officer Note:</span>
                          </div>
                          <p className="leading-relaxed">{inq.response}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                        <span>Submitted: {new Date(inq.createdAt).toLocaleString()}</span>
                        <span>Carmen Public Helpdesk</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Municipal Office Directory & Contact Details */}
        <div className="space-y-4">
          <Card className="border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs bg-white dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <Building className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-foreground">Carmen Municipal Hall Directory</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Office Location
                  </span>
                  <div className="flex items-start gap-2 text-foreground leading-snug">
                    <MapPin className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      MSWDO Desk, Ground Floor, Municipal Hall, Poblacion, Carmen, Cebu 6005
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Public Office Hours
                  </span>
                  <div className="flex items-start gap-2 text-foreground">
                    <Clock className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>Monday to Friday: 8:00 AM – 5:00 PM (No Noon Break)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Telephone Hotline
                  </span>
                  <div className="flex items-center gap-2 text-foreground font-mono">
                    <Phone className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>(032) 345-2044 / +63 917 123 4567</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Official Inquiries Email
                  </span>
                  <div className="flex items-center gap-2 text-foreground font-mono text-[11px]">
                    <Mail className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>mswdo.carmen.cebu@gmail.com</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-[5px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[11px] text-muted-foreground space-y-1">
                <span className="font-bold text-foreground block">
                  Crisis & Emergency Desk (AICS):
                </span>
                <p>
                  For hospital, burial, or emergency transport crisis intervention, walk in directly to the MSWDO Carmen Front Desk.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ApplicantSupportTab
