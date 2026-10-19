// ========================================================================
// APEX HYPERTROPHY OS - CLINICAL NUTRITION & LOGISTICS ENGINE
// ========================================================================

export interface BiometricProfile {
    gender: "male" | "female";
    age: number;
    weightKg: number;
    heightCm: number;
    bodyFatPct?: number;
    skeletalMusclePct?: number;
    trainingDaysPerWeek: number;
    caloricDeficitPct: number; // e.g. 15 or 20
}

export interface MacroTarget {
    tmb: number;
    tdee: number;
    targetCalories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    formulaUsed: "Katch-McArdle (Masa Magra)" | "Mifflin-St Jeor";
}

export interface SupplementDose {
    name: string;
    dosage: string;
    timing: string;
    clinicalReason: string;
}

export interface GroceryItem {
    item: string;
    totalAmount: string;
    category: "Proteínas" | "Carbohidratos" | "Grasas Saludables" | "Vegetales y Frutas";
}

// ------------------------------------------------------------------------
// 1. PROTOCOLO CLÍNICO DE MEDICIÓN (TEXTO TÉCNICO OBLIGATORIO)
// ------------------------------------------------------------------------
export const MEASUREMENT_PROTOCOL = {
    title: "PROTOCOLO ESTANDARIZADO DE BIOIMPEDANCIA Y PLICOMETRÍA",
    criteria: [
        {
            rule: "Ayuno Estricto de 8 a 12 Horas",
            detail: "Tomar la lectura inmediatamente al despertar, tras vaciar por completo la vejiga y antes de ingerir cualquier alimento o líquido."
        },
        {
            rule: "Hidratación Basal Estable",
            detail: "Mantener hidratación normal el día previo. Evitar ingesta masiva de agua 2 horas antes de la prueba para no alterar la resistencia galvánica."
        },
        {
            rule: "Cero Alcohol por 48 Horas",
            detail: "El alcohol induce deshidratación intracelular profunda, distorsionando drásticamente el cálculo de masa libre de grasa."
        },
        {
            rule: "Sin Ejercicio Intenso en 12-24 Horas",
            detail: "El bombeo muscular, la sudoración y la depleción temporal de glucógeno alteran la conductividad eléctrica de los tejidos."
        }
    ]
};

// ------------------------------------------------------------------------
// 2. CÁLCULO METABÓLICO (KATCH-MCARDLE VS MIFFLIN-ST JEOR)
// ------------------------------------------------------------------------
export function calculateMetabolism(bio: BiometricProfile): MacroTarget {
    let tmb = 0;
    let formulaUsed: "Katch-McArdle (Masa Magra)" | "Mifflin-St Jeor" = "Mifflin-St Jeor";

    // Si el usuario proporcionó % de grasa, Katch-McArdle es el estándar de oro en fuerza
    if (bio.bodyFatPct && bio.bodyFatPct > 4 && bio.bodyFatPct < 60) {
        const leanMassKg = bio.weightKg * (1 - bio.bodyFatPct / 100);
        tmb = Math.round(370 + 21.6 * leanMassKg);
        formulaUsed = "Katch-McArdle (Masa Magra)";
    } else {
        // Mifflin-St Jeor
        const s = bio.gender === "male" ? 5 : -161;
        tmb = Math.round(10 * bio.weightKg + 6.25 * bio.heightCm - 5 * bio.age + s);
    }

    // Factor de actividad según días de entrenamiento
    let activityMultiplier = 1.35;
    if (bio.trainingDaysPerWeek >= 5) {
        activityMultiplier = 1.55;
    } else if (bio.trainingDaysPerWeek >= 3) {
        activityMultiplier = 1.45;
    }

    const tdee = Math.round(tmb * activityMultiplier);
    const deficitFactor = 1 - (bio.caloricDeficitPct || 15) / 100;
    const targetCalories = Math.round(tdee * deficitFactor);

    // Distribución de macronutrientes:
    // Proteína fija en 2.2g / kg de peso corporal (óptimo para retención muscular en déficit)
    const proteinG = Math.round(bio.weightKg * 2.2);
    // Grasas soporte hormonal: 0.85g / kg
    const fatsG = Math.round(bio.weightKg * 0.85);

    // Carbohidratos: calorías restantes divididas entre 4 kcal/g
    const caloriesFromProteinAndFats = proteinG * 4 + fatsG * 9;
    const remainingCalories = Math.max(200, targetCalories - caloriesFromProteinAndFats);
    const carbsG = Math.round(remainingCalories / 4);

    return {
        tmb,
        tdee,
        targetCalories,
        proteinG,
        carbsG,
        fatsG,
        formulaUsed
    };
}

