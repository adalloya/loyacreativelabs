import { getAreaPrices, getMaterialPrice } from './local-prices';

export type StructureType = 'ROOF_PERGOLA' | 'GATE_FRAME' | 'WORK_TABLE';
export type JointType = 'WELD' | 'BOLT';
export type SteelFinish = 'BLACK_MATTE' | 'RAW_STEEL' | 'GALVANIZED_ZINTRO' | 'RED_OXIDE';
export type RoofCoverType = 'NONE' | 'LAMINA_R101' | 'POLICARBONATO' | 'TRASLUCIDA';

export interface StructuralMember {
  id: string;
  name: string; // ej. 'Poste A1', 'Viga Maestra Frontal', 'Larguero 1'
  role: 'POST' | 'BEAM' | 'PURLIN' | 'FRAME' | 'INFILL' | 'BRACE';
  materialId: string;
  length_m: number;
  start: [number, number, number]; // [x, y, z] en metros
  end: [number, number, number];
  jointType: JointType;
  cutAngleStart: 90 | 45;
  cutAngleEnd: 90 | 45;
}

export interface RoofParams {
  width_m: number; // Ancho frente (eje X)
  length_m: number; // Largo/fondo (eje Z)
  heightFront_m: number; // Altura frente (eje Y)
  heightBack_m: number; // Altura atrás (eje Y)
  postCountX: number; // Postes al frente (2, 3 o 4)
  postCountZ: number; // Postes en profundidad (2, 3 o 4)
  purlinCount: number; // Número de largueros/montenes
  postMaterialId: string; // ej. 'ptr-3x3-c14'
  beamMaterialId: string; // ej. 'ptr-4x2-c14'
  purlinMaterialId: string; // ej. 'monten-4x2-c14'
  jointType: JointType;
  coverType: RoofCoverType;
  finish: SteelFinish;
}

export interface GateParams {
  width_m: number;
  height_m: number;
  frameMaterialId: string; // ej. 'zintro-r300-c16'
  horizontalDividers: number;
  verticalDividers: number;
  infillType: 'LOUVERS' | 'TUBULAR_BARS' | 'EMPTY';
  infillMaterialId: string; // ej. 'zintro-r150-c18'
  jointType: JointType;
  finish: SteelFinish;
}

export interface WorkTableParams {
  length_m: number;
  width_m: number;
  height_m: number;
  legMaterialId: string; // ej. 'ptr-2x2-c11'
  frameMaterialId: string; // ej. 'ptr-2x2-c14'
  hasLowerShelf: boolean;
  jointType: JointType;
  finish: SteelFinish;
}

