// ==============================================================================
// MEDISEENA IMAGE PREPROCESSOR (Canvas API)
// Implements Section 3.7.1: Image Validation, Noise Reduction, Deskewing,
// Contrast Enhancement, Grayscale & Binarization for Optimal OCR Accuracy
// ==============================================================================

/**
 * Loads an image source into an HTMLImageElement
 * @param {string | File | Blob} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(new Error('Failed to load image for preprocessing.'))

    if (typeof src === 'string') {
      img.src = src
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(src)
    }
  })
}

/**
 * Checks image readability metrics (contrast & variance) to reject unreadable scans
 * @param {ImageData} imageData
 * @returns {{ readable: boolean, contrastScore: number, message?: string }}
 */
export function evaluateReadability(imageData) {
  const data = imageData.data
  const len = data.length
  let totalLuminance = 0
  let minLum = 255
  let maxLum = 0

  const samples = Math.min(len / 4, 10000)
  const step = Math.floor((len / 4) / samples)

  for (let i = 0; i < len; i += step * 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    totalLuminance += lum
    if (lum < minLum) minLum = lum
    if (lum > maxLum) maxLum = lum
  }

  const avgLuminance = totalLuminance / samples
  const contrastRange = maxLum - minLum

  // If contrast range is too low (e.g. totally black or totally white blank image)
  if (contrastRange < 25) {
    return {
      readable: false,
      contrastScore: contrastRange,
      message: 'Image has extremely low contrast or appears blank. Please provide a clearer prescription photo.'
    }
  }

  return {
    readable: true,
    contrastScore: contrastRange,
    avgLuminance
  }
}

/**
 * Processes an image using HTML5 Canvas API
 * @param {HTMLImageElement} img
 * @param {Object} options
 * @param {number} options.rotation - Rotation angle in degrees (-180 to 180)
 * @param {number} options.contrast - Contrast (-100 to 100, default 30)
 * @param {number} options.brightness - Brightness (-100 to 100, default 5)
 * @param {boolean} options.grayscale - Convert to grayscale (default true)
 * @param {boolean} options.binarize - Apply adaptive thresholding/binarization
 * @param {number} options.threshold - Threshold value (0-255, default 128)
 * @param {boolean} options.sharpen - Apply 3x3 unsharp convolution kernel
 * @param {boolean} options.noiseReduction - Apply smoothing filter
 * @returns {{ dataUrl: string, blob: Promise<Blob>, readability: Object }}
 */
export function preprocessCanvas(img, options = {}) {
  const {
    rotation = 0,
    contrast = 35,
    brightness = 10,
    grayscale = true,
    binarize = false,
    threshold = 135,
    sharpen = true,
    noiseReduction = false,
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  // Calculate rotated canvas dimensions
  const rad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const width = Math.floor(img.naturalWidth * cos + img.naturalHeight * sin)
  const height = Math.floor(img.naturalWidth * sin + img.naturalHeight * cos)

  canvas.width = width
  canvas.height = height

  // Background white fill
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Rotate & draw image
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  ctx.restore()

  // Get raw pixel data
  let imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const len = data.length

  // Check readability before severe mutations
  const readability = evaluateReadability(imageData)

  // Contrast factor formula
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  // 1. Grayscale, Brightness & Contrast adjustment
  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    if (grayscale) {
      // Perceptual luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray
      g = gray
      b = gray
    }

    // Apply brightness
    if (brightness !== 0) {
      r += brightness
      g += brightness
      b += brightness
    }

    // Apply contrast
    if (contrast !== 0) {
      r = factor * (r - 128) + 128
      g = factor * (g - 128) + 128
      b = factor * (b - 128) + 128
    }

    // Optional Binarization (Otsu / Thresholding for maximum OCR text separation)
    if (binarize) {
      const val = (r + g + b) / 3 >= threshold ? 255 : 0
      r = val
      g = val
      b = val
    }

    data[i] = Math.min(255, Math.max(0, r))
    data[i + 1] = Math.min(255, Math.max(0, g))
    data[i + 2] = Math.min(255, Math.max(0, b))
  }

  ctx.putImageData(imageData, 0, 0)

  // 2. Convolution Kernels (Sharpen or Noise Reduction)
  if (sharpen && !binarize) {
    imageData = applyKernel(ctx, width, height, [
      0, -0.6, 0,
      -0.6, 3.4, -0.6,
      0, -0.6, 0
    ])
    ctx.putImageData(imageData, 0, 0)
  } else if (noiseReduction) {
    // 3x3 Gaussian smoothing
    imageData = applyKernel(ctx, width, height, [
      1 / 16, 2 / 16, 1 / 16,
      2 / 16, 4 / 16, 2 / 16,
      1 / 16, 2 / 16, 1 / 16
    ])
    ctx.putImageData(imageData, 0, 0)
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

  const toBlob = () =>
    new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    })

  return {
    dataUrl,
    blob: toBlob(),
    width,
    height,
    readability,
  }
}

/**
 * Applies a 3x3 convolution matrix to canvas pixel data
 */
function applyKernel(ctx, w, h, weights) {
  const src = ctx.getImageData(0, 0, w, h)
  const srcData = src.data
  const output = ctx.createImageData(w, h)
  const dstData = output.data

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let r = 0, g = 0, b = 0
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const scx = x + cx - 1
          const scy = y + cy - 1
          const srcOffset = (scy * w + scx) * 4
          const wt = weights[cy * 3 + cx]
          r += srcData[srcOffset] * wt
          g += srcData[srcOffset + 1] * wt
          b += srcData[srcOffset + 2] * wt
        }
      }
      const dstOffset = (y * w + x) * 4
      dstData[dstOffset] = Math.min(255, Math.max(0, r))
      dstData[dstOffset + 1] = Math.min(255, Math.max(0, g))
      dstData[dstOffset + 2] = Math.min(255, Math.max(0, b))
      dstData[dstOffset + 3] = srcData[dstOffset + 3] // Alpha
    }
  }

  return output
}
