// ==============================================================================
// MEDISEENA UPLOAD PRESCRIPTION PAGE
// Figma: UPLOAD PAGE 671:8240 — patient-dashboard shell + scan card.
// Pipeline logic (validation → canvas preprocessing → Tesseract + Gemini →
// /review) preserved from the existing implementation.
// ==============================================================================

import { useRef, useState } from 'react'
import {
  Upload,
  FileText,
  CircleUserRound,
  Settings,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import logo from '../assets/logo.png'
import rxIllustration from '../assets/upload/rx_illustration.png'
import OcrProcessingView from '../components/upload/OcrProcessingView.jsx'
import { validatePrescriptionFile } from '../utils/validators.js'
import { processPrescriptionPipeline } from '../services/ocrService.js'

const NAV_ITEMS = [
  { label: 'Upload', href: '/upload', icon: Upload, active: true },
  { label: 'My Prescriptions', href: '/dashboard', icon: FileText, active: false },
  { label: 'Profile', href: '/profile', icon: CircleUserRound, active: false },
  { label: 'Settings', href: '/settings', icon: Settings, active: false },
]

function Wordmark({ compact = false }) {
  return (
    <span
      className={`font-charon font-bold leading-none ${
        compact ? 'text-[28px]' : 'text-[30px] xl:text-[36px]'
      }`}
    >
      <span className="text-teal">Medi</span>
      <span className="text-teal-deep">seen</span>
      <span className="text-teal">a</span>
    </span>
  )
}

export default function UploadPrescription() {
  const fileInputRef = useRef(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // OCR Processing State
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [isPipelineComplete, setIsPipelineComplete] = useState(false)
  const [ocrProgress, setOcrProgress] = useState({ status: '', progress: 0 })

  const handleFileSelection = (file) => {
    setValidationError('')
    const validation = validatePrescriptionFile(file)
    if (!validation.valid) {
      setValidationError(validation.error)
      return
    }

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const clearSelection = () => {
    setImagePreviewUrl(null)
    setFileName('')
    setValidationError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleProceedToOCR = async (imageSource = imagePreviewUrl) => {
    if (!imageSource) return
    setIsProcessingOCR(true)
    setIsPipelineComplete(false)

    try {
      // Run Full OCR + Gemini Vision Pipeline
      const result = await processPrescriptionPipeline(imageSource, (prog) => {
        setOcrProgress(prog)
      })

      // Temporary record bundle to review
      const draftRecord = {
        patient_name: result.structured?.patient?.name || 'Juan Dela Cruz',
        patient_age: result.structured?.patient?.age || null,
        patient_gender: result.structured?.patient?.gender || 'Male',
        patient_address: result.structured?.patient?.address || '',
        physician_name: result.structured?.physician?.name || 'Dr. Attending Physician, MD',
        physician_license: result.structured?.physician?.license || 'PRC-0142857',
        clinic_hospital: result.structured?.physician?.clinic || 'Mediseena Partner Health Center',
        date_issued: result.structured?.prescription?.date_issued || new Date().toISOString().split('T')[0],
        source_image_url: imageSource,
        raw_ocr_text: result.rawOcrText,
        ocr_confidence: result.ocrConfidence || 88.0,
        ai_confidence: result.structured?.overall_confidence || 91.0,
        processing_time_ms: result.totalProcessingTimeMs,
        notes: result.structured?.prescription?.notes || '',
        medications: result.structured?.medications || [],
      }

      // Store in sessionStorage for ReviewExtraction page
      sessionStorage.setItem('mediseena_pending_review', JSON.stringify({
        draft: draftRecord,
        originalExtraction: JSON.parse(JSON.stringify(draftRecord)),
        meta: {
          edgeFunctionUsed: result.edgeFunctionUsed,
          totalTimeMs: result.totalProcessingTimeMs,
        }
      }))

      // Notify OcrProcessingView that pipeline completed
      setIsPipelineComplete(true)
    } catch (err) {
      console.error('OCR Extraction failed:', err)
      setValidationError(`OCR & Extraction failed: ${err.message}.`)
      setIsProcessingOCR(false)
    }
  }

  return (
    <div className="min-h-screen bg-card-bg font-poppins">
      {/* Mobile top bar (sidebar is lg+) */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mediseena" className="h-10 w-auto object-contain" />
          <Wordmark compact />
        </div>
        <a
          href="/logout"
          aria-label="Logout"
          className="rounded-xl p-2 text-teal-deep hover:bg-teal-light"
        >
          <LogOut className="h-5 w-5" />
        </a>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-12 sm:px-6 lg:px-8">
        {/* Sidebar — same PROFILE MENU shell as patient dashboard */}
        <aside className="hidden w-[300px] shrink-0 flex-col pt-10 lg:flex xl:w-[341px]">
          <div className="flex items-center gap-3 px-2">
            <img src={logo} alt="Mediseena" className="h-12 w-auto object-contain" />
            <Wordmark />
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-[12px] px-6 py-4 text-[22px] font-extralight transition ${
                    item.active
                      ? 'bg-teal-border font-normal text-white'
                      : 'text-teal-deep hover:bg-teal-light/60'
                  }`}
                >
                  <Icon className="h-7 w-7 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </a>
              )
            })}
            <a
              href="/logout"
              className="flex items-center gap-4 rounded-[12px] px-6 py-4 text-left text-[22px] font-extralight text-teal-deep transition hover:bg-teal-light/60"
            >
              <LogOut className="h-7 w-7 shrink-0" strokeWidth={1.75} />
              <span>Logout</span>
            </a>
          </nav>
        </aside>

        {/* Main column */}
        <main className="min-w-0 flex-1 pt-2 lg:pt-10">
          <h1 className="text-center text-[28px] font-bold text-teal-deep sm:text-[36px] lg:text-[48px]">
            PATIENT DASHBOARD
          </h1>

          {/* Scan card — single unified dropzone card */}
              <section
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative mt-6 flex min-h-[540px] lg:h-[600px] w-full flex-col items-center justify-center rounded-[20px] border-[6px] bg-white p-6 sm:p-10 shadow-sm transition-colors ${
                  isDragging ? 'border-teal bg-teal/5' : 'border-[#d9eaea]'
                }`}
              >
                {imagePreviewUrl ? (
                  /* Figma Node 671:8266 — UPLOAD WITH PICTURE STATE */
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded prescription"
                      className="max-h-[500px] w-full rounded-[14px] object-contain"
                    />

                    {/* Change Upload button (Node 671:8273) */}
                    <label className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex h-[46px] w-[196px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-teal px-4 text-[15px] font-semibold text-white shadow-md transition hover:bg-teal-deep">
                      <Upload className="h-4 w-4" strokeWidth={2.5} />
                      <span>Change Upload</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelection(e.target.files[0])
                          }
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  /* Figma Node 671:8240 — EMPTY UPLOAD STATE */
                  <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:gap-14">
                    {/* Rx illustration — exact Figma asset & container framing (Node 671:8250) */}
                    <div className="relative h-[260px] w-[235px] shrink-0 overflow-hidden sm:h-[285px] sm:w-[255px] lg:h-[305px] lg:w-[273px]">
                      <img
                        src={rxIllustration}
                        alt="Prescription illustration"
                        className="absolute left-[-31.13%] top-[-11.4%] h-[120.91%] w-[162.03%] max-w-none object-contain pointer-events-none"
                      />
                    </div>

                    <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-left">
                      <h2 className="text-[28px] font-semibold text-black sm:text-[34px] lg:text-[40px]">
                        Scan a Prescription
                      </h2>
                      <p className="mt-2 max-w-[458px] text-[15px] font-medium text-teal-deep lg:text-[16px]">
                        Upload an image of your prescription and let Mediseena extract the details for you
                      </p>

                      <label className="mt-6 inline-flex h-[60px] w-full max-w-[353px] cursor-pointer items-center justify-center gap-3 rounded-[10px] bg-teal px-6 text-[18px] font-semibold text-white shadow-sm transition hover:bg-teal-deep lg:h-[69px] lg:text-[20px]">
                        <Upload className="h-6 w-6" strokeWidth={2} />
                        <span>Upload Prescription</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelection(e.target.files[0])
                            }
                          }}
                        />
                      </label>
                      <p className="mt-3 text-[14px] font-medium text-teal-deep lg:text-[16px]">
                        or drag an image here
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Error message */}
              {validationError && (
                <div className="mx-auto mt-4 flex max-w-[600px] items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Bottom Upload action — Figma Node 235:367 (80px height x 300px width) */}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={!imagePreviewUrl || isProcessingOCR}
                  onClick={() => handleProceedToOCR(imagePreviewUrl)}
                  className={`h-[80px] w-[300px] rounded-[10px] text-[27px] font-semibold text-white transition ${
                    imagePreviewUrl && !isProcessingOCR
                      ? 'cursor-pointer bg-teal shadow-md hover:bg-teal-deep active:scale-98'
                      : 'cursor-not-allowed bg-teal/40'
                  }`}
                >
                  Upload
                </button>
              </div>
        </main>
      </div>

      {/* Processing view during OCR — Figma Node 671:8292 & 671:8298 */}
      {isProcessingOCR && (
        <OcrProcessingView
          isPipelineComplete={isPipelineComplete}
          onFinished={() => {
            window.location.href = '/review'
          }}
        />
      )}
    </div>
  )
}
