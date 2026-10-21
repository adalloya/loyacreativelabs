export type SteelCategory = 'PTR' | 'TUBULAR_ZINTRO' | 'SOLERA' | 'ANGULO' | 'REDONDO_MACIZO';

export interface SteelProfile {
  id: string;
  category: SteelCategory;
  name: string; // Nombre comercial en mostrador (ej. "PTR 2x2 Cal 14")
  profileCode?: string; // Código de perfil tubular (ej. "C-100", "R-150", "R-200", "R-300", "R-400")
  width_mm: number; // Lado A (mm)
  height_mm: number; // Lado B (mm) - 0 si es solera o redondo
  gauge?: number; // Calibre (10, 11, 12, 14, 16, 18, 20)
  thickness_mm: number; // Espesor real en mm
  weight_kg_per_m: number; // Peso teórico kg/m
  weight_per_6m: number; // Peso por tramo estándar de 6.00m
  isGalvanized: boolean; // Zintro / Galvanizado (recomendado en Mérida)
  defaultPricePer6m: number; // Precio estimado de referencia en Mérida (MXN con IVA)
}

// 1. TABLA OFICIAL DE CALIBRES PARA LÁMINA Y TUBULARES DE ACERO (ESTÁNDAR MÉXICO)
export const GAUGE_TO_MM: Record<number, { mm: number; inchesDecimal: number; recommendedAmps6013: string }> = {
  10: { mm: 3.42, inchesDecimal: 0.1345, recommendedAmps6013: '110A - 140A (Electrodo 1/8")' },
  11: { mm: 3.04, inchesDecimal: 0.1196, recommendedAmps6013: '95A - 125A (Electrodo 1/8")' },
  12: { mm: 2.66, inchesDecimal: 0.1046, recommendedAmps6013: '85A - 110A (Electrodo 1/8" o 3/32")' },
  14: { mm: 1.90, inchesDecimal: 0.0747, recommendedAmps6013: '70A - 85A (Electrodo 3/32")' },
  16: { mm: 1.52, inchesDecimal: 0.0598, recommendedAmps6013: '55A - 70A (Electrodo 3/32" - Punteo)' },
  18: { mm: 1.21, inchesDecimal: 0.0478, recommendedAmps6013: '45A - 60A (Electrodo 3/32" - Escama/Puntos)' },
  20: { mm: 0.91, inchesDecimal: 0.0359, recommendedAmps6013: '35A - 50A (Electrodo 3/32" o Microalambre)' },
};

// 2. EQUIVALENCIAS DE PULGADAS FRACCIONALES A MILÍMETROS
export const INCH_FRACTIONS_TO_MM: Array<{ fraction: string; decimalInch: number; mm: number }> = [
  { fraction: '1/8"', decimalInch: 0.125, mm: 3.175 },
  { fraction: '3/16"', decimalInch: 0.1875, mm: 4.762 },
  { fraction: '1/4"', decimalInch: 0.25, mm: 6.35 },
  { fraction: '5/16"', decimalInch: 0.3125, mm: 7.937 },
  { fraction: '3/8"', decimalInch: 0.375, mm: 9.525 },
  { fraction: '1/2"', decimalInch: 0.5, mm: 12.7 },
  { fraction: '5/8"', decimalInch: 0.625, mm: 15.875 },
  { fraction: '3/4"', decimalInch: 0.75, mm: 19.05 },
  { fraction: '7/8"', decimalInch: 0.875, mm: 22.225 },
  { fraction: '1"', decimalInch: 1.0, mm: 25.4 },
  { fraction: '1 1/4"', decimalInch: 1.25, mm: 31.75 },
  { fraction: '1 1/2"', decimalInch: 1.5, mm: 38.1 },
  { fraction: '2"', decimalInch: 2.0, mm: 50.8 },
  { fraction: '2 1/2"', decimalInch: 2.5, mm: 63.5 },
  { fraction: '3"', decimalInch: 3.0, mm: 76.2 },
  { fraction: '4"', decimalInch: 4.0, mm: 101.6 },
];

// 3. FÓRMULAS FÍSICAS DE PESO (Densidad del acero al carbón = 7.85 g/cm³)
export const STEEL_DENSITY = 7.85;

