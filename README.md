# Mediseena

A centralized digital platform for structured prescription digitization. Mediseena converts handwritten and printed prescriptions into organized, secure, and accessible digital records using browser-based preprocessing, OCR technology, and clinical AI field extraction — reducing misinterpretation and improving efficiency in healthcare management.

> Built by ITC C301-302I (Joshua Cyron Santos, Miggy Rivera, Stephane Aira Cayetano, Sonny Jr. Berdin) — José Rizal University.

---

## Architecture & Technology Stack (Methodology Section 3.6)

Mediseena utilizes a modern, unified JavaScript and TypeScript architecture without a Python component:

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend & UI** | React 19, Vite 8, Tailwind CSS v4, Lucide Icons | Responsive client interface with clinical aesthetics |
| **Image Preprocessing** | HTML5 Canvas API | Deskewing, rotation, contrast, brightness, binarization, noise reduction |
| **Initial OCR** | Tesseract.js | Client-side Optical Character Recognition and confidence scoring |
| **Field Extraction (NER)** | Google Gemini Vision & Clinical NER Engine | Extraction of patient, physician, Rx details, and medications |
| **Secure Application Layer** | Supabase Edge Functions (TypeScript) | Server-side API gateway and secure model inference |
| **Database & Auth** | Supabase PostgreSQL + Supabase Auth | Profiles, prescriptions, medications, correction logs, and audit trail |
| **Storage** | Supabase Storage | Encrypted storage bucket for uploaded prescription images |
| **Export Engines** | Native JavaScript & jsPDF | Standardized structured JSON export and professional medical prescription PDF |

---

## System Users & Roles (Section 3.3)

1. **Patient**
   - Upload prescriptions (JPG, PNG, PDF).
   - View personal medication history and prescription records.
   - Export structured JSON and clinical PDF documents.
2. **Pharmacist / Healthcare Worker**
   - Review OCR and AI-extracted fields in a dual-pane workspace.
   - Perform manual field corrections (automatically tracked in `correction_logs`).
   - Validate and verify prescription records before database commitment.
3. **System Administrator**
   - Monitor real-time system Key Performance Indicators (KPIs).
   - Inspect security audit trails (`audit_logs`) and system compliance.
   - Evaluate model accuracy benchmarks across Agile Scrum two-week sprints.

---

## Research Evaluation Metrics & KPIs (Section 3.1.1 & 3.5.2)

Mediseena continuously tracks research benchmarks in real time:

| Evaluation Metric | Target Benchmark | Implementation / Calculation Method |
| :--- | :--- | :--- |
| **OCR Field Accuracy** | $\ge 85.0\%$ | Measured via $(\text{Extracted Fields} - \text{Corrections}) / \text{Extracted Fields} \times 100$ |
| **Successful Digitization Rate** | $\ge 95.0\%$ | Ratio of verified and stored records to total uploaded prescriptions |
| **Average Processing Time** | $\le 10.0\text{ s}$ | End-to-end duration from upload through Canvas preprocessing, OCR, and NER |
| **Manual Correction Rate** | $\le 15.0\%$ | Percentage of prescriptions requiring pharmacist field modifications |
| **Workflow Completion Rate** | $\ge 90.0\%$ | Pipeline retention from image selection to permanent record saving |
| **Pilot User Satisfaction** | $\ge 4.5 / 5.0$ | Automated 5-star Likert feedback collection from pilot healthcare stakeholders |

---

## Project Structure

