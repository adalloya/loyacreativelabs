// ========================================================================
// APEX HYPERTROPHY OS - CORE BIOMECHANICS & HYPERTROPHY ENGINE
// ========================================================================

import { ALL_FREE_EXERCISES } from "@/data/exerciseDatabase";
import { convertRawToExerciseItem } from "./exercise-catalog";

export type MuscleGroup =
    | "chest"
    | "lats"
    | "upper_back"
    | "delts"
    | "quads"
    | "hamstrings"
    | "glutes"
    | "biceps"
    | "triceps"
    | "calves"
    | "core";

export type ResistanceProfile = "lengthened_bias" | "mid_range_overload" | "shortened_peak";
export type EquipmentType = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";
export type HypertrophyTier = "S" | "A" | "B";
export type ReadinessState = "optimal" | "normal" | "fatigued";

export interface ExerciseItem {
    id: string;
    name: string;
    primary_muscle: MuscleGroup;
    anatomical_subdivision: string;
    secondary_muscles: string[];
    equipment: EquipmentType;
    movement_pattern: string;
    resistance_profile: ResistanceProfile;
    hypertrophy_tier: HypertrophyTier;
    biomechanical_cue: string;
    default_sets: number;
    rep_range_min: number;
    rep_range_max: number;
    rest_seconds: number;
    target_rir: number;
    github_id?: string;
    activation_pct?: number;
    images?: string[];
    instructions?: string[];
    category?: string;
    primaryMuscles?: string[];
    rawEquipment?: string;
    blockId?: string;
    blockTitle?: string;
    blockRounds?: number;
    customPrescription?: string;
}

export interface PlateBreakdown {
    plateKg: number;
    plateWeight?: number;
    countPerSide: number;
}

export interface WarmupSet {
    setNumber: number;
    percentage: number;
    weightKg: number;
    reps: number;
    restSeconds: number;
    purpose: string;
}

// ------------------------------------------------------------------------
// 1. DATASET COMPLETO (873+ EJERCICIOS EN VIVO DE GITHUB CON RESPALDO LOCAL)
// ------------------------------------------------------------------------
export let EXERCISE_DATABASE: ExerciseItem[] = ALL_FREE_EXERCISES.map(convertRawToExerciseItem);

export function updateExerciseDatabase(newCatalog: ExerciseItem[]): void {
    if (newCatalog && newCatalog.length >= 800) {
        EXERCISE_DATABASE = newCatalog;
    }
}

// ------------------------------------------------------------------------
// 2. CALCULADORA DE DISCOS POR LADO (ESTÁNDAR LBS 45 LBS / KG 20 KG)
// ------------------------------------------------------------------------
export function calculatePlatesPerSide(
    targetWeight: number,
    barWeight: number = 45,
    availablePlates?: number[]
): PlateBreakdown[] {
    if (targetWeight <= barWeight) return [];

    const defaultPlates = barWeight >= 40
        ? [45, 35, 25, 10, 5, 2.5, 1.25]
        : [25, 20, 15, 10, 5, 2.5, 1.25];
    const plates = availablePlates || defaultPlates;

    let weightPerSide = (targetWeight - barWeight) / 2;
    const breakdown: PlateBreakdown[] = [];

    const sortedPlates = [...plates].sort((a, b) => b - a);

    for (const plate of sortedPlates) {
        const count = Math.floor(weightPerSide / plate);
        if (count > 0) {
            breakdown.push({ plateKg: plate, plateWeight: plate, countPerSide: count });
            weightPerSide = Number((weightPerSide - count * plate).toFixed(2));
        }
    }
    return breakdown;
}

export function formatPlatesSummary(
    targetWeight: number,
    barWeight?: number,
    unit: "lbs" | "kg" = "lbs"
): string {
    const defaultBar = unit === "lbs" ? 45 : 20;
    const actualBar = barWeight !== undefined ? barWeight : defaultBar;

    if (targetWeight <= actualBar) {
        return `Barra olímpica sola (${actualBar} ${unit})`;
    }
    const breakdown = calculatePlatesPerSide(targetWeight, actualBar);
    if (breakdown.length === 0) return `${targetWeight} ${unit}`;
    const details = breakdown.map(p => `${p.countPerSide}x${p.plateWeight ?? p.plateKg}${unit}`).join(" + ");
    return `Barra ${actualBar} ${unit} + ${details} por lado`;
}

