# Mediseena

**See. Scan. Simplify Prescriptions.**

Mediseena is a web platform that turns photos and scans of handwritten or printed medical prescriptions into structured, editable digital records. A patient or pharmacist uploads a prescription. The browser cleans up the image and runs OCR, and Google Gemini multimodal vision extracts the patient, physician, and medication fields into a strict JSON schema. A human then checks every field in a side-by-side review screen before the record is saved. Every correction is logged, so extraction accuracy can be measured.

| | |
|---|---|
| **Live app** | https://mediseena.vercel.app |
| **Repository** | https://github.com/migsrvr/Mediseena |
| **Type** | Academic capstone / systems project, full-stack web app |
| **Team** | ITC C301-302I, José Rizal University: Joshua Cyron Santos, Miggy Rivera, Stephane Aira Cayetano, Sonny Jr. Berdin |
| **Timeline** | First commit 2026-08-13 · working demo 2026-10-20 · production deploy 2026-10-26 |
| **Status** | Deployed and functional (demo/research use, not a certified clinical product) |
| **Stack** | React 19 · Vite 8 · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Edge Functions) · Google Gemini · Tesseract.js · jsPDF |
| **Hosting** | Frontend on Vercel (auto-deploys from `main`) · backend on Supabase |

---

## Contents