```
Mediseena/
├── frontend/                     # React 19 + Vite client application
│   ├── src/
│   │   ├── assets/               # logo, Figma SVGs, page art
│   │   │   ├── login/            # Login page assets (logo, input icons, decos)
│   │   │   ├── register/         # Register page assets
│   │   │   └── upload/           # Upload page assets (Rx illustration)
│   │   ├── components/
│   │   │   ├── common/           # AppHeader (navigation, RBAC role switcher)
│   │   │   ├── landing/          # Landing page sections (Hero, About, Creators, Features, …)
│   │   │   ├── upload/           # CanvasPreprocessor (contrast, deskew, binarize, sharpen)
│   │   │   ├── review/           # Review workspace components
│   │   │   ├── records/          # Repository card components
│   │   │   └── export/           # Export-related components
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Session management & RBAC persona state
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Authentication & role hook
│   │   │   └── usePrescriptions.js # Prescription repository & filtering hook
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Public project landing page (`/landing-page`)
│   │   │   ├── Login.jsx         # Sign in page (`/login`, Figma-built)
│   │   │   ├── Register.jsx      # Sign up page (`/register`, Figma-built)
│   │   │   ├── Dashboard.jsx     # Patient dashboard (`/dashboard`, Figma-built)
│   │   │   ├── UploadPrescription.jsx # Scan card + upload (`/upload`, Figma-built)
│   │   │   ├── ReviewExtraction.jsx # Dual-pane review, correction logger, verification
│   │   │   ├── Records.jsx       # Searchable prescription repository & filters
│   │   │   ├── RecordDetail.jsx  # Complete record inspection, audit logs, PDF/JSON
│   │   │   └── KpiAnalytics.jsx  # KPI analytics dashboard & stakeholder survey
│   │   ├── services/
│   │   │   ├── api.js            # Supabase client setup
│   │   │   ├── authService.js    # Authentication & role switcher service
│   │   │   ├── ocrService.js     # Tesseract.js & Gemini Vision NER pipeline
│   │   │   ├── prescriptionService.js # Storage, verification & correction logging
│   │   │   ├── exportService.js  # Native JSON & jsPDF prescription generation
│   │   │   └── kpiService.js     # Live KPI formula calculations & feedback
│   │   └── utils/
│   │       ├── Formatters.js     # Date, confidence badge, and status helpers
│   │       ├── validators.js     # File format, 10MB size, and field validators
│   │       └── imagePreprocessor.js # HTML5 Canvas pixel manipulation engine
│   │   └── App.jsx               # Pathname router (`/`, `/landing-page`, `/login`,
│   │                             # `/register`, `/dashboard`, `/upload`, `/review`,
│   │                             # `/records`, `/records/:id`, `/kpis`)
│   └── index.html
├── supabase/
│   ├── schema.sql                # Complete PostgreSQL schema (profiles, prescriptions,
│   │                             # medications, correction_logs, audit_logs, RLS policies)
│   └── functions/
│       └── process-prescription/
│           └── index.ts          # TypeScript Edge Function for secure Gemini Vision API
├── docs/
│   ├── figma-mcp-codex.md        # Figma MCP design-to-code notes
│   └── ocr-pipeline.md           # Upload → OCR → structured data documentation
└── README.md
```

---

## Getting Started

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Variables (Optional)

Create a `.env` file in `frontend/` (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

*Note: If no Supabase keys or Gemini keys are provided, Mediseena automatically operates in an offline demonstration mode with pre-seeded evaluation records, client-side clinical NER parsing, and LocalStorage persistence.*

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Routes

| Route | Page | Notes |
| :--- | :--- | :--- |
| `/` | Landing page | Rewrites to `/landing-page` |
| `/landing-page` | Public landing | Hero, About, Creators, Features, Contact |
| `/login` | Sign in | Figma-built; back arrow returns to landing |
| `/register` | Sign up | Figma-built; links to `/login` |
| `/dashboard` | Patient dashboard | Figma-built sidebar + prescriptions table |
| `/upload` | Scan & upload | Figma-built scan card → preprocessing → OCR → `/review` |
| `/review` | Review & verification | Dual-pane edit, correction logging |
| `/records`, `/records/:id` | Repository & detail | Search, filters, JSON/PDF export |
| `/kpis` | KPI analytics | Live benchmarks, audit log, feedback |

> OCR data flow (upload → preprocessing → Tesseract → Gemini/local NER → review → storage) is documented in [`docs/ocr-pipeline.md`](docs/ocr-pipeline.md).

---

## Evaluation Workflow (Pilot Walkthrough)

1. **Landing Page (`/landing-page`)**: Click **"Get Started"** or **"Register / Login"**.
2. **Register (`/register`) / Login (`/login`)**: Create an account or sign in (session persists via `AuthContext`).
3. **Dashboard (`/dashboard`)**: Patient sidebar (Upload, My Prescriptions, Profile, Settings) with searchable prescriptions table.
4. **Upload (`/upload`)**: Upload a prescription file or drag-drop an image onto the scan card, then press **Upload**.
5. **Canvas Preprocessing**: Fine-tune contrast, deskew angle, and sharpen filters. Click **"Proceed to OCR & Field Extraction"**.
6. **Review & Verification (`/review`)**: Cross-reference extracted fields against the image scan. Edit any discrepancies (modifications are tracked in `correction_logs`). Verify and confirm the record.
7. **Export (`/records/:id`)**: Export digital records as standardized **JSON** or high-quality medical **PDF**.
8. **KPI Dashboard (`/kpis`)**: Review live OCR accuracy, benchmark matrix, correction audit log, and submit pilot feedback.

---

## License

© 2026 Mediseena ITC C301-302I. All rights reserved.