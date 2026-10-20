// Run with Node 24+: node --experimental-vm-modules scripts/ocr-integration.test.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '')
const fixture = { patient: { name: 'Synthetic Patient', age: 0, gender: null, address: '', confidence: 0 }, physician: { name: 'Dr. Synthetic', license: '', clinic: '', confidence: 0 }, prescription: { date_issued: '', notes: '', confidence: 0 }, medications: [{ id: 'm1', medication_name: 'Synthetic Medicine', generic_name: '', dosage: '', frequency: '', duration: '', route: '', instructions: '', confidence_score: 0, flag_warning: 'Unclear' }], overall_confidence: 0 }
const success = (data = fixture) => new Response(JSON.stringify({ modelVersion: 'gemini-3.8-flash', candidates: [{ content: { parts: [{ thought: true, text: 'ignore this thought' }, { text: JSON.stringify(data) }] }, finishReason: 'STOP' }] }), { status: 200 })
async function loadService({ fetch = async () => success(), createWorker = async () => { throw new Error('Worker network unavailable') }, supabase = null, env = { VITE_GEMINI_API_KEY: 'test-key' }, timers = {} } = {}) {
  const context = vm.createContext({ fetch, console: { warn() {}, error() {} }, performance, setTimeout, clearTimeout, AbortController, AbortSignal, Blob, FileReader: class {}, localStorage: { getItem: () => null }, Response, ...timers })
  const mod = new vm.SourceTextModule(fs.readFileSync(`${root}/frontend/src/services/ocrService.js`, 'utf8'), { context, initializeImportMeta(meta) { meta.env = env } })
  await mod.link(async specifier => {
    if (specifier === './clinicalFormulary.js') return new vm.SourceTextModule(fs.readFileSync(`${root}/frontend/src/services/clinicalFormulary.js`, 'utf8'), { context })
    const exports = specifier === 'tesseract.js' ? { createWorker } : { supabase }
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [k, v] of Object.entries(exports)) this.setExport(k, v) }, { context })
  })
  await mod.evaluate()
  return mod.namespace
}
const checks = []
function test(name, run) { checks.push({ name, run }) }
test('formulary resolves generic names, all required brand aliases, and unknowns', async () => {
  const { COMMON_FORMULARY, lookupFormulary } = await import('../src/services/clinicalFormulary.js')
  assert.ok(Object.keys(COMMON_FORMULARY).length >= 20)
  assert.deepEqual(lookupFormulary(' Amoxicillin '), { found: true, strengths: ['250mg', '500mg', '125mg/5mL', '250mg/5mL'], defaultRoute: 'Oral', genericName: 'amoxicillin' })
  for (const [brand, generic] of Object.entries({ biogesic: 'paracetamol', amoxil: 'amoxicillin', augmentin: 'coamoxiclav', ponstan: 'mefenamic', keflex: 'cefalexin', ventolin: 'salbutamol', zithromax: 'azithromycin', lipitor: 'atorvastatin', plavix: 'clopidogrel' })) {
    assert.equal(lookupFormulary(brand.toUpperCase()).genericName, generic)
  }
  assert.equal(lookupFormulary('Co-Amoxiclav').genericName, 'coamoxiclav')
  assert.equal(lookupFormulary('Biogesic (Paracetamol)').genericName, 'paracetamol')
  for (const value of ['Unlisted Medicine', '', null, undefined, 'notamoxicillin']) {
    assert.deepEqual(lookupFormulary(value), { found: false, strengths: [], defaultRoute: '', genericName: '' })
  }
  const first = lookupFormulary('amoxicillin')
  first.strengths.push('changed')
  assert.ok(!lookupFormulary('amoxicillin').strengths.includes('changed'))
})
test('multi-line and nearby Sig strengths remain attached to their medication', async () => {
  const s = await loadService()
  const result = s.parseClinicalNER('Amoxicillin\n500mg\nSig: Take 1 capsule twice daily for 7 days\nParacetamol\nSig: 500mg orally as needed', 85)
  assert.equal(result.medications.length, 2)
  assert.equal(result.medications[0].dosage, '500mg')
  assert.equal(result.medications[0].duration, '7 days')
  assert.equal(result.medications[1].dosage, '500mg')
  assert.equal(result.medications[1].duration, '')
})
test('plain integer strengths infer mg only with suitable oral formulary evidence', async () => {
  const s = await loadService()
  for (const text of ['Paracetamol 500', 'Amoxicillin 500', 'Amoxicillin\n500']) {
    const med = s.parseClinicalNER(text, 95).medications[0]
    assert.equal(med.dosage, '500mg')
    assert.equal(med.route, 'Oral')
    assert.match(med.flag_warning, /infer/i)
    assert.equal(med.is_flagged, true)
  }
})
test('liquid, compound, microgram, IU and percentage strengths preserve full notation', async () => {
  const s = await loadService()
  for (const [text, expected] of [
    ['Amoxicillin 250mg/5mL', '250mg/5mL'], ['Amoxicillin\n125 mg / 5 ml', '125mg/5mL'],
    ['Co-Amoxiclav 625mg', '625mg'], ['Co-Amoxiclav 500mg/125mg', '500mg/125mg'],
    ['Ventolin 100mcg/puff', '100mcg/puff'], ['Hydrocortisone 0.5%', '0.5%'],
    ['Insulin 100 IU/mL', '100IU/mL'], ['Levothyroxine 50mcg', '50mcg'],
  ]) assert.equal(s.parseClinicalNER(text, 85).medications[0]?.dosage, expected, text)
})
test('hyphenated and parenthetical brand names are preserved', async () => {
  const s = await loadService()
  const result = s.parseClinicalNER('1. Co-Amoxiclav 625mg #14\n2. Biogesic (Paracetamol) 500mg #10', 85)
  assert.equal(result.medications.length, 2)
  assert.equal(result.medications[0].medication_name, 'Co-Amoxiclav')
  assert.equal(result.medications[1].medication_name, 'Biogesic (Paracetamol)')
})
test('quantities and administration counts do not become strengths or invented regimens', async () => {
  const s = await loadService()
  for (const text of ['Amoxicillin #21', 'Amoxicillin Disp: 21', 'Amoxicillin\nSig: Take 1 capsule after food', 'Amoxicillin suspension 500', 'Amoxicillin 500\nSig: Take 5mL orally']) {
    const med = s.parseClinicalNER(text, 85).medications[0]
    assert.equal(med?.dosage, '', text)
    assert.equal(med?.frequency, '', text)
    assert.equal(med?.duration, '', text)
    assert.match(med?.flag_warning, /strength|dosage/i)
  }
  const meds = s.parseClinicalNER('Amoxicillin\nParacetamol 500mg', 85).medications
  assert.equal(meds[0].dosage, '')
  assert.equal(meds[1].dosage, '500mg')
})
test('missing strengths remain review candidates even when the formulary has only one option', async () => {
  const s = await loadService()
  for (const drug of ['Amoxicillin', 'Clopidogrel', 'Doxycycline']) {
    const med = s.parseClinicalNER(drug, 90).medications[0]
    assert.equal(med.dosage, '')
    assert.match(med.flag_warning, /Reference strengths \(not extracted\)/)
    assert.equal(med.is_flagged, true)
  }
})
test('isolated strengths above medicine names are consumed exactly once', async () => {
  const s = await loadService()
  const meds = s.parseClinicalNER('500mg\nAmoxicillin\n250mg\nParacetamol', 85).medications
  assert.equal(meds.length, 2)
  assert.equal(meds[0].dosage, '500mg')
  assert.equal(meds[1].dosage, '250mg')
  const missing = s.parseClinicalNER('Amoxicillin\n500mg\nParacetamol', 85).medications
  assert.equal(missing[1].dosage, '')
})
test('ambiguous multi-route drugs resolve only with form or route evidence', async () => {
  const s = await loadService()
  assert.equal(s.parseClinicalNER('Ventolin 100mcg/puff', 85).medications[0].route, 'Inhalation')
  assert.equal(s.parseClinicalNER('Salbutamol 2mg/5mL syrup', 85).medications[0].route, 'Oral')
  assert.equal(s.parseClinicalNER('Salbutamol', 85).medications[0].route, '')
})
test('direct Gemini and Edge prompts have identical spatial dosage and quantity rules', async () => {
  let clientPrompt, edgePrompt
  const s = await loadService({ fetch: async (_url, options) => { clientPrompt = JSON.parse(options.body).systemInstruction.parts[0].text; return success() } })
  await s.callDirectGeminiVision('data:image/png;base64,aW1hZ2U=')
  const edge = await loadEdge(async (_url, options) => { edgePrompt = JSON.parse(options.body).systemInstruction.parts[0].text; return success() })
  await edge(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ocrText: 'Hint' }) }))
  const rules = text => text.match(/Dosage extraction rules:[\s\S]*?End dosage extraction rules\./)?.[0]
  assert.ok(rules(clientPrompt))
  assert.equal(rules(clientPrompt), rules(edgePrompt))
  for (const fragment of ['line above', 'line below', 'Sig', '500mg', '250mg/5mL', '0.5%', '100mcg/puff', '#21', 'Disp: 21']) assert.ok(rules(clientPrompt).includes(fragment), fragment)
})
test('local NER never fabricates clinical fields or a medication', async () => {
  const s = await loadService()
  const result = s.parseClinicalNER('', 0)
  assert.equal(result.patient.name, '')
  assert.equal(result.patient.age, null)
  assert.equal(result.physician.name, '')
  assert.equal(result.prescription.date_issued, '')
  assert.equal(result.medications.length, 0)
  assert.equal(result.overall_confidence, 0)
  const med = s.parseClinicalNER('Patient: Synthetic Patient\nDr.: Synthetic Doctor\nAmoxicillin 500 mg', 60).medications[0]
  assert.equal(med.frequency, '')
  assert.equal(med.duration, '')
  assert.equal(med.route, 'Oral')
  assert.match(med.flag_warning, /Route inferred/)
  assert.equal(med.confidence_score, 60)
  assert.ok(med.flag_warning)
})
test('local NER recognizes standalone names and keeps directions with their medication', async () => {
  const s = await loadService()
  const result = s.parseClinicalNER('Patient: Test Patient\nDr. Test Physician\nAmoxicillin 500 mg\nTake 1 tablet orally once daily for 3 days.\nParacetamol 250 mg\nTake 1 tablet as needed.', 70)
  assert.equal(result.patient.name, 'Test Patient')
  assert.equal(result.physician.name, 'Dr. Test Physician')
  assert.equal(result.medications.length, 2)
  assert.equal(result.medications[0].duration, '3 days')
  assert.equal(result.medications[0].route, 'Oral')
  assert.equal(result.medications[1].duration, '')
})
test('multimodal extraction enforces schema, reads answer parts, preserves zero and unknowns', async () => {
  let request
  const s = await loadService({ fetch: async (url, options) => { request = { url, ...options, body: JSON.parse(options.body) }; return success() } })
  const result = await s.callDirectGeminiVision('data:image/png;base64,aW1hZ2U=', 'OCR hint', ' key\n')
  assert.equal(result?.patient.name, fixture.patient.name)
  assert.equal(result.patient.age, 0)
  assert.equal(result.overall_confidence, 0)
  assert.equal(result.prescription.date_issued, '')
  assert.equal(result.medications[0].frequency, '')
  assert.equal(result.medications[0].confidence_score, 0)
  assert.match(request.url, /gemini-flash-latest:generateContent$/)
  assert.equal(request.headers['x-goog-api-key'], 'key')
  assert.deepEqual(request.body.generationConfig.thinkingConfig, { thinkingBudget: 0 })
  assert.ok(request.body.generationConfig.responseJsonSchema.required.includes('prescription'))
  assert.ok(request.body.generationConfig.responseJsonSchema.properties.medications.items.required.includes('id'))
  assert.equal(request.body.contents[0].parts[1].inline_data.mime_type, 'image/png')
  assert.match(request.body.contents[0].parts[0].text, /OCR hint/)
})
test('Tesseract failure plus throwing Edge invoke still reaches direct vision', async () => {
  let calls = 0
  const s = await loadService({ supabase: { functions: { invoke: async () => { throw new Error('Edge unavailable') } } }, fetch: async () => { calls++; return success() } })
  const result = await s.processPrescriptionPipeline('data:image/png;base64,aW1hZ2U=')
  assert.equal(calls, 1)
  assert.equal(result.structured.patient.name, fixture.patient.name)
  assert.equal(result.ocrConfidence, 0)
  assert.equal(result.edgeFunctionUsed, false)
})
test('failed alias and malformed payloads use pinned fallback, never accept empty objects', async () => {
  const urls = []
  const s = await loadService({ fetch: async url => { urls.push(url); return urls.length === 1 ? success({}) : success() } })
  assert.equal((await s.callDirectGeminiVision('data:image/png;base64,aW1hZ2U='))?.patient.name, fixture.patient.name)
  assert.equal(urls.length, 2)
  assert.match(urls[1], /gemini-3.8-flash:generateContent/)
})
test('connection test validates content and reports actual returned model', async () => {
  const good = await loadService({ fetch: async () => success({ status: 'ok' }) })
  const result = await good.testGeminiConnection('test-key')
  assert.equal(result.success, true)
  assert.equal(result.model, 'gemini-3.8-flash')
  const bad = await loadService({ fetch: async () => new Response('{}', { status: 200 }) })
  assert.equal((await bad.testGeminiConnection('test-key')).success, false)
  assert.equal((await good.testGeminiConnection('your-gemini-api-key')).success, false)
})
test('OCR cleanup failure keeps recognized text; worker timeout terminates late workers', async () => {
  let terminated = 0
  const cleanupFailure = await loadService({ createWorker: async (_lang, _mode, options) => {
    assert.equal(typeof options.errorHandler, 'function')
    return { recognize: async () => ({ data: { text: 'Recognized', confidence: 83, words: [] } }), terminate: async () => { terminated++; throw new Error('cleanup failed') } }
  } })
  assert.equal((await cleanupFailure.runTesseractOCR('image')).text, 'Recognized')
  assert.equal(terminated, 1)
  let releaseWorker
  let fireTimeout
  const timedOut = await loadService({ createWorker: () => new Promise(resolve => { releaseWorker = resolve }), timers: { setTimeout(fn) { fireTimeout = fn; return 1 }, clearTimeout() {} } })
  const job = timedOut.runTesseractOCR('image')
  fireTimeout()
  await assert.rejects(job, /timed out/)
  releaseWorker({ terminate: async () => { terminated++ } })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(terminated, 2)
})
test('Edge success avoids direct calls; empty Edge response falls through', async () => {
  let calls = 0
  let edgeBody
  const s = await loadService({ supabase: { functions: { invoke: async (_name, options) => { edgeBody = options.body; return { data: { success: true, data: fixture } } } } }, fetch: async () => { calls++; return success() } })
  const result = await s.processPrescriptionPipeline('data:image/webp;base64,aW1hZ2U=')
  assert.equal(calls, 0)
  assert.equal(edgeBody.mimeType, 'image/webp')
  assert.equal(result.edgeFunctionUsed, true)
  const empty = await loadService({ supabase: { functions: { invoke: async () => ({ data: { success: true, data: {} } }) } }, fetch: async () => { calls++; return success() } })
  assert.equal((await empty.processPrescriptionPipeline('data:image/png;base64,aW1hZ2U=')).edgeFunctionUsed, false)
  assert.equal(calls, 1)
})
test('missing remote key plus worker failure yields empty manual-review draft', async () => {
  const s = await loadService({ env: {} })
  const result = await s.processPrescriptionPipeline('data:image/png;base64,aW1hZ2U=')
  assert.equal(result.structured.patient.name, '')
  assert.equal(result.structured.medications.length, 0)
  assert.equal(result.structured.overall_confidence, 0)
})
test('PDF bypasses unsupported Tesseract raster recognition', async () => {
  let ocrCalls = 0
  const s = await loadService({ createWorker: async () => { ocrCalls++; throw new Error('should not run') } })
  assert.equal((await s.processPrescriptionPipeline('data:application/pdf;base64,cGRm')).structured.patient.name, fixture.patient.name)
  assert.equal(ocrCalls, 0)
})
test('alias 404 falls back; authentication/quota errors stop duplicate requests', async () => {
  let calls = 0
  const s = await loadService({ fetch: async () => ++calls === 1 ? new Response('{"error":{"message":"not found"}}', { status: 404 }) : success() })
  assert.ok(await s.callDirectGeminiVision('data:image/png;base64,aW1hZ2U='))
  assert.equal(calls, 2)
  for (const status of [401, 403, 429]) {
    calls = 0
    const denied = await loadService({ fetch: async () => { calls++; return new Response('{"error":{"message":"denied"}}', { status }) } })
    assert.equal(await denied.callDirectGeminiVision('data:image/png;base64,aW1hZ2U='), null)
    assert.equal(calls, 1)
  }
})
test('review counts every editable field, additions/removals, and ignores medication reorder', async () => {
  const source = fs.readFileSync(`${root}/frontend/src/pages/ReviewExtraction.jsx`, 'utf8')
  const helper = source.slice(source.indexOf('export function countReviewCorrections'), source.indexOf('export default'))
  const { countReviewCorrections } = await import(`data:text/javascript;base64,${Buffer.from(helper).toString('base64')}`)
  const original = { patient_name: 'Original', medications: [{ ...fixture.medications[0] }, { ...fixture.medications[0], id: 'm2' }] }
  assert.equal(countReviewCorrections(original, original), 0)
  assert.equal(countReviewCorrections({ ...original, medications: [...original.medications].reverse() }, original), 0)
  assert.equal(countReviewCorrections({ ...original, patient_address: 'New', clinic_hospital: 'New', notes: 'New', medications: [{ ...original.medications[0], duration: 'New', instructions: 'New', generic_name: 'New' }, original.medications[1]] }, original), 6)
  assert.equal(countReviewCorrections({ ...original, medications: [original.medications[1]] }, original), 1)
  assert.equal(countReviewCorrections({ ...original, medications: [...original.medications, { id: 'new' }] }, original), 1)
})
async function loadEdge(fetch, key = 'test-key') {
  let handler
  const context = vm.createContext({ fetch, Response, Request, AbortSignal, Deno: { env: { get: () => key } } })
  const source = stripTypeScriptTypes(fs.readFileSync(`${root}/supabase/functions/process-prescription/index.ts`, 'utf8'))
  const mod = new vm.SourceTextModule(source, { context })
  await mod.link(() => new vm.SyntheticModule(['serve'], function () { this.setExport('serve', fn => { handler = fn }) }, { context }))
  await mod.evaluate()
  return handler
}
test('Edge endpoint handles CORS, missing keys, schema, MIME, and answer parts', async () => {
  let request
  const handler = await loadEdge(async (url, options) => { request = { url, ...options, body: JSON.parse(options.body) }; return success() })
  assert.equal((await handler(new Request('http://localhost', { method: 'OPTIONS' }))).status, 200)
  assert.equal((await handler(new Request('http://localhost'))).status, 405)
  const result = await handler(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ imageBase64: 'data:image/png;base64,aW1hZ2U=', ocrText: 'Hint', ocrConfidence: 0 }) }))
  assert.equal(result.status, 200)
  assert.equal((await result.json()).data.patient.name, fixture.patient.name)
  assert.match(request.url, /gemini-flash-latest:generateContent$/)
  assert.equal(request.body.contents[0].parts[1].inline_data.mime_type, 'image/png')
  assert.equal(request.body.contents[0].parts[1].inline_data.data, 'aW1hZ2U=')
  assert.deepEqual(request.body.generationConfig.thinkingConfig, { thinkingBudget: 0 })
  let clientSchema
  const client = await loadService({ fetch: async (_url, options) => { clientSchema = JSON.parse(options.body).generationConfig.responseJsonSchema; return success() } })
  await client.callDirectGeminiVision('data:image/png;base64,aW1hZ2U=')
  assert.deepEqual(request.body.generationConfig.responseJsonSchema, clientSchema)
  const missing = await loadEdge(async () => { throw new Error('should not call') }, '')
  const missingResult = await missing(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ocrText: 'Hint' }) }))
  assert.equal(missingResult.status, 500)
  assert.equal((await missingResult.json()).fallback, true)
})
test('Edge rejects empty, blocked, or malformed extractions instead of reporting success', async () => {
  for (const response of ['{}', 'not JSON', JSON.stringify({ candidates: [{ finishReason: 'SAFETY' }] })]) {
    const handler = await loadEdge(async () => new Response(response))
    const result = await handler(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ocrText: 'Hint' }) }))
    assert.equal(result.status, 502)
    assert.equal((await result.json()).success, false)
  }
})
test('upload enhances the source and hands off real values, zeros, and original extraction', async () => {
  const source = fs.readFileSync(`${root}/frontend/src/pages/UploadPrescription.jsx`, 'utf8')
  const handler = source.slice(source.indexOf('  const handleProceedToOCR ='), source.indexOf('\n  return (', source.indexOf('  const handleProceedToOCR =')))
  let saved
  let complete
  let pipelineInput
  const context = vm.createContext({
    imagePreviewUrl: 'data:image/png;base64,b3JpZ2luYWw=', rotation: 0, performance, console,
    setIsProcessingOCR() {}, setIsPipelineComplete(value) { complete = value }, setValidationError() {}, setOcrProgress() {},
    loadImage: async value => value,
    preprocessCanvas: value => { assert.equal(value, 'data:image/png;base64,b3JpZ2luYWw='); return { dataUrl: 'data:image/jpeg;base64,ZW5oYW5jZWQ=', readability: { readable: true } } },
    processPrescriptionPipeline: async value => { pipelineInput = value; return { structured: fixture, rawOcrText: '', ocrConfidence: 0, edgeFunctionUsed: false } },
    sessionStorage: { setItem(key, value) { assert.equal(key, 'mediseena_pending_review'); saved = JSON.parse(value) } },
  })
  await vm.runInContext(`(async () => { ${handler}; await handleProceedToOCR() })()`, context)
  assert.equal(complete, true)
  assert.equal(pipelineInput, 'data:image/jpeg;base64,ZW5oYW5jZWQ=')
  assert.equal(saved.draft.source_image_url, 'data:image/png;base64,b3JpZ2luYWw=')
  assert.equal(saved.draft.patient_name, fixture.patient.name)
  assert.equal(saved.draft.patient_age, 0)
  assert.equal(saved.draft.patient_gender, null)
  assert.equal(saved.draft.date_issued, '')
  assert.equal(saved.draft.ocr_confidence, 0)
  assert.equal(saved.draft.ai_confidence, 0)
  assert.deepEqual(saved.originalExtraction, saved.draft)
})
test('review ingests the session draft and its original without substituting demo records', async () => {
  const source = fs.readFileSync(`${root}/frontend/src/pages/ReviewExtraction.jsx`, 'utf8')
  const start = source.indexOf('  useEffect(() => {', source.indexOf('export default function ReviewExtraction'))
  const effect = source.slice(start, source.indexOf('  }, [])', start) + '  }, [])'.length)
  const draft = { patient_name: 'Test Patient', medications: [] }
  let record, original, loaded
  const context = vm.createContext({
    useEffect: fn => fn(), console,
    sessionStorage: { getItem: () => JSON.stringify({ draft, originalExtraction: draft }) },
    setRecord: value => { record = value }, setOriginalExtraction: value => { original = value }, setDataLoaded: value => { loaded = value },
    loadFallbackDraft() { assert.fail('Demo fallback must not run for an uploaded draft') },
  })
  vm.runInContext(effect, context)
  assert.equal(record.patient_name, draft.patient_name)
  assert.equal(original.patient_name, draft.patient_name)
  assert.equal(loaded, true)
})
for (const { name, run } of checks) { try { await run(); console.log(`PASS ${name}`) } catch (error) { process.exitCode = 1; console.error(`FAIL ${name}: ${error.message}`) } }
