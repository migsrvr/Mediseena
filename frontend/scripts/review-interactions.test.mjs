// Run from frontend: node --test --test-isolation=none scripts/review-interactions.test.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { validatePrescriptionRecord } from '../src/utils/validators.js'

const source = fs.readFileSync(new URL('../src/pages/ReviewExtraction.jsx', import.meta.url), 'utf8')
const start = source.indexOf('const handleConfirmVerification = async')
const handler = source.slice(start, source.indexOf('\n  }\n', start) + 4)
const valid = () => ({ patient_name: 'Test Patient', physician_name: 'Dr. Test', date_issued: '2026-10-17', medications: [{ id: 'm1', medication_name: 'Test Medicine', dosage: '10 mg' }] })

function harness(record, overrides = {}) {
  const calls = { created: 0, verified: 0, cleared: 0, focused: 0, saving: false, success: false }
  const details = { open: false, closest: () => null }
  const element = { closest: () => details, focus() { calls.focused++ }, scrollIntoView() {} }
  const context = vm.createContext({
    record, originalExtraction: structuredClone(record), user: { id: 'test-user' },
    saveLock: { current: false }, redirectTimer: { current: null },
    validatePrescriptionRecord,
    setValidationErrors(value) { calls.errors = value },
    setSaveError(value) { calls.error = value },
    setSaving(value) { calls.saving = value },
    setSaveSuccess(value) { calls.success = value },
    setRecord(update) { context.record = typeof update === 'function' ? update(context.record) : update },
    document: { getElementById(id) { calls.focusId = id; return element } },
    requestAnimationFrame(fn) { fn() },
    prescriptionService: {
      async createPrescription() { calls.created++; return { id: 'rx_test' } },
      async verifyPrescription() { calls.verified++ },
    },
    sessionStorage: { removeItem() { calls.cleared++ } },
    setTimeout(fn) { calls.redirect = fn; return 1 },
    window: { location: { href: '/review' } },
    console: { error() {} },
    ...overrides,
  })
  vm.runInContext(`${handler}; globalThis.confirm = handleConfirmVerification`, context)
  return { context, calls, details }
}

test('missing date opens hidden details and focuses the invalid field without saving', async () => {
  const h = harness({ ...valid(), date_issued: '' })
  await h.context.confirm()
  assert.equal(h.details.open, true)
  assert.equal(h.calls.focusId, 'date_issued')
  assert.equal(h.calls.focused, 1)
  assert.equal(h.calls.errors.date_issued, 'Date issued is required.')
  assert.equal(h.calls.created, 0)
  assert.equal(h.calls.cleared, 0)
})

test('hidden errors are exposed even when the first invalid field is already visible', async () => {
  const hidden = { open: false }
  let focused
  const h = harness({ ...valid(), patient_name: '', date_issued: '' }, { document: {
    getElementById(id) {
      return { closest: () => id === 'date_issued' ? hidden : null, focus() { focused = id }, scrollIntoView() {} }
    },
  } })
  await h.context.confirm()
  assert.equal(hidden.open, true)
  assert.equal(focused, 'patient_name')
  assert.equal(h.calls.created, 0)
})

test('rapid repeated confirmation creates and verifies only once', async () => {
  let release
  const h = harness(valid(), { prescriptionService: {
    async createPrescription() { h.calls.created++; if (h.calls.created === 1) await new Promise(resolve => { release = resolve }); return { id: 'rx_test' } },
    async verifyPrescription() { h.calls.verified++ },
  } })
  const first = h.context.confirm()
  await h.context.confirm()
  assert.equal(h.calls.created, 1)
  assert.equal(h.calls.saving, true)
  release()
  await first
  await h.context.confirm()
  assert.equal(h.calls.verified, 1)
  assert.equal(h.calls.success, true)
  assert.equal(h.calls.cleared, 1)
  h.calls.redirect()
  assert.equal(h.context.window.location.href, '/dashboard')
})

test('verification failure retains edits and draft; retry reuses the created record', async () => {
  const h = harness(valid(), { prescriptionService: {
    async createPrescription() { h.calls.created++; return { id: 'rx_test' } },
    async verifyPrescription() { h.calls.verified++; if (h.calls.verified === 1) throw new Error('Test service unavailable') },
  } })
  await h.context.confirm()
  assert.match(h.calls.error, /Test service unavailable/)
  assert.equal(h.calls.saving, false)
  assert.equal(h.calls.cleared, 0)
  assert.equal(h.context.record.patient_name, 'Test Patient')
  assert.equal(h.context.saveLock.current, false)
  await h.context.confirm()
  assert.equal(h.calls.created, 1)
  assert.equal(h.calls.verified, 2)
  assert.equal(h.calls.success, true)
})
