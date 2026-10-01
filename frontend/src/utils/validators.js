// ==============================================================================
// MEDISEENA UTILS: validators.js
// Validation rules for image upload, file types, sizes, and prescription fields
// ==============================================================================

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Validates uploaded file type and size
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePrescriptionFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a prescription image.' }
  }

  // Type check
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name)

  if (!isPdf && !isImage) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload JPG, PNG, or PDF prescription files.'
    }
  }

  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
    }
  }

  return { valid: true }
}

/**
 * Validates mandatory fields before prescription verification
 * @param {Object} prescription
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validatePrescriptionRecord(prescription) {
  const errors = {}

  if (!prescription.patient_name || !prescription.patient_name.trim()) {
    errors.patient_name = 'Patient name is required.'
  }

  if (!prescription.physician_name || !prescription.physician_name.trim()) {
    errors.physician_name = 'Physician name is required.'
  }

  if (!prescription.date_issued) {
    errors.date_issued = 'Date issued is required.'
  }

  if (!prescription.medications || prescription.medications.length === 0) {
    errors.medications = 'At least one medication entry is required.'
  } else {
    prescription.medications.forEach((med, idx) => {
      if (!med.medication_name || !med.medication_name.trim()) {
        errors[`med_${idx}_name`] = `Medication #${idx + 1} name is required.`
      }
      if (!med.dosage || !med.dosage.trim()) {
        errors[`med_${idx}_dosage`] = `Medication #${idx + 1} dosage is required.`
      }
    })
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