// 1. GENERADOR DE ELEMENTOS PARA TECHO / PÉRGOLA
export function generateRoofMembers(params: RoofParams): {
  members: StructuralMember[];
  slopePercent: number;
  slopeDegrees: number;
} {
  const members: StructuralMember[] = [];
  const {
    width_m,
    length_m,
    heightFront_m,
    heightBack_m,
    postCountX,
    postCountZ,
    purlinCount,
    postMaterialId,
    beamMaterialId,
    purlinMaterialId,
    jointType,
  } = params;

  // Pendiente y caída de agua
  const heightDiff = heightFront_m - heightBack_m;
  const slopePercent = length_m > 0 ? (Math.abs(heightDiff) / length_m) * 100 : 0;
  const slopeDegrees = (Math.atan(Math.abs(heightDiff) / (length_m || 1)) * 180) / Math.PI;

  // A. POSTES (Columnas)
  const stepX = postCountX > 1 ? width_m / (postCountX - 1) : 0;
  const stepZ = postCountZ > 1 ? length_m / (postCountZ - 1) : 0;

  let postIdx = 1;
  for (let ix = 0; ix < postCountX; ix++) {
    const x = -width_m / 2 + ix * stepX;
    for (let iz = 0; iz < postCountZ; iz++) {
      const z = -length_m / 2 + iz * stepZ;
      // Interpolar altura entre z=0 (atrás) y z=length (frente)
      // Definimos z negativo = atrás (heightBack), z positivo = frente (heightFront)
      const t = length_m > 0 ? (z + length_m / 2) / length_m : 0;
      const h = heightBack_m + t * (heightFront_m - heightBack_m);

      members.push({
        id: `post-${ix}-${iz}`,
        name: `Poste Columna ${postIdx++}`,
        role: 'POST',
        materialId: postMaterialId,
        length_m: Number(h.toFixed(3)),
        start: [x, 0, z],
        end: [x, h, z],
        jointType: jointType,
        cutAngleStart: 90,
        cutAngleEnd: 90,
      });
    }
  }

  // B. VIGAS MAESTRAS (Cargadoras transversales frontales y traseras)
  members.push({
    id: 'beam-front',
    name: 'Viga Maestra Frontal',
    role: 'BEAM',
    materialId: beamMaterialId,
    length_m: width_m,
    start: [-width_m / 2, heightFront_m, length_m / 2],
    end: [width_m / 2, heightFront_m, length_m / 2],
    jointType: jointType,
    cutAngleStart: 90,
    cutAngleEnd: 90,
  });

  members.push({
    id: 'beam-back',
    name: 'Viga Maestra Trasera',
    role: 'BEAM',
    materialId: beamMaterialId,
    length_m: width_m,
    start: [-width_m / 2, heightBack_m, -length_m / 2],
    end: [width_m / 2, heightBack_m, -length_m / 2],
    jointType: jointType,
    cutAngleStart: 90,
    cutAngleEnd: 90,
  });

  // Si hay más de 2 postes en Z, agregar vigas intermedias
  if (postCountZ > 2) {
    for (let iz = 1; iz < postCountZ - 1; iz++) {
      const z = -length_m / 2 + iz * stepZ;
      const t = (z + length_m / 2) / length_m;
      const h = heightBack_m + t * (heightFront_m - heightBack_m);
      members.push({
        id: `beam-mid-${iz}`,
        name: `Viga Maestra Intermedia ${iz}`,
        role: 'BEAM',
        materialId: beamMaterialId,
        length_m: width_m,
        start: [-width_m / 2, h, z],
        end: [width_m / 2, h, z],
        jointType: jointType,
        cutAngleStart: 90,
        cutAngleEnd: 90,
      });
    }
  }

  // C. LARGUEROS / MONTENES (Van en dirección Z con la caída de agua)
  const rafterLength = Math.sqrt(Math.pow(length_m, 2) + Math.pow(heightDiff, 2));
  const purlinStepX = purlinCount > 1 ? width_m / (purlinCount - 1) : 0;

  for (let ip = 0; ip < purlinCount; ip++) {
    const px = -width_m / 2 + ip * purlinStepX;
    members.push({
      id: `purlin-${ip + 1}`,
      name: `Montén/Larguero ${ip + 1}`,
      role: 'PURLIN',
      materialId: purlinMaterialId,
      length_m: Number(rafterLength.toFixed(3)),
      start: [px, heightBack_m, -length_m / 2],
      end: [px, heightFront_m, length_m / 2],
      jointType: jointType,
      cutAngleStart: 90,
      cutAngleEnd: 90,
    });
  }

  return {
    members,
    slopePercent: Number(slopePercent.toFixed(1)),
    slopeDegrees: Number(slopeDegrees.toFixed(1)),
  };
}

