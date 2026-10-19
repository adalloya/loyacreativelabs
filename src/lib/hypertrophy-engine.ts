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
}

export interface PlateBreakdown {
    plateKg: number;
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
// 2. CALCULADORA DE DISCOS POR LADO (ESTÁNDAR OLÍMPICO 20 KG)
// ------------------------------------------------------------------------
export function calculatePlatesPerSide(
    targetWeightKg: number,
    barWeightKg: number = 20,
    availablePlates: number[] = [25, 20, 15, 10, 5, 2.5, 1.25]
): PlateBreakdown[] {
    if (targetWeightKg <= barWeightKg) return [];

    let weightPerSide = (targetWeightKg - barWeightKg) / 2;
    const breakdown: PlateBreakdown[] = [];

    const sortedPlates = [...availablePlates].sort((a, b) => b - a);

    for (const plate of sortedPlates) {
        const count = Math.floor(weightPerSide / plate);
        if (count > 0) {
            breakdown.push({ plateKg: plate, countPerSide: count });
            weightPerSide = Number((weightPerSide - count * plate).toFixed(2));
        }
    }
    return breakdown;
}

export function formatPlatesSummary(targetWeightKg: number, barWeightKg: number = 20): string {
    if (targetWeightKg <= barWeightKg) {
        return `Barra olímpica sola (${barWeightKg} kg)`;
    }
    const breakdown = calculatePlatesPerSide(targetWeightKg, barWeightKg);
    if (breakdown.length === 0) return `${targetWeightKg} kg`;
    const details = breakdown.map(p => `${p.countPerSide}x${p.plateKg}kg`).join(" + ");
    return `Barra ${barWeightKg}kg + ${details} por lado`;
}

// ------------------------------------------------------------------------
// 3. GENERADOR DE SERIES DE CALENTAMIENTO (CERO FATIGA)
// ------------------------------------------------------------------------
export function generateWarmupProtocol(workingWeightKg: number, barWeightKg: number = 20): WarmupSet[] {
    const roundToNearest2_5 = (val: number) => Math.max(barWeightKg, Math.round(val / 2.5) * 2.5);

    if (workingWeightKg <= 35) {
        return [
            {
                setNumber: 1,
                percentage: 50,
                weightKg: barWeightKg,
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
            weightKg: roundToNearest2_5(workingWeightKg * 0.50),
            reps: 8,
            restSeconds: 60,
            purpose: "Flujo sanguíneo y temperatura muscular"
        },
        {
            setNumber: 2,
            percentage: 70,
            weightKg: roundToNearest2_5(workingWeightKg * 0.70),
            reps: 4,
            restSeconds: 90,
            purpose: "Transición neuromuscular sin lactato"
        },
        {
            setNumber: 3,
            percentage: 85,
            weightKg: roundToNearest2_5(workingWeightKg * 0.85),
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
    lastWeightKg: number,
    lastReps: number,
    targetRepsMin: number,
    targetRepsMax: number,
    readiness: ReadinessState
) {
    if (!lastReps || lastReps <= 0 || !lastWeightKg || lastWeightKg <= 0) {
        return { suggestedWeight: 0, suggestedReps: 0, targetRir: 1, estimated1RM: 0 };
    }

    let suggestedWeight = lastWeightKg;
    let suggestedReps = lastReps;
    let targetRir = 1;

    if (readiness === "optimal") {
        if (lastReps >= targetRepsMax) {
            suggestedWeight = Math.round((lastWeightKg * 1.025) / 2.5) * 2.5;
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
        suggestedWeight = Math.round((lastWeightKg * 0.95) / 2.5) * 2.5;
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
    title: string;
    focus: string;
    targetMuscles: string[];
    excludeDays?: number[];
    muscleSequence: string[];
}

const FIVE_DAY_SPLIT_RULES: DaySplitRule[] = [
    {
        dayNumber: 1,
        title: "Día 1: Empuje (Push)",
        focus: "Pectoral, Deltoides Anterior/Lateral & Tríceps",
        targetMuscles: ["chest", "shoulders", "triceps"],
        muscleSequence: ["chest", "chest", "shoulders", "triceps", "shoulders", "triceps", "chest"]
    },
    {
        dayNumber: 2,
        title: "Día 2: Tracción (Pull)",
        focus: "Dorsales, Espalda Media/Baja, Trapecios & Bíceps",
        targetMuscles: ["lats", "middle back", "lower back", "biceps", "traps"],
        muscleSequence: ["lats", "middle back", "biceps", "traps", "lower back", "biceps", "lats"]
    },
    {
        dayNumber: 3,
        title: "Día 3: Pierna (Quad Focus)",
        focus: "Cuádriceps, Pantorrillas & Abdominales",
        targetMuscles: ["quadriceps", "calves", "abdominals"],
        muscleSequence: ["quadriceps", "quadriceps", "calves", "abdominals", "quadriceps", "abdominals", "calves"]
    },
    {
        dayNumber: 4,
        title: "Día 4: Torso Superior (Upper / Hypertrophy)",
        focus: "Hombros, Pectoral, Dorsales & Brazos (Sin repetición D1/D2)",
        targetMuscles: ["shoulders", "chest", "lats", "biceps", "triceps"],
        excludeDays: [1, 2],
        muscleSequence: ["shoulders", "chest", "lats", "triceps", "biceps", "shoulders", "chest"]
    },
    {
        dayNumber: 5,
        title: "Día 5: Cadena Posterior (Posterior Chain)",
        focus: "Isquiosurales, Glúteos, Espalda Baja & Pantorrillas (Sin repetición D3)",
        targetMuscles: ["hamstrings", "glutes", "lower back", "calves"],
        excludeDays: [3],
        muscleSequence: ["hamstrings", "glutes", "lower back", "calves", "hamstrings", "glutes", "calves"]
    },
    {
        dayNumber: 6,
        title: "Día 6: Brazos & Hombros (Hypertrophy Booster)",
        focus: "Aislamiento de Bíceps, Tríceps & Deltoides Lateral",
        targetMuscles: ["biceps", "triceps", "shoulders", "forearms"],
        excludeDays: [1, 2, 4],
        muscleSequence: ["biceps", "triceps", "shoulders", "biceps", "triceps", "shoulders", "forearms"]
    },
    {
        dayNumber: 7,
        title: "Día 7: Acondicionamiento & Core (Full Body Reset)",
        focus: "Core, Movilidad Articular & Resistencia Muscular",
        targetMuscles: ["abdominals", "quadriceps", "hamstrings", "chest", "lats"],
        excludeDays: [],
        muscleSequence: ["abdominals", "quadriceps", "hamstrings", "lats", "abdominals", "chest", "calves"]
    }
];

export function exerciseMatchesEnvironment(
    item: ExerciseItem,
    env: "full_gym" | "hotel_gym" | "bodyweight" = "full_gym"
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

    if (env === "bodyweight") {
        return eq === "bodyweight" || raw === "bodyweight" || raw === "none" || !item.equipment;
    }

    return true;
}

export function generateWeeklyProgram(
    daysPerWeek: number = 5,
    sessionDurationMins: number = 60,
    preferredCardio: string = "incline_treadmill",
    environment: "full_gym" | "hotel_gym" | "bodyweight" = "full_gym",
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
            title: rule.title,
            focus: rule.focus,
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

