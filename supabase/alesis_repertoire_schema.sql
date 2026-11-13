-- ============================================================================
-- ALESIS CLOUD STUDIO - SUPABASE SQL SETUP (PROYECTO: femjbpqeejfymdkuagti)
-- Ejecuta este script en: https://supabase.com/dashboard/project/femjbpqeejfymdkuagti/sql/new
-- ============================================================================

-- 1. Asegurar que la tabla public.songs exista y tenga las columnas para MusicXML
CREATE TABLE IF NOT EXISTS public.songs (
    id text primary key default gen_random_uuid()::text,
    title text not null,
    file_url text,
    xml_content text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Si la tabla public.songs ya existía en Loya Creative Lab, agregar las columnas nuevas sin perder datos:
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS xml_content text;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now());

-- Sincronizar registros existentes de Alesis para que tengan file_url y xml_content poblados
UPDATE public.songs
SET
  file_url = COALESCE(file_url, audio_url, 'songs/fur_elise.xml'),
  xml_content = COALESCE(xml_content, plain_lyrics)
WHERE album = 'Alesis Online Repertoire' AND (xml_content IS NULL OR file_url IS NULL);

-- 2. Habilitar Row Level Security (RLS) y política pública de lectura/escritura en public.songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Permitir lectura y escritura pública de partituras"
        ON public.songs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Crear automáticamente el Bucket 'sheet-music' como Público en Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('sheet-music', 'sheet-music', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Políticas RLS para permitir subir y leer archivos .xml en el bucket 'sheet-music'
DO $$ BEGIN
    CREATE POLICY "Permitir lectura pública en sheet-music"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'sheet-music');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir subida pública en sheet-music"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'sheet-music');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir actualización pública en sheet-music"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'sheet-music');
EXCEPTION WHEN duplicate_object THEN null; END $$;
