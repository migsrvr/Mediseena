# Mediseena

A centralized digital healthcare platform for structured prescription digitization. Mediseena converts handwritten and printed medical prescriptions into organized, secure, and accessible digital clinical records using browser-based canvas enhancement, optical character recognition (OCR), and **Google Gemini 3.8 Flash Multimodal Vision** — eliminating misinterpretation and streamlining pharmacy workflows.

> **Built by ITC C301-302I** (Joshua Cyron Santos, Miggy Rivera, Stephane Aira Cayetano, Sonny Jr. Berdin) — José Rizal University.

---

## Key Features & Capabilities

### 1. Optical Character Recognition & Multimodal Clinical Vision
- **Google Gemini 3.8 Flash Engine**: Integrated via `gemini-flash-latest` with `thinkingConfig: { thinkingBudget: 0 }` for ultra-low latency (**2.6s – 4.8s** end-to-end processing, well below the $\le 10$s clinical KPI target).
- **Enforced Clinical JSON Schema**: Extracts strict structured entities:
  - **Patient**: Name, age, gender, address, confidence score.
  - **Physician**: Name, PRC license / PTR number, clinic / hospital affiliation, confidence score.
  - **Prescription**: Date issued, notes, special instructions, confidence score.
  - **Medications List**: Brand name, generic chemical name, dosage, frequency, duration, administration route, specific instructions, confidence score, and flag warnings.
- **Resilient Hybrid Fallback**: Client-side HTML5 Canvas preprocessing $\rightarrow$ Tesseract.js tokenization $\rightarrow$ Supabase Edge Function $\rightarrow$ Direct Gemini Vision API $\rightarrow$ Clinical NER parser.

### 2. Dynamic Real-Time OCR Progress Screen
- **Real-Time AI Pipeline Synchronization**: The loading screen is actively coupled to the real extraction pipeline stages (Canvas filter enhancement $\rightarrow$ text tokenization $\rightarrow$ multimodal Gemini inference $\rightarrow$ schema validation).
- **Zero Mockup Freezes**: Replaced legacy static timers that stalled at 92% with dynamic percentage interpolation and asymptotic pacing.
- **Live AI Activity Status Badge**: Pulsating real-time pill displaying what the AI is doing at each moment (*"Analyzing handwriting & extracting clinical entities with Gemini..."*).
- **8-Step Progressive Checklist**: Real-time checklist items check off in direct synchronization with actual pipeline milestones.

### 3. Dual-Pane Pharmacist Review Workspace
- **Side-by-Side Verification**: Original prescription image / PDF scan on the left with interactive zoom controls (75% to 250%) and editable clinical fields on the right.
- **Live Audit & Correction Tracking**: Every manual modification (corrections, additions, removals) is tracked in real time and logged to `correction_logs` for research accuracy KPI benchmarking.
- **One-Click Clinical Exports**: Instant export to standardized structured **JSON** and high-resolution clinical **PDF**.

### 4. Patient Profile & Medical History
- **8 Demographic & Clinical Fields**: Full name, email, phone number, date of birth, residential address, allergies, blood type, and existing medical conditions.
- **Persistent Multi-Account Isolation**: Persistent local storage (`mediseena_user_profiles`) combined with Supabase PostgreSQL synchronization ensures user edits survive reloads and logouts.
- **Clean Authentic State**: All fake persona fallbacks ("Juan Dela Cruz", "2001-05-16", etc.) removed; empty fields display clean placeholders.

### 5. Patient Dashboard ("My Prescriptions")
- **Strict Per-User Record Isolation**: Patient dashboard queries are strictly locked to the authenticated user (`user.id`), ensuring patients only see their own prescriptions.
- **Authentic Empty States**: All hardcoded sample medications (Omeprazole, Pantoprazole, etc.) eliminated; displays a clean illustration with an "Upload Prescription" action button when no records exist.
- **Direct Navigation**: Confirming a prescription on review routes straight to `/dashboard`.

### 6. AI & OCR Engine Management (`/settings`)
- **Interactive Connection Test**: Test live Gemini API connectivity and measure round-trip latency in milliseconds.
- **Engine Configuration**: Switch between `.env` API keys and browser overrides with real-time model verification (`gemini-3.8-flash`).

