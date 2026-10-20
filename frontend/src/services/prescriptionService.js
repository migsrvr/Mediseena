// ==============================================================================
// MEDISEENA PRESCRIPTION SERVICE
// Section 3.7.3 & 3.8: Storage, Verification, Correction Logs & Audit Trail
// ==============================================================================

import { supabase, isLiveSupabaseConfigured } from './api.js'

const LOCAL_PRESCRIPTIONS_KEY = 'mediseena_prescriptions_data'
const LOCAL_CORRECTIONS_KEY = 'mediseena_corrections_log'
const LOCAL_AUDIT_KEY = 'mediseena_audit_trail'

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const isUUID = value => typeof value === 'string' && UUID_PATTERN.test(value)
const newUUID = () => crypto.randomUUID()
const clinicalFields = ['patient_name', 'patient_age', 'patient_gender', 'patient_address',
  'physician_name', 'physician_license', 'clinic_hospital', 'date_issued', 'notes']
const medicationFields = ['medication_name', 'generic_name', 'dosage', 'frequency', 'duration', 'route', 'instructions']

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

function writeStore(key, rows, optional = false) {
  try { localStorage.setItem(key, JSON.stringify(rows)) } catch (error) {
    if (!optional) throw error
    console.warn('The remote change succeeded, but the browser cache could not be updated.')
  }
}

function mergeRecord(record, previous) {
  return { ...record, medications: (record.medications || []).map(med => ({
    ...med,
    // OCR IDs can differ from database UUIDs. Retain their local alias across reads/retries.
    client_id: med.client_id || previous?.medications?.find(old => old.id === med.id)?.client_id || med.id,
  })) }
}

function cacheRecords(records, replace = () => false) {
  const previous = readStore(LOCAL_PRESCRIPTIONS_KEY)
  const merged = records.map(record => mergeRecord(record, previous.find(old => old.id === record.id)))
  const ids = new Set(merged.map(record => record.id))
  writeStore(LOCAL_PRESCRIPTIONS_KEY, [...merged, ...previous.filter(row => !ids.has(row.id) && !replace(row))], true)
  return merged
}

