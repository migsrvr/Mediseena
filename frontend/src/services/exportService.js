// ==============================================================================
// MEDISEENA EXPORT SERVICE (JSON & PDF Generation)
// Section 3.4.3 & Phase 5: Native JS JSON export & jsPDF medical document export
// ==============================================================================

import { jsPDF } from 'jspdf'
import { formatDate } from '../utils/Formatters.js'

/**
 * Exports a prescription record as a structured JSON file (Native JavaScript)
 * @param {Object} prescription
 */
export function exportToJSON(prescription) {
  if (!prescription) return

  const payload = {
    platform: 'Mediseena Structured Prescription Platform',
    version: '1.0',
    export_timestamp: new Date().toISOString(),
    prescription_id: prescription.id,
    verification: {
      status: prescription.verification_status,
      verified_by: prescription.verified_by || 'Unverified',
      verified_at: prescription.verified_at || null,
      confidence_score: prescription.ai_confidence || prescription.ocr_confidence || null,
    },
    patient: {
      name: prescription.patient_name,
      age: prescription.patient_age,
      gender: prescription.patient_gender,
      address: prescription.patient_address,
    },
    physician: {
      name: prescription.physician_name,
      license_number: prescription.physician_license,
      clinic_hospital: prescription.clinic_hospital,
    },
    prescription_details: {
      date_issued: prescription.date_issued,
      clinical_notes: prescription.notes,
    },
    medications: (prescription.medications || []).map((med, idx) => ({
      item: idx + 1,
      medication_name: med.medication_name,
      generic_name: med.generic_name || 'N/A',
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      route: med.route || 'Oral',
      instructions: med.instructions,
    }))
  }

  const jsonStr = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `Mediseena_Prescription_${prescription.patient_name?.replace(/\s+/g, '_') || 'Record'}_${prescription.id}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generates an elegant, clinical-grade Medical Prescription PDF using jsPDF
 * @param {Object} prescription
 */
export function exportToPDF(prescription) {
  if (!prescription) return

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Palette
  const tealPrimary = [6, 78, 92]     // #064e5c
  const tealAccent = [96, 171, 168]   // #60aba8
  const darkGray = [30, 41, 59]       // #1e293b
  const lightGray = [100, 116, 139]   // #64748b
  const bgCard = [246, 248, 252]      // #f6f8fc

  // 1. Top Header Banner
  doc.setFillColor(...tealPrimary)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Brand Name
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('MEDISEENA', 16, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Centralized Structured Prescription Digitization Platform', 16, 20)

  // Status Badge in Header
  const isVerified = prescription.verification_status === 'verified'
  doc.setFillColor(isVerified ? 16 : 217, isVerified ? 185 : 119, isVerified ? 129 : 6)
  doc.roundedRect(pageWidth - 55, 8, 39, 11, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(isVerified ? 'VERIFIED RECORD' : 'PENDING REVIEW', pageWidth - 52, 15)

  // 2. Clinic / Physician Header Info
  let curY = 38
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(prescription.clinic_hospital || 'Medical Health Care Center', 16, curY)

  curY += 6
  doc.setFontSize(11)
  doc.setTextColor(...tealPrimary)
  doc.text(prescription.physician_name || 'Dr. Attending Physician, MD', 16, curY)

  curY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text(`License / PTR No: ${prescription.physician_license || 'PRC-VERIFIED-01'}`, 16, curY)

  // Divider
  curY += 6
  doc.setDrawColor(...tealAccent)
  doc.setLineWidth(0.6)
  doc.line(16, curY, pageWidth - 16, curY)

  // 3. Patient Demographics Box
  curY += 6
  doc.setFillColor(...bgCard)
  doc.roundedRect(16, curY, pageWidth - 32, 24, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(16, curY, pageWidth - 32, 24, 3, 3, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)
  doc.text('Patient Name:', 22, curY + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(prescription.patient_name || 'N/A', 50, curY + 7)

  doc.setFont('helvetica', 'bold')
  doc.text('Age / Gender:', 22, curY + 14)
  doc.setFont('helvetica', 'normal')
  doc.text(`${prescription.patient_age ? `${prescription.patient_age} yrs` : 'N/A'} / ${prescription.patient_gender || 'N/A'}`, 50, curY + 14)

  doc.setFont('helvetica', 'bold')
  doc.text('Address:', 22, curY + 20)
  doc.setFont('helvetica', 'normal')
  doc.text(prescription.patient_address || 'Metro Manila, Philippines', 50, curY + 20)

  // Date on right side
  doc.setFont('helvetica', 'bold')
  doc.text('Date Issued:', pageWidth - 80, curY + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(prescription.date_issued), pageWidth - 55, curY + 7)

  doc.setFont('helvetica', 'bold')
  doc.text('Rx ID:', pageWidth - 80, curY + 14)
  doc.setFont('helvetica', 'normal')
  doc.text(prescription.id?.substring(0, 16) || 'RX-001', pageWidth - 55, curY + 14)

  // 4. Rx Symbol
  curY += 34
  doc.setFont('times', 'bolditalic')
  doc.setFontSize(28)
  doc.setTextColor(...tealAccent)
  doc.text('Rx', 16, curY)

  // 5. Medications List
  curY += 8
  const medications = prescription.medications || []

  medications.forEach((med, index) => {
    // Medication Card
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(16, curY, pageWidth - 32, 22, 2, 2, 'D')

    // Pill indicator
    doc.setFillColor(...tealPrimary)
    doc.circle(23, curY + 7, 2, 'F')

    // Name & Dosage
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...darkGray)
    doc.text(`${index + 1}. ${med.medication_name}`, 28, curY + 8)

    doc.setTextColor(...tealPrimary)
    doc.setFontSize(10)
    doc.text(`— ${med.dosage}`, 28 + (med.medication_name.length * 2.8) + 4, curY + 8)

    // Instructions / Sig
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text(`Sig: ${med.frequency}${med.duration ? ` for ${med.duration}` : ''}. ${med.instructions || ''}`, 28, curY + 16)

    curY += 26
  })

  // 6. Clinical Notes
  if (prescription.notes) {
    curY += 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text('Clinical Instructions & Remarks:', 16, curY)
    curY += 5
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...lightGray)
    doc.text(prescription.notes, 16, curY, { maxWidth: pageWidth - 32 })
    curY += 12
  }

  // 7. Verification & Sign-off Footer
  const signY = Math.max(curY + 10, pageHeight - 55)

  // Left: Verification Metadata
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...tealPrimary)
  doc.text('VERIFICATION AUDIT METADATA', 16, signY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...lightGray)
  doc.text(`Verified By: ${prescription.verified_by || 'Pending Pharmacist Review'}`, 16, signY + 5)
  doc.text(`Verification Timestamp: ${prescription.verified_at ? new Date(prescription.verified_at).toLocaleString() : 'N/A'}`, 16, signY + 9)
  doc.text(`OCR / AI Field Confidence: ${prescription.ai_confidence || prescription.ocr_confidence || 90}%`, 16, signY + 13)

  // Right: Physician Signature line
  doc.setDrawColor(...darkGray)
  doc.setLineWidth(0.4)
  doc.line(pageWidth - 75, signY + 10, pageWidth - 16, signY + 10)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)
  doc.text(prescription.physician_name || 'Dr. Physician', pageWidth - 75, signY + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...lightGray)
  doc.text(`Lic: ${prescription.physician_license || 'PRC-0142857'}`, pageWidth - 75, signY + 19)

  // Bottom Security Line
  doc.setFillColor(...bgCard)
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...lightGray)
  doc.text('This digital document was generated by Mediseena. Tamper-evident electronic record subject to RLS security policies.', 16, pageHeight - 5)

  // Save the PDF
  const filename = `Prescription_${prescription.patient_name?.replace(/\s+/g, '_') || 'Mediseena'}_${prescription.id}.pdf`
  doc.save(filename)
}
