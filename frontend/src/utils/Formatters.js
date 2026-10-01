// ==============================================================================
// MEDISEENA UTILS: Formatters.js
// ==============================================================================

/**
 * Format a date string or timestamp into a readable format (e.g. Oct 24, 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Format a timestamp into date + time (e.g. Oct 24, 2026, 2:45 PM)
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateString
  }
}

/**
 * Format confidence percentage (e.g. 92.4%)
 */
export function formatConfidence(score) {
  if (score === null || score === undefined) return 'N/A'
  const val = Number(score)
  if (isNaN(val)) return 'N/A'
  return `${val.toFixed(1)}%`
}

/**
 * Determine badge color classes for confidence levels
 */
export function getConfidenceBadgeClass(score) {
  const val = Number(score)
  if (isNaN(val) || val >= 85) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (val >= 70) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

/**
 * Status color classes for prescription status
 */
export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'verified':
      return 'bg-teal-50 text-teal-deep border-teal/40 font-semibold'
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'pending':
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200'
  }
}

/**
 * Format milliseconds into seconds string (e.g. 3.42s)
 */
export function formatSeconds(ms) {
  if (!ms) return '0.0s'
  return `${(ms / 1000).toFixed(1)}s`
}
