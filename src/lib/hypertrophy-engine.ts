// ========================================================================
// APEX HYPERTROPHY OS - CORE BIOMECHANICS & HYPERTROPHY ENGINE
// ========================================================================

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
// 1. TIER S & A BIOMECHANICAL EXERCISE DATABASE
// ------------------------------------------------------------------------
export const EXERCISE_DATABASE: ExerciseItem[] = [
    // --- PECTORAL (CHEST) ---
    {
        id: "incline-dumbbell-press",
        name: "Press Inclinado con Mancuernas (30°)",
        primary_muscle: "chest",
        anatomical_subdivision: "Haz Clavicular (Pecho Superior)",
        secondary_muscles: ["delts", "triceps"],
        equipment: "dumbbell",
        movement_pattern: "incline_push",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Banca a 30°. Codos a 45° del torso. Pausa de 1 segundo en máximo estiramiento profundo.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Incline_Dumbbell_Press",
        activation_pct: 94
    },
    {
        id: "barbell-bench-press",
        name: "Press de Banca Plano con Barra",
        primary_muscle: "chest",
        anatomical_subdivision: "Haz Esternocostal (Pecho Medio)",
        secondary_muscles: ["triceps", "delts"],
        equipment: "barbell",
        movement_pattern: "horizontal_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Retracción y depresión escapular. Barra toca esternón bajo. Concéntrica explosiva sin perder arco.",
        default_sets: 3,
        rep_range_min: 6,
        rep_range_max: 8,
        rest_seconds: 180,
        target_rir: 2,
        github_id: "Barbell_Bench_Press_-_Medium_Grip",
        activation_pct: 91
    },
    {
        id: "pec-deck-flye",
        name: "Aperturas en Pec Deck / Máquina",
        primary_muscle: "chest",
        anatomical_subdivision: "Haz Esternal Completo",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Pecho erguido. Aprieta codos hacia el centro sin empujar con los hombros.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Butterfly",
        activation_pct: 96
    },
    {
        id: "convergent-chest-press",
        name: "Press de Pecho en Máquina Convergente",
        primary_muscle: "chest",
        anatomical_subdivision: "Pecho Medio / Inferior",
        secondary_muscles: ["triceps"],
        equipment: "machine",
        movement_pattern: "horizontal_push",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Alinea las empuñaduras a la línea media del pezón. Estabilidad biomecánica máxima sin balanceo.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Cable_Chest_Press",
        activation_pct: 89
    },

    // --- DORSAL (LATS) ---
    {
        id: "lat-pulldown-neutral",
        name: "Jalón al Pecho con Agarre Neutro Unilateral",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ilíaco e Inferior",
        secondary_muscles: ["biceps"],
        equipment: "cable",
        movement_pattern: "vertical_pull",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Conduce el codo directo hacia la cadera. No arquees en exceso la columna baja.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Close-Grip_Front_Lat_Pulldown",
        activation_pct: 95
    },
    {
        id: "chest-supported-t-bar-row",
        name: "Remo en T con Soporte al Pecho (Agarre Cerrado)",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ancho & Espesor",
        secondary_muscles: ["biceps", "upper_back"],
        equipment: "machine",
        movement_pattern: "horizontal_pull",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Cero balanceo lumbar gracias al cojín. Tracciona pegando los codos a las costillas.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Lying_T-Bar_Row",
        activation_pct: 93
    },
    {
        id: "cable-pullover",
        name: "Pullover en Polea Alta con Cuerda / Barra",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ancho en Estiramiento",
        secondary_muscles: ["triceps"],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "A",
        biomechanical_cue: "Brazos semi-rígidos. Imagina barrer el piso con las manos hasta tocar los muslos.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Bent-Arm_Barbell_Pullover",
        activation_pct: 90
    },

    // --- ESPALDA ALTA (UPPER BACK) ---
    {
        id: "wide-grip-cable-row",
        name: "Remo Sentado en Polea (Agarre Ancho Prono)",
        primary_muscle: "upper_back",
        anatomical_subdivision: "Romboides y Trapecio Medio",
        secondary_muscles: ["delts", "biceps"],
        equipment: "cable",
        movement_pattern: "horizontal_pull",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Codos abiertos a 70°. Retracción escapular pronunciada con pausa isométrica de 1s.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Seated_Cable_Rows",
        activation_pct: 92
    },
    {
        id: "face-pull-cable",
        name: "Face Pull en Polea Doble Cuerda",
        primary_muscle: "upper_back",
        anatomical_subdivision: "Manguito Rotador y Deltoides Posterior",
        secondary_muscles: ["delts"],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Tira de la cuerda hacia los ojos mientras rotas externamente los hombros hacia atrás.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Face_Pull",
        activation_pct: 88
    },

    // --- HOMBRO / DELTOIDES (DELTS) ---
    {
        id: "cable-lateral-raise",
        name: "Elevaciones Laterales en Polea (A la altura de la muñeca)",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Lateral (Ancho de Hombros)",
        secondary_muscles: [],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Polea a la altura de la rodilla o cadera. Tensión constante desde el primer centímetro.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Side_Lateral_Raise",
        activation_pct: 97
    },
    {
        id: "seated-dumbbell-shoulder-press",
        name: "Press Militar Sentado con Mancuernas",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Anterior y Tríceps",
        secondary_muscles: ["triceps"],
        equipment: "dumbbell",
        movement_pattern: "incline_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Banca a 75° (no 90° para salvar el manguito). Baja hasta tocar ligeramente las hombreras.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Dumbbell_Shoulder_Press",
        activation_pct: 91
    },
    {
        id: "rear-delt-flye-cable",
        name: "Pájaros / Cruces de Polea para Deltoides Posterior",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Posterior",
        secondary_muscles: ["upper_back"],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Cruza las poleas sin accesorios (sujetando el cable directo). Abre en abanico a 45°.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Cable_Rear_Delt_Fly",
        activation_pct: 94
    },

    // --- CUÁDRICEPS (QUADS) ---
    {
        id: "hack-squat-machine",
        name: "Sentadilla Hack en Máquina",
        primary_muscle: "quads",
        anatomical_subdivision: "Vasto Lateral, Medial y Recto Femoral",
        secondary_muscles: ["glutes"],
        equipment: "machine",
        movement_pattern: "knee_dominant",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Pies bajos en la plataforma. Flexiona rodillas al máximo permitiendo que pasen la punta del pie sin despegar talones.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 150,
        target_rir: 1,
        github_id: "Hack_Squat",
        activation_pct: 96
    },
    {
        id: "leg-press-45",
        name: "Prensa de Piernas 45°",
        primary_muscle: "quads",
        anatomical_subdivision: "Vasto Lateral y Masa Cuadricipital",
        secondary_muscles: ["glutes"],
        equipment: "machine",
        movement_pattern: "knee_dominant",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "No bloquees las rodillas al subir. Mantén la pelvis pegada al respaldo para proteger las vértebras lumbares.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Leg_Press",
        activation_pct: 92
    },
    {
        id: "leg-extension-machine",
        name: "Extensión de Piernas en Máquina",
        primary_muscle: "quads",
        anatomical_subdivision: "Recto Femoral en Acortamiento",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Agarra con fuerza las asas laterales para fijar la cadera al asiento. Pausa de 1s arriba.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 75,
        target_rir: 0,
        github_id: "Leg_Extensions",
        activation_pct: 98
    },

    // --- ISQUIOTIBIALES (HAMSTRINGS) ---
    {
        id: "seated-leg-curl",
        name: "Curl Femoral Sentado en Máquina",
        primary_muscle: "hamstrings",
        anatomical_subdivision: "Isquiotibiales en Estiramiento de Cadera",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Científicamente superior al acostado. Inclina el torso ligeramente al frente para estirar el origen isquiático.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 0,
        github_id: "Seated_Leg_Curl",
        activation_pct: 97
    },
    {
        id: "romanian-deadlift-dumbbell",
        name: "Peso Muerto Rumano con Mancuernas (RDL)",
        primary_muscle: "hamstrings",
        anatomical_subdivision: "Cadena Posterior & Bíceps Femoral",
        secondary_muscles: ["glutes", "upper_back"],
        equipment: "dumbbell",
        movement_pattern: "hip_hinge",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Empuja la cadera hacia la pared de atrás. Mancuernas pegadas a las espinillas. Rodillas semiflexionadas fijas.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 2,
        github_id: "Romanian_Deadlift",
        activation_pct: 95
    },

    // --- GLÚTEOS (GLUTES) ---
    {
        id: "barbell-hip-thrust",
        name: "Hip Thrust con Barra / Máquina",
        primary_muscle: "glutes",
        anatomical_subdivision: "Glúteo Mayor (Máxima Contracción)",
        secondary_muscles: ["hamstrings"],
        equipment: "barbell",
        movement_pattern: "hip_hinge",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Mentón pegado al pecho. Retroversión pélvica arriba con bloqueo de 1 segundo.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Barbell_Hip_Thrust",
        activation_pct: 96
    },

    // --- BÍCEPS (BICEPS) ---
    {
        id: "incline-dumbbell-curl",
        name: "Curl Inclinado con Mancuernas (Banca 45°)",
        primary_muscle: "biceps",
        anatomical_subdivision: "Cabeza Larga (Pico del Bíceps)",
        secondary_muscles: [],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "El codo queda detrás del cuerpo todo el tiempo. Tensión máxima en estiramiento fascial.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 0,
        github_id: "Alternate_Incline_Dumbbell_Curl",
        activation_pct: 93
    },
    {
        id: "preacher-curl-machine",
        name: "Curl en Banco Scott / Predicador con Barra EZ o Máquina",
        primary_muscle: "biceps",
        anatomical_subdivision: "Cabeza Corta & Braquial",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Cero balanceo corporal. Controla la bajada excéntrica en 3 segundos completos.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 1,
        github_id: "Cable_Preacher_Curl",
        activation_pct: 95
    },

    // --- TRÍCEPS (TRICEPS) ---
    {
        id: "overhead-cable-triceps-extension",
        name: "Extensión de Tríceps Sobre la Cabeza en Polea",
        primary_muscle: "triceps",
        anatomical_subdivision: "Cabeza Larga del Tríceps",
        secondary_muscles: [],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Hombro en flexión total. Extiende los codos permitiendo estiramiento completo detrás de la nuca.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 0,
        github_id: "Cable_Incline_Triceps_Extension",
        activation_pct: 96
    },
    {
        id: "triceps-rope-pushdown",
        name: "Jalón de Tríceps en Polea con Cuerda",
        primary_muscle: "triceps",
        anatomical_subdivision: "Cabeza Lateral y Medial",
        secondary_muscles: [],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Separa las puntas de la cuerda al final del recorrido bloqueando los codos.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Triceps_Pushdown",
        activation_pct: 90
    },

    // --- PANTORRILLAS (CALVES) ---
    {
        id: "standing-calf-raise-machine",
        name: "Elevación de Talones de Pie en Máquina",
        primary_muscle: "calves",
        anatomical_subdivision: "Gastrocnemio (Gemelos)",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Rodillas completamente estiradas. PAUSA DE 2 SEGUNDOS en el fondo para eliminar el rebote del tendón de Aquiles.",
        default_sets: 4,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 0,
        github_id: "Standing_Calf_Raises",
        activation_pct: 94
    },

    // --- CORE / ABDOMEN ---
    {
        id: "cable-woodchopper-or-crunch",
        name: "Crunch en Polea Alta Arrodillado",
        primary_muscle: "core",
        anatomical_subdivision: "Recto Abdominal con Sobrecarga",
        secondary_muscles: [],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "No flexiones la cadera; flexiona la columna enrollando el pecho hacia la pelvis.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Cable_Crunch",
        activation_pct: 92
    }
];

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
export function findBiomechanicalSwaps(currentExerciseId: string): ExerciseItem[] {
    const current = EXERCISE_DATABASE.find(e => e.id === currentExerciseId);
    if (!current) return [];

    return EXERCISE_DATABASE.filter(
        e => e.id !== current.id &&
            (e.primary_muscle === current.primary_muscle || e.movement_pattern === current.movement_pattern)
    );
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

export function generateWeeklyProgram(
    daysPerWeek: number = 4,
    sessionDurationMins: number = 60,
    preferredCardio: string = "incline_treadmill"
): RoutineDay[] {
    const cardioProtocols: Record<string, { type: string; protocol: string }> = {
        incline_treadmill: {
            type: "Caminadora con Inclinación",
            protocol: "Zona 2: 12% Inclinación, 4.8 km/h. Sin sujetarse de los pasamanos."
        },
        stairmaster: {
            type: "Escaladora / StairMaster",
            protocol: "Zona 2: Nivel 5-7 cadencia constante. Mantén el torso vertical."
        },
        stationary_bike: {
            type: "Bicicleta Estática",
            protocol: "Zona 2: Resistencia media, 80-90 RPM continuas."
        },
        none: {
            type: "Sin cardio",
            protocol: "Recuperación activa."
        }
    };

    const cardioConfig = cardioProtocols[preferredCardio] || cardioProtocols.incline_treadmill;
    const cardioDuration = preferredCardio === "none" ? 0 : 20;

    // Base de patrones de movimiento por día
    const days: RoutineDay[] = [];

    // Patrones predefinidos para distribución de alta frecuencia
    const exercisePicksByPattern = {
        chest: EXERCISE_DATABASE.filter(e => e.primary_muscle === "chest"),
        lats: EXERCISE_DATABASE.filter(e => e.primary_muscle === "lats"),
        upper_back: EXERCISE_DATABASE.filter(e => e.primary_muscle === "upper_back"),
        quads: EXERCISE_DATABASE.filter(e => e.primary_muscle === "quads"),
        hamstrings: EXERCISE_DATABASE.filter(e => e.primary_muscle === "hamstrings"),
        delts: EXERCISE_DATABASE.filter(e => e.primary_muscle === "delts"),
        arms: EXERCISE_DATABASE.filter(e => e.primary_muscle === "biceps" || e.primary_muscle === "triceps"),
        calves: EXERCISE_DATABASE.filter(e => e.primary_muscle === "calves"),
    };

    const totalDays = Math.min(7, Math.max(2, daysPerWeek));

    for (let i = 1; i <= totalDays; i++) {
        let pickedExercises: ExerciseItem[] = [];

        // Full Body Alternado para máxima recuperación
        if (i % 2 === 1) {
            // Énfasis Empuje + Pierna Cuádriceps
            pickedExercises = [
                exercisePicksByPattern.chest[0],
                exercisePicksByPattern.quads[0],
                exercisePicksByPattern.lats[0],
                exercisePicksByPattern.delts[0],
                exercisePicksByPattern.arms.find(e => e.primary_muscle === "triceps")!,
                exercisePicksByPattern.calves[0]
            ].filter(Boolean);
        } else {
            // Énfasis Tracción + Cadena Posterior
            pickedExercises = [
                exercisePicksByPattern.upper_back[0],
                exercisePicksByPattern.hamstrings[0],
                exercisePicksByPattern.chest[1] || exercisePicksByPattern.chest[0],
                exercisePicksByPattern.quads[1] || exercisePicksByPattern.quads[0],
                exercisePicksByPattern.delts[1] || exercisePicksByPattern.delts[0],
                exercisePicksByPattern.arms.find(e => e.primary_muscle === "biceps")!
            ].filter(Boolean);
        }

        // Si la sesión es de 45 minutos, reducimos a los 4 compuestos primarios
        if (sessionDurationMins <= 45) {
            pickedExercises = pickedExercises.slice(0, 4);
        } else if (sessionDurationMins >= 90) {
            // Añadir accesorio de abdomen
            const coreEx = EXERCISE_DATABASE.find(e => e.primary_muscle === "core");
            if (coreEx && !pickedExercises.includes(coreEx)) {
                pickedExercises.push(coreEx);
            }
        }

        days.push({
            dayNumber: i,
            title: `Día ${i}: Full-Body Ondulante (Sesión ${i})`,
            focus: i % 2 === 1 ? "Énfasis Fuerza Empuje & Cuádriceps" : "Énfasis Densidad Tracción & Cadena Posterior",
            estimatedMinutes: sessionDurationMins,
            exercises: pickedExercises,
            cardio: {
                type: cardioConfig.type,
                durationMinutes: cardioDuration,
                protocol: cardioConfig.protocol
            }
        });
    }

    return days;
}
