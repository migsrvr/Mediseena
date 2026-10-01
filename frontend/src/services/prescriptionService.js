// ==============================================================================
// MEDISEENA PRESCRIPTION SERVICE
// Section 3.7.3 & 3.8: Storage, Verification, Correction Logs & Audit Trail
// ==============================================================================

import { supabase, isLiveSupabaseConfigured } from './api.js'

const LOCAL_PRESCRIPTIONS_KEY = 'mediseena_prescriptions_data'
const LOCAL_CORRECTIONS_KEY = 'mediseena_corrections_log'
const LOCAL_AUDIT_KEY = 'mediseena_audit_trail'

// Sample pre-seeded prescription data for immediate demonstration & evaluation
const SEED_PRESCRIPTIONS = [
  {
    id: 'rx_seed_001',
    user_id: 'usr_pat_001',
    patient_name: 'Juan Dela Cruz',
    patient_age: 42,
    patient_gender: 'Male',
    patient_address: 'Sampaloc, Manila',
    physician_name: 'Dr. Roberto Mendoza, MD',
    physician_license: 'PRC-0098412',
    clinic_hospital: 'Manila Doctors Medical Center',
    date_issued: '2026-09-18',
    source_image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
    raw_ocr_text: 'MANILA DOCTORS MEDICAL CENTER\nDr. Roberto Mendoza, MD\nLic No: PRC-0098412\nPatient: Juan Dela Cruz Age: 42 Sex: M Date: 2026-09-18\nRx\nAmoxicillin 500mg capsules #21\nSig: 1 cap every 8 hours for 7 days after meals\nParacetamol 500mg tablets #10\nSig: 1 tab every 4-6 hours PRN for fever',
    ocr_confidence: 89.4,
    ai_confidence: 93.0,
    processing_time_ms: 3820,
    verification_status: 'verified',
    verified_by: 'Stephane Aira Cayetano, RPh',
    verified_at: '2026-09-18T10:15:00.000Z',
    notes: 'Prescribed for acute pharyngitis. Patient advised to complete 7-day antibiotic course.',
    created_at: '2026-09-18T09:45:00.000Z',
    medications: [
      {
        id: 'med_001_1',
        medication_name: 'Amoxicillin',
        generic_name: 'Amoxicillin Trihydrate',
        dosage: '500 mg',
        frequency: 'Every 8 hours (3x daily)',
        duration: '7 days',
        route: 'Oral',
        instructions: 'Take 1 capsule every 8 hours after meals until finished.',
        confidence_score: 95.0,
        is_verified: true,
      },
      {
        id: 'med_001_2',
        medication_name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        dosage: '500 mg',
        frequency: 'Every 4-6 hours as needed',
        duration: '3-5 days',
        route: 'Oral',
        instructions: 'Take 1 tablet PRN for temperature > 37.8°C or body aches.',
        confidence_score: 91.5,
        is_verified: true,
      }
    ]
  },
  {
    id: 'rx_seed_002',
    user_id: 'usr_pat_001',
    patient_name: 'Maria Clara Santos',
    patient_age: 58,
    patient_gender: 'Female',
    patient_address: 'Quezon City, Metro Manila',
    physician_name: 'Dr. Evelyn Tan, MD, FPCP',
    physician_license: 'PRC-0076543',
    clinic_hospital: 'St. Luke\'s Medical Center',
    date_issued: '2026-09-24',
    source_image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=800',
    raw_ocr_text: 'ST. LUKE\'S MEDICAL CENTER\nDr. Evelyn Tan, MD, FPCP\nPatient: Maria Clara Santos Age: 58 Sex: F Date: 2026-09-24\nRx\nAmlodipine Besylate 10mg tab #30\nSig: 1 tab OD at bedtime\nMetformin HCl 500mg tab #60\nSig: 1 tab BID with meals',
    ocr_confidence: 86.2,
    ai_confidence: 91.0,
    processing_time_ms: 4150,
    verification_status: 'pending',
    verified_by: null,
    verified_at: null,
    notes: 'Hypertension and Type 2 Diabetes maintenance checkup. Recheck BP in 2 weeks.',
    created_at: '2026-09-24T14:20:00.000Z',
    medications: [
      {
        id: 'med_002_1',
        medication_name: 'Amlodipine Besylate',
        generic_name: 'Amlodipine',
        dosage: '10 mg',
        frequency: 'Once daily (OD)',
        duration: '30 days',
        route: 'Oral',
        instructions: 'Take 1 tablet daily at bedtime. Monitor blood pressure.',
        confidence_score: 87.5,
        is_verified: false,
      },
      {
        id: 'med_002_2',
        medication_name: 'Metformin HCl',
        generic_name: 'Metformin Hydrochloride',
        dosage: '500 mg',
        frequency: 'Twice daily (BID)',
        duration: '30 days',
        route: 'Oral',
        instructions: 'Take 1 tablet twice daily with morning and evening meals.',
        confidence_score: 85.0,
        is_verified: false,
      }
    ]
  },
  {
    id: 'rx_seed_003',
    user_id: 'usr_pat_001',
    patient_name: 'Angelo Reyes',
    patient_age: 29,
    patient_gender: 'Male',
    patient_address: 'Mandaluyong City',
    physician_name: 'Dr. Carmelo Diaz, MD',
    physician_license: 'PRC-0112349',
    clinic_hospital: 'JRU Health & Wellness Center',
    date_issued: '2026-09-25',
    source_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    raw_ocr_text: 'JRU HEALTH & WELLNESS CENTER\nDr. Carmelo Diaz, MD\nPatient: Angelo Reyes Age: 29 Date: 2026-09-25\nRx\nCetirizine DiHCl 10mg tab #14\nSig: 1 tab OD at night for allergic rhinitis\nSalbutamol Inhaler 100mcg\nSig: 2 puffs q4-6h PRN for wheezing',
    ocr_confidence: 88.0,
    ai_confidence: 94.2,
    processing_time_ms: 3200,
    verification_status: 'pending',
    verified_by: null,
    verified_at: null,
    notes: 'Seasonal allergic rhinitis with mild bronchial hyperreactivity.',
    created_at: '2026-09-25T11:00:00.000Z',
    medications: [
      {
        id: 'med_003_1',
        medication_name: 'Cetirizine DiHCl',
        generic_name: 'Cetirizine Dihydrochloride',
        dosage: '10 mg',
        frequency: 'Once daily (OD)',
        duration: '14 days',
        route: 'Oral',
        instructions: 'Take 1 tablet at night before sleep. May cause drowsiness.',
        confidence_score: 93.0,
        is_verified: false,
      },
      {
        id: 'med_003_2',
        medication_name: 'Salbutamol Inhaler',
        generic_name: 'Albuterol Sulfate',
        dosage: '100 mcg/actuation',
        frequency: 'Every 4-6 hours as needed',
        duration: '30 days',
        route: 'Inhalation',
        instructions: 'Inhale 2 puffs for sudden shortness of breath or wheezing.',
        confidence_score: 86.0,
        is_verified: false,
      }
    ]
  }
]