// ------------------------------------------------------------------------
// 3. GENERADOR DE SERIES DE CALENTAMIENTO (CERO FATIGA)
// ------------------------------------------------------------------------
export function generateWarmupProtocol(
    workingWeight: number,
    barWeight?: number,
    unit: "lbs" | "kg" = "lbs"
): WarmupSet[] {
    const defaultBar = unit === "lbs" ? 45 : 20;
    const actualBar = barWeight !== undefined ? barWeight : defaultBar;
    const step = unit === "lbs" ? 5 : 2.5;
    const threshold = unit === "lbs" ? 75 : 35;
    const roundToNearest = (val: number) => Math.max(actualBar, Math.round(val / step) * step);

    if (workingWeight <= threshold) {
        return [
            {
                setNumber: 1,
                percentage: 50,
                weightKg: actualBar,
                reps: 8,
                restSeconds: 45,
                purpose: "Lubricación articular y aclimatación motora"
            }
        ];
    }

    return [
        {
            setNumber: 1,
            percentage: 50,
            weightKg: roundToNearest(workingWeight * 0.50),
            reps: 8,
            restSeconds: 60,
            purpose: "Flujo sanguíneo y temperatura muscular"
        },
        {
            setNumber: 2,
            percentage: 70,
            weightKg: roundToNearest(workingWeight * 0.70),
            reps: 4,
            restSeconds: 90,
            purpose: "Transición neuromuscular sin lactato"
        },
        {
            setNumber: 3,
            percentage: 85,
            weightKg: roundToNearest(workingWeight * 0.85),
            reps: 1,
            restSeconds: 120,
            purpose: "Potenciación post-activación (PAP) para serie efectiva"
        }
    ];
}

// ------------------------------------------------------------------------
// 4. AUTO-REGULACIÓN DIARIA (READINESS CHECK) & 1RM
// ------------------------------------------------------------------------
export function calculateTodayTarget(
    lastWeight: number,
    lastReps: number,
    targetRepsMin: number,
    targetRepsMax: number,
    readiness: ReadinessState,
    unit: "lbs" | "kg" = "lbs"
) {
    if (!lastReps || lastReps <= 0 || !lastWeight || lastWeight <= 0) {
        return { suggestedWeight: 0, suggestedReps: 0, targetRir: 1, estimated1RM: 0 };
    }

    let suggestedWeight = lastWeight;
    let suggestedReps = lastReps;
    let targetRir = 1;
    const step = unit === "lbs" ? 5 : 2.5;

    if (readiness === "optimal") {
        if (lastReps >= targetRepsMax) {
            suggestedWeight = Math.round((lastWeight * 1.025) / step) * step;
            suggestedReps = targetRepsMin;
        } else {
            suggestedReps = lastReps + 1;
        }
        targetRir = 1;
    } else if (readiness === "normal") {
        suggestedReps = Math.min(targetRepsMax, lastReps + 1);
        targetRir = 1;
    } else if (readiness === "fatigued") {
        // Reducción preventiva del 5% o +1 RIR para proteger articulaciones
        suggestedWeight = Math.round((lastWeight * 0.95) / step) * step;
        suggestedReps = lastReps;
        targetRir = 2;
    }

    const estimated1RM = Math.round(suggestedWeight * (1 + suggestedReps / 30));

    return { suggestedWeight, suggestedReps, targetRir, estimated1RM };
}

// ------------------------------------------------------------------------
// 5. SWAP SELECTOR (BUSCADOR DE EQUIVALENCIAS BIOMECÁNICAS)
// ------------------------------------------------------------------------
export function findBiomechanicalSwaps(
    currentExerciseId: string,
    catalog: ExerciseItem[] = EXERCISE_DATABASE
): ExerciseItem[] {
    const activeCatalog = catalog && catalog.length > 0 ? catalog : EXERCISE_DATABASE;
    const current = activeCatalog.find(e => e.id === currentExerciseId);
    if (!current) return [];

    const currentPrimary = (current.primaryMuscles && current.primaryMuscles[0]) || current.primary_muscle;

    const matches = activeCatalog.filter(
        e => e.id !== current.id && (
            (e.primaryMuscles && e.primaryMuscles.includes(currentPrimary)) ||
            e.primary_muscle === current.primary_muscle ||
            (e.movement_pattern && e.movement_pattern === current.movement_pattern)
        )
    );

    if (matches.length > 0) return matches;
    return activeCatalog.filter(e => e.id !== current.id);
}