export function calculateHollowRectangularWeightPerMeter(
  width_mm: number,
  height_mm: number,
  thickness_mm: number
): number {
  // Fórmula de sección hueca considerando espesor constante: 2 * (A + B - 2e) * e * 7.85 / 1000
  const area_mm2 = 2 * (width_mm + height_mm - 2 * thickness_mm) * thickness_mm;
  return Number(((area_mm2 * STEEL_DENSITY) / 1000).toFixed(3));
}

export function calculateFlatBarWeightPerMeter(width_mm: number, thickness_mm: number): number {
  // Solera o Placa: Ancho(mm) * Espesor(mm) * 7.85 / 1000
  return Number(((width_mm * thickness_mm * STEEL_DENSITY) / 1000).toFixed(3));
}

export function calculateSolidRoundWeightPerMeter(diameter_mm: number): number {
  // Redondo macizo: pi * (d/2)^2 * 7.85 / 1000
  const radius = diameter_mm / 2;
  const area_mm2 = Math.PI * radius * radius;
  return Number(((area_mm2 * STEEL_DENSITY) / 1000).toFixed(3));
}

// 4. FÓRMULAS DE TALLER: CUADRATURA Y CORTES A 45 GRADOS
export function calculateFrameDiagonal(width_m: number, height_m: number): {
  diagonal_m: number;
  diagonal_cm: number;
  diagonal_mm: number;
} {
  const diag = Math.sqrt(Math.pow(width_m, 2) + Math.pow(height_m, 2));
  return {
    diagonal_m: Number(diag.toFixed(4)),
    diagonal_cm: Number((diag * 100).toFixed(2)),
    diagonal_mm: Math.round(diag * 1000),
  };
}

export function calculateMiter45InnerLength(outerLength_mm: number, profileFaceWidth_mm: number): {
  outerLength_mm: number;
  innerLength_mm: number;
  deductionEachSide_mm: number;
} {
  // En un corte a 45° exacto en ambos extremos, la medida interior es Medida Exterior - (2 * Ancho del Perfil)
  return {
    outerLength_mm,
    innerLength_mm: Number((outerLength_mm - 2 * profileFaceWidth_mm).toFixed(1)),
    deductionEachSide_mm: profileFaceWidth_mm,
  };
}

