// ==============================================================================
// MEDISEENA RECORDS REPOSITORY PAGE
// Section 3.3 & 3.4.3: Centralized Prescription History, Filters, Search & Exports
// ==============================================================================

import { useState } from 'react'
import AppHeader from '../components/common/AppHeader.jsx'
import usePrescriptions from '../hooks/usePrescriptions.js'
import { exportToJSON, exportToPDF } from '../services/exportService.js'
import { formatDate, getStatusBadgeClass, formatConfidence, getConfidenceBadgeClass } from '../utils/Formatters.js'
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Pill,
  Calendar,
  User,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'

export default function Records() {
  const {
    prescriptions,
    loading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    deleteRecord,
  } = usePrescriptions()

  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this prescription record?')) return
    setDeletingId(id)
    try {
      await deleteRecord(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-poppins pb-16">
      <AppHeader currentPath="/records" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Prescription Records Repository
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Access, filter, inspect, and export verified digital prescriptions and medication histories.
            </p>
          </div>

          <a
            href="/upload"
            className="inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-deep transition active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Prescription</span>
          </a>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, clinic, or drug name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>

          {/* Status Tab Filter */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'verified', label: 'Verified' },
              { id: 'pending', label: 'Pending Review' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-teal-deep shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records Listing */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
            <div className="text-xs font-semibold text-slate-500">Loading prescription repository...</div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No prescriptions found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? `No records matching "${searchQuery}". Try clearing search filters.`
                : 'Upload or scan your first handwritten prescription to get started.'}
            </p>
            <a
              href="/upload"
              className="mt-4 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-deep transition"
            >
              Upload Prescription Now
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map((p) => {
              const isVerified = p.verification_status === 'verified'
              return (
                <div
                  key={p.id}
                  onClick={() => { window.location.href = `/records/${p.id}` }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-teal/60 hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Header: Status & Confidence */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadgeClass(p.verification_status)}`}>
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-teal" /> Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-600" /> Pending Review
                          </>
                        )}
                      </span>

                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getConfidenceBadgeClass(p.ai_confidence || p.ocr_confidence)}`}>
                        {formatConfidence(p.ai_confidence || p.ocr_confidence)} Acc
                      </span>
                    </div>

                    {/* Patient & Doctor Details */}
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal transition">
                        {p.patient_name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{p.patient_age ? `${p.patient_age} yrs` : 'N/A'}</span>
                        <span>•</span>
                        <span>{p.patient_gender || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(p.date_issued)}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs text-slate-600">
                        {p.physician_name} • <span className="text-slate-400">{p.clinic_hospital || 'Clinic'}</span>
                      </div>
                    </div>

                    {/* Medications Mini-List */}
                    <div className="mb-4 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5 text-teal" />
                        <span>Prescribed Drugs ({p.medications?.length || 0})</span>
                      </div>
                      <div className="space-y-1">
                        {(p.medications || []).slice(0, 3).map((m, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-700">
                            <span className="font-semibold truncate max-w-[160px]">{m.medication_name}</span>
                            <span className="text-slate-500 text-[11px]">{m.dosage}</span>
                          </div>
                        ))}
                        {(p.medications?.length || 0) > 3 && (
                          <div className="text-[10px] font-semibold text-teal pt-0.5">
                            +{p.medications.length - 3} more medication(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-400">
                      ID: {p.id.substring(0, 10)}...
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => exportToJSON(p)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal transition"
                        title="Download JSON"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => exportToPDF(p)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal transition"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(p.id, e)}
                        disabled={deletingId === p.id}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