function filterRecords(records, { status = 'all', search = '', role = 'pharmacist', userId = null } = {}) {
  const query = search.trim().toLowerCase()
  const scoped = role === 'patient' || userId !== null
  return records.filter(row => (!scoped || (userId && row.user_id === userId)) &&
    (status === 'all' || row.verification_status === status) &&
    (!query || [row.patient_name, row.physician_name, row.clinic_hospital,
      ...(row.medications || []).map(med => med.medication_name)]
      .some(value => String(value || '').toLowerCase().includes(query))))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

function prescriptionPayload(record) {
  return {
    patient_name: record.patient_name ?? '', patient_age: record.patient_age ?? null,
    patient_gender: record.patient_gender || null, patient_address: record.patient_address ?? '',
    physician_name: record.physician_name ?? '', physician_license: record.physician_license ?? '',
    clinic_hospital: record.clinic_hospital ?? '', date_issued: record.date_issued || null,
    source_image_url: record.source_image_url ?? '', raw_ocr_text: record.raw_ocr_text ?? '',
    ocr_confidence: record.ocr_confidence ?? 0, ai_confidence: record.ai_confidence ?? 0,
    processing_time_ms: record.processing_time_ms ?? 0, notes: record.notes ?? '',
  }
}

function normalizeMedications(medications = [], existing = [], live = false) {
  if (!Array.isArray(medications)) throw new Error('Medications must be an array.')
  const aliases = new Map(existing.flatMap(med => [[med.id, med], [med.client_id || med.id, med]]))
  const ids = new Set()
  return medications.map(med => {
    const previous = aliases.get(med.id)
    const id = previous?.id || (live ? newUUID() : med.id || `med_${newUUID()}`)
    if (ids.has(id)) throw new Error('A medication ID appears more than once.')
    ids.add(id)
    return {
      id, client_id: previous?.client_id || med.id || id,
      medication_name: med.medication_name ?? '', generic_name: med.generic_name ?? '',
      dosage: med.dosage ?? '', frequency: med.frequency ?? '', duration: med.duration ?? '',
      route: med.route ?? '', instructions: med.instructions ?? '',
      confidence_score: med.confidence_score ?? 0, flag_warning: med.flag_warning ?? null,
      is_verified: med.is_verified ?? false,
    }
  })
}

function medicationPayload(medication, prescriptionId) {
  const { id, medication_name, generic_name, dosage, frequency, duration, route,
    instructions, confidence_score, flag_warning, is_verified } = medication
  return { id, prescription_id: prescriptionId, medication_name, generic_name, dosage,
    frequency, duration, route, instructions, confidence_score, flag_warning, is_verified }
}

async function requireResult(query, operation, requireRow = false) {
  const { data, error } = await query
  if (error) throw new Error(`${operation}: ${error.message || String(error)}`)
  if (requireRow && (!data || (Array.isArray(data) && !data.length))) {
    throw new Error(`${operation}: record was not found or access was denied.`)
  }
  return data
}

function detectCorrections(id, current, original, existing, user) {
  const rows = []
  const text = value => String(value ?? '').trim()
  const append = (field, before, after) => rows.push({
    id: newUUID(), prescription_id: id, user_id: user?.id || null,
    field_name: field, original_value: text(before), corrected_value: text(after),
    created_at: new Date().toISOString(),
  })
  clinicalFields.forEach(field => {
    if (text(current[field]) !== text(original[field])) append(field, original[field], current[field])
  })
  const aliases = new Map(existing.flatMap(med => [[med.id, med.id], [med.client_id || med.id, med.id]]))
  const previous = new Map((original.medications || []).map((med, i) => [aliases.get(med.id) || med.id || `index_${i}`, med]))
  current.medications.forEach(med => {
    const old = previous.get(med.id)
    if (!old) append(`medication[${med.id}].added`, '', JSON.stringify(medicationFields.map(field => med[field])))
    else {
      medicationFields.forEach(field => {
        if (text(old[field]) !== text(med[field])) append(`medication[${med.id}].${field}`, old[field], med[field])
      })
      previous.delete(med.id)
    }
  })
  previous.forEach((med, key) => append(`medication[${key}].removed`, JSON.stringify(medicationFields.map(field => med[field] ?? '')), ''))
  return rows
}

export const prescriptionService = {
  _ensureLocalStore() {
    const rows = readStore(LOCAL_PRESCRIPTIONS_KEY)
    // Remove only reserved legacy sample rows; preserve uploaded prescriptions.
    const uploaded = rows.filter(row => !String(row.id || '').startsWith('rx_seed_'))
    if (localStorage.getItem(LOCAL_PRESCRIPTIONS_KEY) === null || uploaded.length !== rows.length) {
      writeStore(LOCAL_PRESCRIPTIONS_KEY, uploaded)
    }
  },

  async getPrescriptions({ status = 'all', search = '', role = 'pharmacist', userId = null } = {}) {
    const filters = { status, search, role, userId }
    const live = isLiveSupabaseConfigured && (!userId || isUUID(userId))
    const scoped = role === 'patient' || userId !== null
    if (scoped && !userId) return []
    if (live) {
      try {
        let query = supabase.from('prescriptions').select('*, medications(*)')
        if (status !== 'all') query = query.eq('verification_status', status)
        if (scoped) query = query.eq('user_id', userId)
        const rows = await requireResult(query.order('created_at', { ascending: false }), 'Fetch prescriptions')
        const matchesScope = row => isUUID(row.id) && (!scoped || row.user_id === userId) &&
          (status === 'all' || row.verification_status === status)
        // Search is applied after the joined read so medication/physician/clinic search agrees offline and online.
        return filterRecords(cacheRecords(rows || [], matchesScope), filters)
      } catch (error) { console.warn('Remote prescription read failed; using cached records.', error) }
    }
    this._ensureLocalStore()
    return filterRecords(readStore(LOCAL_PRESCRIPTIONS_KEY).filter(row => !live || isUUID(row.id)), filters)
  },

  async getPrescriptionById(id) {
    if (isLiveSupabaseConfigured && isUUID(id)) {
      try {
        const { data, error } = await supabase.from('prescriptions').select('*, medications(*)').eq('id', id).maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) { cacheRecords([], row => row.id === id); return null }
        return cacheRecords([data])[0]
      } catch (error) { console.warn('Remote prescription read failed; using cached record.', error) }
    }
    this._ensureLocalStore()
    return readStore(LOCAL_PRESCRIPTIONS_KEY).find(row => row.id === id) || null
  },

  async createPrescription(record, user) {
    if (!user?.id) throw new Error('Sign in before saving a prescription.')
    const live = isLiveSupabaseConfigured && isUUID(user?.id)
    const id = live ? newUUID() : `rx_${newUUID()}`
    const now = new Date().toISOString()
    const medications = normalizeMedications(record.medications, [], live)
    let created = {
      ...prescriptionPayload(record), id,
      user_id: live && isUUID(record.user_id) ? record.user_id : user?.id || 'usr_pat_001',
      verification_status: 'pending', verified_by: null, verified_at: null,
      corrections_count: 0, created_at: now, updated_at: now, medications,
    }
    if (live) {
      const { medications: children, ...parent } = created
      const row = await requireResult(supabase.from('prescriptions').insert([parent]).select('*').single(), 'Create prescription', true)
      try {
        const savedMeds = children.length ? await requireResult(supabase.from('medications')
          .insert(children.map(med => medicationPayload(med, row.id))).select('*'), 'Create medications') : []
        created = mergeRecord({ ...row, medications: savedMeds }, { medications: children })
        await this.logAudit({ action: 'PRESCRIPTION_UPLOAD', resource_type: 'prescriptions', resource_id: row.id,
          details: { patient: created.patient_name, medication_count: savedMeds.length }, user })
      } catch (error) {
        try { await requireResult(supabase.from('prescriptions').delete().eq('id', row.id), 'Rollback prescription') }
        catch { throw new Error(`${error.message} Parent rollback failed; refresh before retrying.`) }
        throw error
      }
      return cacheRecords([created])[0]
    }
    this._ensureLocalStore()
    writeStore(LOCAL_PRESCRIPTIONS_KEY, [created, ...readStore(LOCAL_PRESCRIPTIONS_KEY)])
    await this.logAudit({ action: 'PRESCRIPTION_UPLOAD', resource_type: 'prescriptions', resource_id: id,
      details: { patient: created.patient_name, medication_count: medications.length }, user })
    return created
  },

  async verifyPrescription(id, updatedData, originalExtraction, user) {
    const live = isLiveSupabaseConfigured && isUUID(id)
    if (live && !isUUID(user?.id)) throw new Error('A signed-in user is required to verify a live prescription.')
    let old
    if (live) {
      // Mutations must use authoritative state, never the read fallback after an authorization/network failure.
      old = await requireResult(supabase.from('prescriptions').select('*, medications(*)').eq('id', id).single(), 'Load prescription for verification', true)
      old = mergeRecord(old, readStore(LOCAL_PRESCRIPTIONS_KEY).find(row => row.id === id))
    } else {
      this._ensureLocalStore()
      old = readStore(LOCAL_PRESCRIPTIONS_KEY).find(row => row.id === id)
    }
    if (!old) throw new Error('Prescription record not found.')
    const medications = normalizeMedications(updatedData.medications ?? old.medications, old.medications, live)
      .map(med => ({ ...med, is_verified: true }))
    const current = { ...old, ...prescriptionPayload({ ...old, ...updatedData }), medications }
    const baseline = old.verification_status === 'verified' ? old : originalExtraction || old
    const corrections = detectCorrections(id, current, baseline, old.medications, user)
    // A successful save whose response was lost must not duplicate correction/audit rows on retry.
    if (old.verification_status === 'verified' && !corrections.length) return old
    const now = new Date().toISOString()
    let verified = { ...current, verification_status: 'verified', verified_by: user?.id || null,
      verified_at: now, updated_at: now, corrections_count: Number(old.corrections_count || 0) + corrections.length }
    if (live) {
      const existingIds = new Set(old.medications.map(med => med.id))
      const currentIds = new Set(medications.map(med => med.id))
      let changedChildren = false
      let changedParent = false
      let loggedCorrections = false
      try {
        for (const med of medications) {
          changedChildren = true
          const payload = medicationPayload(med, id)
          if (existingIds.has(med.id)) {
            await requireResult(supabase.from('medications').update(payload).eq('prescription_id', id).eq('id', med.id).select('id'), 'Update medication', true)
          } else await requireResult(supabase.from('medications').insert([payload]), 'Add medication')
        }
        const removed = [...existingIds].filter(medId => !currentIds.has(medId))
        if (removed.length) {
          changedChildren = true
          await requireResult(supabase.from('medications').delete().eq('prescription_id', id).in('id', removed), 'Remove medications')
        }
        if (corrections.length) {
          await requireResult(supabase.from('correction_logs').insert(corrections), 'Log corrections')
          loggedCorrections = true
        }
        const payload = { ...prescriptionPayload(verified), verification_status: 'verified', verified_by: user.id,
          verified_at: now, corrections_count: verified.corrections_count }
        const parent = await requireResult(supabase.from('prescriptions').update(payload).eq('id', id).select('*').single(), 'Verify prescription', true)
        changedParent = true
        verified = { ...parent, medications }
        await this.logAudit({ action: 'PRESCRIPTION_VERIFIED', resource_type: 'prescriptions', resource_id: id,
          details: { verified_by: user.id, corrections_applied: corrections.length }, user })
      } catch (error) {
        // REST requests cannot form a transaction. Restore touched state where possible and surface failures.
        try {
          if (changedParent) await requireResult(supabase.from('prescriptions').update({ ...prescriptionPayload(old),
            verification_status: old.verification_status, verified_by: old.verified_by, verified_at: old.verified_at,
            corrections_count: old.corrections_count || 0 }).eq('id', id), 'Restore prescription')
          if (changedChildren) {
            const addedIds = medications.filter(med => !existingIds.has(med.id)).map(med => med.id)
            if (addedIds.length) await requireResult(supabase.from('medications').delete().eq('prescription_id', id).in('id', addedIds), 'Restore added medications')
            if (old.medications.length) await requireResult(supabase.from('medications')
              .upsert(old.medications.map(med => medicationPayload(med, id))), 'Restore medications')
          }
          if (loggedCorrections) {
            const removed = await requireResult(supabase.from('correction_logs').delete()
              .in('id', corrections.map(row => row.id)).select('id'), 'Restore corrections')
            // Admin-only history mutation can prevent rollback by a patient/pharmacist.
            if (removed?.length !== corrections.length) throw new Error('Correction history requires administrator recovery.')
          }
        } catch { throw new Error(`${error.message} Verification rollback could not complete; refresh before retrying.`) }
        throw error
      }
      cacheRecords([verified])
      if (corrections.length) writeStore(LOCAL_CORRECTIONS_KEY, [...corrections, ...readStore(LOCAL_CORRECTIONS_KEY)], true)
      return verified
    }
    writeStore(LOCAL_PRESCRIPTIONS_KEY, readStore(LOCAL_PRESCRIPTIONS_KEY).map(row => row.id === id ? verified : row))
    if (corrections.length) writeStore(LOCAL_CORRECTIONS_KEY, [...corrections, ...readStore(LOCAL_CORRECTIONS_KEY)])
    await this.logAudit({ action: 'PRESCRIPTION_VERIFIED', resource_type: 'prescriptions', resource_id: id,
      details: { verified_by: verified.verified_by, corrections_applied: corrections.length }, user })
    return verified
  },

  async deletePrescription(id, user) {
    const live = isLiveSupabaseConfigured && isUUID(id)
    if (live && !isUUID(user?.id)) throw new Error('A signed-in user is required to delete a live prescription.')
    if (live) await requireResult(supabase.from('prescriptions').delete().eq('id', id).select('id'), 'Delete prescription', true)
    else this._ensureLocalStore()
    writeStore(LOCAL_PRESCRIPTIONS_KEY, readStore(LOCAL_PRESCRIPTIONS_KEY).filter(row => row.id !== id), live)
    writeStore(LOCAL_CORRECTIONS_KEY, readStore(LOCAL_CORRECTIONS_KEY).filter(row => row.prescription_id !== id), live)
    try {
      await this.logAudit({ action: 'PRESCRIPTION_DELETED', resource_type: 'prescriptions', resource_id: id, user })
    } catch (error) {
      const failure = new Error(`The prescription was deleted, but its audit log failed: ${error.message}`)
      failure.deletionCompleted = true
      throw failure
    }
    return true
  },

  async logAudit({ action, resource_type, resource_id, details = {}, user }) {
    const live = isLiveSupabaseConfigured && isUUID(user?.id)
    const row = { id: newUUID(), action, resource_type, resource_id: isUUID(resource_id) ? resource_id : null,
      details, user_id: live ? user.id : user?.id || null, user_email: user?.email || null,
      user_role: user?.role || (live ? null : 'guest'), created_at: new Date().toISOString(),
      user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent }
    const stored = live ? await requireResult(supabase.from('audit_logs').insert([row]).select('*').single(), 'Write audit log', true)
      : { ...row, resource_id: resource_id || null }
    const item = { ...stored, timestamp: stored.created_at }
    writeStore(LOCAL_AUDIT_KEY, [item, ...readStore(LOCAL_AUDIT_KEY)].slice(0, 1000), live)
    return item
  },

  async getAuditLogs() {
    if (isLiveSupabaseConfigured) {
      try {
        const rows = await requireResult(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }), 'Fetch audit logs')
        const normalized = (rows || []).map(row => ({ ...row, timestamp: row.created_at }))
        writeStore(LOCAL_AUDIT_KEY, normalized, true)
        return normalized
      } catch (error) { console.warn('Remote audit read failed; using cached logs.', error) }
    }
    return readStore(LOCAL_AUDIT_KEY)
  },

  async getCorrectionLogs() {
    if (isLiveSupabaseConfigured) {
      try {
        const rows = await requireResult(supabase.from('correction_logs').select('*').order('created_at', { ascending: false }), 'Fetch correction logs')
        writeStore(LOCAL_CORRECTIONS_KEY, rows || [], true)
        return rows || []
      } catch (error) { console.warn('Remote correction read failed; using cached logs.', error) }
    }
    return readStore(LOCAL_CORRECTIONS_KEY)
  },
}
