export interface AreaMaterialPrice {
  id: string;
  category: 'PTR' | 'TUBULAR_ZINTRO' | 'MONTEN' | 'SOLERA' | 'ANGULO' | 'LAMINA' | 'CONSUMIBLE';
  name: string;
  spec: string; // Ej. '6.00 m Cal. 14' o 'Kilo' o 'Pieza'
  unit: 'tramo_6m' | 'kilo' | 'pieza' | 'litro' | 'hoja';
  currentPriceMXN: number;
  lastUpdated: string;
  notes?: string;
}

export interface AreaHardwareStore {
  id: string;
  name: string;
  zone: string;
  prices: Record<string, number>; // id -> priceMXN
}

export const DEFAULT_AREA_PRICES: AreaMaterialPrice[] = [
  // --- PTR ESTRUCTURAL (Tramos 6.00m) ---
  {
    id: 'ptr-1x1-c14',
    category: 'PTR',
    name: 'PTR 1" x 1" Cal. 14',
    spec: 'Tramo 6.00m · 8.16 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 320,
    lastUpdated: '2026-10',
    notes: 'Uso ligero, barrotes y marcos chicos',
  },
  {
    id: 'ptr-1.5x1.5-c14',
    category: 'PTR',
    name: 'PTR 1 1/2" x 1 1/2" Cal. 14',
    spec: 'Tramo 6.00m · 12.66 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 480,
    lastUpdated: '2026-10',
    notes: 'Bastidores de portón y soportes',
  },
  {
    id: 'ptr-2x1-c14',
    category: 'PTR',
    name: 'PTR 2" x 1" Cal. 14 (Rectangular)',
    spec: 'Tramo 6.00m · 12.66 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 490,
    lastUpdated: '2026-10',
    notes: 'Largueros y marcos de celosía',
  },
  {
    id: 'ptr-2x2-c14',
    category: 'PTR',
    name: 'PTR 2" x 2" Cal. 14',
    spec: 'Tramo 6.00m · 17.16 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 640,
    lastUpdated: '2026-10',
    notes: 'Postes para techos chicos o mesas',
  },
  {
    id: 'ptr-2x2-c11',
    category: 'PTR',
    name: 'PTR 2" x 2" Cal. 11 (Cédula/Pesado)',
    spec: 'Tramo 6.00m · 26.76 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 990,
    lastUpdated: '2026-10',
    notes: 'Estructuras pesadas, postes resistentes',
  },
  {
    id: 'ptr-3x1.5-c14',
    category: 'PTR',
    name: 'PTR 3" x 1 1/2" Cal. 14',
    spec: 'Tramo 6.00m · 19.44 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 730,
    lastUpdated: '2026-10',
    notes: 'Vigas para claros de 3 a 4m',
  },
  {
    id: 'ptr-3x3-c14',
    category: 'PTR',
    name: 'PTR 3" x 3" Cal. 14',
    spec: 'Tramo 6.00m · 26.28 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 1150,
    lastUpdated: '2026-10',
    notes: 'Columnas principales para cocheras y terrazas',
  },
  {
    id: 'ptr-4x2-c14',
    category: 'PTR',
    name: 'PTR 4" x 2" Cal. 14',
    spec: 'Tramo 6.00m · 26.28 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 1080,
    lastUpdated: '2026-10',
    notes: 'Viga cargadora maestra para techos y claros de 4 a 6m',
  },
  {
    id: 'ptr-4x4-c14',
    category: 'PTR',
    name: 'PTR 4" x 4" Cal. 14',
    spec: 'Tramo 6.00m · 35.40 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 1520,
    lastUpdated: '2026-10',
    notes: 'Columnas maestras para claros grandes',
  },

  // --- POLÍN MONTÉN (Tramos 6.00m) ---
  {
    id: 'monten-3x1.5-c14',
    category: 'MONTEN',
    name: 'Polín Montén C 3" x 1 1/2" Cal. 14',
    spec: 'Tramo 6.00m · 11.20 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 510,
    lastUpdated: '2026-10',
    notes: 'Largueros para techos ligeros de lámina',
  },
  {
    id: 'monten-4x2-c14',
    category: 'MONTEN',
    name: 'Polín Montén C 4" x 2" Cal. 14 (Pintado)',
    spec: 'Tramo 6.00m · 14.80 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 680,
    lastUpdated: '2026-10',
    notes: 'El estándar de oro para largueros en techos residenciales',
  },
  {
    id: 'monten-5x2-c14',
    category: 'MONTEN',
    name: 'Polín Montén C 5" x 2" Cal. 14',
    spec: 'Tramo 6.00m · 18.50 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 840,
    lastUpdated: '2026-10',
    notes: 'Para claros de más de 4.5m entre apoyos',
  },

  // --- TUBULAR ZINTRO GALVANIZADO (Tramos 6.00m) ---
  {
    id: 'zintro-c100-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 1" x 1" (C-100) Cal. 18 Zintro',
    spec: 'Tramo 6.00m · 5.46 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 245,
    lastUpdated: '2026-10',
    notes: 'Resistente a salitre de Mérida',
  },
  {
    id: 'zintro-r150-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 1 1/2" x 1/2" (R-150 Duela) Cal. 18',
    spec: 'Tramo 6.00m · 5.46 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 250,
    lastUpdated: '2026-10',
    notes: 'Para louvers y duela de portones',
  },
  {
    id: 'zintro-r200-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 2" x 1" (R-200) Cal. 18 Zintro',
    spec: 'Tramo 6.00m · 8.34 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 360,
    lastUpdated: '2026-10',
    notes: 'Intermedios de portón y pérgolas decorativas',
  },
  {
    id: 'zintro-r300-c16',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 3" x 1 1/2" (R-300 Marco) Cal. 16 Zintro',
    spec: 'Tramo 6.00m · 15.78 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 630,
    lastUpdated: '2026-10',
    notes: 'Marco perimetral para portones residenciales',
  },

  // --- SOLERAS Y ÁNGULOS (Tramos 6.00m) ---
  {
    id: 'solera-1.5x3-16',
    category: 'SOLERA',
    name: 'Solera 1 1/2" x 3/16"',
    spec: 'Tramo 6.00m · 8.52 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 295,
    lastUpdated: '2026-10',
    notes: 'Placas de unión y soleras de remate',
  },
  {
    id: 'angulo-1.5x1-8',
    category: 'ANGULO',
    name: 'Ángulo 1 1/2" x 1/8"',
    spec: 'Tramo 6.00m · 7.38 kg',
    unit: 'tramo_6m',
    currentPriceMXN: 275,
    lastUpdated: '2026-10',
    notes: 'Soportes para montenes y anclajes a muro',
  },

  // --- CUBIERTAS DE TECHO ---
  {
    id: 'lamina-r101-galv',
    category: 'LAMINA',
    name: 'Lámina Galvanizada R-101 Cal. 26 (1.07m ancho útil)',
    spec: 'Metro lineal',
    unit: 'hoja',
    currentPriceMXN: 195,
    lastUpdated: '2026-10',
    notes: 'Techado económico y duradero',
  },
  {
    id: 'policarbonato-6mm',
    category: 'LAMINA',
    name: 'Policarbonato Celular 6mm Blanco Opal/Humo (2.10 x 5.80m)',
    spec: 'Hoja completa',
    unit: 'hoja',
    currentPriceMXN: 2350,
    lastUpdated: '2026-10',
    notes: 'Pérgolas residenciales con luz natural',
  },

  // --- CONSUMIBLES Y FIJACIÓN ---
  {
    id: 'electrodo-6013-3-32',
    category: 'CONSUMIBLE',
    name: 'Electrodo Infra E6013 3/32" (Punta Azul)',
    spec: 'Kilo (aprox. 52 varillas)',
    unit: 'kilo',
    currentPriceMXN: 98,
    lastUpdated: '2026-10',
    notes: 'Soldadura para calibres 14 a 18 en taller',
  },
  {
    id: 'electrodo-7018-1-8',
    category: 'CONSUMIBLE',
    name: 'Electrodo E7018 1/8" Bajo Hidrógeno',
    spec: 'Kilo (aprox. 28 varillas)',
    unit: 'kilo',
    currentPriceMXN: 135,
    lastUpdated: '2026-10',
    notes: 'Para placas base y cordones estructurales',
  },
  {
    id: 'disco-corte-4.5',
    category: 'CONSUMIBLE',
    name: 'Disco de Corte Fino 4 1/2" x 1mm (Austromex)',
    spec: 'Pieza',
    unit: 'pieza',
    currentPriceMXN: 28,
    lastUpdated: '2026-10',
    notes: 'Corte rápido sin calentar el material',
  },
  {
    id: 'disco-corte-14',
    category: 'CONSUMIBLE',
    name: 'Disco para Tronzadora 14" x 1/8"',
    spec: 'Pieza',
    unit: 'pieza',
    currentPriceMXN: 145,
    lastUpdated: '2026-10',
    notes: 'Para mesa de corte a 90° y 45°',
  },
  {
    id: 'tornillo-3-8x2.5',
    category: 'CONSUMIBLE',
    name: 'Tornillo Grado 5 3/8" x 2 1/2" con Tuerca y Rondanas',
    spec: 'Pieza galvanizada',
    unit: 'pieza',
    currentPriceMXN: 16,
    lastUpdated: '2026-10',
    notes: 'Para uniones desarmables y montaje en sitio',
  },
  {
    id: 'taquete-expansivo-3-8',
    category: 'CONSUMIBLE',
    name: 'Taquete Expansivo TX 3/8" x 3" (Anclaje Concreto)',
    spec: 'Pieza',
    unit: 'pieza',
    currentPriceMXN: 24,
    lastUpdated: '2026-10',
    notes: 'Anclaje a losas o zapatas de concreto en Mérida',
  },
  {
    id: 'pija-autoculante-monten',
    category: 'CONSUMIBLE',
    name: 'Pija Autoculante con Cabeza Hexagonal y Rondana de Neopreno 1/4" x 1"',
    spec: 'Ciento (100 piezas)',
    unit: 'pieza',
    currentPriceMXN: 120,
    lastUpdated: '2026-10',
    notes: 'Para fijar lámina a montén sin filtraciones',
  },
  {
    id: 'primario-anticorrosivo',
    category: 'CONSUMIBLE',
    name: 'Fondo Primario Alquidálico Anticorrosivo (Rojo Óxido o Gris)',
    spec: 'Litro',
    unit: 'litro',
    currentPriceMXN: 165,
    lastUpdated: '2026-10',
    notes: 'Crucial contra la humedad de Yucatán',
  },
  {
    id: 'esmalte-negro-mate',
    category: 'CONSUMIBLE',
    name: 'Esmalte Secado Rápido Negro Mate Industrial',
    spec: 'Litro',
    unit: 'litro',
    currentPriceMXN: 195,
    lastUpdated: '2026-10',
    notes: 'Acabado estético residencial',
  },
];