// 5. CATÁLOGO BASE DE ACEROS COMERCIALES (MÉXICO / MÉRIDA)
export const INITIAL_STEEL_CATALOG: SteelProfile[] = [
  // PTR Estructural
  {
    id: 'ptr-1x1-c14',
    category: 'PTR',
    name: 'PTR 1" x 1" Cal. 14 (Negro)',
    width_mm: 25.4,
    height_mm: 25.4,
    gauge: 14,
    thickness_mm: 1.90,
    weight_kg_per_m: 1.36,
    weight_per_6m: 8.16,
    isGalvanized: false,
    defaultPricePer6m: 310,
  },
  {
    id: 'ptr-1.5x1.5-c14',
    category: 'PTR',
    name: 'PTR 1 1/2" x 1 1/2" Cal. 14 (Negro)',
    width_mm: 38.1,
    height_mm: 38.1,
    gauge: 14,
    thickness_mm: 1.90,
    weight_kg_per_m: 2.11,
    weight_per_6m: 12.66,
    isGalvanized: false,
    defaultPricePer6m: 465,
  },
  {
    id: 'ptr-2x2-c14',
    category: 'PTR',
    name: 'PTR 2" x 2" Cal. 14 (Negro)',
    width_mm: 50.8,
    height_mm: 50.8,
    gauge: 14,
    thickness_mm: 1.90,
    weight_kg_per_m: 2.86,
    weight_per_6m: 17.16,
    isGalvanized: false,
    defaultPricePer6m: 620,
  },
  {
    id: 'ptr-2x2-c11',
    category: 'PTR',
    name: 'PTR 2" x 2" Cal. 11 (Pesado Mesa/Poste)',
    width_mm: 50.8,
    height_mm: 50.8,
    gauge: 11,
    thickness_mm: 3.04,
    weight_kg_per_m: 4.46,
    weight_per_6m: 26.76,
    isGalvanized: false,
    defaultPricePer6m: 980,
  },
  {
    id: 'ptr-3x1.5-c14',
    category: 'PTR',
    name: 'PTR 3" x 1 1/2" Cal. 14 (Rectangular)',
    width_mm: 76.2,
    height_mm: 38.1,
    gauge: 14,
    thickness_mm: 1.90,
    weight_kg_per_m: 3.24,
    weight_per_6m: 19.44,
    isGalvanized: false,
    defaultPricePer6m: 710,
  },
  {
    id: 'ptr-4x2-c14',
    category: 'PTR',
    name: 'PTR 4" x 2" Cal. 14 (Viga Pérgola / Marco)',
    width_mm: 101.6,
    height_mm: 50.8,
    gauge: 14,
    thickness_mm: 1.90,
    weight_kg_per_m: 4.38,
    weight_per_6m: 26.28,
    isGalvanized: false,
    defaultPricePer6m: 960,
  },
  // Perfiles Tubulares Zintro / Galvanizados (Mérida)
  {
    id: 'zintro-p100-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 1" x 1" (C-100) Cal. 18 Zintro',
    profileCode: 'C-100',
    width_mm: 25.4,
    height_mm: 25.4,
    gauge: 18,
    thickness_mm: 1.21,
    weight_kg_per_m: 0.91,
    weight_per_6m: 5.46,
    isGalvanized: true,
    defaultPricePer6m: 235,
  },
  {
    id: 'zintro-r150-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 1 1/2" x 1/2" (Duela/Louvers) Cal. 18 Zintro',
    profileCode: 'R-150',
    width_mm: 38.1,
    height_mm: 12.7,
    gauge: 18,
    thickness_mm: 1.21,
    weight_kg_per_m: 0.91,
    weight_per_6m: 5.46,
    isGalvanized: true,
    defaultPricePer6m: 240,
  },
  {
    id: 'zintro-r200-c18',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 2" x 1" (R-200) Cal. 18 Zintro',
    profileCode: 'R-200',
    width_mm: 50.8,
    height_mm: 25.4,
    gauge: 18,
    thickness_mm: 1.21,
    weight_kg_per_m: 1.39,
    weight_per_6m: 8.34,
    isGalvanized: true,
    defaultPricePer6m: 345,
  },
  {
    id: 'zintro-r300-c16',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 3" x 1 1/2" (R-300) Cal. 16 Zintro (Marco Portón)',
    profileCode: 'R-300',
    width_mm: 76.2,
    height_mm: 38.1,
    gauge: 16,
    thickness_mm: 1.52,
    weight_kg_per_m: 2.63,
    weight_per_6m: 15.78,
    isGalvanized: true,
    defaultPricePer6m: 615,
  },
  {
    id: 'zintro-r400-c16',
    category: 'TUBULAR_ZINTRO',
    name: 'Tubular 4" x 1 1/2" (R-400) Cal. 16 Zintro',
    profileCode: 'R-400',
    width_mm: 101.6,
    height_mm: 38.1,
    gauge: 16,
    thickness_mm: 1.52,
    weight_kg_per_m: 3.24,
    weight_per_6m: 19.44,
    isGalvanized: true,
    defaultPricePer6m: 760,
  },
  // Soleras y Ángulos
  {
    id: 'solera-1x1-8',
    category: 'SOLERA',
    name: 'Solera 1" x 1/8" (25.4mm x 3.17mm)',
    width_mm: 25.4,
    height_mm: 0,
    thickness_mm: 3.175,
    weight_kg_per_m: 0.63,
    weight_per_6m: 3.78,
    isGalvanized: false,
    defaultPricePer6m: 145,
  },
  {
    id: 'solera-1.5x3-16',
    category: 'SOLERA',
    name: 'Solera 1 1/2" x 3/16" (Placas de Anclaje a Muro)',
    width_mm: 38.1,
    height_mm: 0,
    thickness_mm: 4.762,
    weight_kg_per_m: 1.42,
    weight_per_6m: 8.52,
    isGalvanized: false,
    defaultPricePer6m: 315,
  },
  {
    id: 'angulo-1x1-8',
    category: 'ANGULO',
    name: 'Ángulo 1" x 1" x 1/8"',
    width_mm: 25.4,
    height_mm: 25.4,
    thickness_mm: 3.175,
    weight_kg_per_m: 1.19,
    weight_per_6m: 7.14,
    isGalvanized: false,
    defaultPricePer6m: 265,
  },
];