// ------------------------------------------------------------------------
// 6. GENERADOR DE RUTINA SEMANAL COMPLETA (FULL-BODY GARANTIZADO)
// ------------------------------------------------------------------------
export interface RoutineDay {
    dayNumber: number;
    title: string;
    focus: string;
    estimatedMinutes: number;
    exercises: ExerciseItem[];
    cardio: {
        type: string;
        durationMinutes: number;
        protocol: string;
    };
    dayName?: string;
    carbCyclePhase?: "high_carb" | "low_carb" | "mod_carb";
    carbCycleLabel?: string;
}

export type CardioType = "incline_treadmill" | "stairmaster" | "stationary_bike" | "none";

export interface CardioProtocolInfo {
    id: CardioType;
    label: string;
    type: string;
    protocol: string;
    defaultMinutes: number;
    defaultIncline: number;
    defaultSpeed: number;
    inclineLabel: string;
    inclineUnit: string;
    speedLabel: string;
    speedUnit: string;
    inclineStep: number;
    speedStep: number;
    inclinePresets: number[];
    speedPresets: number[];
}

export interface DailyCardioEntry {
    type: CardioType;
    minutes: number;
    incline: number;
    speed: number;
    completed: boolean;
    distanceKm?: number;
    caloriesBurned?: number;
    date?: string;
    savedAt?: string;
}

export const CARDIO_PROTOCOLS: Record<CardioType, CardioProtocolInfo> = {
    incline_treadmill: {
        id: "incline_treadmill",
        label: "Caminadora",
        type: "Caminadora con Inclinación",
        protocol: "Zona 2: 12% Inclinación, 4.8 km/h. Sin sujetarse de los pasamanos para reclutar cadena posterior.",
        defaultMinutes: 20,
        defaultIncline: 12,
        defaultSpeed: 4.8,
        inclineLabel: "Inclinación",
        inclineUnit: "%",
        speedLabel: "Velocidad",
        speedUnit: "km/h",
        inclineStep: 0.5,
        speedStep: 0.1,
        inclinePresets: [8, 10, 12, 15],
        speedPresets: [4.0, 4.5, 4.8, 5.2]
    },
    stairmaster: {
        id: "stairmaster",
        label: "Escaladora",
        type: "Escaladora / StairMaster",
        protocol: "Zona 2: Nivel 5-7 con cadencia constante. Mantén el torso vertical y apoya toda la planta del pie.",
        defaultMinutes: 15,
        defaultIncline: 6,
        defaultSpeed: 50,
        inclineLabel: "Nivel / Resistencia",
        inclineUnit: "Nvl",
        speedLabel: "Cadencia",
        speedUnit: "SPM",
        inclineStep: 1,
        speedStep: 5,
        inclinePresets: [4, 6, 8, 10],
        speedPresets: [40, 50, 60, 70]
    },
    stationary_bike: {
        id: "stationary_bike",
        label: "Bicicleta",
        type: "Bicicleta Estática",
        protocol: "Zona 2: Resistencia media, 80-90 RPM continuas. Cero impacto articular en rodillas y columna.",
        defaultMinutes: 20,
        defaultIncline: 6,
        defaultSpeed: 85,
        inclineLabel: "Resistencia",
        inclineUnit: "Nvl",
        speedLabel: "Cadencia",
        speedUnit: "RPM",
        inclineStep: 1,
        speedStep: 5,
        inclinePresets: [4, 6, 8, 10],
        speedPresets: [70, 80, 85, 95]
    },
    none: {
        id: "none",
        label: "Sin cardio hoy",
        type: "Sin cardio",
        protocol: "Sesión 100% hipertrofia y tensión mecánica. Descanso metabólico para optimizar recuperación.",
        defaultMinutes: 0,
        defaultIncline: 0,
        defaultSpeed: 0,
        inclineLabel: "Inclinación",
        inclineUnit: "%",
        speedLabel: "Velocidad",
        speedUnit: "km/h",
        inclineStep: 1,
        speedStep: 1,
        inclinePresets: [],
        speedPresets: []
    }
};

/**
 * Calcula distancia estimada (km) y calorías quemadas en Zona 2
 * basado en fórmulas metabólicas ACSM ajustadas al peso del usuario.
 */
