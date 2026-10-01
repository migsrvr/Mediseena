// ==============================================================================
// MEDISEENA CANVAS PREPROCESSOR COMPONENT
// Section 3.7.1: Interactive Canvas Preprocessing (Noise Reduction, Deskewing,
// Contrast Enhancement, Binarization, Readability Assessment)
// ==============================================================================

import { useState, useEffect, useRef } from 'react'
import { preprocessCanvas, loadImage } from '../../utils/imagePreprocessor.js'
import {
  RotateCcw,
  RotateCw,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  ZoomIn,
  Zap,
  ArrowRight
} from 'lucide-react'

export default function CanvasPreprocessor({
  imageSource,
  onProceedToOCR,
  onCancel,
  fileName = 'prescription.jpg'
}) {
  const [loadedImg, setLoadedImg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processedDataUrl, setProcessedDataUrl] = useState(null)
  const [readabilityInfo, setReadabilityInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('split') // 'split' | 'processed' | 'original'

  // Preprocessing Settings State
  const [contrast, setContrast] = useState(35)
  const [brightness, setBrightness] = useState(10)
  const [rotation, setRotation] = useState(0)
  const [grayscale, setGrayscale] = useState(true)
  const [binarize, setBinarize] = useState(false)
  const [threshold, setThreshold] = useState(135)
  const [sharpen, setSharpen] = useState(true)
  const [noiseReduction, setNoiseReduction] = useState(false)

  // Load the initial image
  useEffect(() => {
    let isMounted = true
    async function init() {
      setLoading(true)
      try {
        const img = await loadImage(imageSource)
        if (isMounted) {
          setLoadedImg(img)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load image:', err)
        if (isMounted) setLoading(false)
      }
    }
    init()
    return () => { isMounted = false }
  }, [imageSource])

  // Run Canvas API operations whenever controls change
  useEffect(() => {
    if (!loadedImg) return

    try {
      const result = preprocessCanvas(loadedImg, {
        contrast,
        brightness,
        rotation,
        grayscale,
        binarize,
        threshold,
        sharpen,
        noiseReduction,
      })

      setProcessedDataUrl(result.dataUrl)
      setReadabilityInfo(result.readability)
    } catch (err) {
      console.error('Canvas processing error:', err)
    }
  }, [loadedImg, contrast, brightness, rotation, grayscale, binarize, threshold, sharpen, noiseReduction])

  // Quick Preset Actions
  const applyPreset = (presetName) => {
    switch (presetName) {
      case 'handwriting':
        setContrast(45)
        setBrightness(12)
        setGrayscale(true)
        setBinarize(false)
        setSharpen(true)
        setNoiseReduction(false)
        break
      case 'printed_binary':
        setContrast(50)
        setBrightness(5)
        setGrayscale(true)
        setBinarize(true)
        setThreshold(140)
        setSharpen(false)
        setNoiseReduction(false)
        break
      case 'despeckle':
        setContrast(30)
        setBrightness(8)
        setGrayscale(true)
        setBinarize(false)
        setSharpen(false)
        setNoiseReduction(true)
        break
      case 'reset':
      default:
        setContrast(35)
        setBrightness(10)
        setRotation(0)
        setGrayscale(true)
        setBinarize(false)
        setThreshold(135)
        setSharpen(true)
        setNoiseReduction(false)
        break
    }
  }

  const handleStartOCR = () => {
    if (!processedDataUrl) return
    onProceedToOCR({
      processedImage: processedDataUrl,
      originalImage: typeof imageSource === 'string' ? imageSource : processedDataUrl,
      settings: { contrast, brightness, rotation, grayscale, binarize, sharpen }
    })
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-teal" />
        <p className="text-sm font-semibold text-slate-600">Loading prescription for preprocessing...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Guidance */}
      <div className="flex flex-col gap-3 rounded-2xl border border-teal-border/40 bg-teal/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-teal-deep">
            <Sparkles className="h-4 w-4 text-teal" />
            <span>Canvas API Preprocessing (Phase 2 & Section 3.7.1)</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Optimize image contrast, deskew angle, and sharpness to maximize OCR field accuracy (Target: ≥ 85%).
          </p>
        </div>

        {/* Readability Status */}
        {readabilityInfo && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${
            readabilityInfo.readable
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}>
            {readabilityInfo.readable ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Readability: Good (Contrast {Math.round(readabilityInfo.contrastScore)})</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Low Contrast Warning</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Controls on Left, Dual Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal" />
              Image Enhancement Controls
            </h3>
            <button
              type="button"
              onClick={() => applyPreset('reset')}
              className="text-xs text-slate-500 hover:text-teal font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Clinical Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('handwriting')}
                className="rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-xs font-semibold text-teal-deep hover:bg-teal/20 text-left transition"
              >
                ✍️ Handwriting Enhance
              </button>
              <button
                type="button"
                onClick={() => applyPreset('printed_binary')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition"
              >
                📄 High-Contrast Scan
              </button>
              <button
                type="button"
                onClick={() => applyPreset('despeckle')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition"
              >
                🧼 Despeckle & Smooth
              </button>
              <button
                type="button"
                onClick={() => applyPreset('reset')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition"
              >
                ↺ Balanced Default
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {/* Contrast Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Contrast Enhancement</span>
                <span className="text-teal font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-teal h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Brightness Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Brightness</span>
                <span className="text-teal font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-teal h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Deskewing & Rotation */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Deskew / Rotation Angle</span>
                <span className="text-teal font-bold">{rotation}°</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
                  title="Rotate Left 90°"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  value={rotation % 90}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-teal h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
                  title="Rotate Right 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Toggles (Grayscale, Sharpen, Binarization, Noise Reduction) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Grayscale (Luminance Filter)</span>
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="h-4 w-4 accent-teal rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Sharpen Convolution (Faint Ink)</span>
                <input
                  type="checkbox"
                  checked={sharpen}
                  onChange={(e) => setSharpen(e.target.checked)}
                  className="h-4 w-4 accent-teal rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Adaptive Binarization (Black & White)</span>
                <input
                  type="checkbox"
                  checked={binarize}
                  onChange={(e) => setBinarize(e.target.checked)}
                  className="h-4 w-4 accent-teal rounded cursor-pointer"
                />
              </label>

              {binarize && (
                <div className="pl-4 pt-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                    <span>Threshold Cutoff</span>
                    <span>{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-teal h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Noise Reduction / Smoothing</span>
                <input
                  type="checkbox"
                  checked={noiseReduction}
                  onChange={(e) => setNoiseReduction(e.target.checked)}
                  className="h-4 w-4 accent-teal rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-col gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={handleStartOCR}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-teal-deep active:scale-[0.99]"
            >
              <span>Proceed to OCR & Field Extraction</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-xl py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
              >
                Upload Different Image
              </button>
            )}
          </div>
        </div>

        {/* Dual Live Preview Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          {/* Preview Viewport Switcher */}
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-bold text-slate-800">Visual Comparison</span>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeTab === 'split' ? 'bg-white text-teal-deep shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Split Comparison
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('processed')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeTab === 'processed' ? 'bg-white text-teal-deep shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Preprocessed (OCR Ready)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('original')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activeTab === 'original' ? 'bg-white text-teal-deep shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Original
              </button>
            </div>
          </div>

          {/* Previews */}
          <div className="flex-1 flex items-center justify-center min-h-[380px] rounded-2xl bg-slate-900/5 p-4 border border-slate-200/60 overflow-hidden">
            {activeTab === 'split' ? (
              <div className="grid grid-cols-2 gap-4 w-full h-full">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Original Upload</span>
                  <div className="relative flex items-center justify-center max-h-[360px] w-full rounded-xl bg-white p-2 border shadow-2xs overflow-hidden">
                    <img
                      src={typeof imageSource === 'string' ? imageSource : processedDataUrl}
                      alt="Original"
                      className="max-h-[340px] w-auto object-contain rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-teal-deep uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-teal" /> Preprocessed (Canvas API)
                  </span>
                  <div className="relative flex items-center justify-center max-h-[360px] w-full rounded-xl bg-white p-2 border-2 border-teal shadow-2xs overflow-hidden">
                    {processedDataUrl && (
                      <img
                        src={processedDataUrl}
                        alt="Preprocessed"
                        className="max-h-[340px] w-auto object-contain rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'processed' ? (
              <div className="relative flex items-center justify-center max-h-[440px] w-full rounded-xl bg-white p-2 border-2 border-teal shadow-2xs">
                {processedDataUrl && (
                  <img
                    src={processedDataUrl}
                    alt="Preprocessed"
                    className="max-h-[420px] w-auto object-contain rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="relative flex items-center justify-center max-h-[440px] w-full rounded-xl bg-white p-2 border shadow-2xs">
                <img
                  src={typeof imageSource === 'string' ? imageSource : processedDataUrl}
                  alt="Original"
                  className="max-h-[420px] w-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>File: {fileName}</span>
            <span>Target OCR Accuracy: ≥ 85%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