1. [Handoff notes for a portfolio writer](#1-handoff-notes-for-a-portfolio-writer)
2. [Problem and solution](#2-problem-and-solution)
3. [Features](#3-features)
4. [How extraction works](#4-how-extraction-works)
5. [Architecture](#5-architecture)
6. [Tech stack](#6-tech-stack)
7. [Data model and security](#7-data-model-and-security)
8. [Routes](#8-routes)
9. [Project structure](#9-project-structure)
10. [Local development](#10-local-development)
11. [Testing](#11-testing)
12. [Deployment (current production setup)](#12-deployment-current-production-setup)
13. [Known limitations](#13-known-limitations)
14. [Team and license](#14-team-and-license)

---

## 1. Handoff notes for a portfolio writer

This section is for anyone (human or AI agent) writing about Mediseena for a portfolio, résumé, or case study.

### One-line pitch
> A prescription digitization platform that combines in-browser image enhancement, OCR, and Gemini multimodal AI with a human-in-the-loop review step to turn handwritten prescriptions into structured, auditable records.

### Short description (about 60 words)
> Mediseena digitizes handwritten and printed prescriptions. Users upload a photo or PDF; the app enhances it with the HTML5 Canvas API, runs Tesseract.js OCR, and sends it to a secured Supabase Edge Function that calls Google Gemini with a strict JSON schema. Extracted fields go through a side-by-side human review, and every correction is logged to measure accuracy.

### Claims that are accurate and safe to make
- Built a **full-stack React 19 + Supabase** application, deployed to production on **Vercel** at https://mediseena.vercel.app.
- Designed a **multi-stage extraction pipeline with graceful fallbacks**: Canvas preprocessing → Tesseract.js OCR → Supabase Edge Function (Gemini) → optional direct Gemini call → local rule-based clinical parser (Section 4).
- Used **schema-constrained LLM output**: Gemini is called with `responseJsonSchema`, and every response is validated and normalized before use. Prompts tell the model never to invent fields and to flag ambiguous handwriting.
- Wrote **prompt rules for dosage extraction**: keep compound strengths like `250mg/5mL` intact, don't treat quantities (`#21`) as strengths, and infer `mg` only for solid oral medicines (and flag it when inferred). The browser and the Edge Function share identical prompt rules, and a test enforces this.
- Kept **secrets server-side**: the Gemini API key lives only in Supabase Edge Function secrets, never in the browser bundle. The Edge Function verifies the caller's Supabase session and rejects anonymous requests (401) and oversized images (413).
- **Role-based access control in Postgres**: Row-Level Security policies for patients, pharmacists, and admins; a `SECURITY DEFINER` role lookup that ignores editable JWT metadata; and a trigger that stops users from promoting their own role.
- **Human-in-the-loop review with audit trail**: a dual-pane review screen (zoomable source image beside editable fields). Every edit, addition, and removal is written to `correction_logs`, and actions are written to `audit_logs`.
- **Research KPI dashboard** that calculates OCR field accuracy, digitization rate, average processing time, and manual correction rate from stored records and corrections.
- **Offline-tolerant design**: if Supabase is unreachable, auth and records fall back to browser storage (local accounts use PBKDF2-SHA256 password hashing via Web Crypto).
- Exports records as **JSON** and as a formatted **PDF** (jsPDF, loaded only when needed).
- Prepared the app for production: found and removed an API key that was being bundled into the frontend, added an SPA rewrite for Vercel, applied database migrations, cut image assets from about 10 MB to 1.9 MB, and split jsPDF out of the main bundle (1.09 MB → 694 KB).

### Claims to avoid (not supported by the code)
- **Don't quote specific latency numbers** (for example "2.6–4.8 seconds"). The ≤10 s figure is a *target*, not a measured result.
- **Don't present KPI page numbers as measured results unless real records exist.** When there are no prescriptions, `kpiService.calculateKPIs()` returns **hardcoded placeholder values**: 89.2% accuracy, 96.5% digitization, 3.8 s, 12% corrections, 94% completion. Screenshots of an empty KPI page show those placeholders.
- **Don't claim real user-satisfaction results.** The satisfaction score on the KPI page starts from 3 **hardcoded sample feedback entries** (`frontend/src/services/kpiService.js`), not from real users.
- **Don't claim clinical validation, HIPAA compliance, or medical certification.** None exists.
- **Don't claim automatic deskewing.** Rotation is manual (a slider).
- **Don't claim CI/CD test automation.** Tests exist (Section 11) but run manually; nothing runs them on push.
- The model name: the code requests `gemini-flash-latest` and falls back to `gemini-3.8-flash`. Describe it as "Google Gemini (Flash) multimodal vision".

### Contribution attribution
This was a four-person team project. Commit history shows 7 of 10 commits by `Rivera-Dev-01` (Miggy Rivera), 2 by Sonny Jr. Berdin, and 1 by Joshua Cyron Santos (`Shua-sec-404`). Commit counts don't map cleanly to who did what. **Confirm individual responsibilities with the owner before writing first-person claims.**

### Suggested screenshots (all at https://mediseena.vercel.app)
| Screen | Route | What it shows |
|---|---|---|
| Landing page | `/` | Hero, features, team section |
| Upload + preprocessing | `/upload` | Dropzone, Canvas enhancement controls (contrast, brightness, rotation, sharpen, binarize) |
| OCR progress | `/upload` (after "Proceed") | Live pipeline progress with stage checklist |
| Review workspace | `/review` | Source image beside editable extracted fields, zoom controls, confidence flags |
| Record detail | `/records/:id` | Saved record, audit trail, JSON/PDF export |
| Dashboard | `/dashboard` | The user's prescription list |
| KPI analytics | `/kpis` | Research metrics vs targets, correction logs, audit trail |

Screens after the landing page need a signed-in account (register at `/register`).

### Suggested tags
`React` `Vite` `Tailwind CSS` `Supabase` `PostgreSQL` `Row-Level Security` `Edge Functions` `Deno` `Google Gemini` `LLM structured output` `OCR` `Tesseract.js` `Canvas API` `Healthcare` `Human-in-the-loop AI` `Vercel`

---

## 2. Problem and solution

**Problem.** Handwritten prescriptions are hard to read. Misreading a drug name, strength, or frequency can cause dispensing errors, and paper prescriptions are hard to store, search, and audit.

**Solution.** Mediseena:
1. Enhances the image so faint handwriting is easier to read.
2. Extracts the prescription into a strict, typed structure (patient, physician, prescription metadata, and a list of medications).
3. Marks low-confidence or ambiguous fields so a reviewer looks at them.
4. Requires a person to confirm every field before the record is saved.
5. Logs every correction, so the system's real accuracy can be measured against research targets.

---

## 3. Features

### Upload and image enhancement (`/upload`)
- Accepts **JPEG, PNG, WebP, and PDF**.
- Canvas-based preprocessing (`frontend/src/utils/imagePreprocessor.js`): grayscale, contrast, brightness, manual rotation, 3×3 sharpen kernel, optional binarization (threshold), and optional noise reduction.
- A readability check rejects images that are blank or have extremely low contrast before processing.

### AI extraction with live progress
- A progress screen tied to the real pipeline stages (`frontend/src/components/upload/OcrProcessingView.jsx`).
- Extracted fields:
  - **Patient:** name, age, gender, address
  - **Physician:** name, PRC/PTR license, clinic or hospital
  - **Prescription:** date issued, notes
  - **Medications (list):** brand/medication name, generic name, dosage, frequency, duration, route, instructions, confidence score (0–100), and a flag warning for anything that needs review

### Review and verification (`/review`)
- The original image or PDF sits beside editable fields, with zoom from 75% to 250%.
- Required-field validation runs before confirming.
- Medications can be added, removed, or edited. Each change is counted and written to `correction_logs`.
- Confirming saves the prescription and medications, marks it verified, and returns to `/dashboard`.

### Records
- **Dashboard (`/dashboard`):** each user sees only their own prescriptions.
- **Record detail (`/records/:id`):** full record, audit trail, re-open in review, delete.
- **Export:** structured JSON or a formatted PDF (`frontend/src/services/exportService.js`).

### KPI analytics (`/kpis`)
Calculated in `frontend/src/services/kpiService.js` from stored prescriptions and corrections:

| Metric | Target |
|---|---|
| OCR field accuracy | ≥ 85% |
| Successful digitization rate | ≥ 95% |
| Average processing time | ≤ 10 s |
| Manual correction rate | ≤ 15% |
| Workflow completion rate | ≥ 90% |
| User satisfaction (1–5 survey) | ≥ 4.5 (starts from 3 sample entries; see Section 13) |

The page also lists correction logs and audit-log events. With no prescriptions stored, it shows placeholder values instead (see Section 13).

### Accounts and profile
- **Register and login:** Supabase Auth (email + password, with email confirmation). Self-registration always creates a `patient`. Staff roles (`pharmacist`, `admin`) must be assigned by an administrator in the database.
- **Profile (`/profile`):** full name, phone, date of birth, address, allergies, blood type, existing conditions. Saved to Supabase `profiles` and cached in the browser.
- **Settings (`/settings`):** language, date/time format, notification toggles, and an **AI & OCR Engine** tab. Production extraction always uses the server-side key. Developers can optionally save a Gemini key in their own browser and test the connection with it.

---

## 4. How extraction works

Code: `frontend/src/services/ocrService.js` → `processPrescriptionPipeline()`.

```
 Image / PDF
     │
     ▼
 1. Canvas preprocessing (browser)        imagePreprocessor.js
     │
     ▼
 2. Tesseract.js OCR (browser, 8 s cap)   produces a raw-text hint; skipped for PDFs
     │
     ▼
 3. Supabase Edge Function                supabase/functions/process-prescription
    "process-prescription"                • verifies the user's Supabase session (401 if not signed in)
     │  (15 s client timeout)             • rejects images > ~10 MB (413)
     │                                    • calls Gemini with image + OCR hint +
     │                                      responseJsonSchema; tries gemini-flash-latest,
     │                                      then gemini-3.8-flash
     │                                    • validates the JSON shape before returning
     ▼  if step 3 fails or returns nothing usable
 4. Direct Gemini call (browser)          only if the user saved a personal key in Settings
     │
     ▼  if still nothing
 5. Local clinical parser                 parseClinicalNER(): regex + formulary rules over OCR text;
                                          fills only what it can find, flags everything else
     │
     ▼
 Normalized result  →  /review (human confirms)  →  Supabase tables
```

Design choices:
- **No invented data.** Every prompt says to leave unreadable or missing fields empty or `null` and to flag them. Image and OCR text are treated as untrusted data, never as instructions (a prompt-injection guard).
- **Dosage rules** are shared word-for-word between the browser and the Edge Function. `ocr-integration.test.mjs` checks that they match.
- **Formulary helper** (`frontend/src/services/clinicalFormulary.js`): 20+ common medicines with brand aliases (e.g. Biogesic → paracetamol, Augmentin → co-amoxiclav), standard strengths, and default routes. The local parser uses it to recognize drug names and infer routes or units, and flags every inference.
- **Gemini settings:** `responseMimeType: application/json`, `responseJsonSchema` (all fields required, no extra properties), `thinkingConfig.thinkingBudget: 0` for lower latency, and a 15 s timeout per model. Errors 400/401/403/429 stop retries.

---

## 5. Architecture

```
┌──────────────────────────── Browser (React SPA) ────────────────────────────┐
│ Canvas preprocessing · Tesseract.js OCR · review UI · JSON/PDF export        │
│ Custom pushState router (App.jsx) · AuthContext · services/*                 │
└──────┬──────────────────────────────┬──────────────────────────────┬────────┘
       │ static assets                │ supabase-js (anon key + user JWT)
       ▼                              ▼                              ▼
┌──────────────┐        ┌─────────────────────────┐      ┌──────────────────────────┐
│   Vercel     │        │ Supabase Postgres + RLS │      │ Supabase Edge Function   │
│ (static host,│        │ Auth · Storage bucket   │      │ process-prescription     │
│ SPA rewrite) │        │ "prescriptions"         │      │ (Deno) ─── GEMINI_API_KEY│
└──────────────┘        └─────────────────────────┘      └────────────┬─────────────┘
                                                                      ▼
                                                         Google Gemini API
```

- **Frontend:** a static Vite build. There's no Next.js and no server rendering. Routing is a small custom router in `frontend/src/App.jsx` built on `history.pushState`, so `frontend/vercel.json` rewrites every path to `index.html`.
- **Backend:** Supabase only. There's no separate API server.
- **Offline fallback:** `authService.js` and `prescriptionService.js` switch to `localStorage` when Supabase is unreachable or not configured. Records saved this way stay in that browser only.

---

## 6. Tech stack

| Layer | Technology (installed version) |
|---|---|
| UI | React 19.2.8, Tailwind CSS 4.3.3 (`@tailwindcss/vite`), lucide-react 1.48.0, Poppins (Google Fonts) |
| Build | Vite 8.2.1, `@vitejs/plugin-react` 6.0.5, Node ≥ 22 (Vercel uses 24.x) |
| OCR | tesseract.js 7.0.0 (worker and language data load from a CDN at runtime) |
| AI | Google Gemini REST API (`generativelanguage.googleapis.com/v1beta`), models `gemini-flash-latest` → `gemini-3.8-flash` |
| Backend | Supabase: Postgres 17, Auth, Storage, Edge Functions (Deno); `@supabase/supabase-js` 2.117.2 |
| Export | jsPDF 4.2.1 (loaded on demand), native JSON |
| Hosting | Vercel (frontend), Supabase (backend) |
| Tests | Node's built-in test runner and `node:vm` module harness, no extra test dependencies |

---

## 7. Data model and security

Schema: `supabase/schema.sql`. It's idempotent, so it can be run again safely.

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user (created by the `on_auth_user_created` trigger): role, contact, and medical-history fields |
| `prescriptions` | Extracted and verified record: patient/physician fields, `source_image_url`, raw OCR text, OCR and AI confidence, processing time, `verification_status` (`pending`/`verified`/`rejected`), `corrections_count`, verifier and timestamp |
| `medications` | Child rows of a prescription: name, generic, dosage, frequency, duration, route, instructions, confidence, `flag_warning`, `is_verified` |
| `correction_logs` | One row per field changed during review (original vs corrected value), used for accuracy KPIs |
| `audit_logs` | Actions such as upload, verify, export, delete, with actor, role, and details (JSONB) |
| `kpi_metrics` | Optional KPI snapshots (readable by anyone) |

Enums: `user_role` (`patient`, `pharmacist`, `admin`) and `prescription_status` (`pending`, `verified`, `rejected`).

**Security model**
- **RLS on every table.** Patients see and change only their own rows. Pharmacists and admins can read and verify all prescriptions. Only admins can delete profiles or edit and delete logs.
- **Role lookup:** `get_current_user_role()` is a `SECURITY DEFINER` function that reads `profiles.role`. It never trusts JWT metadata, and only the `authenticated` role can call it.
- **Role escalation guard:** the `protect_profiles_role` trigger blocks non-admins from changing any role, including their own.
- **Storage:** a private `prescriptions` bucket where users read objects in their own `<user_id>/` folder (staff can read all).
- **Secrets:** the browser only gets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, which are public by design and protected by RLS. `GEMINI_API_KEY` exists only as a Supabase Edge Function secret.
- **Edge Function:** JWT verification is on, the caller must be a signed-in user (checked against Supabase Auth `/auth/v1/user`), and the payload size is capped. CORS defaults to `*` and can be restricted with an `ALLOWED_ORIGIN` secret.

---

## 8. Routes

| Route | Page | Auth |
|---|---|---|
| `/` (also `/landing-page`) | Landing page: hero, about, features, team, contact | Public |
| `/login` | Sign in | Public |
| `/register` | Sign up (patient or pharmacist form; the database assigns `patient`) | Public |
| `/dashboard`, `/records` | My prescriptions | Signed in |
| `/upload` | Upload, enhance, extract | Signed in |
| `/review` | Review and verify extraction | Signed in |
| `/records/:id` | Record detail, audit trail, export | Signed in |
| `/profile` | Profile and medical history | Signed in |
| `/settings` | Preferences and AI engine status | Signed in |
| `/kpis` | KPI analytics | Signed in |
| `/logout` | Sign-out screen | Signed in |

Any unknown path shows the dashboard.

---

## 9. Project structure

```
Mediseena/
├── frontend/                      # Vite + React app (Vercel Root Directory)
│   ├── index.html
│   ├── vercel.json                # SPA rewrite → /index.html
│   ├── package.json               # scripts: dev, build, preview · engines: node >=22
│   ├── public/favicon.png
│   ├── scripts/                   # Node test suites (see Section 11)
│   └── src/
│       ├── App.jsx                # pushState router
│       ├── context/AuthContext.jsx
│       ├── pages/                 # Landing, Login, Register, Dashboard, Upload, Review,
│       │                          # RecordDetail, KpiAnalytics, Profile, Settings, Logout
│       ├── components/            # landing/*, upload/CanvasPreprocessor, OcrProcessingView, common/AppHeader
│       ├── services/              # api (Supabase client), authService, ocrService, prescriptionService,
│       │                          # kpiService, exportService, clinicalFormulary
│       ├── utils/                 # imagePreprocessor, validators, Formatters
│       └── assets/
├── supabase/
│   ├── schema.sql                 # full schema, RLS, triggers, storage bucket
│   └── functions/process-prescription/index.ts   # Gemini extraction gateway (Deno)
├── docs/                          # OCR pipeline notes, design specs and plans
├── DEMO_FLOW.md                   # scene-by-scene video demo script
└── README.md
```

---

## 10. Local development

Requirements: Node.js 22+ and npm 10+.

```bash
git clone https://github.com/migsrvr/Mediseena.git
cd Mediseena/frontend
npm install
cp .env.example .env     # then fill in the two values below
npm run dev              # http://localhost:5173
```

`frontend/.env`:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase anon key>
```

> **Never add a Gemini key as a `VITE_*` variable.** Vite bundles every `VITE_*` value into public JavaScript. To test AI extraction locally, either sign in (the deployed Edge Function is used), or paste a personal key into **Settings → AI & OCR Engine**, which stays in your browser only.

Without Supabase values, the app still runs in local mode: accounts and records live in `localStorage`, and extraction uses Tesseract plus the local parser.

---

## 11. Testing

Run from `frontend/` (Node 24 recommended, because the suites use `node:module`'s `stripTypeScriptTypes` and `vm.SourceTextModule`):

```bash
node --test scripts/review-interactions.test.mjs                  # 4 tests
node --experimental-vm-modules scripts/ocr-integration.test.mjs   # 28 checks
npm run build                                                     # production build
```

Coverage:
- **OCR and parsing:** formulary lookups, strength and quantity handling, multi-line Sig parsing, route inference, never inventing fields.
- **Gemini integration:** schema enforcement, ignoring "thought" parts, model fallback, no retries after 401/403/429, PDF handling, and a check that a bundled `VITE_GEMINI_API_KEY` alone can't enable browser calls.
- **Edge Function:** CORS and 405, 401 for anonymous or invalid tokens, 413 for oversized images, missing-secret fallback, rejecting malformed or blocked model output, and prompt and schema parity with the browser.
- **Review flow:** correction counting (edits, additions, removals, ignoring reorders), and the upload → review handoff.

No CI pipeline runs these yet.

---

## 12. Deployment (current production setup)

### Vercel (frontend)
| Setting | Value |
|---|---|
| Project | `mediseena` |
| Production URL | https://mediseena.vercel.app |
| Git | `migsrvr/Mediseena`, production branch `main` (every push to `main` deploys to production; other branches get preview URLs) |
| Root Directory | `frontend` |
| Framework preset | Vite (build `npm run build`, output `dist`) |
| Node.js | 24.x |
| Env vars (Production + Preview) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (type: config/public) |

To deploy, push to `main`. For a manual deploy from the repo root: `npx vercel link` (select `mediseena`), then `npx vercel deploy --prod`.

### Supabase (backend)
- **Project:** ref `izmctkzzegisxxuhzyeo` (named "Integ" in the dashboard).
- **Schema:** apply or update with `npx supabase db query --linked -f supabase/schema.sql`, or paste it into the SQL editor.
- **Edge Function secrets:** `GEMINI_API_KEY` (required). `ALLOWED_ORIGIN` is optional and left unset on purpose, because setting it would block `localhost` and Vercel preview URLs.
- **Deploy the function:**
  ```bash
  npx supabase login
  npx supabase link --project-ref izmctkzzegisxxuhzyeo
  npx supabase secrets set GEMINI_API_KEY=<key>
  npx supabase functions deploy process-prescription --use-api
  ```
- **Auth → URL Configuration:** Site URL `https://mediseena.vercel.app`; Redirect URLs include `https://mediseena.vercel.app/**`.

### Rotating the Gemini key
Create a new key in Google AI Studio, run `npx supabase secrets set GEMINI_API_KEY=<new key>`, then revoke the old key. You don't need to redeploy the frontend.

---

## 13. Known limitations

- **Not a medical device.** Extraction output must be checked by a qualified person, which is why the review step is mandatory.
- **Placeholder KPI values.** With zero prescriptions, the KPI page shows hardcoded demo numbers (89.2% accuracy, 96.5% digitization, 3.8 s, 12% corrections, 94% completion) instead of empty states. Real values replace them once records exist.
- **Sample satisfaction data.** The KPI page's satisfaction survey starts from 3 hardcoded sample entries saved in browser storage, so that metric isn't real-user data.
- **Source images are stored inline.** `source_image_url` holds the preprocessed image as a base64 data URL in Postgres instead of a Storage object. That works at demo scale but makes rows large.
- **Local-only accounts** (created while Supabase is unreachable) keep data in a single browser and can't use server-side AI extraction (Tesseract plus the local parser only).
- **Tesseract** downloads its worker and English language data from a CDN on first use, so the first OCR run is slower and needs internet access.
- **Bundle size:** the main JS chunk is about 694 KB (about 200 KB gzipped) and could be split further by route.
- **No CI.** Tests run manually.

---

## 14. Team and license

**ITC C301-302I, José Rizal University**
- Joshua Cyron Santos
- Miggy Rivera
- Stephane Aira Cayetano
- Sonny Jr. Berdin

For a scripted walkthrough suitable for a demo video, see [DEMO_FLOW.md](DEMO_FLOW.md).

© 2026 Mediseena ITC C301-302I. All rights reserved.