// 6. ALGORITMO DE OPTIMIZACIÓN DE CORTE 1D (FIRST-FIT DECREASING BIN PACKING)
export interface CutRequestItem {
  id: string;
  label: string; // Ej. "Poste vertical izquierdo", "Barrote central"
  length_m: number; // Largo requerido en metros (ej. 2.15)
  quantity: number; // Número de piezas iguales
}

export interface StockBarAllocation {
  barNumber: number;
  cuts: Array<{ label: string; length_m: number }>;
  usedLength_m: number;
  kerfLoss_m: number;
  waste_m: number;
  efficiencyPercent: number;
}

export interface CutOptimizationResult {
  stockLength_m: number;
  totalBarsNeeded: number;
  totalLinearMetersCut: number;
  totalWasteMeters: number;
  overallEfficiencyPercent: number;
  bars: StockBarAllocation[];
  oversizedPieces: Array<{ label: string; length_m: number }>;
}

export function optimizeLinearCuts1D(
  requests: CutRequestItem[],
  stockLength_m: number = 6.0,
  kerf_mm: number = 3.0 // Espesor estándar de disco de corte tronzadora / esmeril
): CutOptimizationResult {
  const kerf_m = kerf_mm / 1000;
  const individualPieces: Array<{ label: string; length_m: number }> = [];
  const oversizedPieces: Array<{ label: string; length_m: number }> = [];

  requests.forEach((req) => {
    if (req.length_m <= 0 || req.quantity <= 0) return;
    for (let i = 0; i < req.quantity; i++) {
      if (req.length_m > stockLength_m) {
        oversizedPieces.push({ label: req.label, length_m: req.length_m });
      } else {
        individualPieces.push({ label: req.label, length_m: Number(req.length_m.toFixed(3)) });
      }
    }
  });

  // Ordenar de mayor a menor longitud (First-Fit Decreasing)
  individualPieces.sort((a, b) => b.length_m - a.length_m);

  const bars: StockBarAllocation[] = [];

  for (const piece of individualPieces) {
    let placed = false;
    for (const bar of bars) {
      // Si ya hay piezas en la barra, cada corte nuevo consume el espesor del disco (kerf)
      const currentTotal = bar.usedLength_m + bar.kerfLoss_m;
      const requiredSpace = piece.length_m + (bar.cuts.length > 0 ? kerf_m : 0);

      if (currentTotal + requiredSpace <= stockLength_m + 0.0001) {
        bar.cuts.push(piece);
        bar.usedLength_m = Number((bar.usedLength_m + piece.length_m).toFixed(3));
        bar.kerfLoss_m = Number((bar.cuts.length * kerf_m).toFixed(3));
        bar.waste_m = Number(Math.max(0, stockLength_m - bar.usedLength_m - bar.kerfLoss_m).toFixed(3));
        bar.efficiencyPercent = Number(((bar.usedLength_m / stockLength_m) * 100).toFixed(1));
        placed = true;
        break;
      }
    }

    if (!placed) {
      const initialKerf = piece.length_m < stockLength_m ? kerf_m : 0;
      const waste = Math.max(0, stockLength_m - piece.length_m - initialKerf);
      bars.push({
        barNumber: bars.length + 1,
        cuts: [piece],
        usedLength_m: piece.length_m,
        kerfLoss_m: Number(initialKerf.toFixed(3)),
        waste_m: Number(waste.toFixed(3)),
        efficiencyPercent: Number(((piece.length_m / stockLength_m) * 100).toFixed(1)),
      });
    }
  }

  const totalBarsNeeded = bars.length;
  const totalLinearMetersCut = Number(
    bars.reduce((acc, b) => acc + b.usedLength_m, 0).toFixed(2)
  );
  const totalWasteMeters = Number(
    bars.reduce((acc, b) => acc + b.waste_m, 0).toFixed(2)
  );
  const overallEfficiencyPercent = totalBarsNeeded > 0
    ? Number(((totalLinearMetersCut / (totalBarsNeeded * stockLength_m)) * 100).toFixed(1))
    : 0;

  return {
    stockLength_m,
    totalBarsNeeded,
    totalLinearMetersCut,
    totalWasteMeters,
    overallEfficiencyPercent,
    bars,
    oversizedPieces,
  };
}