export function calculateCardioTelemetry(
    type: CardioType,
    minutes: number,
    incline: number,
    speed: number,
    weightKg: number = 75
): { distanceKm: number; caloriesBurned: number } {
    if (type === "none" || minutes <= 0) {
        return { distanceKm: 0, caloriesBurned: 0 };
    }

    let distanceKm = 0;
    let caloriesBurned = 0;

    if (type === "incline_treadmill") {
        distanceKm = Math.round((speed * (minutes / 60)) * 100) / 100;
        const speedMperMin = (speed * 1000) / 60;
        const grade = (incline || 0) / 100;
        const vo2 = (0.1 * speedMperMin) + (1.8 * speedMperMin * grade) + 3.5;
        const mets = vo2 / 3.5;
        const kcalPerMin = (mets * 3.5 * weightKg) / 200;
        caloriesBurned = Math.round(kcalPerMin * minutes);
    } else if (type === "stairmaster") {
        const level = incline || 6;
        const mets = 6.0 + (level * 0.4);
        const kcalPerMin = (mets * 3.5 * weightKg) / 200;
        caloriesBurned = Math.round(kcalPerMin * minutes);
        distanceKm = Math.round((((speed || 50) * minutes * 0.2) / 1000) * 100) / 100;
    } else if (type === "stationary_bike") {
        const res = incline || 6;
        const mets = 5.0 + (res * 0.35);
        const kcalPerMin = (mets * 3.5 * weightKg) / 200;
        caloriesBurned = Math.round(kcalPerMin * minutes);
        const approxSpeed = ((speed || 85) / 85) * 20;
        distanceKm = Math.round((approxSpeed * (minutes / 60)) * 100) / 100;
    }

    return { distanceKm, caloriesBurned };
}

interface DaySplitRule {
    dayNumber: number;
    dayName: string;
    title: string;
    focus: string;
    targetMuscles: string[];
    excludeDays?: number[];
    muscleSequence: string[];
    carbCyclePhase: "high_carb" | "low_carb" | "mod_carb";
    carbCycleLabel: string;
}

const FIVE_DAY_SPLIT_RULES: DaySplitRule[] = [
    {
        dayNumber: 1,
        dayName: "LUNES",
        title: "Lunes: Empuje (Push)",
        focus: "Pectoral, Deltoides Anterior/Lateral & Tríceps",
        targetMuscles: ["chest", "shoulders", "triceps"],
        muscleSequence: ["chest", "chest", "shoulders", "triceps", "shoulders", "triceps", "chest"],
        carbCyclePhase: "mod_carb",
        carbCycleLabel: "MOD CARB // RENDIMIENTO Y FUERZA"
    },
    {
        dayNumber: 2,
        dayName: "MARTES",
        title: "Martes: Tracción (Pull)",
        focus: "Dorsales, Espalda Media/Baja, Trapecios & Bíceps",
        targetMuscles: ["lats", "middle back", "lower back", "biceps", "traps"],
        muscleSequence: ["lats", "middle back", "biceps", "traps", "lower back", "biceps", "lats"],
        carbCyclePhase: "low_carb",
        carbCycleLabel: "LOW CARB // OXIDACIÓN LIPÍDICA"
    },
    {
        dayNumber: 3,
        dayName: "MIÉRCOLES",
        title: "Miércoles: Pierna (Quad Focus)",
        focus: "Cuádriceps, Pantorrillas & Abdominales",
        targetMuscles: ["quadriceps", "calves", "abdominals"],
        muscleSequence: ["quadriceps", "quadriceps", "calves", "abdominals", "quadriceps", "abdominals", "calves"],
        carbCyclePhase: "high_carb",
        carbCycleLabel: "HIGH CARB DAY // CARGA DE GLUCÓGENO"
    },
    {
        dayNumber: 4,
        dayName: "JUEVES",
        title: "Jueves: Torso Superior (Upper)",
        focus: "Hombros, Pectoral, Dorsales & Brazos (Sin repetición D1/D2)",
        targetMuscles: ["shoulders", "chest", "lats", "biceps", "triceps"],
        excludeDays: [1, 2],
        muscleSequence: ["shoulders", "chest", "lats", "triceps", "biceps", "shoulders", "chest"],
        carbCyclePhase: "low_carb",
        carbCycleLabel: "LOW CARB // OXIDACIÓN LIPÍDICA"
    },
    {
        dayNumber: 5,
        dayName: "VIERNES",
        title: "Viernes: Pierna & Glúteo (Posterior Chain)",
        focus: "Isquiosurales, Glúteos, Espalda Baja & Pantorrillas",
        targetMuscles: ["hamstrings", "glutes", "lower back", "calves"],
        excludeDays: [3],
        muscleSequence: ["hamstrings", "glutes", "lower back", "calves", "hamstrings", "glutes", "calves"],
        carbCyclePhase: "high_carb",
        carbCycleLabel: "HIGH CARB DAY // CARGA DE GLUCÓGENO"
    },
    {
        dayNumber: 6,
        dayName: "SÁBADO",
        title: "Sábado: Brazos & Hombros (Booster)",
        focus: "Aislamiento de Bíceps, Tríceps & Deltoides Lateral",
        targetMuscles: ["biceps", "triceps", "shoulders", "forearms"],
        excludeDays: [1, 2, 4],
        muscleSequence: ["biceps", "triceps", "shoulders", "biceps", "triceps", "shoulders", "forearms"],
        carbCyclePhase: "mod_carb",
        carbCycleLabel: "MOD CARB // RENDIMIENTO Y RECUPERACIÓN"
    },
    {
        dayNumber: 7,
        dayName: "DOMINGO",
        title: "Domingo: Acondicionamiento & Core (Reset)",
        focus: "Core, Movilidad Articular & Resistencia Muscular",
        targetMuscles: ["abdominals", "quadriceps", "hamstrings", "chest", "lats"],
        excludeDays: [],
        muscleSequence: ["abdominals", "quadriceps", "hamstrings", "lats", "abdominals", "chest", "calves"],
        carbCyclePhase: "low_carb",
        carbCycleLabel: "LOW CARB // RECUPERACIÓN & OXIDACIÓN"
    }
];

