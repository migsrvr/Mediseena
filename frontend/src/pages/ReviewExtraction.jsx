// Review the source prescription alongside editable OCR results.
import { useState, useEffect, useRef } from 'react'
import { prescriptionService } from '../services/prescriptionService.js'
import { lookupFormulary } from '../services/clinicalFormulary.js'
import { exportToJSON, exportToPDF } from '../services/exportService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatConfidence } from '../utils/Formatters.js'
import { validatePrescriptionRecord } from '../utils/validators.js'
import { AlertCircle, CheckCircle2, ChevronDown, Download, FileText, Minus, Plus, Trash2 } from 'lucide-react'
import backArrow from '../assets/review/back-arrow.svg'
import decoration from '../assets/review/decoration.svg'

function ReviewField({ id, label, value, onChange, type = 'text', error, required = false, options, multiline = false, compact = false, ...rest }) {
  const textareaRef = useRef(null)
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight + 2}px`
    }
    resize()
    let lastWidth = textarea.getBoundingClientRect().width
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === lastWidth) return
      lastWidth = entry.contentRect.width
      resize()
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [value, multiline])
  const inputClass = `block w-full min-w-0 rounded-[6px] border bg-card-bg font-medium text-teal-deep outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 ${compact ? 'min-h-12 px-4 py-3 text-sm' : 'min-h-[62px] px-6 py-4 text-base lg:text-xl'} ${error ? 'border-rose-400' : 'border-transparent'}`
  const shared = { id, value: value ?? '', onChange, required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, className: inputClass, ...rest }
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={`mb-3 block font-extrabold text-teal-deep ${compact ? 'text-sm' : 'text-base lg:text-xl'}`}>
        {label}
      </label>
      {options ? (
        <select {...shared}>
          <option value="">Not extracted</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : multiline ? <textarea {...shared} ref={textareaRef} rows={1} className={`${inputClass} resize-y`} /> : <input {...shared} type={type} />}
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  )
}

function ReviewDetails({ title, children }) {
  return (
    <details className="group rounded-xl border border-teal-light px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-teal-deep outline-none focus-visible:ring-2 focus-visible:ring-teal [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-5 space-y-5">{children}</div>
    </details>
  )
}

function BackToUpload() {
  return (
    <a href="/upload" aria-label="Back to Upload" className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-teal-light/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:left-[calc(8.05%-10px)] lg:top-[39px]">
      <span aria-hidden="true" className="flex h-[30px] w-6 items-center justify-center">
        <img src={backArrow} alt="" className="origin-center scale-x-[3.259] scale-y-[2.357]" />
      </span>
    </a>
  )
}

export function countReviewCorrections(record, original) {
  if (!record || !original) return 0
  const changed = (a, b) => String(a ?? '').trim() !== String(b ?? '').trim()
  const fields = ['patient_name', 'patient_age', 'patient_gender', 'patient_address',
    'physician_name', 'physician_license', 'clinic_hospital', 'date_issued', 'notes']
  const medicationFields = ['medication_name', 'generic_name', 'dosage', 'frequency',
    'duration', 'route', 'instructions']
  let count = fields.filter(field => changed(record[field], original[field])).length
  const originals = new Map((original.medications || []).map((med, i) => [med.id || `index_${i}`, med]))
  const medications = record.medications || []
  medications.forEach((med, i) => {
    const key = med.id || `index_${i}`
    const previous = originals.get(key)
    if (previous) {
      count += medicationFields.filter(field => changed(med[field], previous[field])).length
      originals.delete(key)
    } else {
      count++
    }
  })
  return count + originals.size
}

export default function ReviewExtraction() {
  const { user } = useAuth()
  const [dataLoaded, setDataLoaded] = useState(false)
  const [record, setRecord] = useState(null)
  const [originalExtraction, setOriginalExtraction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [correctionsCount, setCorrectionsCount] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [validationErrors, setValidationErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const saveLock = useRef(false)
  const redirectTimer = useRef(null)

  useEffect(() => {
    // Retrieve pending review draft from sessionStorage
    const stored = sessionStorage.getItem('mediseena_pending_review')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (!parsed?.draft || typeof parsed.draft !== 'object' || !Array.isArray(parsed.draft.medications)) {
          throw new Error('Invalid prescription draft')
        }
        setRecord(parsed.draft)
        setOriginalExtraction(parsed.originalExtraction || parsed.draft)
        setDataLoaded(true)
        return
      } catch (e) {
        console.error('Failed to parse draft:', e)
        setDataLoaded(true)
        return
      }
    }

    // If navigated directly without upload, load a default pending item
    loadFallbackDraft()
  }, [])

  const loadFallbackDraft = async () => {
    try {
      const list = await prescriptionService.getPrescriptions({ status: 'pending' })
      const pendingItem = list[0] || (await prescriptionService.getPrescriptions({ status: 'all' }))[0]
      if (pendingItem) {
        setRecord(JSON.parse(JSON.stringify(pendingItem)))
        setOriginalExtraction(JSON.parse(JSON.stringify(pendingItem)))
      }
    } catch (err) {
      console.error('Failed to load review:', err)
      setSaveError('Unable to load this prescription. Return to Upload and try again.')
    } finally {
      setDataLoaded(true)
    }
  }

  useEffect(() => () => clearTimeout(redirectTimer.current), [])

  // Count manual edits dynamically
  useEffect(() => {
    if (!record || !originalExtraction) return
    setCorrectionsCount(countReviewCorrections(record, originalExtraction))
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
          frequency: '',
          duration: '',
          route: '',
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

  // Validation opens hidden fields before moving keyboard focus to the first error.
  const handleConfirmVerification = async () => {
    if (saveLock.current) return
    const validation = validatePrescriptionRecord(record)
    setValidationErrors(validation.errors)
    setSaveError('')
    if (!validation.valid) {
      const invalidFields = Object.keys(validation.errors).map(id => document.getElementById(id))
      const firstInvalid = invalidFields.find(Boolean)
      for (const field of invalidFields) {
        let details = field?.closest('details')
        while (details) {
          details.open = true
          details = details.parentElement?.closest('details')
        }
      }
      requestAnimationFrame(() => {
        firstInvalid?.focus()
        firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      return
    }
    saveLock.current = true
    setSaving(true)
    let confirmed = false
    try {
      let targetId = record.id
      const isPersisted = Boolean(targetId && !targetId.startsWith('rx_seed') && (targetId.startsWith('rx_') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)))
      if (!isPersisted) {
        const created = await prescriptionService.createPrescription(record, user)
        targetId = created.id
        // A failed verification can be retried without creating a second record.
        setRecord(prev => ({ ...prev, id: targetId }))
      }
      await prescriptionService.verifyPrescription(targetId, record, originalExtraction, user)
      sessionStorage.removeItem('mediseena_pending_review')
      confirmed = true
      setSaveSuccess(true)
      redirectTimer.current = setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (err) {
      console.error('Verification error:', err)
      setSaveError(`Unable to confirm this prescription: ${err.message || 'Please try again.'}`)
    } finally {
      setSaving(false)
      if (!confirmed) saveLock.current = false
    }
  }

  if (!dataLoaded || !record) {
    return (
      <main className="relative min-h-screen bg-card-bg font-poppins text-teal-deep">
        <BackToUpload />
        <div className="flex min-h-screen items-center justify-center px-6 text-center" role="status">
          <div className="max-w-md space-y-4">
            <p>{saveError || (dataLoaded ? 'No prescription is available for review. Upload a prescription to begin.' : 'Loading prescription…')}</p>
            {dataLoaded && <a href="/upload" className="inline-block rounded-[10px] bg-teal px-6 py-3 font-semibold text-white">Back to Upload</a>}
          </div>
        </div>
      </main>
    )
  }

  const disabled = saving || saveSuccess

  return (
    <main className="min-h-screen bg-card-bg font-poppins text-teal-deep lg:grid lg:grid-cols-[48.333%_51.667%] lg:items-start">
      <section aria-label="Source prescription" className="relative min-w-0 px-6 pb-8 pt-24 lg:sticky lg:top-0 lg:px-[11.494%] lg:pb-16 lg:pt-40">
        <BackToUpload />
        <img src={decoration} alt="" aria-hidden="true" className="pointer-events-none absolute left-[calc(11.8%+10px)] top-[447px] hidden origin-center rotate-[17.9deg] lg:block" />
        <div className="relative max-h-[704px] min-h-48 overflow-auto">
          {record.source_image_url ? (
            record.source_image_url.startsWith('data:application/pdf;') || /\.pdf(?:[?#]|$)/i.test(record.source_image_url) ? (
              <object data={record.source_image_url} type="application/pdf" aria-label="Prescription PDF" className="h-[min(70vh,704px)] min-h-80 w-full">
                <a href={record.source_image_url} download="prescription.pdf" className="text-sm underline">Download source prescription PDF</a>
              </object>
            ) : (
              <img src={record.source_image_url} alt="Original prescription for comparison with extracted information" className="mx-auto block h-auto max-w-none object-contain" style={{ width: `${zoomLevel * 100}%`, maxHeight: `${704 * zoomLevel}px` }} />
            )
          ) : <p className="py-16 text-center text-sm">No source document is available for this prescription.</p>}
        </div>
      </section>

      <section aria-labelledby="review-title" className="min-w-0 min-h-screen rounded-t-[30px] bg-white px-6 pb-12 pt-8 sm:px-10 lg:rounded-[30px] lg:px-[8.6%] lg:pt-[29px]">
        <h1 id="review-title" className="mb-7 text-[28px] leading-[1.75] font-black text-teal sm:text-[32px] lg:mb-[18px] lg:text-[clamp(28px,2.778vw,40px)]">Extracted Information</h1>
        <form noValidate onSubmit={event => { event.preventDefault(); handleConfirmVerification() }} aria-busy={saving}>
          <fieldset disabled={disabled} className="min-w-0 space-y-[18px] disabled:opacity-70">
            <legend className="sr-only">Review and edit the extracted prescription</legend>
            <ReviewField id="patient_name" label="Patient’s Name" required value={record.patient_name} error={validationErrors.patient_name} onChange={e => handleFieldChange('patient_name', e.target.value)} />
            <ReviewField id="physician_name" label="Doctor’s Name" required value={record.physician_name} error={validationErrors.physician_name} onChange={e => handleFieldChange('physician_name', e.target.value)} />

            <div id="medications" tabIndex={-1} className="space-y-10 pt-[26px] outline-none">
              <h2 className="sr-only">Prescribed medications</h2>
              {validationErrors.medications && <p role="alert" className="text-sm text-rose-700">{validationErrors.medications}</p>}
              {!record.medications.length && <p className="text-sm">No medications were extracted. Add a medication below to continue.</p>}
              {(record.medications || []).map((med, idx) => {
                const formularyMatch = lookupFormulary(med.medication_name || med.generic_name)
                return (
                <section key={med.id || idx} aria-label={`Medication ${idx + 1}`} className="space-y-[18px]">
                  {med.flag_warning && (
                    <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{med.flag_warning}
                    </p>
                  )}
                  <ReviewField id={`med_${idx}_name`} label="Medicine" required value={med.medication_name} error={validationErrors[`med_${idx}_name`]} onChange={e => handleMedChange(idx, 'medication_name', e.target.value)} />
                  <div>
                    <ReviewField id={`med_${idx}_dosage`} label="Dosage" required value={med.dosage} error={validationErrors[`med_${idx}_dosage`]} onChange={e => handleMedChange(idx, 'dosage', e.target.value)} />
                    {formularyMatch.found && formularyMatch.strengths?.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-teal-deep/70">Standard Strengths:</span>
                        {formularyMatch.strengths.map(strength => (
                          <button
                            key={strength}
                            type="button"
                            onClick={() => handleMedChange(idx, 'dosage', strength)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              med.dosage?.trim() === strength
                                ? 'bg-teal text-white shadow-sm'
                                : 'bg-teal-light/60 text-teal-deep hover:bg-teal-border hover:text-white'
                            }`}
                          >
                            {strength}
                          </button>
                        ))}
                      </div>
                    )}
                    {!med.dosage?.trim() && formularyMatch.found && (
                      <p className="mt-1 text-xs text-amber-800">Dosage not clearly detected — click a standard strength above or enter manually.</p>
                    )}
                  </div>
                  <ReviewField id={`med_${idx}_frequency`} label="Frequency" multiline value={med.frequency} onChange={e => handleMedChange(idx, 'frequency', e.target.value)} />
                  <ReviewDetails title={`Medication ${idx + 1} details`}>
                    {med.confidence_score != null && <p className="text-sm">Extraction confidence: {formatConfidence(med.confidence_score)}</p>}
                    {[
                      ['generic_name', 'Generic Name'], ['duration', 'Duration'],
                      ['route', 'Route'], ['instructions', 'Instructions'],
                    ].map(([field, label]) => (
                      <ReviewField key={field} id={`med_${idx}_${field}`} label={label} compact multiline={field === 'instructions'} value={med[field]} onChange={e => handleMedChange(idx, field, e.target.value)} />
                    ))}
                    <button type="button" onClick={() => handleRemoveMedication(idx)} aria-label={`Remove medication ${idx + 1}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-teal">
                      <Trash2 aria-hidden="true" className="h-4 w-4" />Remove medication
                    </button>
                  </ReviewDetails>
                </section>
                )
              })}
              <ReviewDetails title="Manage medications">
                <button type="button" onClick={handleAddMedication} className="inline-flex items-center gap-2 rounded-lg bg-teal-light px-4 py-3 text-sm font-semibold transition hover:bg-teal-border focus-visible:outline-2 focus-visible:outline-teal">
                  <Plus aria-hidden="true" className="h-4 w-4" />Add medication
                </button>
              </ReviewDetails>
            </div>

            <ReviewDetails title="Additional details">
              <ReviewField id="date_issued" label="Date Issued" type="date" compact required value={record.date_issued} error={validationErrors.date_issued} onChange={e => handleFieldChange('date_issued', e.target.value)} />
              <ReviewField id="patient_age" label="Age" type="number" compact min={0} value={record.patient_age} onChange={e => handleFieldChange('patient_age', e.target.value === '' ? null : Number(e.target.value))} />
              <ReviewField id="patient_gender" label="Gender" compact options={['Male', 'Female', 'Other']} value={record.patient_gender} onChange={e => handleFieldChange('patient_gender', e.target.value)} />
              {[
                ['patient_address', 'Patient Address'], ['physician_license', 'PRC License / PTR No.'],
                ['clinic_hospital', 'Clinic / Hospital'], ['notes', 'Notes & Instructions'],
              ].map(([field, label]) => (
                <ReviewField key={field} id={field} label={label} compact multiline={field === 'notes'} value={record[field]} onChange={e => handleFieldChange(field, e.target.value)} />
              ))}
            </ReviewDetails>

            <ReviewDetails title="Review tools">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">Image zoom</span>
                <button type="button" aria-label="Zoom out" disabled={zoomLevel <= 0.75} onClick={() => setZoomLevel(z => Math.max(0.75, z - 0.25))} className="rounded-lg border border-teal-light p-2 disabled:opacity-40"><Minus aria-hidden="true" className="h-4 w-4" /></button>
                <output className="min-w-12 text-center text-sm">{Math.round(zoomLevel * 100)}%</output>
                <button type="button" aria-label="Zoom in" disabled={zoomLevel >= 2.5} onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))} className="rounded-lg border border-teal-light p-2 disabled:opacity-40"><Plus aria-hidden="true" className="h-4 w-4" /></button>
                <button type="button" onClick={() => setZoomLevel(1)} className="rounded-lg border border-teal-light px-2.5 py-1 text-xs font-semibold hover:bg-teal-light">Reset (100%)</button>
              </div>
              <p className="text-sm">OCR confidence: {formatConfidence(record.ocr_confidence)} · AI confidence: {formatConfidence(record.ai_confidence ?? record.ocr_confidence)}</p>
              <p className="text-sm">{correctionsCount} {correctionsCount === 1 ? 'field change' : 'field changes'}</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => exportToJSON(record)} className="inline-flex items-center gap-2 rounded-lg border border-teal-light px-4 py-3 text-sm font-semibold hover:bg-card-bg"><FileText aria-hidden="true" className="h-4 w-4" />JSON Export</button>
                <button type="button" onClick={() => exportToPDF(record)} className="inline-flex items-center gap-2 rounded-lg border border-teal-light px-4 py-3 text-sm font-semibold hover:bg-card-bg"><Download aria-hidden="true" className="h-4 w-4" />PDF Export</button>
              </div>
            </ReviewDetails>
          </fieldset>

          {Object.keys(validationErrors).length > 0 && <p role="alert" className="mt-6 text-sm text-rose-700">Please complete the required fields before confirming.</p>}
          {saveError && <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p>}
          {saveSuccess && (
            <p role="status" className="mt-6 flex items-center gap-2 text-sm font-semibold text-teal-deep">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />Prescription saved. Redirecting to dashboard…
            </p>
          )}
          <button type="submit" disabled={disabled} className="mx-auto mt-10 flex min-h-[62px] w-full max-w-[400px] items-center justify-center rounded-[10px] bg-teal px-6 py-3 text-xl font-bold text-white transition hover:bg-teal-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-wait disabled:opacity-60 lg:text-[25px]">
            {saving ? 'Saving…' : saveSuccess ? 'Confirmed' : 'Confirm'}
          </button>
        </form>
      </section>
    </main>
  )
}
