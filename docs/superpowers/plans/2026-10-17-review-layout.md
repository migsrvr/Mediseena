# Review layout implementation

Coordinator owns `frontend/src/pages/ReviewExtraction.jsx`, review assets, the review interaction regression script, and these project notes. Supporting edits load Poppins weights 800/900 in `frontend/index.html` and scope the existing draft-ingestion regression to the page component now that the field component has its own effect. No workers or changes to existing OCR services, schema, or configuration.

1. Read Figma design context and screenshot; reuse existing tokens; fetch the back arrow and visible decoration locally.
2. Add focused failing tests for hidden required-field validation, duplicate confirmation, and retry after save failure.
3. Replace the review presentation with the approved responsive layout, dynamic preview, expandable details/tools, and Confirm. Preserve correction counting and draft ingestion. Keep newly created IDs for retries; prevent simultaneous or post-success saves. Release the lock on failure.
4. Run review interaction checks, existing OCR regressions, Windows-native Vite build, and browser visual/interaction checks if browser execution is available. Verify local asset geometry and absence of the review header.
5. Record actual results and remaining limitations here; do not claim live Supabase persistence was tested.

## Verification checkpoint

- Four focused confirmation tests cover hidden date validation, opening all invalid sections, simultaneous/post-success duplicate submission, and retry after verification failure without recreating the record. Tests first failed against the missing behaviors and then passed after implementation.
- All 16 existing OCR integration checks pass. The draft-ingestion check now selects the page's effect explicitly rather than the first effect anywhere in the source.
- Windows-native Vite production build passes. The existing bundle-size warning remains.
- A temporary Windows headless Chromium/CDP check passed at desktop (1440×1024), tablet (1024×768), and mobile (390×844). Checked dynamic preview, local SVG loads/geometry, no header or horizontal overflow, zoom/panning, fully readable long directions, medication add/remove, hidden-field focus, zero age, mocked save failure/retry, duplicate-save protection, records redirect, PDF fallback, malformed-draft empty state, and no uncaught browser exceptions.
- Visual screenshots inspected: `/tmp/mediseena-review-desktop.png`, `/tmp/mediseena-review-tablet.png`, and `/tmp/mediseena-review-mobile-form.png`. Browser verification harness: `/tmp/mediseena-review-browser.cjs`. These are local verification artifacts only; no patient data or live persistence was used.
- Hosted Supabase persistence still has the pre-existing limitations described in `docs/ocr-integration-report.md`. This change preserves the existing service and displays failures inline.