// 7. MOTOR DE COTIZACIÓN RESIDENCIAL CON PROTECCIÓN ANTICORROSIVA (ESPECIFICACIÓN MÉRIDA)
export interface QuoteBreakdown {
  steelCostMXN: number;
  totalWeightKg: number;
  consumables: {
    electrodesKg: number;
    cuttingDiscs4_5: number;
    flapDiscs: number;
    anticorrosivePrimerLiters: number;
    topCoatEnamelLiters: number;
    polyurethaneSealantTubes: number;
    consumablesTotalMXN: number;
  };
  directCostSubtotalMXN: number;
  laborCostMXN: number;
  installationAndFreightMXN: number;
  profitAmountMXN: number;
  finalClientPriceMXN: number;
  ivaAmountMXN: number;
  finalClientPriceWithIvaMXN: number;
}

export function calculateMeridaProjectQuote(params: {
  totalBars6m: number;
  pricePerBar6m: number;
  weightPerBar6m: number;
  totalCutsCount: number;
  includeMeridaAnticorrosiveSpec: boolean;
  estimatedWorkshopDays: number;
  dailyCrewCostMXN: number;
  freightAndInstallMXN: number;
  marginPercent: number;
}): QuoteBreakdown {
  const steelCostMXN = params.totalBars6m * params.pricePerBar6m;
  const totalWeightKg = Number((params.totalBars6m * params.weightPerBar6m).toFixed(2));

  // Consumibles según reglas de taller
  const electrodesKg = Number(Math.max(0.5, params.totalBars6m * 0.35).toFixed(1));
  const cuttingDiscs4_5 = Math.max(2, Math.ceil(params.totalCutsCount / 18));
  const flapDiscs = Math.max(1, Math.ceil(params.totalBars6m / 3));

  const anticorrosivePrimerLiters = params.includeMeridaAnticorrosiveSpec
    ? Number(Math.max(1, params.totalBars6m * 0.45).toFixed(1))
    : Number(Math.max(0.5, params.totalBars6m * 0.25).toFixed(1));

  const topCoatEnamelLiters = Number(Math.max(1, params.totalBars6m * 0.45).toFixed(1));
  const polyurethaneSealantTubes = params.includeMeridaAnticorrosiveSpec
    ? Math.max(1, Math.ceil(params.totalBars6m / 4))
    : 0;

  const consumablesTotalMXN = Math.round(
    electrodesKg * 95 +
    cuttingDiscs4_5 * 28 +
    flapDiscs * 65 +
    anticorrosivePrimerLiters * 240 +
    topCoatEnamelLiters * 290 +
    polyurethaneSealantTubes * 165
  );

  const directCostSubtotalMXN = steelCostMXN + consumablesTotalMXN;
  const laborCostMXN = params.estimatedWorkshopDays * params.dailyCrewCostMXN;
  const baseCost = directCostSubtotalMXN + laborCostMXN + params.freightAndInstallMXN;
  const profitAmountMXN = Math.round(baseCost * (params.marginPercent / 100));
  const finalClientPriceMXN = Math.round(baseCost + profitAmountMXN);
  const ivaAmountMXN = Math.round(finalClientPriceMXN * 0.16);
  const finalClientPriceWithIvaMXN = finalClientPriceMXN + ivaAmountMXN;

  return {
    steelCostMXN,
    totalWeightKg,
    consumables: {
      electrodesKg,
      cuttingDiscs4_5,
      flapDiscs,
      anticorrosivePrimerLiters,
      topCoatEnamelLiters,
      polyurethaneSealantTubes,
      consumablesTotalMXN,
    },
    directCostSubtotalMXN,
    laborCostMXN,
    installationAndFreightMXN: params.freightAndInstallMXN,
    profitAmountMXN,
    finalClientPriceMXN,
    ivaAmountMXN,
    finalClientPriceWithIvaMXN,
  };
}
