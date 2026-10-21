export type OperatorName = 'Adal' | 'Marco';

export interface SteelCatalogItem {
  id: string;
  category: 'PTR' | 'Perfil Tubular' | 'Solera' | 'Ángulo' | 'Redondo' | string;
  designation: string;
  gauge?: number;
  thickness_mm: number;
  weight_kg_per_m: number;
  standard_length_m: number;
  last_price_mxn?: number;
  updated_at?: string;
}

export interface QuoteRecord {
  id: string;
  client_name: string;
  zone_merida?: string;
  has_anticorrosive_primer: boolean;
  materials_json: any;
  consumables_cost: number;
  labor_cost: number;
  margin_percent: number;
  total_mxn: number;
  created_by: OperatorName;
  created_at?: string;
}

export interface ExpenseCapexRecord {
  id: string;
  item_type: 'Equipo_Inicial' | 'Consumible' | 'Material_Obra' | 'Herramienta' | string;
  vendor?: string;
  description: string;
  amount_mxn: number;
  receipt_url?: string;
  paid_by: OperatorName;
  expense_date: string;
}

export interface AIStructuralProjectRecord {
  id: string;
  project_title: string;
  client_name?: string;
  source_image_url?: string;
  raw_gemini_analysis: any;
  estimated_weight_kg?: number;
  estimated_steel_cost_mxn?: number;
  estimated_total_price_mxn?: number;
  created_by: OperatorName;
  created_at?: string;
}
