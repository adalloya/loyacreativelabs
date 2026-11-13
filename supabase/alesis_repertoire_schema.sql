-- ========================================================================
-- ALESIS SMART PIANO STUDIO - SUPABASE SCHEMA (PROYECTO: femjbpqeejfymdkuagti)
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.alesis_repertoire (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Ludwig van Beethoven',
    file TEXT NOT NULL,
    music_xml TEXT NOT NULL,
    sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alesis_repertoire ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public read access for alesis_repertoire"
        ON public.alesis_repertoire FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public insert/upsert access for alesis_repertoire"
        ON public.alesis_repertoire FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public update access for alesis_repertoire"
        ON public.alesis_repertoire FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