// 2. GENERADOR DE ELEMENTOS PARA PORTÓN RESIDENCIAL
export function generateGateMembers(params: GateParams): StructuralMember[] {
  const members: StructuralMember[] = [];
  const {
    width_m,
    height_m,
    frameMaterialId,
    horizontalDividers,
    verticalDividers,
    infillType,
    infillMaterialId,
    jointType,
  } = params;

  // Marco perimetral a 45°
  // Poste izquierdo
  members.push({
    id: 'gate-post-left',
    name: 'Marco Lateral Izquierdo',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: height_m,
    start: [-width_m / 2, 0, 0],
    end: [-width_m / 2, height_m, 0],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });

  // Poste derecho
  members.push({
    id: 'gate-post-right',
    name: 'Marco Lateral Derecho',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: height_m,
    start: [width_m / 2, 0, 0],
    end: [width_m / 2, height_m, 0],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });

  // Travesaño superior
  members.push({
    id: 'gate-beam-top',
    name: 'Marco Travesaño Superior',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: width_m,
    start: [-width_m / 2, height_m, 0],
    end: [width_m / 2, height_m, 0],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });

  // Travesaño inferior
  members.push({
    id: 'gate-beam-bottom',
    name: 'Marco Travesaño Inferior',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: width_m,
    start: [-width_m / 2, 0, 0],
    end: [width_m / 2, 0, 0],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });

  // Travesaños horizontales intermedios
  if (horizontalDividers > 0) {
    const stepY = height_m / (horizontalDividers + 1);
    for (let i = 1; i <= horizontalDividers; i++) {
      const y = i * stepY;
      members.push({
        id: `gate-h-div-${i}`,
        name: `Refuerzo Horizontal ${i}`,
        role: 'BRACE',
        materialId: frameMaterialId,
        length_m: width_m - 0.1, // holgura interna de marco
        start: [-width_m / 2 + 0.05, y, 0],
        end: [width_m / 2 - 0.05, y, 0],
        jointType: jointType,
        cutAngleStart: 90,
        cutAngleEnd: 90,
      });
    }
  }

  // Relleno de Louvers / Duelas horizontales
  if (infillType === 'LOUVERS') {
    const louverSpacing = 0.12; // cada 12 cm
    const count = Math.floor(height_m / louverSpacing) - 1;
    for (let i = 1; i <= count; i++) {
      const y = i * louverSpacing;
      members.push({
        id: `louver-${i}`,
        name: `Duela Louver ${i}`,
        role: 'INFILL',
        materialId: infillMaterialId,
        length_m: width_m - 0.08,
        start: [-width_m / 2 + 0.04, y, 0],
        end: [width_m / 2 - 0.04, y, 0],
        jointType: jointType,
        cutAngleStart: 90,
        cutAngleEnd: 90,
      });
    }
  }

  return members;
}

// 3. GENERADOR DE MESA DE TALLER
export function generateWorkTableMembers(params: WorkTableParams): StructuralMember[] {
  const members: StructuralMember[] = [];
  const { length_m, width_m, height_m, legMaterialId, frameMaterialId, hasLowerShelf, jointType } = params;

  // 4 patas
  const corners: [number, number][] = [
    [-width_m / 2, -length_m / 2],
    [width_m / 2, -length_m / 2],
    [width_m / 2, length_m / 2],
    [-width_m / 2, length_m / 2],
  ];

  corners.forEach(([x, z], idx) => {
    members.push({
      id: `table-leg-${idx + 1}`,
      name: `Pata de Mesa ${idx + 1}`,
      role: 'POST',
      materialId: legMaterialId,
      length_m: height_m,
      start: [x, 0, z],
      end: [x, height_m, z],
      jointType: jointType,
      cutAngleStart: 90,
      cutAngleEnd: 90,
    });
  });

  // Marco superior (4 lados)
  members.push({
    id: 'table-top-front',
    name: 'Bastidor Superior Frente',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: width_m,
    start: [-width_m / 2, height_m, length_m / 2],
    end: [width_m / 2, height_m, length_m / 2],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });
  members.push({
    id: 'table-top-back',
    name: 'Bastidor Superior Fondo',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: width_m,
    start: [-width_m / 2, height_m, -length_m / 2],
    end: [width_m / 2, height_m, -length_m / 2],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });
  members.push({
    id: 'table-top-left',
    name: 'Bastidor Superior Lateral Izq',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: length_m,
    start: [-width_m / 2, height_m, -length_m / 2],
    end: [-width_m / 2, height_m, length_m / 2],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });
  members.push({
    id: 'table-top-right',
    name: 'Bastidor Superior Lateral Der',
    role: 'FRAME',
    materialId: frameMaterialId,
    length_m: length_m,
    start: [width_m / 2, height_m, -length_m / 2],
    end: [width_m / 2, height_m, length_m / 2],
    jointType: jointType,
    cutAngleStart: 45,
    cutAngleEnd: 45,
  });

  // Repisa inferior opcional
  if (hasLowerShelf) {
    const shelfY = 0.25; // 25 cm del piso
    members.push({
      id: 'table-shelf-front',
      name: 'Amarre Inferior Frente',
      role: 'BRACE',
      materialId: frameMaterialId,
      length_m: width_m,
      start: [-width_m / 2, shelfY, length_m / 2],
      end: [width_m / 2, shelfY, length_m / 2],
      jointType: jointType,
      cutAngleStart: 90,
      cutAngleEnd: 90,
    });
    members.push({
      id: 'table-shelf-back',
      name: 'Amarre Inferior Fondo',
      role: 'BRACE',
      materialId: frameMaterialId,
      length_m: width_m,
      start: [-width_m / 2, shelfY, -length_m / 2],
      end: [width_m / 2, shelfY, -length_m / 2],
      jointType: jointType,
      cutAngleStart: 90,
      cutAngleEnd: 90,
    });
  }

  return members;
}

