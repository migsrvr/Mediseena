// ==============================================================================
// MEDISEENA OCR PROCESSING VIEW
// Figma Node 671:8292 (OCR PROCESSING) & Node 671:8298 (OCR PROCESSING COMPLETE)
// Features:
// - 0% to 100% animated circular percentage counter
// - 8-step progressive checklist checking off in sequence
// - "Process Complete" celebration state before proceeding to review
// ==============================================================================

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

// Checkpoint thresholds for the 8 steps
const CHECKLIST_LEFT = [
  { id: 'ocr_engine', label: 'Preparing OCR Engine', threshold: 12 },
  { id: 'enhance_img', label: 'Enhancing Prescription Image', threshold: 25 },
  { id: 'reduce_noise', label: 'Reducing Image Noise', threshold: 38 },
  { id: 'save_record', label: 'Saving Prescription Record', threshold: 100 },
]

const CHECKLIST_RIGHT = [
  { id: 'detect_handwritten', label: 'Detecting Handwritten Text', threshold: 50 },
  { id: 'recognize_meds', label: 'Recognizing Medicine Names', threshold: 63 },
  { id: 'id_dosage', label: 'Identifying Dosage and Frequency', threshold: 75 },
  { id: 'verify_info', label: 'Verifying Medicine Information', threshold: 88 },
]

export default function OcrProcessingView({ isPipelineComplete, onFinished }) {
  const [displayPercent, setDisplayPercent] = useState(0)
  const [showCompleteState, setShowCompleteState] = useState(false)
  const finishedRef = useRef(false)

  // Smooth percentage counter timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayPercent((prev) => {
        // If pipeline is not yet done, crawl up to 92% smoothly
        if (!isPipelineComplete) {
          if (prev < 92) {
            // Gentle natural increment
            const inc = prev < 40 ? 2 : prev < 75 ? 1 : Math.random() > 0.4 ? 1 : 0
            return Math.min(prev + inc, 92)
          }
          return prev
        }

        // Once pipeline is complete, quickly count up to 100%
        if (prev < 100) {
          return prev + 2
        }

        return 100
      })
    }, 70)

    return () => clearInterval(timer)
  }, [isPipelineComplete])

  // Transition to "OCR PROCESSING COMPLETE" (Node 671:8298) when reaching 100%
  useEffect(() => {
    if (displayPercent >= 100 && isPipelineComplete && !showCompleteState) {
      const completeTimer = setTimeout(() => {
        setShowCompleteState(true)
      }, 350)
      return () => clearTimeout(completeTimer)
    }
  }, [displayPercent, isPipelineComplete, showCompleteState])

  // After brief celebration of "Process Complete", trigger navigation to review
  useEffect(() => {
    if (showCompleteState && !finishedRef.current) {
      const redirectTimer = setTimeout(() => {
        finishedRef.current = true
        if (onFinished) onFinished()
      }, 1200)
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

        {/* Figma Node 671:8295 / 244:1431 — Loading Bar with dynamic 0% - 100% */}
        <div className="relative my-8 flex h-[130px] w-[130px] items-center justify-center sm:my-10">
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
              className="transition-all duration-150 ease-out"
            />
          </svg>

          {/* Center percent readout */}
          <div className="absolute flex items-baseline justify-center font-['Poppins:Bold'] text-[18px] font-bold text-[#8f8f8f] sm:text-[20px]">
            <span>{displayPercent}</span>
            <span className="text-[14px] sm:text-[15px]">%</span>
          </div>
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
                        ? 'border-[#60aba8] bg-[#60aba8] text-white shadow-xs'
                        : 'border-[#60aba8] bg-transparent text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                  </div>
                  <span
                    className={`text-[16px] sm:text-[18px] lg:text-[20px] transition-colors duration-200 ${
                      isChecked ? 'font-medium text-black' : 'font-normal text-slate-700'
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
                        ? 'border-[#60aba8] bg-[#60aba8] text-white shadow-xs'
                        : 'border-[#60aba8] bg-transparent text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                  </div>
                  <span
                    className={`text-[16px] sm:text-[18px] lg:text-[20px] transition-colors duration-200 ${
                      isChecked ? 'font-medium text-black' : 'font-normal text-slate-700'
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
