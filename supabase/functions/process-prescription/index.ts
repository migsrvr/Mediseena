// ==============================================================================
// MEDISEENA SUPABASE EDGE FUNCTION: process-prescription
// TypeScript Server-Side API for Secure Gemini Vision & NER Field Extraction
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProcessRequest {
  imageBase64?: string;
  mimeType?: string;
  ocrText?: string;
  ocrConfidence?: number;
  fileName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { imageBase64, mimeType = "image/jpeg", ocrText = "", ocrConfidence = 0 }: ProcessRequest = await req.json();

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured in Supabase Edge Function secrets.",
          fallback: true,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `
You are Mediseena's Clinical Prescription Information Extractor.
Your task is to analyze the provided prescription image (and optional OCR text) and extract all critical medical prescription fields into a clean, structured JSON object.

Extract with extreme medical precision:
1. Patient Details: Full Name, Age, Gender, Address
2. Physician Details: Full Name (Dr. ...), License Number / PTR, Clinic/Hospital Name, Contact Info
3. Prescription Meta: Date Issued (YYYY-MM-DD), Diagnosis / Clinical Notes
4. Medications (array):
   - medication_name (brand / generic)
   - dosage (e.g., 500mg, 10ml, 1 puff)
   - frequency (e.g., 3x daily, every 8 hours, BID, TID, as needed)
   - duration (e.g., 7 days, 14 days, 1 month)
   - route (e.g., Oral, Topical, Inhalation, Ophthalmic)
   - instructions (e.g., Take after meals, with a full glass of water)
   - confidence_score (number 0-100 indicating extraction confidence)
   - flag_warning (string or null if handwriting is ambiguous or needs manual pharmacist review)

Return ONLY valid JSON in this schema:
{
  "patient": {
    "name": "string",
    "age": "number or null",
    "gender": "string or null",
    "address": "string or null",
    "confidence": 92
  },
  "physician": {
    "name": "string",
    "license": "string or null",
    "clinic": "string or null",
    "confidence": 90
  },
  "prescription": {
    "date_issued": "YYYY-MM-DD",
    "notes": "string or null"
  },
  "medications": [
    {
      "medication_name": "string",
      "generic_name": "string or null",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "route": "string",
      "instructions": "string",
      "confidence_score": 88,
      "flag_warning": null
    }
  ],
  "overall_confidence": 90.5
}
`;

    // Gemini 1.5 Flash / Gemini 2.0 Flash endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            ...(ocrText ? [{ text: `Initial Tesseract.js OCR raw text:\n"""${ocrText}"""` }] : []),
            ...(imageBase64 ? [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
                }
              }
            ] : [])
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const structuredResult = JSON.parse(candidateText);

    const processingTimeMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: structuredResult,
        processing_time_ms: processingTimeMs,
        tesseract_ocr_confidence: ocrConfidence,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        processing_time_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