// ============================================================================
// 4. MOTOR DE DESPIECE Y OPTIMIZACIÓN EN TRAMOS DE 6 METROS
// "si todas son de 6 m y quiero un techo de 3m de alto entonces necesito 2..."
// ============================================================================

export interface StockCutBar {
  barIndex: number;
  materialId: string;
  piecesCut: { memberName: string; length_m: number }[];
  usedLength_m: number;
  remnantLength_m: number; // Sobrante / retal
  kerfLoss_m: number;
}

export interface MaterialStockSummary {
  materialId: string;
  materialName: string;
  totalPieces: number;
  piecesBreakdown: { length_m: number; count: number; name: string }[];
  required6mBars: number;
  cutBars: StockCutBar[];
  totalMetersNeeded: number;
  totalMetersBought: number;
  wastePercent: number;
  pricePerBarMXN: number;
  totalCostMXN: number;
  plainExplanation: string; // Explicación en lenguaje directo de taller
}

export interface ProjectBillOfMaterials {
  materials: MaterialStockSummary[];
  totalBars6m: number;
  totalMaterialCostMXN: number;
  consumablesCostMXN: number;
  weldLinearMeters: number;
  electrodesKgNeeded: number;
  boltsCountNeeded: number;
  cuttingDiscsNeeded: number;
  primerLitersNeeded: number;
  enamelLitersNeeded: number;
  grandTotalMXN: number;
  estimatedWeightKg: number;
}