### 7. KPI Analytics & Research Benchmark Tracking (`/kpis`)
- **Automated Research Metrics**: Live calculation of OCR Field Accuracy ($\ge 85\%$), Successful Digitization Rate ($\ge 95\%$), Average Processing Time ($\le 10$s), and Manual Correction Rate ($\le 15\%$).
- **Stakeholder Survey**: Built-in 5-star Likert scale feedback system computing average user satisfaction.
- **Compliance Audit Trail**: Live inspection of system events (`audit_logs`) with actor attribution and timestamps.

---

## Architecture & Technology Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, Vite 8, Tailwind CSS v4, Lucide Icons | Clinical UI with responsive desktop/tablet/mobile layouts |
| **Image Preprocessing** | HTML5 Canvas API | Contrast enhancement, binarization, deskewing, noise reduction |
| **OCR Tokenization** | Tesseract.js | Client-side Optical Character Recognition & bounding boxes |
| **Clinical Multimodal AI** | Google Gemini 3.8 Flash (`gemini-flash-latest`) | Deep handwriting recognition & JSON schema field extraction |
| **Backend & Database** | Supabase PostgreSQL + Supabase Edge Functions | Relational database, RLS policies, secure Edge inference |
| **Authentication & Auth** | Supabase Auth + Local PBKDF2 Account Registry | Secure sign-in, session rehydration, role-based access |
| **Export Engines** | Native JSON & jsPDF | Structured JSON & printable prescription PDF documents |

---

## Routes & Navigation

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | Landing Page | Public landing page with Hero, About, Team, and Features |
| `/login` | Sign In | Authenticate existing patient or pharmacist account |
| `/register` | Sign Up | Register a new patient or healthcare account |
| `/dashboard` | My Prescriptions | User-isolated patient dashboard with prescription history |
| `/upload` | Scan & Upload | Image dropzone, Canvas preprocessor, dynamic OCR progress screen |
| `/review` | Review & Verification | Dual-pane review workspace with zoom and correction tracking |
| `/records/:id` | Record Inspection | Single prescription inspection, audit trail, and export |
| `/profile` | Patient Profile | 8-field demographic and medical profile management |
| `/settings` | Settings | AI engine status, live Gemini connection test & latency monitor |
| `/kpis` | KPI Analytics | Research benchmarks, correction logs, and feedback survey |

---

## Getting Started

### 1. Prerequisites
- **Node.js** v20+ / v22+ / v24+
- **npm** v10+

### 2. Installation
```bash
git clone https://github.com/YourRepo/Mediseena.git
cd Mediseena/frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in `frontend/` (see `.env.example`):
```env
# Optional Supabase Configuration (PostgreSQL, Auth, Storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API Key (Enables Gemini 3.8 Flash Multimodal Vision)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

> **Note**: Mediseena includes an automatic local persistence engine (`mediseena_registered_users` & `mediseena_user_profiles`). If Supabase is offline or not configured, the entire authentication, prescription storage, and review workflow functions seamlessly with local browser persistence.

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Verification & Automated Test Suite

Mediseena includes 51 automated tests covering end-to-end functionality:

```bash
# 1. Review Interactions Test (4/4 passing)
node --test frontend/scripts/review-interactions.test.mjs

# 2. OCR Multimodal Vision Integration (16/16 passing)
node --experimental-vm-modules frontend/scripts/ocr-integration.test.mjs

# 3. Production Build Verification
"/mnt/c/Program Files/nodejs/node.exe" node_modules/vite/bin/vite.js build < /dev/null
```

---

## Video Demo Recording Script & Flow

Looking to record a polished video demonstration with cursor clicks, keyboard typing sounds, and zoom-in animations? Check out our dedicated **[DEMO_FLOW.md](DEMO_FLOW.md)** guide for:
- Detailed scene-by-scene script with exact timestamps
- Camera cues (`[ZOOM IN]`, `[SLOW PAN]`, `[ZOOM OUT]`)
- Sound effect markers (`[SFX: Typing]`, `[SFX: Click]`, `[SFX: Chime]`)
- Ready-to-use prompt for ChatGPT to generate voiceovers and video editing cues

---

## License

© 2026 Mediseena ITC C301-302I. All rights reserved.