export const prescriptionService = {
  /**
   * Initialize local store with seeds if empty
   */
  _ensureLocalStore() {
    const existing = localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY)
    if (!existing) {
      localStorage.setItem(LOCAL_PRESCRIPTIONS_KEY, JSON.stringify(SEED_PRESCRIPTIONS))
    }
  },

  /**
   * Get all prescriptions with optional status filter or search
   */
  async getPrescriptions({ status = 'all', search = '', role = 'pharmacist', userId = null } = {}) {
    if (isLiveSupabaseConfigured) {
      try {
        let query = supabase.from('prescriptions').select('*, medications(*)')
        if (status !== 'all') query = query.eq('verification_status', status)
        if (role === 'patient' && userId) query = query.eq('user_id', userId)
        if (search) query = query.ilike('patient_name', `%${search}%`)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (!error && data) return data
      } catch (e) {
        console.warn('Supabase getPrescriptions error:', e)
      }
    }

    this._ensureLocalStore()
    let list = JSON.parse(localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) || '[]')

    if (role === 'patient' && userId) {
      list = list.filter(p => p.user_id === userId)
    }

    if (status !== 'all') {
      list = list.filter(p => p.verification_status === status)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.patient_name?.toLowerCase().includes(q) ||
        p.physician_name?.toLowerCase().includes(q) ||
        p.clinic_hospital?.toLowerCase().includes(q) ||
        p.medications?.some(m => m.medication_name?.toLowerCase().includes(q))
      )
    }

    return list
  },

  /**
   * Get single prescription by ID
   */
  async getPrescriptionById(id) {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*, medications(*)')
          .eq('id', id)
          .single()
        if (!error && data) return data
      } catch (e) {
        console.warn('Supabase getPrescriptionById error:', e)
      }
    }

    this._ensureLocalStore()
    const list = JSON.parse(localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) || '[]')
    return list.find(p => p.id === id) || null
  },

  /**
   * Save a newly extracted prescription
   */
  async createPrescription(record, user) {
    const newId = `rx_${Date.now()}`
    const prescriptionData = {
      id: newId,
      user_id: user?.id || 'usr_pat_001',
      patient_name: record.patient_name || 'Patient',
      patient_age: record.patient_age || null,
      patient_gender: record.patient_gender || null,
      patient_address: record.patient_address || '',
      physician_name: record.physician_name || 'Dr. Physician',
      physician_license: record.physician_license || '',
      clinic_hospital: record.clinic_hospital || '',
      date_issued: record.date_issued || new Date().toISOString().split('T')[0],
      source_image_url: record.source_image_url || '',
      raw_ocr_text: record.raw_ocr_text || '',
      ocr_confidence: record.ocr_confidence || 88.0,
      ai_confidence: record.ai_confidence || 90.0,
      processing_time_ms: record.processing_time_ms || 3500,
      verification_status: 'pending',
      verified_by: null,
      verified_at: null,
      notes: record.notes || '',
      created_at: new Date().toISOString(),
      medications: record.medications || [],
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .insert([prescriptionData])
          .select()
          .single()
        if (!error && data) return data
      } catch (e) {
        console.warn('Supabase createPrescription error:', e)
      }
    }

    this._ensureLocalStore()
    const list = JSON.parse(localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) || '[]')
    list.unshift(prescriptionData)
    localStorage.setItem(LOCAL_PRESCRIPTIONS_KEY, JSON.stringify(list))

    // Log to audit trail
    this.logAudit({
      action: 'PRESCRIPTION_UPLOAD',
      resource_type: 'prescriptions',
      resource_id: newId,
      details: { patient: prescriptionData.patient_name, time: prescriptionData.created_at },
      user
    })

    return prescriptionData
  },

  /**
   * Verifies & Saves prescription with automatic correction logging
   * Section 3.7.3: Corrections logged for OCR field accuracy & manual correction rate KPIs
   */
  async verifyPrescription(prescriptionId, updatedData, originalExtraction, user) {
    this._ensureLocalStore()
    const list = JSON.parse(localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) || '[]')
    const index = list.findIndex(p => p.id === prescriptionId)

    if (index === -1) throw new Error('Prescription record not found.')

    const old = list[index]
    const corrections = []

    // Detect field changes between original extraction and user-confirmed record
    const baseFields = ['patient_name', 'physician_name', 'date_issued', 'clinic_hospital']
    baseFields.forEach(field => {
      const orig = originalExtraction?.[field] ?? old[field]
      const curr = updatedData[field]
      if (orig && curr && String(orig).trim() !== String(curr).trim()) {
        corrections.push({
          id: `corr_${Date.now()}_${field}`,
          prescription_id: prescriptionId,
          user_id: user?.id || 'usr_anonymous',
          field_name: field,
          original_value: String(orig),
          corrected_value: String(curr),
          created_at: new Date().toISOString()
        })
      }
    })

    // Compare medications
    updatedData.medications?.forEach((med, i) => {
      const origMed = originalExtraction?.medications?.[i]
      if (origMed) {
        if (origMed.medication_name !== med.medication_name) {
          corrections.push({
            id: `corr_${Date.now()}_med_name_${i}`,
            prescription_id: prescriptionId,
            user_id: user?.id,
            field_name: `medication[${i}].name`,
            original_value: origMed.medication_name,
            corrected_value: med.medication_name,
            created_at: new Date().toISOString()
          })
        }
        if (origMed.dosage !== med.dosage) {
          corrections.push({
            id: `corr_${Date.now()}_med_dose_${i}`,
            prescription_id: prescriptionId,
            user_id: user?.id,
            field_name: `medication[${i}].dosage`,
            original_value: origMed.dosage,
            corrected_value: med.dosage,
            created_at: new Date().toISOString()
          })
        }
      }
    })

    // Store corrections
    if (corrections.length > 0) {
      const corrList = JSON.parse(localStorage.getItem(LOCAL_CORRECTIONS_KEY) || '[]')
      localStorage.setItem(LOCAL_CORRECTIONS_KEY, JSON.stringify([...corrections, ...corrList]))
    }

    const verifiedRecord = {
      ...old,
      ...updatedData,
      verification_status: 'verified',
      verified_by: user?.full_name || 'Stephane Aira Cayetano, RPh',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      corrections_count: (old.corrections_count || 0) + corrections.length,
    }

    list[index] = verifiedRecord
    localStorage.setItem(LOCAL_PRESCRIPTIONS_KEY, JSON.stringify(list))

    // Audit log
    this.logAudit({
      action: 'PRESCRIPTION_VERIFIED',
      resource_type: 'prescriptions',
      resource_id: prescriptionId,
      details: {
        verified_by: verifiedRecord.verified_by,
        corrections_applied: corrections.length
      },
      user
    })

    return verifiedRecord
  },

  /**
   * Delete prescription
   */
  async deletePrescription(id, user) {
    this._ensureLocalStore()
    let list = JSON.parse(localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) || '[]')
    list = list.filter(p => p.id !== id)
    localStorage.setItem(LOCAL_PRESCRIPTIONS_KEY, JSON.stringify(list))

    this.logAudit({
      action: 'PRESCRIPTION_DELETED',
      resource_type: 'prescriptions',
      resource_id: id,
      user
    })
    return true
  },

  /**
   * Log an audit event (Section 3.5.1 & 3.8.1)
   */
  logAudit({ action, resource_type, resource_id, details = {}, user }) {
    const logItem = {
      id: `audit_${Date.now()}`,
      action,
      resource_type,
      resource_id,
      details,
      user_id: user?.id || 'usr_anonymous',
      user_email: user?.email || 'system',
      user_role: user?.role || 'guest',
      timestamp: new Date().toISOString(),
    }

    const logs = JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]')
    logs.unshift(logItem)
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs.slice(0, 100)))
  },

  /**
   * Retrieve audit trail
   */
  getAuditLogs() {
    return JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]')
  },

  /**
   * Retrieve correction logs for KPI calculations
   */
  getCorrectionLogs() {
    return JSON.parse(localStorage.getItem(LOCAL_CORRECTIONS_KEY) || '[]')
  }
}
