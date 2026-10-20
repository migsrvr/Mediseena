# Mediseena — Official Product Demo Video Script & Flow

> **Instructions for ChatGPT / Prompt**:
> *You can copy-paste this document directly into ChatGPT with the prompt:*
> *"Act as a professional healthcare technology video producer. Use this demo flow script to generate a voiceover narration script with exact subtitle timestamps and CapCut/Premiere video editing cues."*

---

## Video Specifications & Creative Direction

- **Target Video Duration**: ~2 minutes 15 seconds to 2 minutes 30 seconds
- **Resolution**: 1080p (1920x1080) or 4K (3840x2160) at 60 FPS
- **Pacing**: Modern, crisp, engaging, and professional (Apple / Linear / Supabase style demo)
- **Audio Aesthetic**:
  - **Background Music**: Low-volume modern ambient tech synth (uplifting, clean, non-distracting)
  - **SFX**: High-quality tactile Foley — mechanical keyboard clacks, soft mouse clicks, subtle UI whooshes, AI digital processing hum, and a clean satisfying confirmation chime
- **Visual Effects**: Smooth cursor smoothing, localized camera zoom-ins (1.2x – 1.6x) on active inputs/badges, and smooth zoom-outs to showcase layout responsiveness

---

## Scene-by-Scene Demo Flow

### Scene 1: Introduction & Public Landing Page (0:00 – 0:18)
- **Visual**:
  - Start at `http://localhost:5173/` (Landing Page).
  - Screen displays the bold hero headline: *"Deciphering Healthcare, One Prescription at a Time."*
- **Camera Movement**:
  - `[CAMERA: Slow cinematic zoom (1.0x -> 1.15x) centered on the hero illustration and CTA buttons]`
- **Actions**:
  - Cursor smoothly moves toward the primary action button.
  - Hover over **"Scan Prescription"** (button glows slightly).
  - `[SFX: Crisp Mouse Click]` Click **"Get Started"** or **"Sign In"**.
- **Voiceover / Narration**:
  > *"Medical prescriptions contain critical health information, but illegible handwriting and manual interpretation lead to costly delays and errors. Welcome to Mediseena — an intelligent, clinical platform that transforms handwritten prescriptions into structured, accessible digital records."*

---

### Scene 2: Secure Sign In & Local/Supabase Persistence (0:18 – 0:35)
- **Visual**:
  - Navigates to `/login`. Crisp dual-panel view with clinical teal branding and decorative iconography.
- **Camera Movement**:
  - `[CAMERA: Smooth cut, then zoom in (1.25x) focused on the email and password inputs]`
- **Actions**:
  - Cursor clicks into the **Email** input field.
  - `[SFX: Rapid ASMR Mechanical Keyboard Typing (Thocky)]` Type: `patient@mediseena.ph`
  - Cursor clicks into **Password** input field.
  - `[SFX: Rapid Mechanical Typing]` Type: `••••••••••••`
  - Cursor checks the "Remember me" box.
  - `[SFX: Soft Click]` Click **"SIGN IN"**.
- **Voiceover / Narration**:
  > *"Mediseena features robust authentication backed by Supabase and a secure local account registry — ensuring your personal health data and medical records remain completely isolated, private, and persistent across devices."*

---

### Scene 3: Patient Dashboard & Clean Personal Repository (0:35 – 0:52)
- **Visual**:
  - Instantly lands on `/dashboard` (Patient Dashboard).
  - Clean sidebar with brand logo, "PATIENT DASHBOARD", and personalized greeting: *"Welcome back, Patient!"*.
  - When no prescriptions are uploaded yet, showcase the authentic empty state: *"No Prescriptions Yet — You haven't uploaded any prescriptions yet."*
- **Camera Movement**:
  - `[CAMERA: Pan across sidebar navigation, then zoom in (1.3x) onto the clean empty state illustration and 'Upload Prescription' button]`
- **Actions**:
  - Cursor highlights the empty state.
  - `[SFX: Soft Click]` Click the **"Upload Prescription"** button in the empty state card (or in the sidebar).
- **Voiceover / Narration**:
  > *"Your dashboard provides a focused view of your personal prescription history. With zero clutter or mock data, the platform is ready for your real medical documents."*

---

### Scene 4: Prescription Staging & Canvas Enhancement (0:52 – 1:12)
- **Visual**:
  - Lands on `/upload` (Scan a Prescription).
  - Modern drag-and-drop card with upload illustration.
- **Camera Movement**:
  - `[CAMERA: Zoom out (1.0x), then smooth punch-in (1.2x) on the dropzone as the file is added]`
