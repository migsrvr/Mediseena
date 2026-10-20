# OCR and Gemini Vision integration engineering report

Date: 2026-10-17. Scope: the five files assigned by `gemini-planner` session `303e58f6`, plus a focused regression script and this report. Existing edits were preserved; `opencode.json`, environment files, manifests, and lockfiles were not changed by this work. No commit, push, or deployment was performed.

## Implementation and contract checks

| Assigned file | Result |
| --- | --- |
| `frontend/src/services/ocrService.js` | Uses `gemini-flash-latest`, then `gemini-3.8-flash` for unavailable models, network failures, or invalid output. Retains `thinkingConfig: { thinkingBudget: 0 }`. Sends source MIME, inline base64 document/image, and OCR hint. Uses `responseJsonSchema` rather than relying only on the prompt. |
| `frontend/src/pages/UploadPrescription.jsx` | Applies the existing Canvas enhancement/readability engine to raster uploads before the pipeline. Preserves the original source for human review. Packages real extracted values into `sessionStorage.mediseena_pending_review`, with an independent original-extraction snapshot and timing metadata. Preserves zero age/confidence and absent dates/gender. |
| `frontend/src/pages/ReviewExtraction.jsx` | Loads the session draft and original extraction, supports all clinical field and medication edits including generic name, and displays ambiguity warnings. Counts all editable fields and medication additions/removals by stable IDs; reordering does not create corrections. Validates required fields before saving. Supports PDF source preview as well as raster images. |
| `frontend/src/pages/Settings.jsx` | Preserves AI & OCR Engine, environment-key status, and Test Connection controls. Reports the actual returned model after a valid connection test. Separates connection-check latency from the full processing target and accurately describes browser key persistence. |
| `supabase/functions/process-prescription/index.ts` | Uses the same endpoint order, thinking configuration, and extraction schema as the client. Derives MIME from data URLs, strips their prefix, passes OCR hints, handles CORS/methods/missing keys, and rejects blocked, empty, malformed, or incomplete container responses. |

Both extraction schemas require:

- `patient`: name, age, gender, address, confidence.
- `physician`: name, license, clinic, confidence.
- `prescription`: date_issued, notes, confidence.
- `medications[]`: id, medication_name, generic_name, dosage, frequency, duration, route, instructions, confidence_score, flag_warning.
- `overall_confidence`.

Unknown clinical values remain empty/null and medication arrays can remain empty. The local fallback no longer inserts sample patients, physicians, licenses, addresses, drugs, or treatment schedules. Its parser recognizes standalone patient/physician names and confines medication directions to the matching medication.

Tesseract errors do not prevent vision extraction. Tokenization has an eight-second timeout; late-created workers are terminated, and cleanup failures do not discard recognized text. PDF documents bypass unsupported raster OCR. Edge failures and exceptions independently fall through to direct Gemini, then limited local NER. Remote requests have fifteen-second attempt timeouts. Authentication, invalid-request, and quota errors avoid duplicate requests to the second model.

## Verification results

- **16/16 focused checks passed** with Node 24.21.0. Run from `frontend`: `node --experimental-vm-modules scripts/ocr-integration.test.mjs`.
- Checks cover absent clinical values, local parsing, schema contents/parity, image MIME and hints, zero confidence/age, answer-part selection, worker errors/timeouts/cleanup, Edge failure/success, alias fallback, authentication/quota errors, PDF routing, all review correction types, upload enhancement/session handoff, review ingestion, and Edge CORS/invalid responses. They use controlled mocks and synthetic data; they are not browser automation.
- `node --check frontend/src/services/ocrService.js`: passed.
- Scoped `git diff --check`: passed. The unrelated pre-existing `opencode.json` CRLF diff produces whitespace notices in an unscoped check and was left unchanged.
- **Final production build passed** using installed Windows Node: from `frontend`, `"/mnt/c/Program Files/nodejs/node.exe" node_modules/vite/bin/vite.js build`. Native Linux Vite could not build because the existing dependency installation contains Windows native bindings. The Windows build reported the existing bundle-size warning; dependencies were not reinstalled.
- **Live final-service connection check passed:** actual returned model `gemini-3.8-flash`, latency **2,663 ms**. The configured key was read without displaying it.
- **Live synthetic prescription PDF pipeline passed:** **4,874 ms**, with correct patient name/age/gender, physician, date, and medication; absent address and generic name stayed blank. The document explicitly contained synthetic test data. This exercised the real direct multimodal API and enforced schema, without real patient information.

Google's [structured-output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en) supports schema-based extraction. Its [thinking documentation](https://ai.google.dev/gemini-api/docs/generate-content/thinking) recommends thinking levels for newer Gemini models; live checks confirmed that the requested zero-budget configuration is currently accepted by this key and alias, so it was retained. Model naming/availability should continue to be checked against actual API responses.

## Remaining validation and external scope

- The synthetic PDF result is below ten seconds; it does **not** establish the end-to-end handwritten raster benchmark, field-accuracy target, or pilot success rate. A representative labeled prescription set and real-browser Canvas/Tesseract runs are still needed. Timeout/fallback paths may exceed ten seconds.
- Edge TypeScript was stripped and its handler executed in isolated tests. Deno is not installed in this environment; the function was not deployed or tested against hosted Supabase.
- The existing persistence service is outside the assigned ownership. Its correction logs cover only a subset of the fields counted in review, omit some blank-to-value changes and medication additions/removals, and its verification flow looks up local records. Full live Supabase creation/verification and audit-log completeness require a separate persistence task. The review success text now describes applied review changes without claiming all were logged.
- Browser rendering and interactive input behavior were compiled and handler-tested, but not exercised in a real-browser automated walkthrough.
- Existing OCR documentation still describes older model names and demo fallbacks; this report records the current implementation.
