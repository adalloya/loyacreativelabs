-- ========================================================================
-- ARCO MAESTRO - AI WELDING (HERRERÍA RESIDENCIAL MÉRIDA)
-- SUPABASE DATABASE SCHEMA
-- ========================================================================

-- 1. EXTENSIONES Y ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE operator_name AS ENUM ('Adal', 'Marco');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CATÁLOGO COMERCIAL DE ACEROS (TRAMOS DE 6.00 METROS)
CREATE TABLE IF NOT EXISTS public.steel_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'PTR', 'Perfil Tubular', 'Solera', 'Ángulo', 'Redondo'
  designation TEXT NOT NULL, -- Ej. 'PTR 2x2" Cal 14'
  gauge INT, -- Calibre (10, 12, 14, 16, 18, 20)
  thickness_mm NUMERIC(5,2) NOT NULL,
  weight_kg_per_m NUMERIC(6,3) NOT NULL,
  standard_length_m NUMERIC(4,2) DEFAULT 6.00,
  last_price_mxn NUMERIC(10,2), -- Precio por tramo de 6m en Mérida
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COTIZACIONES Y PROYECTOS RESIDENCIALES
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  zone_merida TEXT, -- Ej. 'Cholul', 'Conkal', 'Temozón', 'Altabrisa'
  has_anticorrosive_primer BOOLEAN DEFAULT TRUE, -- Crítico por humedad en Yucatán
  materials_json JSONB NOT NULL, -- Desglose de tramos, kilos y desperdicio
  consumables_cost NUMERIC(10,2) NOT NULL, -- Electrodos, discos, pintura
  labor_cost NUMERIC(10,2) NOT NULL,
  margin_percent NUMERIC(5,2) DEFAULT 35.00,
  total_mxn NUMERIC(10,2) NOT NULL,
  created_by operator_name NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FINANZAS Y GASTOS (CAPEX Y OPERATIVOS 50/50)
CREATE TABLE IF NOT EXISTS public.expenses_capex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'Equipo_Inicial', 'Consumible', 'Material_Obra', 'Herramienta'
  vendor TEXT, -- Ej. 'Aceros Yucatecos', 'Boxito', 'Home Depot', 'Ferretería'
  description TEXT NOT NULL,
  amount_mxn NUMERIC(10,2) NOT NULL,
  receipt_url TEXT,
  paid_by operator_name NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE
);

-- 5. PROYECTOS ANALIZADOS POR GEMINI VISION
CREATE TABLE IF NOT EXISTS public.ai_structural_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_title TEXT NOT NULL,
  client_name TEXT DEFAULT 'Cliente Residencial Mérida',
  source_image_url TEXT,
  raw_gemini_analysis JSONB NOT NULL,
  estimated_weight_kg NUMERIC(8,2),
  estimated_steel_cost_mxn NUMERIC(10,2),
  estimated_total_price_mxn NUMERIC(10,2),
  created_by operator_name NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
ALTER TABLE public.steel_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses_capex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_structural_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for steel_catalog" ON public.steel_catalog FOR ALL USING (true);
    CREATE POLICY "Allow public read-write for quotes" ON public.quotes FOR ALL USING (true);
    CREATE POLICY "Allow public read-write for expenses_capex" ON public.expenses_capex FOR ALL USING (true);
    CREATE POLICY "Allow public read-write for ai_structural_projects" ON public.ai_structural_projects FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