export type EnvironmentMode = "full_gym" | "hotel_gym" | "bodyweight" | "home_gym";

export function exerciseMatchesEnvironment(
    item: ExerciseItem,
    env: EnvironmentMode = "full_gym"
): boolean {
    if (env === "full_gym") return true;
    const eq = (item.equipment || "").toLowerCase();
    const raw = (item.rawEquipment || "").toLowerCase();

    if (env === "hotel_gym") {
        return (
            eq === "dumbbell" ||
            eq === "cable" ||
            eq === "bodyweight" ||
            raw === "dumbbell" ||
            raw === "cable" ||
            raw === "bodyweight" ||
            raw === "bands" ||
            raw === "other"
        );
    }

    if (env === "home_gym") {
        // Ejercicios en Casa: Peso corporal / calistenia, mancuernas, bandas de resistencia, pesas rusas, pelota, foam roll, objetos caseros
        return (
            eq === "bodyweight" ||
            eq === "dumbbell" ||
            raw === "bodyweight" ||
            raw === "body only" ||
            raw === "dumbbell" ||
            raw === "bands" ||
            raw === "kettlebells" ||
            raw === "exercise ball" ||
            raw === "foam roll" ||
            raw === "other" ||
            raw === "none" ||
            !item.equipment
        );
    }

    if (env === "bodyweight") {
        return eq === "bodyweight" || raw === "bodyweight" || raw === "body only" || raw === "none" || !item.equipment;
    }

    return true;
}

/**
 * Determina si un ejercicio es de peso propio / peso corporal (calistenia, lagartijas, dominadas, fondos, etc.)
 */
export function isBodyweightExercise(exercise?: { equipment?: string; rawEquipment?: string; name?: string } | null): boolean {
    if (!exercise) return false;
    const eq = (exercise.equipment || "").toLowerCase().trim();
    const raw = (exercise.rawEquipment || "").toLowerCase().trim();
    const n = (exercise.name || "").toLowerCase().trim();

    if (eq === "bodyweight" || raw === "body only" || raw === "bodyweight" || raw === "none") {
        return true;
    }
    if (n.includes("barbell") || n.includes("dumbbell") || n.includes("cable") || n.includes("machine") || n.includes("weighted")) {
        return false;
    }
    if (
        n.includes("bodyweight") ||
        n.includes("push-up") || n.includes("pushup") || n.includes("lagartija") ||
        n.includes("pull-up") || n.includes("pullup") || n.includes("dominada") ||
        n.includes("chin-up") || n.includes("chinup") ||
        n.includes("dip") || n.includes("fondo") ||
        n.includes("crunch") || n.includes("plank") || n.includes("plancha") ||
        n.includes("sit-up") || n.includes("situp") || n.includes("abdominal") ||
        n.includes("burpee") || n.includes("jumping jack") ||
        n.includes("air squat") || n.includes("sentadilla libre")
    ) {
        return true;
    }
    return eq === "bodyweight";
}

