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
        name: "Cruces en Polea / Press Convergente",
        primary_muscle: "chest",
        anatomical_subdivision: "Pecho Medio / Inferior",
        secondary_muscles: ["triceps"],
        equipment: "cable",
        movement_pattern: "horizontal_push",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Alinea las empuñaduras a la línea media del pezón. Estabilidad biomecánica máxima.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Cable_Chest_Press",
        activation_pct: 89
    },
    {
        id: "chest-dips",
        name: "Fondos en Paralelas para Pecho",
        primary_muscle: "chest",
        anatomical_subdivision: "Pectoral Inferior y Tríceps",
        secondary_muscles: ["triceps", "delts"],
        equipment: "bodyweight",
        movement_pattern: "vertical_push",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Inclina el torso 30° hacia adelante. Desciende hasta 90° en los codos sintiendo el estiramiento pectoral.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Dips_-_Chest_Version",
        activation_pct: 92
    },
    {
        id: "decline-barbell-bench-press",
        name: "Press Declinado con Barra",
        primary_muscle: "chest",
        anatomical_subdivision: "Pectoral Inferior",
        secondary_muscles: ["triceps"],
        equipment: "barbell",
        movement_pattern: "horizontal_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "A",
        biomechanical_cue: "Banca a 15-20° de declive. Menor estrés en el manguito rotador y mayor sobrecarga en el haz costal.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Decline_Barbell_Bench_Press",
        activation_pct: 88
    },

    // --- DORSAL (LATS) & ESPALDA ---
    {
        id: "lat-pulldown-neutral",
        name: "Jalón al Pecho con Agarre Cerrado",
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
        id: "bent-over-barbell-row",
        name: "Remo Inclinado con Barra Prona",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ancho & Espesor Espinal",
        secondary_muscles: ["upper_back", "biceps"],
        equipment: "barbell",
        movement_pattern: "horizontal_pull",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Torso a 45°. Tracciona llevando la barra hacia el ombligo manteniendo columna neutra.",
        default_sets: 3,
        rep_range_min: 6,
        rep_range_max: 8,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Bent_Over_Barbell_Row",
        activation_pct: 94
    },
    {
        id: "chest-supported-t-bar-row",
        name: "Remo en T con Soporte al Pecho",
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
        name: "Pullover en Polea Alta con Barra",
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
    {
        id: "weighted-pull-ups",
        name: "Dominadas con Lastre / Peso Corporal",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ancho & Redondo Mayor",
        secondary_muscles: ["biceps", "upper_back"],
        equipment: "bodyweight",
        movement_pattern: "vertical_pull",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Tracción vertical completa con parada de 1s en la parte baja sin balanceo.",
        default_sets: 3,
        rep_range_min: 6,
        rep_range_max: 8,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Weighted_Pull_Ups",
        activation_pct: 96
    },
    {
        id: "one-arm-dumbbell-row",
        name: "Remo Unilateral con Mancuerna",
        primary_muscle: "lats",
        anatomical_subdivision: "Dorsal Ancho Unilateral",
        secondary_muscles: ["biceps", "upper_back"],
        equipment: "dumbbell",
        movement_pattern: "horizontal_pull",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Lleva la mancuerna hacia la cadera en arco parabólico. Estiramiento completo abajo.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "One-Arm_Dumbbell_Row",
        activation_pct: 93
    },

    // --- ESPALDA ALTA (UPPER BACK) ---
    {
        id: "wide-grip-cable-row",
        name: "Remo Sentado en Polea Baja",
        primary_muscle: "upper_back",
        anatomical_subdivision: "Romboides y Trapecio Medio",
        secondary_muscles: ["delts", "biceps"],
        equipment: "cable",
        movement_pattern: "horizontal_pull",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Codos abiertos a 70°. Retracción escapular pronunciada con pausa de 1s.",
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
        name: "Face Pull en Polea con Cuerda",
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
        github_id: "Cable_Rope_Rear-Delt_Rows",
        activation_pct: 88
    },

    // --- HOMBRO / DELTOIDES (DELTS) ---
    {
        id: "cable-lateral-raise",
        name: "Elevaciones Laterales con Mancuerna",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Lateral (Ancho de Hombros)",
        secondary_muscles: [],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Lanza las mancuernas hacia las esquinas del cuarto en el plano escapular.",
        default_sets: 4,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Side_Lateral_Raise",
        activation_pct: 97
    },
    {
        id: "seated-dumbbell-shoulder-press",
        name: "Press Militar con Barra de Pie",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Anterior y Tríceps",
        secondary_muscles: ["triceps"],
        equipment: "barbell",
        movement_pattern: "incline_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Glúteos y abdomen apretados. Empuja vertical sin arquear la zona lumbar.",
        default_sets: 3,
        rep_range_min: 6,
        rep_range_max: 8,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Barbell_Shoulder_Press",
        activation_pct: 91
    },
    {
        id: "seated-dumbbell-press",
        name: "Press Militar Sentado con Mancuernas",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Anterior",
        secondary_muscles: ["triceps"],
        equipment: "dumbbell",
        movement_pattern: "incline_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Banca a 75°. Rango completo de movimiento tocando suavemente la altura de la barbilla.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Dumbbell_Shoulder_Press",
        activation_pct: 90
    },
    {
        id: "rear-delt-flye-cable",
        name: "Cruces en Polea para Deltoides Posterior",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Posterior",
        secondary_muscles: ["upper_back"],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Abre en abanico sin doblar los codos manteniendo la tensión en el hombro posterior.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Cable_Rear_Delt_Fly",
        activation_pct: 94
    },
    {
        id: "rear-delt-dumbbell-flye",
        name: "Pájaros Posteriores con Mancuerna",
        primary_muscle: "delts",
        anatomical_subdivision: "Deltoides Posterior & Trapecio",
        secondary_muscles: ["upper_back"],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "A",
        biomechanical_cue: "Torso paralelo al suelo. Eleva los codos hacia afuera con control excéntrico.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Dumbbell_Lying_Rear_Lateral_Raise",
        activation_pct: 90
    },

    // --- CUÁDRICEPS (QUADS) ---
    {
        id: "barbell-back-squat",
        name: "Sentadilla Libre Trasera con Barra",
        primary_muscle: "quads",
        anatomical_subdivision: "Complejo Cuadricipital & Cadera",
        secondary_muscles: ["glutes", "hamstrings"],
        equipment: "barbell",
        movement_pattern: "knee_dominant",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Profundidad rompiendo el paralelo. Empuja el piso con todo el pie sin levantar talones.",
        default_sets: 3,
        rep_range_min: 6,
        rep_range_max: 8,
        rest_seconds: 180,
        target_rir: 2,
        github_id: "Barbell_Full_Squat",
        activation_pct: 95
    },
    {
        id: "leg-press-45",
        name: "Prensa de Piernas a 45°",
        primary_muscle: "quads",
        anatomical_subdivision: "Vasto Lateral y Medial",
        secondary_muscles: ["glutes"],
        equipment: "machine",
        movement_pattern: "knee_dominant",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "No bloquees las rodillas al subir. Mantén la pelvis pegada al respaldo.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 120,
        target_rir: 1,
        github_id: "Leg_Press",
        activation_pct: 92
    },
    {
        id: "hack-squat-machine",
        name: "Sentadilla Hack con Barra / Máquina",
        primary_muscle: "quads",
        anatomical_subdivision: "Vasto Lateral y Recto Femoral",
        secondary_muscles: ["glutes"],
        equipment: "machine",
        movement_pattern: "knee_dominant",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Flexiona rodillas al máximo permitiendo avance de rodilla controlado para estiramiento cuadricipital.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 150,
        target_rir: 1,
        github_id: "Barbell_Hack_Squat",
        activation_pct: 96
    },
    {
        id: "leg-extension-machine",
        name: "Extensión de Cuádriceps en Máquina",
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
    {
        id: "dumbbell-walking-lunges",
        name: "Zancadas / Desplantes con Mancuernas",
        primary_muscle: "quads",
        anatomical_subdivision: "Cuádriceps, Glúteo & Aductores",
        secondary_muscles: ["glutes"],
        equipment: "dumbbell",
        movement_pattern: "knee_dominant",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Paso largo manteniendo torso ligeramente inclinado al frente para sobrecarga de cadera y rodilla.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Dumbbell_Lunges",
        activation_pct: 91
    },

    // --- ISQUIOTIBIALES & GLÚTEOS (HAMSTRINGS / GLUTES) ---
    {
        id: "romanian-deadlift-barbell",
        name: "Peso Muerto Rumano con Barra (RDL)",
        primary_muscle: "hamstrings",
        anatomical_subdivision: "Cadena Posterior & Bíceps Femoral",
        secondary_muscles: ["glutes", "upper_back"],
        equipment: "barbell",
        movement_pattern: "hip_hinge",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Empuja la cadera hacia atrás con rodillas semi-rígidas. Siente la tensión profunda en los isquios.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 120,
        target_rir: 2,
        github_id: "Romanian_Deadlift",
        activation_pct: 96
    },
    {
        id: "lying-leg-curl-machine",
        name: "Curl Femoral Tumbado en Máquina",
        primary_muscle: "hamstrings",
        anatomical_subdivision: "Bíceps Femoral y Semitendinoso",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Mantén la cadera firmemente apoyada en el cojín sin arquear la zona lumbar al flexionar rodillas.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 0,
        github_id: "Lying_Leg_Curls",
        activation_pct: 93
    },
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
        biomechanical_cue: "Inclina el torso ligeramente al frente para estirar el origen isquiático.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 0,
        github_id: "Seated_Leg_Curl",
        activation_pct: 97
    },
    {
        id: "barbell-deadlift",
        name: "Peso Muerto Convencional con Barra",
        primary_muscle: "hamstrings",
        anatomical_subdivision: "Cadena Posterior Total & Erectores",
        secondary_muscles: ["glutes", "upper_back", "quads"],
        equipment: "barbell",
        movement_pattern: "hip_hinge",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Empuja el suelo con las piernas antes de extender la cadera. Bloqueo neutro sin hiperextensión.",
        default_sets: 3,
        rep_range_min: 5,
        rep_range_max: 6,
        rest_seconds: 180,
        target_rir: 2,
        github_id: "Barbell_Deadlift",
        activation_pct: 95
    },
    {
        id: "barbell-hip-thrust",
        name: "Hip Thrust con Barra / Puente de Glúteos",
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
        github_id: "Barbell_Glute_Bridge",
        activation_pct: 96
    },

    // --- BÍCEPS (BICEPS) ---
    {
        id: "dumbbell-bicep-curl",
        name: "Curl de Bíceps con Mancuernas Supino",
        primary_muscle: "biceps",
        anatomical_subdivision: "Cabeza Corta y Larga",
        secondary_muscles: [],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Supina la muñeca activamente en el punto medio del ascenso. Codos pegados a los costados.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 1,
        github_id: "Dumbbell_Bicep_Curl",
        activation_pct: 92
    },
    {
        id: "barbell-curl",
        name: "Curl de Bíceps con Barra Recta",
        primary_muscle: "biceps",
        anatomical_subdivision: "Masa Completa del Bíceps",
        secondary_muscles: [],
        equipment: "barbell",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Agarre al ancho de hombros. Evita balanceo del torso; controla la bajada en 3 segundos.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Barbell_Curl",
        activation_pct: 94
    },
    {
        id: "alternate-hammer-curl",
        name: "Curl Martillo Alterno con Mancuerna",
        primary_muscle: "biceps",
        anatomical_subdivision: "Braquial Anterior & Braquiorradial",
        secondary_muscles: [],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Agarre neutro (palmas enfrentadas). Aumenta el grosor transversal del brazo.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Alternate_Hammer_Curl",
        activation_pct: 91
    },
    {
        id: "preacher-curl-machine",
        name: "Curl en Banco Predicador / Scott",
        primary_muscle: "biceps",
        anatomical_subdivision: "Cabeza Corta (Pico y Densidad)",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Brazos fijos en el soporte inclinado. Contracción concéntrica controlada sin despegue de codos.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 0,
        github_id: "Preacher_Curl",
        activation_pct: 95
    },
    {
        id: "incline-dumbbell-curl",
        name: "Curl Inclinado con Mancuernas (45°)",
        primary_muscle: "biceps",
        anatomical_subdivision: "Cabeza Larga en Máximo Estiramiento",
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

    // --- TRÍCEPS (TRICEPS) ---
    {
        id: "triceps-pushdown",
        name: "Extensión de Tríceps en Polea",
        primary_muscle: "triceps",
        anatomical_subdivision: "Cabeza Lateral y Medial",
        secondary_muscles: [],
        equipment: "cable",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Codos inmóviles pegados al torso. Bloqueo articular completo abajo con separación activa.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 60,
        target_rir: 0,
        github_id: "Triceps_Pushdown",
        activation_pct: 94
    },
    {
        id: "lying-triceps-press-skull-crusher",
        name: "Press Francés con Barra EZ (Skull Crusher)",
        primary_muscle: "triceps",
        anatomical_subdivision: "Cabeza Larga y Medial",
        secondary_muscles: [],
        equipment: "barbell",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Baja la barra hacia la coronilla o detrás de la cabeza para maximizar el estiramiento de la cabeza larga.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 10,
        rest_seconds: 90,
        target_rir: 1,
        github_id: "Lying_Triceps_Press",
        activation_pct: 95
    },
    {
        id: "bench-dips",
        name: "Fondos en Banco para Tríceps",
        primary_muscle: "triceps",
        anatomical_subdivision: "Tríceps Completo",
        secondary_muscles: ["chest", "delts"],
        equipment: "bodyweight",
        movement_pattern: "vertical_push",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "A",
        biomechanical_cue: "Espalda pegada al borde del banco. Descenso hasta 90 grados y extensión rápida de codos.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Bench_Dips",
        activation_pct: 89
    },
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
        id: "dumbbell-tricep-kickback-overhead",
        name: "Extensión Copa de Tríceps con Mancuerna",
        primary_muscle: "triceps",
        anatomical_subdivision: "Cabeza Larga del Tríceps",
        secondary_muscles: [],
        equipment: "dumbbell",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "A",
        biomechanical_cue: "Sujeta la mancuerna con ambas manos tras la cabeza. Rango profundo vertical.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 1,
        github_id: "Lying_Dumbbell_Tricep_Extension",
        activation_pct: 88
    },

    // --- PANTORRILLAS (CALVES) ---
    {
        id: "standing-calf-raise-machine",
        name: "Elevación de Talones de Pie",
        primary_muscle: "calves",
        anatomical_subdivision: "Gastrocnemio (Gemelos)",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Rodillas completamente estiradas. PAUSA DE 2 SEGUNDOS en el fondo para eliminar rebote del tendón.",
        default_sets: 4,
        rep_range_min: 10,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 0,
        github_id: "Standing_Calf_Raises",
        activation_pct: 94
    },
    {
        id: "seated-calf-raise-machine",
        name: "Elevación de Talones Sentado (Sóleo)",
        primary_muscle: "calves",
        anatomical_subdivision: "Sóleo",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "S",
        biomechanical_cue: "Rodillas a 90°. El sóleo asume el 85% de la carga con la rodilla flexionada.",
        default_sets: 4,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 75,
        target_rir: 0,
        github_id: "Barbell_Seated_Calf_Raise",
        activation_pct: 92
    },

    // --- CORE / ABDOMEN ---
    {
        id: "ab-crunch-machine",
        name: "Crunch Abdominal con Carga en Máquina",
        primary_muscle: "core",
        anatomical_subdivision: "Recto Abdominal Superior",
        secondary_muscles: [],
        equipment: "machine",
        movement_pattern: "isolation",
        resistance_profile: "shortened_peak",
        hypertrophy_tier: "S",
        biomechanical_cue: "Flexiona el torso enrollando las costillas hacia la pelvis. Exhalación completa al cerrar.",
        default_sets: 3,
        rep_range_min: 12,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Ab_Crunch_Machine",
        activation_pct: 95
    },
    {
        id: "hanging-leg-raise",
        name: "Elevación de Piernas Colgado",
        primary_muscle: "core",
        anatomical_subdivision: "Recto Abdominal Inferior",
        secondary_muscles: [],
        equipment: "bodyweight",
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "No te balances. Lleva las rodillas o pies hacia el pecho contrayendo el abdomen.",
        default_sets: 3,
        rep_range_min: 10,
        rep_range_max: 15,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Hanging_Leg_Raise",
        activation_pct: 94
    },
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
    },
    {
        id: "ab-roller",
        name: "Rueda Abdominal / Ab Roller",
        primary_muscle: "core",
        anatomical_subdivision: "Pared Abdominal & Anti-Extensión",
        secondary_muscles: [],
        equipment: "other" as any,
        movement_pattern: "isolation",
        resistance_profile: "lengthened_bias",
        hypertrophy_tier: "S",
        biomechanical_cue: "Mantén la pelvis en retroversión. Rueda hacia adelante hasta el estiramiento máximo controlado.",
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 75,
        target_rir: 1,
        github_id: "Ab_Roller",
        activation_pct: 97
    },
    {
        id: "plank",
        name: "Plancha Abdominal Isométrica",
        primary_muscle: "core",
        anatomical_subdivision: "Transverso Abdominal & Estabilidad",
        secondary_muscles: [],
        equipment: "bodyweight",
        movement_pattern: "isolation",
        resistance_profile: "mid_range_overload",
        hypertrophy_tier: "A",
        biomechanical_cue: "Aprieta glúteos y cuádriceps. Línea recta perfecta desde los talones hasta la cabeza.",
        default_sets: 3,
        rep_range_min: 45,
        rep_range_max: 60,
        rest_seconds: 60,
        target_rir: 1,
        github_id: "Plank",
        activation_pct: 88
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

export type CardioType = "incline_treadmill" | "stairmaster" | "stationary_bike" | "none";

export interface CardioProtocolInfo {
    id: CardioType;
    label: string;
    type: string;
    protocol: string;
    defaultMinutes: number;
}

export const CARDIO_PROTOCOLS: Record<CardioType, CardioProtocolInfo> = {
    incline_treadmill: {
        id: "incline_treadmill",
        label: "Caminadora",
        type: "Caminadora con Inclinación",
        protocol: "Zona 2: 12% Inclinación, 4.8 km/h. Sin sujetarse de los pasamanos para reclutar cadena posterior.",
        defaultMinutes: 20
    },
    stairmaster: {
        id: "stairmaster",
        label: "Escaladora",
        type: "Escaladora / StairMaster",
        protocol: "Zona 2: Nivel 5-7 con cadencia constante. Mantén el torso vertical y apoya toda la planta del pie.",
        defaultMinutes: 15
    },
    stationary_bike: {
        id: "stationary_bike",
        label: "Bicicleta",
        type: "Bicicleta Estática",
        protocol: "Zona 2: Resistencia media, 80-90 RPM continuas. Cero impacto articular en rodillas y columna.",
        defaultMinutes: 20
    },
    none: {
        id: "none",
        label: "Sin cardio hoy",
        type: "Sin cardio",
        protocol: "Sesión 100% hipertrofia y tensión mecánica. Descanso metabólico para optimizar recuperación.",
        defaultMinutes: 0
    }
};

export function generateWeeklyProgram(
    daysPerWeek: number = 4,
    sessionDurationMins: number = 60,
    preferredCardio: string = "incline_treadmill"
): RoutineDay[] {
    const cardioConfig = CARDIO_PROTOCOLS[preferredCardio as CardioType] || CARDIO_PROTOCOLS.incline_treadmill;
    const cardioDuration = cardioConfig.defaultMinutes;

    // Helper para buscar ejercicios garantizados por ID
    const getEx = (id: string): ExerciseItem => {
        const found = EXERCISE_DATABASE.find(e => e.id === id);
        if (!found) {
            // Fallback al primer ejercicio si no se encuentra
            return EXERCISE_DATABASE[0];
        }
        return found;
    };

    // Plan Maestro de 7 Días con CERO ejercicios repetidos
    const masterDailyTemplates = [
        {
            title: "Día 1: Empuje A (Pectoral Superior, Tríceps & Deltoides Lateral)",
            focus: "Sobrecarga Progresiva en Banco & Estabilidad Glenohumeral",
            primaryExerciseIds: [
                "incline-dumbbell-press",
                "barbell-bench-press",
                "cable-lateral-raise",
                "triceps-pushdown",
                "chest-dips",
                "ab-crunch-machine"
            ],
            bonus90MinExerciseId: "decline-barbell-bench-press"
        },
        {
            title: "Día 2: Tracción A (Dorsales, Espalda Alta & Flexores de Codo)",
            focus: "Amplitud Dorsal en Plano Sagital & Densidad Escapular",
            primaryExerciseIds: [
                "lat-pulldown-neutral",
                "bent-over-barbell-row",
                "wide-grip-cable-row",
                "dumbbell-bicep-curl",
                "face-pull-cable",
                "alternate-hammer-curl"
            ],
            bonus90MinExerciseId: "cable-pullover"
        },
        {
            title: "Día 3: Pierna A (Cuádriceps Dominante & Pantorrillas)",
            focus: "Profundidad de Sentadilla & Tensión Mecánica en Extensión",
            primaryExerciseIds: [
                "barbell-back-squat",
                "leg-press-45",
                "leg-extension-machine",
                "dumbbell-walking-lunges",
                "standing-calf-raise-machine",
                "hanging-leg-raise"
            ],
            bonus90MinExerciseId: "plank"
        },
        {
            title: "Día 4: Empuje B (Hombro Fuerza, Pectoral Aislado & Cabeza Larga)",
            focus: "Pico de Tensión en Longitud Muscular & Press Militar",
            primaryExerciseIds: [
                "seated-dumbbell-shoulder-press",
                "pec-deck-flye",
                "convergent-chest-press",
                "lying-triceps-press-skull-crusher",
                "overhead-cable-triceps-extension",
                "cable-woodchopper-or-crunch"
            ],
            bonus90MinExerciseId: "dumbbell-tricep-kickback-overhead"
        },
        {
            title: "Día 5: Tracción B (Cadena Posterior, Remo con Apoyo & Bíceps Braquial)",
            focus: "Bisagra de Cadera Pesada & Tracciones Horizontales Estables",
            primaryExerciseIds: [
                "barbell-deadlift",
                "chest-supported-t-bar-row",
                "weighted-pull-ups",
                "romanian-deadlift-barbell",
                "preacher-curl-machine",
                "rear-delt-flye-cable"
            ],
            bonus90MinExerciseId: "rear-delt-dumbbell-flye"
        },
        {
            title: "Día 6: Piernas B & Brazos Hipertrofia (Isquiosurales, Glúteos & Brazos)",
            focus: "Flexión de Rodilla Aislada, Hip Thrust & Superconjuntos de Brazos",
            primaryExerciseIds: [
                "hack-squat-machine",
                "lying-leg-curl-machine",
                "barbell-hip-thrust",
                "barbell-curl",
                "bench-dips",
                "seated-calf-raise-machine"
            ],
            bonus90MinExerciseId: "incline-dumbbell-curl"
        },
        {
            title: "Día 7: Rebalance Metabólico & Deltoides Posterior (Atleta Élite)",
            focus: "Aislamiento en Estiramiento Máximo, Vasto Lateral & Anti-Extensión Core",
            primaryExerciseIds: [
                "seated-leg-curl",
                "one-arm-dumbbell-row",
                "seated-dumbbell-press",
                "cable-pullover",
                "incline-dumbbell-curl",
                "ab-roller"
            ],
            bonus90MinExerciseId: "plank"
        }
    ];

    const totalDays = Math.min(7, Math.max(2, daysPerWeek));
    const days: RoutineDay[] = [];

    for (let i = 0; i < totalDays; i++) {
        const template = masterDailyTemplates[i];
        let pickedExercises: ExerciseItem[] = template.primaryExerciseIds.map(getEx);

        // Ajuste inteligente según tiempo de sesión
        if (sessionDurationMins <= 45) {
            // Primeros 4 ejercicios compuestos clave
            pickedExercises = pickedExercises.slice(0, 4);
        } else if (sessionDurationMins >= 90 && template.bonus90MinExerciseId) {
            // Añadir ejercicio de volumen adicional de alta hipertrofia
            const bonusEx = getEx(template.bonus90MinExerciseId);
            if (bonusEx && !pickedExercises.some(e => e.id === bonusEx.id)) {
                pickedExercises.push(bonusEx);
            }
        }

        days.push({
            dayNumber: i + 1,
            title: template.title,
            focus: template.focus,
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