export function calculateBillOfMaterials(
  members: StructuralMember[],
  kerf_mm: number = 3
): ProjectBillOfMaterials {
  const kerf_m = kerf_mm / 1000;
  const areaPrices = getAreaPrices();
  const priceMap = new Map(areaPrices.map((p) => [p.id, p]));

  // Agrupar miembros por materialId
  const byMaterial = new Map<string, StructuralMember[]>();
  members.forEach((m) => {
    const list = byMaterial.get(m.materialId) || [];
    list.push(m);
    byMaterial.set(m.materialId, list);
  });

  const materialsSummary: MaterialStockSummary[] = [];
  let totalBars6m = 0;
  let totalMaterialCostMXN = 0;
  let totalWeightKg = 0;
  let totalLinearMeters = 0;
  let weldCount = 0;
  let boltCount = 0;

  byMaterial.forEach((pieces, materialId) => {
    const matMeta = priceMap.get(materialId);
    const materialName = matMeta ? matMeta.name : materialId;
    const pricePerBar = matMeta ? matMeta.currentPriceMXN : 0;

    // Desglose de piezas únicas
    const pieceCountMap = new Map<number, { count: number; name: string }>();
    pieces.forEach((p) => {
      totalLinearMeters += p.length_m;
      if (p.jointType === 'WELD') weldCount += 2; // 2 uniones por miembro
      if (p.jointType === 'BOLT') boltCount += 2;

      const rounded = Number(p.length_m.toFixed(3));
      const cur = pieceCountMap.get(rounded);
      if (cur) {
        cur.count++;
      } else {
        pieceCountMap.set(rounded, { count: 1, name: p.name });
      }
    });

    const piecesBreakdown = Array.from(pieceCountMap.entries()).map(([len, data]) => ({
      length_m: len,
      count: data.count,
      name: data.name,
    }));

    // Algoritmo 1D Bin Packing en barras de 6.00m (First-Fit Decreasing)
    const sortedPieces = [...pieces].sort((a, b) => b.length_m - a.length_m);
    const bars: StockCutBar[] = [];

    sortedPieces.forEach((piece) => {
      const pieceLenWithKerf = piece.length_m + kerf_m;
      let placed = false;

      for (const bar of bars) {
        if (bar.usedLength_m + pieceLenWithKerf <= 6.0) {
          bar.piecesCut.push({ memberName: piece.name, length_m: piece.length_m });
          bar.usedLength_m += pieceLenWithKerf;
          bar.kerfLoss_m += kerf_m;
          bar.remnantLength_m = Number(Math.max(0, 6.0 - bar.usedLength_m).toFixed(3));
          placed = true;
          break;
        }
      }

      if (!placed) {
        bars.push({
          barIndex: bars.length + 1,
          materialId,
          piecesCut: [{ memberName: piece.name, length_m: piece.length_m }],
          usedLength_m: piece.length_m,
          remnantLength_m: Number(Math.max(0, 6.0 - piece.length_m).toFixed(3)),
          kerfLoss_m: 0,
        });
      }
    });

    const requiredBars = bars.length;
    const totalNeeded = pieces.reduce((acc, p) => acc + p.length_m, 0);
    const totalBought = requiredBars * 6.0;
    const wastePercent = totalBought > 0 ? ((totalBought - totalNeeded) / totalBought) * 100 : 0;
    const matCost = requiredBars * pricePerBar;

    totalBars6m += requiredBars;
    totalMaterialCostMXN += matCost;

    // Generar explicación directa de taller
    let explanation = '';
    if (piecesBreakdown.length === 1 && piecesBreakdown[0].length_m === 3.0) {
      explanation = `De cada tramo de 6.00m salen exactamente 2 piezas de 3.00m. Necesitas ${requiredBars} tramos para ${pieces.length} piezas sin desperdicio.`;
    } else {
      explanation = `Necesitas ${requiredBars} tramo${requiredBars > 1 ? 's' : ''} comercial${requiredBars > 1 ? 'es' : ''} de 6.00m para cortar las ${pieces.length} piezas. Desperdicio/retal útil: ${wastePercent.toFixed(1)}%.`;
    }

    materialsSummary.push({
      materialId,
      materialName,
      totalPieces: pieces.length,
      piecesBreakdown,
      required6mBars: requiredBars,
      cutBars: bars,
      totalMetersNeeded: Number(totalNeeded.toFixed(2)),
      totalMetersBought: totalBought,
      wastePercent: Number(wastePercent.toFixed(1)),
      pricePerBarMXN: pricePerBar,
      totalCostMXN: matCost,
      plainExplanation: explanation,
    });
  });

  // Consumibles según la escala de la estructura
  const weldLinearMeters = Number((weldCount * 0.15).toFixed(2)); // ~15 cm de cordón por unión
  const electrodesKgNeeded = Math.max(1, Math.ceil(weldLinearMeters / 6)); // ~6m de cordón por kg E6013
  const boltsCountNeeded = boltCount * 2; // 2 tornillos por unión
  const cuttingDiscsNeeded = Math.max(2, Math.ceil(members.length / 8)); // 1 disco 4.5" rinde ~8 cortes de PTR
  const primerLitersNeeded = Math.max(1, Math.ceil(totalLinearMeters / 18)); // 1L rinde ~18m de perfil
  const enamelLitersNeeded = primerLitersNeeded;

  const electrodoPrice = getMaterialPrice('electrodo-6013-3-32') || 98;
  const boltPrice = getMaterialPrice('tornillo-3-8x2.5') || 16;
  const discPrice = getMaterialPrice('disco-corte-4.5') || 28;
  const primerPrice = getMaterialPrice('primario-anticorrosivo') || 165;
  const enamelPrice = getMaterialPrice('esmalte-negro-mate') || 195;

  const consumablesCostMXN =
    electrodesKgNeeded * electrodoPrice +
    boltsCountNeeded * boltPrice +
    cuttingDiscsNeeded * discPrice +
    primerLitersNeeded * primerPrice +
    enamelLitersNeeded * enamelPrice;

  // Estimación de peso (~3.2 kg por metro promedio en perfiles mixtos)
  const estimatedWeightKg = Math.round(totalLinearMeters * 3.1);

  return {
    materials: materialsSummary,
    totalBars6m,
    totalMaterialCostMXN,
    consumablesCostMXN,
    weldLinearMeters,
    electrodesKgNeeded,
    boltsCountNeeded,
    cuttingDiscsNeeded,
    primerLitersNeeded,
    enamelLitersNeeded,
    grandTotalMXN: totalMaterialCostMXN + consumablesCostMXN,
    estimatedWeightKg,
  };
}
