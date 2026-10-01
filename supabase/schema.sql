-- ==============================================================================
-- MEDISEENA DATABASE SCHEMA (Supabase PostgreSQL)
-- Built for ITC C301-302I: Centralized Digital Platform for Structured Prescription Digitization
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER ROLES ENUM
CREATE TYPE user_role AS ENUM ('patient', 'pharmacist', 'admin');
CREATE TYPE prescription_status AS ENUM ('pending', 'verified', 'rejected');

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    license_number TEXT, -- For pharmacists/healthcare workers
    phone_number TEXT,
    organization TEXT, -- Clinic / Pharmacy / Hospital
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for profile updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to automatically create a public.profiles record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, license_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'patient'::public.user_role),
        NEW.raw_user_meta_data->>'license_number'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_age INT,
    patient_gender TEXT,
    patient_address TEXT,
    physician_name TEXT NOT NULL,
    physician_license TEXT,
    clinic_hospital TEXT,
    date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
    source_image_url TEXT NOT NULL,
    raw_ocr_text TEXT,
    ocr_confidence NUMERIC(5, 2) DEFAULT 0.00, -- e.g. 88.50%
    ai_confidence NUMERIC(5, 2) DEFAULT 0.00,
    processing_time_ms INT DEFAULT 0, -- In milliseconds
    verification_status prescription_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_prescriptions_modtime
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT NOT NULL,          -- e.g. "500 mg", "10 ml"
    frequency TEXT NOT NULL,       -- e.g. "Every 8 hours", "3x a day"
    duration TEXT,                 -- e.g. "7 days", "2 weeks"
    route TEXT DEFAULT 'Oral',     -- e.g. "Oral", "Topical", "Inhalation"
    instructions TEXT,             -- e.g. "Take with food"
    confidence_score NUMERIC(5,2) DEFAULT 90.00,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CORRECTION LOGS TABLE (For calculating OCR field accuracy and manual correction rate KPIs)
CREATE TABLE IF NOT EXISTS public.correction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,          -- e.g. "patient_name", "medication_name", "dosage"
    original_value TEXT,               -- Raw extracted value from OCR/Gemini
    corrected_value TEXT NOT NULL,     -- Value confirmed by pharmacist/patient
    reason TEXT,                       -- Optional reason for correction
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,              -- e.g. "PRESCRIPTION_UPLOAD", "OCR_EXTRACT", "PRESCRIPTION_VERIFY", "EXPORT_PDF"
    resource_type TEXT NOT NULL,       -- e.g. "prescriptions", "medications", "users"
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SYSTEM KPI METRICS TABLE (For snapshot tracking over Agile sprints)
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ocr_field_accuracy NUMERIC(5, 2) NOT NULL,    -- Target: >= 85%
    successful_digitization_rate NUMERIC(5, 2) NOT NULL, -- Target: >= 95%
    avg_processing_time_sec NUMERIC(5, 2) NOT NULL,       -- Target: <= 10.0s
    manual_correction_rate NUMERIC(5, 2) NOT NULL,        -- Target: <= 15%
    workflow_completion_rate NUMERIC(5, 2) NOT NULL,
    total_prescriptions_processed INT NOT NULL DEFAULT 0,
    total_fields_extracted INT NOT NULL DEFAULT 0,
    total_corrections_made INT NOT NULL DEFAULT 0
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can view their own profile; Pharmacists/Admins can view all profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.get_current_user_role() IN ('pharmacist', 'admin'));

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Prescriptions:
-- Patients see their own prescriptions.
-- Pharmacists & Admins see all prescriptions to review/verify.
CREATE POLICY "Prescription select policy"
    ON public.prescriptions FOR SELECT
    USING (
        auth.uid() = user_id OR
        public.get_current_user_role() IN ('pharmacist', 'admin')
    );

CREATE POLICY "Prescription insert policy"
    ON public.prescriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.get_current_user_role() IN ('pharmacist', 'admin'));

CREATE POLICY "Prescription update policy"
    ON public.prescriptions FOR UPDATE
    USING (
        auth.uid() = user_id OR
        public.get_current_user_role() IN ('pharmacist', 'admin')
    );

-- Medications:
CREATE POLICY "Medications select policy"
    ON public.medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = medications.prescription_id
            AND (p.user_id = auth.uid() OR public.get_current_user_role() IN ('pharmacist', 'admin'))
        )
    );

CREATE POLICY "Medications insert/update policy"
    ON public.medications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = medications.prescription_id
            AND (p.user_id = auth.uid() OR public.get_current_user_role() IN ('pharmacist', 'admin'))
        )
    );

-- Correction Logs:
CREATE POLICY "Correction logs viewable by authorized"
    ON public.correction_logs FOR SELECT
    USING (public.get_current_user_role() IN ('pharmacist', 'admin') OR auth.uid() = user_id);

CREATE POLICY "Correction logs insertable by verifiers"
    ON public.correction_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Audit Logs:
CREATE POLICY "Audit logs select policy"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Audit logs insert policy"
    ON public.audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- KPI Metrics:
CREATE POLICY "KPI metrics select policy"
    ON public.kpi_metrics FOR SELECT
    USING (TRUE);

-- 10. STORAGE BUCKET (prescriptions)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Prescription images access policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.get_current_user_role() IN ('pharmacist', 'admin')));

CREATE POLICY "Prescription images upload policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid() IS NOT NULL);
