// ==============================================================================
// MEDISEENA REVIEW & VERIFICATION PAGE
// Section 3.7.3 & 3.4.3: Editable Form, Confidence Badges, Manual Correction Logging,
// Dual Viewport (Image + Form), Record Confirmation & PostgreSQL Storage
// ==============================================================================

import { useState, useEffect } from 'react'
import AppHeader from '../components/common/AppHeader.jsx'
import { prescriptionService } from '../services/prescriptionService.js'
import { exportToJSON, exportToPDF } from '../services/exportService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getConfidenceBadgeClass, formatConfidence } from '../utils/Formatters.js'
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Download,
  FileText,
  Plus,
  Trash2,
  Edit3,
  ZoomIn,
  ShieldCheck,
  History,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

export default function ReviewExtraction() {
  const { user, role, isPharmacist } = useAuth()
  const [dataLoaded, setDataLoaded] = useState(false)
  const [record, setRecord] = useState(null)
  const [originalExtraction, setOriginalExtraction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [correctionsCount, setCorrectionsCount] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    // Retrieve pending review draft from sessionStorage
    const stored = sessionStorage.getItem('mediseena_pending_review')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecord(parsed.draft)
        setOriginalExtraction(parsed.originalExtraction || parsed.draft)
        setDataLoaded(true)
        return
      } catch (e) {
        console.error('Failed to parse draft:', e)
      }
    }

    // If navigated directly without upload, load a default pending item
    loadFallbackDraft()
  }, [])

  const loadFallbackDraft = async () => {
    const list = await prescriptionService.getPrescriptions({ status: 'pending' })
    const pendingItem = list[0] || (await prescriptionService.getPrescriptions({ status: 'all' }))[0]
    if (pendingItem) {
      setRecord(JSON.parse(JSON.stringify(pendingItem)))
      setOriginalExtraction(JSON.parse(JSON.stringify(pendingItem)))
    }
    setDataLoaded(true)
  }

  // Count manual edits dynamically
  useEffect(() => {
    if (!record || !originalExtraction) return
    let count = 0
    if (record.patient_name !== originalExtraction.patient_name) count++
    if (record.patient_age !== originalExtraction.patient_age) count++
    if (record.patient_gender !== originalExtraction.patient_gender) count++
    if (record.physician_name !== originalExtraction.physician_name) count++
    if (record.physician_license !== originalExtraction.physician_license) count++
    if (record.date_issued !== originalExtraction.date_issued) count++

    record.medications?.forEach((med, i) => {
      const orig = originalExtraction.medications?.[i]
      if (!orig || orig.medication_name !== med.medication_name || orig.dosage !== med.dosage || orig.frequency !== med.frequency) {
        count++
      }
    })
    setCorrectionsCount(count)
  }, [record, originalExtraction])

  // Field change handler
  const handleFieldChange = (field, value) => {
    setRecord((prev) => ({ ...prev, [field]: value }))
  }

  // Medication item change handler
  const handleMedChange = (index, field, value) => {
    setRecord((prev) => {
      const nextMeds = [...(prev.medications || [])]
      nextMeds[index] = { ...nextMeds[index], [field]: value }
      return { ...prev, medications: nextMeds }
    })
  }

  // Add Medication Row
  const handleAddMedication = () => {
    setRecord((prev) => ({
      ...prev,
      medications: [
        ...(prev.medications || []),
        {
          id: `med_new_${Date.now()}`,
          medication_name: '',
          generic_name: '',
          dosage: '',
          frequency: 'Once daily',
          duration: '7 days',
          route: 'Oral',
          instructions: '',
          confidence_score: 100,
          is_verified: true,
        }
      ]
    }))
  }

  // Remove Medication Row
  const handleRemoveMedication = (index) => {
    setRecord((prev) => {
      const nextMeds = prev.medications.filter((_, idx) => idx !== index)
      return { ...prev, medications: nextMeds }
    })
  }

  // Confirm & Verify
  const handleConfirmVerification = async () => {
    setSaving(true)
    try {
      let targetId = record.id
      if (!targetId || targetId.startsWith('rx_seed') || !targetId.startsWith('rx_')) {
        // Create new record first
        const created = await prescriptionService.createPrescription(record, user)
        targetId = created.id
      }

      await prescriptionService.verifyPrescription(
        targetId,
        record,
        originalExtraction,
        user
      )

      sessionStorage.removeItem('mediseena_pending_review')
      setSaveSuccess(true)
      setTimeout(() => {
        window.location.href = `/records`
      }, 1500)
    } catch (err) {
      console.error('Verification error:', err)
      alert(`Verification failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!dataLoaded || !record) {
    return (
      <div className="min-h-screen bg-slate-50 font-poppins">
        <AppHeader currentPath="/review" />
        <div className="flex h-96 items-center justify-center">
          <div className="text-sm font-semibold text-slate-500">Loading prescription verification workspace...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-poppins pb-16">
      <AppHeader currentPath="/review" />

      {/* Verification Success Toast */}
      {saveSuccess && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 rounded-2xl bg-teal-deep text-white px-5 py-4 shadow-xl ring-1 ring-black/10">
          <CheckCircle2 className="h-6 w-6 text-teal" />
          <div>
            <div className="text-sm font-bold">Prescription Verified & Saved!</div>
            <div className="text-xs text-slate-200">
              {correctionsCount} field corrections logged for KPI tracking. Redirecting to records...
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <a
              href="/upload"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-teal-deep mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Upload
            </a>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Prescription Verification & Review
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Mandatory clinical verification (Section 3.7.3). Provisional AI outputs require human validation before permanent record storage.
            </p>
          </div>

          {/* Quick Actions (JSON & PDF Export) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToJSON(record)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Export structured JSON representation (Section 3.4.3)"
            >
              <FileText className="h-3.5 w-3.5 text-teal" />
              <span>JSON Export</span>
            </button>
            <button
              type="button"
              onClick={() => exportToPDF(record)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Download standardized medical prescription PDF (Section 3.4.3)"
            >
              <Download className="h-3.5 w-3.5 text-teal" />
              <span>PDF Export</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${getConfidenceBadgeClass(record.ai_confidence || record.ocr_confidence)}`}>
              AI Confidence: {formatConfidence(record.ai_confidence || record.ocr_confidence)}
            </div>
            <div className="text-xs text-slate-600">
              Target OCR Field Accuracy: <span className="font-bold text-teal-deep">≥ 85%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {correctionsCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800 border border-amber-200">
                <Edit3 className="h-3.5 w-3.5" />
                {correctionsCount} Field {correctionsCount === 1 ? 'Correction' : 'Corrections'} Tracked
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4" /> No manual corrections required
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Verifier: <strong>{user?.full_name || 'Pharmacist'}</strong> ({role})
            </span>
          </div>
        </div>

        {/* Two-Pane Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Pane: Sticky Image Viewer (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-teal" /> Source Prescription Document
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    className="rounded-lg border px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold text-slate-600">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="rounded-lg border px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto rounded-2xl bg-slate-900/5 p-3 flex items-center justify-center border">
                <img
                  src={record.source_image_url}
                  alt="Prescription Scan"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="rounded-lg object-contain transition-transform duration-200 max-w-full"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Pan / scroll to cross-reference handwriting</span>
                <span>Tesseract raw confidence: {formatConfidence(record.ocr_confidence)}</span>
              </div>
            </div>
          </div>

          {/* Right Pane: Structured Editable Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Section 1: Patient Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">1. Patient Information</h3>
                <span className="text-[11px] font-semibold text-teal-deep bg-teal/10 px-2.5 py-0.5 rounded-full">
                  Demographics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    value={record.patient_name || ''}
                    onChange={(e) => handleFieldChange('patient_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={record.patient_age || ''}
                    onChange={(e) => handleFieldChange('patient_age', e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={record.patient_gender || 'Male'}
                    onChange={(e) => handleFieldChange('patient_gender', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Patient Address</label>
                  <input
                    type="text"
                    value={record.patient_address || ''}
                    onChange={(e) => handleFieldChange('patient_address', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Physician & Clinic Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">2. Physician & Clinic Information</h3>
                <span className="text-[11px] font-semibold text-teal-deep bg-teal/10 px-2.5 py-0.5 rounded-full">
                  Credentials
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Physician Name *</label>
                  <input
                    type="text"
                    value={record.physician_name || ''}
                    onChange={(e) => handleFieldChange('physician_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PRC License / PTR No.</label>
                  <input
                    type="text"
                    value={record.physician_license || ''}
                    onChange={(e) => handleFieldChange('physician_license', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Clinic / Hospital</label>
                  <input
                    type="text"
                    value={record.clinic_hospital || ''}
                    onChange={(e) => handleFieldChange('clinic_hospital', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date Issued *</label>
                  <input
                    type="date"
                    value={record.date_issued || ''}
                    onChange={(e) => handleFieldChange('date_issued', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Prescribed Medications */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3. Prescribed Medications (Rx)</h3>
                  <p className="text-xs text-slate-500">Cross-reference drug name, dosage, and frequency with source scan</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-deep transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Medication
                </button>
              </div>

              <div className="space-y-4">
                {(record.medications || []).map((med, idx) => (
                  <div
                    key={med.id || idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-teal-deep">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white text-[11px]">
                          {idx + 1}
                        </span>
                        <span>Medication Item #{idx + 1}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {med.confidence_score && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getConfidenceBadgeClass(med.confidence_score)}`}>
                            {formatConfidence(med.confidence_score)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Medication Name *</label>
                        <input
                          type="text"
                          value={med.medication_name || ''}
                          onChange={(e) => handleMedChange(idx, 'medication_name', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Dosage *</label>
                        <input
                          type="text"
                          value={med.dosage || ''}
                          onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500 mg"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Frequency (Sig)</label>
                        <input
                          type="text"
                          value={med.frequency || ''}
                          onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Every 8 hours"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Duration</label>
                        <input
                          type="text"
                          value={med.duration || ''}
                          onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 7 days"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Route</label>
                        <input
                          type="text"
                          value={med.route || 'Oral'}
                          onChange={(e) => handleMedChange(idx, 'route', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Instructions</label>
                        <input
                          type="text"
                          value={med.instructions || ''}
                          onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                          placeholder="e.g. Take after meals with plenty of water"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Clinical Notes & Instructions */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">4. Special Instructions & Clinical Notes</h3>
              <textarea
                rows={3}
                value={record.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Doctor's special instructions, allergy notes, or dietary warnings..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </div>

            {/* Verification Action Bar */}
            <div className="rounded-3xl border border-teal-border/50 bg-teal/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-teal-deep flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal" />
                  Mandatory Verification Confirmation
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Confirming this record marks it as medically verified and permanently commits it to Supabase PostgreSQL.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmVerification}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-teal px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-deep transition active:scale-[0.99] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{saving ? 'Verifying & Saving...' : 'Verify & Confirm Record'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