const LOCAL_STORAGE_PRICES_KEY = 'arco_maestro_local_prices_v2';

export function getAreaPrices(): AreaMaterialPrice[] {
  if (typeof window === 'undefined') return DEFAULT_AREA_PRICES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRICES_KEY);
    if (!raw) return DEFAULT_AREA_PRICES;
    const parsed = JSON.parse(raw) as AreaMaterialPrice[];
    // Combinar con los default para no perder materiales nuevos
    const idMap = new Map(parsed.map((p) => [p.id, p]));
    return DEFAULT_AREA_PRICES.map((def) => {
      const custom = idMap.get(def.id);
      return custom ? { ...def, currentPriceMXN: custom.currentPriceMXN, lastUpdated: custom.lastUpdated } : def;
    });
  } catch {
    return DEFAULT_AREA_PRICES;
  }
}

export function saveAreaPrice(id: string, newPriceMXN: number): AreaMaterialPrice[] {
  const current = getAreaPrices();
  const updated = current.map((item) =>
    item.id === id
      ? { ...item, currentPriceMXN: Math.max(0, newPriceMXN), lastUpdated: new Date().toISOString().slice(0, 10) }
      : item
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PRICES_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function resetAreaPrices(): AreaMaterialPrice[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_PRICES_KEY);
  }
  return DEFAULT_AREA_PRICES;
}

export function getMaterialPrice(materialId: string): number {
  const prices = getAreaPrices();
  const match = prices.find((p) => p.id === materialId);
  return match ? match.currentPriceMXN : 0;
}