// ------------------------------------------------------------------------
// 3. STACK DE SUPLEMENTACIÓN CLÍNICA (EVIDENCIA GRADO A)
// ------------------------------------------------------------------------
export function calculateSupplementStack(weightKg: number): SupplementDose[] {
    return [
        {
            name: "Creatina Monohidratada (Creapure)",
            dosage: "5 g diarios (continuos)",
            timing: "Misma hora todos los días (idealmente post-entrenamiento con carbohidratos)",
            clinicalReason: "Saturación de fosfocreatina intracelular; incrementa fuerza contráctil y retención de agua sarcoplasmática."
        },
        {
            name: "Proteína Whey (Aislada o Concentrada)",
            dosage: "25 a 35 g (1 a 1.5 scoops)",
            timing: "Post-entrenamiento o entre comidas",
            clinicalReason: "Alcanzar el umbral de leucina (3g) para disparo máximo de síntesis proteica muscular (vía mTOR)."
        },
        {
            name: "Omega-3 Ultra Puro (EPA / DHA)",
            dosage: "2,500 mg combinados diarios",
            timing: "Con el desayuno o la comida más copiosa",
            clinicalReason: "Control de citoquinas proinflamatorias articulares y aumento de la sensibilidad periférica a la insulina."
        },
        {
            name: "Magnesio Bisglicinato / Citrato",
            dosage: "400 mg elementales",
            timing: "60 minutos antes de dormir",
            clinicalReason: "Relajación del sistema neuromuscular, optimización de fases REM y control del cortisol nocturno."
        },
        {
            name: "Colágeno Hidrolizado + Vitamina C",
            dosage: "10 a 15 g diarios",
            timing: "En ayunas o pre-entreno",
            clinicalReason: "Estimula la síntesis de colágeno en la matriz extracelular de tendones y ligamentos sometidos a tensión pesada."
        }
    ];
}

// ------------------------------------------------------------------------
// 4. CONSOLIDADOR DE SUPERMERCADO SEMANAL (1 VIAJE EN KG)
// ------------------------------------------------------------------------
export function generateWeeklyGroceryList(weightKg: number): GroceryItem[] {
    // Cálculo proporcional basado en ingesta semanal estimada
    const chickenOrBeefKg = ((weightKg * 2.2 * 7 * 0.6) / 250).toFixed(1); // 60% fuente cárnica
    const eggsCount = Math.round(14 + (weightKg > 80 ? 7 : 0));
    const riceOrOatsKg = (1.5 + (weightKg > 80 ? 0.7 : 0)).toFixed(1);

    return [
        { item: "Pechuga de Pollo / Lomo de Res Magro / Pescado Blanco", totalAmount: `${chickenOrBeefKg} kg`, category: "Proteínas" },
        { item: "Huevos Enteros Pasteurisados", totalAmount: `${eggsCount} piezas`, category: "Proteínas" },
        { item: "Arroz Blanco / Avena en Hojuelas", totalAmount: `${riceOrOatsKg} kg`, category: "Carbohidratos" },
        { item: "Papas / Camote (Batata)", totalAmount: "2.0 kg", category: "Carbohidratos" },
        { item: "Aguacates Hass / Aceite de Oliva Extra Virgen", totalAmount: "7 piezas / 1 botella", category: "Grasas Saludables" },
        { item: "Frutos Secos (Nueces, Almendras)", totalAmount: "300 g", category: "Grasas Saludables" },
        { item: "Espinacas, Brócoli, Espárragos y Frutos Rojos", totalAmount: "1.5 kg surtido", category: "Vegetales y Frutas" }
    ];
}