export function generateWeeklyProgram(
    daysPerWeek: number = 5,
    sessionDurationMins: number = 60,
    preferredCardio: string = "incline_treadmill",
    environment: EnvironmentMode = "full_gym",
    catalog: ExerciseItem[] = EXERCISE_DATABASE
): RoutineDay[] {
    const activeCatalog = catalog && catalog.length >= 800 ? catalog : EXERCISE_DATABASE;
    const cardioConfig = CARDIO_PROTOCOLS[preferredCardio as CardioType] || CARDIO_PROTOCOLS.incline_treadmill;
    const cardioDuration = cardioConfig.defaultMinutes;

    let targetExerciseCount = 6;
    if (sessionDurationMins <= 45) {
        targetExerciseCount = 4;
    } else if (sessionDurationMins >= 90) {
        targetExerciseCount = 7;
    }

    const totalDays = Math.min(7, Math.max(2, daysPerWeek));
    const days: RoutineDay[] = [];
    const usedIdsOverall = new Set<string>();
    const dayExerciseMap: Record<number, string[]> = {};

    for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
        const rule = FIVE_DAY_SPLIT_RULES[dayIdx] || FIVE_DAY_SPLIT_RULES[0];
        dayExerciseMap[rule.dayNumber] = [];

        // Excluir IDs usados en días clave (ej. D4 excluye D1 y D2; D5 excluye D3)
        const specificExcludedIds = new Set<string>();
        if (rule.excludeDays && rule.excludeDays.length > 0) {
            rule.excludeDays.forEach(d => {
                (dayExerciseMap[d] || []).forEach(id => specificExcludedIds.add(id));
            });
        }

        // Filtramos candidatos según targetMuscles
        const candidates = activeCatalog.filter(ex => {
            const pMuscles = (ex.primaryMuscles || [ex.primary_muscle]).map(m => m.toLowerCase());
            const hasTargetMuscle = pMuscles.some(m => rule.targetMuscles.includes(m));
            return hasTargetMuscle && !specificExcludedIds.has(ex.id) && !usedIdsOverall.has(ex.id);
        });

        // Aplicamos filtro de entorno
        const envCandidates = candidates.filter(ex => exerciseMatchesEnvironment(ex, environment));
        const pool = envCandidates.length >= targetExerciseCount ? envCandidates : (candidates.length >= targetExerciseCount ? candidates : activeCatalog.filter(ex => !usedIdsOverall.has(ex.id)));

        const picked: ExerciseItem[] = [];
        for (const muscle of rule.muscleSequence) {
            if (picked.length >= targetExerciseCount) break;
            const match = pool.find(ex => {
                const pMuscles = (ex.primaryMuscles || [ex.primary_muscle]).map(m => m.toLowerCase());
                return pMuscles.includes(muscle) && !picked.some(p => p.id === ex.id);
            });
            if (match) {
                picked.push(match);
            }
        }

        // Si faltan ejercicios para completar la cuota del día, rellenar del pool
        for (const ex of pool) {
            if (picked.length >= targetExerciseCount) break;
            if (!picked.some(p => p.id === ex.id)) {
                picked.push(ex);
            }
        }

        // Si aún falta, rellenar de activeCatalog evitando duplicados
        if (picked.length < targetExerciseCount) {
            for (const ex of activeCatalog) {
                if (picked.length >= targetExerciseCount) break;
                if (!picked.some(p => p.id === ex.id) && !usedIdsOverall.has(ex.id)) {
                    picked.push(ex);
                }
            }
        }

        picked.forEach(p => {
            usedIdsOverall.add(p.id);
            dayExerciseMap[rule.dayNumber].push(p.id);
        });

        days.push({
            dayNumber: rule.dayNumber,
            dayName: rule.dayName,
            title: rule.title,
            focus: rule.focus,
            carbCyclePhase: rule.carbCyclePhase,
            carbCycleLabel: rule.carbCycleLabel,
            estimatedMinutes: sessionDurationMins,
            exercises: picked,
            cardio: {
                type: cardioConfig.type,
                durationMinutes: cardioDuration,
                protocol: cardioConfig.protocol
            }
        });
    }

    return days;
}

