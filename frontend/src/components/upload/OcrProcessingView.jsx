// ==============================================================================
// MEDISEENA OCR PROCESSING VIEW
// Figma Node 671:8292 (OCR PROCESSING) & Node 671:8298 (OCR PROCESSING COMPLETE)
// Dynamic Progress & AI Stage Coordination:
// - Real-time progress driven by Canvas enhancement, Tesseract & Gemini AI stages
// - Dynamic percentage ring with asymptotic pacing during deep inference (no 92% freeze)
// - Live AI activity banner displaying real pipeline status
// - 8-step progressive checklist checking off in sync with extraction milestones
// - "Process Complete" celebration state before proceeding to review
// ==============================================================================

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

// Checkpoint thresholds for the 8 steps
const CHECKLIST_LEFT = [
  { id: 'ocr_engine', label: 'Preparing OCR Engine', threshold: 10 },
  { id: 'enhance_img', label: 'Enhancing Prescription Image', threshold: 20 },
  { id: 'reduce_noise', label: 'Reducing Image Noise', threshold: 30 },
  { id: 'save_record', label: 'Saving Prescription Record', threshold: 95 },
]

const CHECKLIST_RIGHT = [
  { id: 'detect_handwritten', label: 'Detecting Handwritten Text', threshold: 45 },
  { id: 'recognize_meds', label: 'Recognizing Medicine Names', threshold: 60 },
  { id: 'id_dosage', label: 'Identifying Dosage and Frequency', threshold: 75 },
  { id: 'verify_info', label: 'Verifying Medicine Information', threshold: 88 },
]

