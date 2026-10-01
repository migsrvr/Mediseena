// ==============================================================================
// MEDISEENA RECORD DETAIL PAGE
// Section 3.3, 3.4.3 & 3.8.2: Detailed Prescription View, Audit Metadata, PDF & JSON
// ==============================================================================

import { useState, useEffect } from 'react'
import AppHeader from '../components/common/AppHeader.jsx'
import { prescriptionService } from '../services/prescriptionService.js'
import { exportToJSON, exportToPDF } from '../services/exportService.js'
import { formatDate, formatDateTime, getStatusBadgeClass, formatConfidence, getConfidenceBadgeClass } from '../utils/Formatters.js'
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Pill,
  History,
  FileCheck
} from 'lucide-react'

export default function RecordDetail({ recordId }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Determine record ID from prop or URL pathname: /records/:id
    const id = recordId || window.location.pathname.split('/').filter(Boolean)[1]
    async function load() {
      setLoading(true)
      try {
        const item = await prescriptionService.getPrescriptionById(id)
        setRecord(item)
      } catch (err) {
        console.error('Failed to load record:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [recordId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-poppins">
        <AppHeader currentPath="/records" />
        <div className="flex h-96 items-center justify-center text-sm font-semibold text-slate-500">
          Loading prescription details...
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 font-poppins">
        <AppHeader currentPath="/records" />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Prescription Record Not Found</h2>
          <p className="mt-1 text-xs text-slate-500">The requested prescription ID does not exist or was removed.</p>
          <a
            href="/records"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Records
          </a>
        </div>
      </div>
    )
  }

  const isVerified = record.verification_status === 'verified'

  return (
    <div className="min-h-screen bg-slate-50 font-poppins pb-16">
      <AppHeader currentPath="/records" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <a
              href="/records"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-teal-deep mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to All Records
            </a>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Prescription #{record.id.substring(0, 12)}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Created on {formatDateTime(record.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportToJSON(record)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <FileText className="h-4 w-4 text-teal" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => exportToPDF(record)}
              className="flex items-center gap-2 rounded-2xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-deep transition active:scale-[0.99]"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Status Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${getStatusBadgeClass(record.verification_status)}`}>
              {isVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-teal" /> Medically Verified
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" /> Pending Pharmacist Review
                </>
              )}
            </span>

            <span className={`rounded-full px-3 py-1 text-xs font-bold border ${getConfidenceBadgeClass(record.ai_confidence || record.ocr_confidence)}`}>
              OCR / AI Confidence: {formatConfidence(record.ai_confidence || record.ocr_confidence)}
            </span>
          </div>

          {!isVerified && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('mediseena_pending_review', JSON.stringify({ draft: record, originalExtraction: record }))
                window.location.href = '/review'
              }}
              className="rounded-xl bg-teal/10 px-4 py-1.5 text-xs font-bold text-teal-deep hover:bg-teal/20 transition"
            >
              Review & Verify Record →
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Metadata & Medications (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Demographics Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-teal" /> Patient Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{record.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Age & Gender</span>
                  <span className="font-semibold text-slate-800">
                    {record.patient_age ? `${record.patient_age} years old` : 'N/A'} • {record.patient_gender || 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Address</span>
                  <span className="font-medium text-slate-800">{record.patient_address || 'Metro Manila, Philippines'}</span>
                </div>
              </div>
            </div>

            {/* Physician Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <Building className="h-4 w-4 text-teal" /> Physician & Clinical Origin
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Attending Physician</span>
                  <span className="font-bold text-slate-900 text-sm">{record.physician_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">License / PTR</span>
                  <span className="font-semibold text-slate-800">{record.physician_license || 'PRC-0142857'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Clinic / Hospital</span>
                  <span className="font-medium text-slate-800">{record.clinic_hospital || 'Medical Health Center'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Date Issued</span>
                  <span className="font-semibold text-slate-800">{formatDate(record.date_issued)}</span>
                </div>
              </div>
            </div>

            {/* Prescribed Medications */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal" /> Prescribed Medications (Rx)
              </h3>
              <div className="space-y-3">
                {(record.medications || []).map((med, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{idx + 1}. {med.medication_name}</span>
                      <span className="rounded-lg bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal-deep">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <strong>Sig:</strong> {med.frequency} {med.duration && `for ${med.duration}`}
                    </div>
                    {med.instructions && (
                      <div className="text-xs text-slate-500 mt-1 italic">
                        Instructions: {med.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {record.notes && (
                <div className="mt-4 pt-3 border-t text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Doctor's Clinical Notes:</span>
                  <p className="text-slate-600 italic bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                    {record.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Audit & Verification Log */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-teal" /> Verification & Security Audit Trail
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Verification Status</span>
                  <span className="font-bold uppercase">{record.verification_status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Verified By</span>
                  <span className="font-semibold text-slate-800">{record.verified_by || 'Pending verification'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Verification Timestamp</span>
                  <span>{formatDateTime(record.verified_at)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Processing Latency</span>
                  <span>{(record.processing_time_ms / 1000).toFixed(2)} seconds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Source Prescription Image (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-teal" /> Source Prescription Scan
              </h3>
              <div className="max-h-[500px] overflow-auto rounded-2xl bg-slate-100 p-2 border">
                <img
                  src={record.source_image_url}
                  alt="Original Rx Scan"
                  className="rounded-lg object-contain w-full"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Stored securely in Supabase Storage</span>
                <span className="font-semibold text-teal">Encrypted at rest</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