- **Actions**:
  - Drag and drop an image of a real handwritten doctor's prescription into the dropzone (e.g., Amoxicillin / Paracetamol doctor prescription).
  - `[SFX: Gentle Paper Rustle / File Drop Sound]`
  - Image previews instantly in the canvas workspace.
  - Cursor hovers over the large teal **"Upload"** button at the bottom.
  - `[SFX: Crisp Tactile Click]` Click **"Upload"**.
- **Voiceover / Narration**:
  > *"Simply drop any printed or handwritten prescription — whether a photo or a PDF. Behind the scenes, HTML5 Canvas filters optimize contrast, remove shadow artifacts, and enhance edge clarity before recognition."*

---

### Scene 5: Dynamic AI-Driven OCR & Gemini 3.8 Flash in Action (1:12 – 1:40)
*(⭐ Key Cinematic Sequence — Highlights the live AI processing)*
- **Visual**:
  - Screen transitions into the full-screen dynamic **OcrProcessingView**.
  - Animated circular progress counter in the center.
  - **Live Pulsating AI Status Badge** directly beneath the percentage ring.
  - Two-column 8-step progressive checklist checking off in sequence.
- **Camera Movement**:
  - `[CAMERA: Dramatic slow zoom in (1.1x -> 1.4x) focused on the dynamic percentage ring and the live AI activity pill]`
- **Actions & Progression**:
  - **10% – 30%**:
    - Status: *"Enhancing prescription image with Canvas..."* $\rightarrow$ *"Image noise reduced & contrast optimized."*
    - Checklist items **"Preparing OCR Engine"** and **"Enhancing Prescription Image"** tick with green checkmarks.
    - `[SFX: Subtle Soft Click / Checkmark Pop]`
  - **45% – 55%**:
    - Status: *"Initializing OCR Engine & text tokenization..."*
    - Checklist item **"Detecting Handwritten Text"** ticks off.
    - `[SFX: Soft Digital Hum / Futuristic Processing Audio]`
  - **60% – 88%**:
    - Status: *"Connecting to Gemini 3.8 Flash Multimodal Vision..."* $\rightarrow$ *"Analyzing handwriting & extracting clinical entities with Gemini..."*
    - The percentage ring smoothly and dynamically advances (65% $\rightarrow$ 75% $\rightarrow$ 85%), never freezing.
    - Checklist items **"Recognizing Medicine Names"**, **"Identifying Dosage and Frequency"**, and **"Verifying Medicine Information"** check off in real time!
    - `[SFX: Rapid Satisfying Checkmark Pops]`
  - **95% – 100%**:
    - Status: *"Validating clinical schema & dosage instructions..."* $\rightarrow$ *"Extraction complete!"*
    - Circular ring completes to **100%**.
    - Screen transitions into the **"Process Complete"** celebration checkmark.
    - `[SFX: High-Quality Uplifting Success Chime (AirDrop/Apple style)]`
- **Voiceover / Narration**:
  > *"Now watch the live extraction pipeline. Mediseena connects directly to Google Gemini 3.8 Flash Multimodal Vision with zero thinking delay. The system tokenizes layout, deciphers doctor handwriting, extracts medicine brand and generic names, and structures exact dosages — all in under four seconds."*

---

### Scene 6: Dual-Pane Review Workspace & Interactive Verification (1:40 – 2:08)
- **Visual**:
  - Automatically redirects into `/review` (Dual-Pane Review Workspace).
  - Left pane: The original prescription scan.
  - Right pane: Structured clinical fields (Patient details, Doctor credentials, Date, Child Medications table).
- **Camera Movement**:
  - `[CAMERA: Split zoom — punch in (1.4x) on the original prescription scan, then smooth horizontal pan to the extracted fields]`
- **Actions**:
  - **Inspect & Zoom**:
    - Cursor clicks the **"+" (Zoom In)** button above the image scan.
    - `[SFX: Quick Click]` Image zooms in to 150%, showing handwriting detail clearly.
    - Cursor clicks **"-" (Zoom Out)** back to 100%.
  - **Edit & Real-Time Correction Tracking**:
    - Cursor clicks into the **Dosage** field for the extracted medication (e.g., changes "250mg" to "500mg").
    - `[SFX: Rapid Mechanical Typing]`
    - `[CAMERA: Zoom in (1.5x) on the live Correction Counter badge]`
    - Notice the badge increments in real time: *"1 field change"*.
  - **Confirm Record**:
    - Cursor scrolls to the bottom of the form.
    - `[SFX: Tactile Click]` Click **"Confirm"** (turns into *"Confirmed"* with green checkmark).
    - Status toast appears: *"Prescription saved. Redirecting to records..."*
    - `[SFX: Success Chime]`
- **Voiceover / Narration**:
  > *"In the review workspace, healthcare professionals cross-examine every extracted field against the original scan using interactive zoom tools. Any modification is tracked in real-time correction logs for research accuracy metrics. Once verified, the prescription is committed to the database."*