export default function OcrProcessingView({
  isPipelineComplete = false,
  progress = 0,
  status = '',
  onFinished,
}) {
  const [displayPercent, setDisplayPercent] = useState(8)
  const [showCompleteState, setShowCompleteState] = useState(false)
  const finishedRef = useRef(false)
  const tickRef = useRef(0)

  // Dynamic progress interpolation driven by real AI pipeline stages
  useEffect(() => {
    const rawTarget = isPipelineComplete
      ? 100
      : Math.max(8, Math.min(99, Math.round((progress || 0) * 100)))

    const timer = setInterval(() => {
      tickRef.current++
      setDisplayPercent((prev) => {
        // When pipeline is fully complete, swiftly accelerate to 100%
        if (isPipelineComplete) {
          if (prev < 100) return prev + Math.max(1, Math.ceil((100 - prev) / 3))
          return 100
        }

        // Catch up to current target stage smoothly
        if (prev < rawTarget) {
          const step = Math.max(1, Math.ceil((rawTarget - prev) / 5))
          return Math.min(prev + step, rawTarget)
        }

        // While awaiting remote Gemini AI inference (50% - 88%), gently pulse forward
        // so the user sees continuous, active progress and never a frozen counter
        if (prev < 88 && tickRef.current % 4 === 0) {
          return prev + 1
        }

        return prev
      })
    }, 60)

    return () => clearInterval(timer)
  }, [progress, isPipelineComplete])

  // Transition to "OCR PROCESSING COMPLETE" (Node 671:8298) when reaching 100%
  useEffect(() => {
    if (displayPercent >= 100 && isPipelineComplete && !showCompleteState) {
      const completeTimer = setTimeout(() => {
        setShowCompleteState(true)
      }, 300)
      return () => clearTimeout(completeTimer)
    }
  }, [displayPercent, isPipelineComplete, showCompleteState])

  // After brief celebration of "Process Complete", trigger navigation to review
  useEffect(() => {
    if (showCompleteState && !finishedRef.current) {
      const redirectTimer = setTimeout(() => {
        finishedRef.current = true
        if (onFinished) onFinished()
      }, 1100)
      return () => clearTimeout(redirectTimer)
    }
  }, [showCompleteState, onFinished])

  // Circle progress calculation (r = 56, circumference = 2 * PI * 56 ≈ 351.86)
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (circumference * displayPercent) / 100

  // ----------------------------------------------------------------------------
  // Figma Node 671:8298 — OCR PROCESSING COMPLETE
  // ----------------------------------------------------------------------------
  if (showCompleteState) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f6f8fc] px-4 font-poppins">
        <div className="flex flex-col items-center text-center">
          {/* Figma Node 671:8300 — Vector Complete Checkmark */}
          <div className="flex items-center justify-center">
            <svg
              width="111"
              height="111"
              viewBox="0 0 111 111"
              fill="none"
              className="h-[96px] w-[96px] sm:h-[111px] sm:w-[111px] animate-in fade-in zoom-in-75 duration-300"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M55.5 111C62.7884 111 70.0054 109.564 76.7389 106.775C83.4725 103.986 89.5908 99.8981 94.7444 94.7444C99.8981 89.5908 103.986 83.4725 106.775 76.7389C109.564 70.0054 111 62.7884 111 55.5C111 48.2116 109.564 40.9946 106.775 34.2611C103.986 27.5275 99.8981 21.4092 94.7444 16.2556C89.5908 11.1019 83.4725 7.01382 76.7389 4.22469C70.0054 1.43555 62.7884 -1.08605e-07 55.5 0C40.7805 2.19338e-07 26.6638 5.8473 16.2556 16.2556C5.84731 26.6638 0 40.7805 0 55.5C0 70.2195 5.84731 84.3362 16.2556 94.7444C26.6638 105.153 40.7805 111 55.5 111ZM54.0693 77.9467L84.9027 40.9467L75.4307 33.0533L48.914 64.8672L35.1932 51.1402L26.4735 59.8598L44.9735 78.3598L49.7465 83.1328L54.0693 77.9467Z"
                fill="#60ABA8"
              />
            </svg>
          </div>

          {/* Figma Node 671:8299 — Process Complete title */}
          <h1 className="mt-8 text-[36px] font-bold text-[#064e5c] sm:text-[50px] lg:text-[64px]">
            Process Complete
          </h1>
          <p className="mt-2 text-[16px] font-medium text-teal-deep sm:text-[18px]">
            Redirecting to review...
          </p>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------------------------
  // Figma Node 671:8292 — OCR PROCESSING
  // ----------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#f6f8fc] px-4 py-8 font-poppins">
      <div className="flex w-full max-w-[1000px] flex-col items-center">
        {/* Figma Node 671:8293 — "Processing..." */}
        <h1 className="text-center text-[40px] font-bold text-[#064e5c] sm:text-[52px] lg:text-[64px]">
          Processing...
        </h1>

        {/* Figma Node 671:8294 — "Please wait a while we extract the information" */}
        <p className="mt-2 text-center text-[20px] font-medium text-black sm:text-[28px] lg:text-[36px]">
          Please wait a while we extract the information
        </p>

        {/* Dynamic circular percentage ring */}
        <div className="relative my-6 flex h-[130px] w-[130px] items-center justify-center sm:my-8">
          <svg className="h-[130px] w-[130px] -rotate-90" viewBox="0 0 130 130">
            {/* Background ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#d9eaea"
              strokeWidth="8"
              fill="none"
            />
            {/* Animated progress ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#60aba8"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-100 ease-out"
            />
          </svg>

          {/* Center percent readout */}
          <div className="absolute flex items-baseline justify-center font-['Poppins:Bold'] text-[20px] font-bold text-slate-800 sm:text-[22px]">
            <span>{displayPercent}</span>
            <span className="text-[14px] sm:text-[15px] font-semibold text-teal-deep">%</span>
          </div>
        </div>

        {/* Dynamic AI Status Badge */}
        <div className="mb-8 flex items-center justify-center gap-2.5 rounded-full border border-teal/20 bg-teal/5 px-5 py-2 text-[14px] font-semibold text-teal-deep sm:text-[16px] shadow-2xs">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal"></span>
          </span>
          <span className="truncate max-w-[500px]">{status || 'Analyzing prescription with AI...'}</span>
        </div>

        {/* Two-column Progress Checklists (Figma Node 671:8296 & 671:8297) */}
        <div className="grid w-full max-w-[880px] grid-cols-1 gap-x-10 gap-y-4 px-2 sm:grid-cols-2 lg:gap-x-16">
          {/* Left Column (Node 671:8296) */}
          <div className="flex flex-col gap-3.5">
            {CHECKLIST_LEFT.map((item) => {
              const isChecked = displayPercent >= item.threshold
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-all duration-300 ${
                      isChecked
                        ? 'border-[#60aba8] bg-[#60aba8] text-white shadow-xs scale-100'
                        : 'border-[#60aba8] bg-transparent text-transparent scale-95'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                  </div>
                  <span
                    className={`text-[16px] sm:text-[18px] lg:text-[20px] transition-colors duration-200 ${
                      isChecked ? 'font-medium text-black' : 'font-normal text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Right Column (Node 671:8297) */}
          <div className="flex flex-col gap-3.5">
            {CHECKLIST_RIGHT.map((item) => {
              const isChecked = displayPercent >= item.threshold
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-all duration-300 ${
                      isChecked
                        ? 'border-[#60aba8] bg-[#60aba8] text-white shadow-xs scale-100'
                        : 'border-[#60aba8] bg-transparent text-transparent scale-95'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                  </div>
                  <span
                    className={`text-[16px] sm:text-[18px] lg:text-[20px] transition-colors duration-200 ${
                      isChecked ? 'font-medium text-black' : 'font-normal text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