---

### Scene 7: Updated Dashboard & Detail Inspection (2:08 – 2:24)
- **Visual**:
  - Lands back on `/dashboard`.
  - The patient's dashboard now proudly displays their newly digitized prescription in the table!
  - Columns show: Prescription Name (e.g., *Amoxicillin 500mg*), Date Issued, and status *"Saved"*.
- **Camera Movement**:
  - `[CAMERA: Zoom in (1.25x) on the newly added prescription row in the table]`
- **Actions**:
  - Cursor clicks into the search box.
  - `[SFX: Fast Typing]` Type *"Amox"*. The table filters dynamically in real time.
  - Clear the search box.
- **Voiceover / Narration**:
  > *"Instantly, your verified medication appears on your personal dashboard. Every record is stored with relational foreign keys, cascade safety, and strict user isolation."*

---

### Scene 8: Profile Persistence & AI Settings (2:24 – 2:42)
- **Visual**:
  - Navigate to y`/profile` via the sidebar.
  - Show the 8-field clinical profile (DOB, Address, Allergies, Blood Type, Conditions).
- **Camera Movement**:
  - `[CAMERA: Zoom in (1.3x) on the profile summary chips]`
- **Actions**:
  - Click **Edit Profile**.
  - `[SFX: Typing]` Change Blood Type to "O+" and Allergies to "Penicillin".
  - Click **Save Profile Changes** $\rightarrow$ Green success alert: *"Profile saved successfully."*
  - `[SFX: Soft Refresh / Page Reload (F5)]`
  - Reload the page: Notice the updated blood type "O+" and allergies "Penicillin" are **100% retained**!
  - Quickly click **Settings** in sidebar $\rightarrow$ Click **"Test Connection"** under AI & OCR Engine.
  - `[SFX: Ping Sound]` Badge confirms: *"Gemini 3.8 Flash · 2,663 ms"*.
- **Voiceover / Narration**:
  > *"Demographic and clinical profiles stay fully persistent across sessions. And under settings, you can benchmark live AI latency directly against Google Gemini 3.8 Flash."*

---

### Scene 9: Outro & Call to Action (2:42 – 2:50)
- **Visual**:
  - Smooth camera transition back to the Mediseena logo and team tagline.
  - Text overlay:
    - **Mediseena**
    - *Transforming Handwriting into Digital Clinical Certainty*
    - *Built by ITC C301-302I · José Rizal University*
- **Camera Movement**:
  - `[CAMERA: Slow pull-out to center wide shot, gentle fade to clean white]`
- **Voiceover / Narration**:
  > *"Mediseena: Transforming handwriting into digital clinical certainty. Try it today."*
  - `[SFX: Warm Outro Chime & Gentle Music Fade]`

---

## Sound Effects (SFX) Audio Asset Checklist

| SFX Tag | Description | Recommended Sound Type |
| :--- | :--- | :--- |
| `[SFX: Soft Click]` | Button / link clicks | Apple UI click or subtle mechanical mouse click |
| `[SFX: Rapid Typing]` | Form input typing | High-end mechanical keyboard (Gateron Ink Black / Thocky sound) |
| `[SFX: Paper Rustle]` | Prescription image drop | Gentle paper sliding onto desk or soft drag-drop whoosh |
| `[SFX: AI Hum]` | Processing loop | Modern low-pass digital data stream or tech ambience |
| `[SFX: Checkmark Pop]`| Checklist item check | Crisp bubble pop or gentle wooden marimba ping |
| `[SFX: Success Chime]`| Process Complete / Saved | Uplifting two-tone glass chime (similar to macOS AirDrop) |
| `[SFX: Whoosh]` | Page transitions / zooms | Subtle, fast cinematic air swoosh |

---

## Video Editing Tips (CapCut, Premiere Pro, DaVinci Resolve)

1. **Camera Zooms**:
   - Apply an **Ease In / Ease Out (Smooth Bezier)** curve to all camera zooms so the camera glides naturally into the textboxes and buttons.
   - Target zoom scale: **125% to 140%** for text fields; **150%** for the prescription handwriting crop.
2. **SFX Volume Balancing**:
   - **Background Music**: Set to `-22 dB` to `-26 dB` during voiceover so speech remains crystal clear.
   - **Keyboard Typing SFX**: Set to `-12 dB` (crisp, present, ASMR-like).
   - **Click SFX**: Set to `-10 dB`.
   - **Success Chime**: Set to `-6 dB` for maximum emotional payoff.
3. **Cursor Smoothing**:
   - Use a screen recorder like **Screen Studio**, **OBS Studio with Cursor Highlight**, or **Camtasia** to give the mouse pointer silky smooth interpolation between clicks.
