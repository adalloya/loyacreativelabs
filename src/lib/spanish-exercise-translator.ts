// src/lib/spanish-exercise-translator.ts
// ========================================================================
// APEX HYPERTROPHY OS - DICCIONARIO Y MOTOR DE TRADUCCIÓN A ESPAÑOL
// ========================================================================

/**
 * Mapeo directo exacto para los ejercicios más frecuentes y emblemáticos.
 */
const DIRECT_EXERCISE_SPANISH_MAP: Record<string, string> = {
    // Pectoral (Pecho)
    "barbell bench press - medium grip": "Press de Banca con Barra (Agarre Medio)",
    "barbell bench press": "Press de Banca con Barra",
    "incline dumbbell press": "Press Inclinado con Mancuernas",
    "decline dumbbell press": "Press Declinado con Mancuernas",
    "flat dumbbell bench press": "Press Plano con Mancuernas",
    "dumbbell bench press": "Press Plano con Mancuernas",
    "incline barbell bench press": "Press Inclinado con Barra",
    "decline barbell bench press": "Press Declinado con Barra",
    "incline dumbbell flyes": "Aperturas Inclinadas con Mancuernas",
    "flat dumbbell flyes": "Aperturas Planas con Mancuernas",
    "cable crossover": "Cruces en Polea para Pecho",
    "cable chest press": "Press de Pecho en Polea",
    "machine bench press": "Press de Pecho en Máquina",
    "butterfly": "Aperturas en Pec Deck",
    "pec deck": "Aperturas en Pec Deck",
    "dips - chest version": "Fondos en Paralelas (Enfoque Pecho)",
    "pushups": "Flexiones de Pecho (Lagartijas)",
    "push-ups": "Flexiones de Pecho (Lagartijas)",
    "pushup": "Flexión de Pecho",
    "push-up": "Flexión de Pecho",

    // Espalda y Dorsales
    "bent over barbell row": "Remo Inclinado con Barra",
    "close-grip front lat pulldown": "Jalón al Pecho (Agarre Cerrado)",
    "wide-grip lat pulldown": "Jalón al Pecho (Agarre Ancho)",
    "lat pulldown": "Jalón al Pecho",
    "seated cable rows": "Remo Sentado en Polea",
    "one-arm dumbbell row": "Remo Unilateral con Mancuerna",
    "weighted pull ups": "Dominadas con Lastre",
    "pullups": "Dominadas",
    "pull-ups": "Dominadas",
    "pullup": "Dominada",
    "pull-up": "Dominada",
    "chinups": "Dominadas Supinas",
    "chin-ups": "Dominadas Supinas",
    "t-bar row with handle": "Remo en Barra T con Agarre",
    "bent-arm barbell pullover": "Pullover con Barra",

    // Pierna (Cuádriceps, Isquios, Glúteos)
    "barbell full squat": "Sentadilla con Barra",
    "barbell squat": "Sentadilla con Barra",
    "front barbell squat": "Sentadilla Frontal con Barra",
    "hack squat": "Sentadilla Hack",
    "barbell hack squat": "Sentadilla Hack con Barra",
    "smith machine squat": "Sentadilla en Máquina Smith",
    "leg press": "Prensa de Piernas",
    "leg extensions": "Extensiones de Cuádriceps",
    "lying leg curls": "Curl Femoral Tumbado",
    "seated leg curl": "Curl Femoral Sentado",
    "romanian deadlift": "Peso Muerto Rumano",
    "stiff-legged deadlift": "Peso Muerto Piernas Rígidas",
    "barbell deadlift": "Peso Muerto con Barra",
    "sumo deadlift": "Peso Muerto Sumo",
    "dumbbell lunges": "Zancadas con Mancuernas",
    "split squat with dumbbells": "Sentadilla Búlgara con Mancuernas",
    "bulgarian split squat": "Sentadilla Búlgara",
    "barbell glute bridge": "Puente de Glúteos con Barra",
    "barbell hip thrust": "Hip Thrust con Barra",
    "hip thrust": "Hip Thrust (Empuje de Cadera)",
    "standing calf raises": "Elevación de Talones de Pie",
    "seated calf raise": "Elevación de Talones Sentado",
    "barbell seated calf raise": "Elevación de Talones Sentado con Barra",

    // Hombros (Deltoides)
    "standing dumbbell shoulder press": "Press Militar de Pie con Mancuernas",
    "barbell shoulder press": "Press Militar con Barra",
    "seated dumbbell press": "Press de Hombros Sentado con Mancuernas",
    "arnold dumbbell press": "Press Arnold con Mancuernas",
    "side lateral raise": "Elevaciones Laterales con Mancuernas",
    "side lateral raises": "Elevaciones Laterales con Mancuernas",
    "front dumbbell raise": "Elevaciones Frontales con Mancuernas",
    "rear delt raises": "Pájaros Posteriores (Deltoides)",
    "rear delt flyes": "Pájaros Posteriores en Máquina",
    "cable rope rear-delt rows": "Face Pull en Polea con Cuerda",
    "face pull": "Face Pull (Jalón al Rostro)",
    "upright barbell row": "Remo al Mentón con Barra",

    // Brazos: Bíceps y Tríceps
    "dumbbell bicep curl": "Curl de Bíceps con Mancuernas",
    "barbell curl": "Curl con Barra",
    "alternate hammer curl": "Curl Martillo Alternado",
    "hammer curls": "Curl Martillo con Mancuernas",
    "preacher curl": "Curl Predicador en Banco Scott",
    "incline dumbbell curl": "Curl Inclinado con Mancuernas",
    "cable hammer curls - rope attachment": "Curl Martillo en Polea con Cuerda",
    "triceps pushdown": "Extensión de Tríceps en Polea",
    "triceps pushdown - rope attachment": "Extensión de Tríceps en Polea con Cuerda",
    "lying triceps press": "Press Francés (Skull Crusher)",
    "bench dips": "Fondos en Banco",
    "dips - triceps version": "Fondos en Paralelas (Enfoque Tríceps)",
    "seated triceps press": "Extensión de Tríceps Sentado sobre la Cabeza",

    // Core & Abdomen
    "ab crunch machine": "Crunch en Máquina Abdominal",
    "hanging leg raise": "Elevación de Piernas Colgado",
    "plank": "Plancha Abdominal",
    "side plank": "Plancha Lateral",
    "ab roller": "Rueda Abdominal (Ab Roller)",
    "air bike": "Bicicleta Aérea (Air Bike)",
    "cable crunch": "Crunch en Polea Alta",
    "russian twist": "Giro Ruso (Russian Twist)",
    "mountain climbers": "Escaladores (Mountain Climbers)"
};

// Caché en memoria para no recalcular
const TRANSLATION_CACHE = new Map<string, string>();

/**
 * Traduce cualquier nombre de ejercicio en inglés al español gramaticalmente correcto.
 */
export function translateExerciseNameToSpanish(englishName: string): string {
    if (!englishName) return "";
    const trimmed = englishName.trim();
    const key = trimmed.toLowerCase();

    // 1. Consulta en caché
    if (TRANSLATION_CACHE.has(key)) {
        return TRANSLATION_CACHE.get(key)!;
    }

    // 2. Mapeo directo exacto
    if (DIRECT_EXERCISE_SPANISH_MAP[key]) {
        const direct = DIRECT_EXERCISE_SPANISH_MAP[key];
        TRANSLATION_CACHE.set(key, direct);
        return direct;
    }

    // 3. Transformador gramatical inteligente (Acción + Modificador + Posición + Implemento)
    let text = trimmed;

    // Detectar implemento
    let equipment = "";
    if (/\bbarbell\b/i.test(text)) equipment = "con Barra";
    else if (/\bdumbbells?\b/i.test(text)) equipment = "con Mancuernas";
    else if (/\bcables?\b/i.test(text)) equipment = "en Polea";
    else if (/\bsmith machine\b/i.test(text)) equipment = "en Máquina Smith";
    else if (/\bsmith\b/i.test(text)) equipment = "en Smith";
    else if (/\bmachines?\b/i.test(text)) equipment = "en Máquina";
    else if (/\bkettlebells?\b/i.test(text)) equipment = "con Pesa Rusa";
    else if (/\bbands?\b/i.test(text)) equipment = "con Banda";

    // Detectar postura / inclinación
    let posture = "";
    if (/\bincline\b/i.test(text)) posture = "Inclinado";
    else if (/\bdecline\b/i.test(text)) posture = "Declinado";
    else if (/\bseated\b/i.test(text)) posture = "Sentado";
    else if (/\bstanding\b/i.test(text)) posture = "de Pie";
    else if (/\blying\b/i.test(text)) posture = "Tumbado";
    else if (/\bkneeling\b/i.test(text)) posture = "de Rodillas";

    // Detectar uniteralidad
    let unilateral = "";
    if (/\b(one-arm|single-arm|one arm)\b/i.test(text)) unilateral = "Unilateral";
    else if (/\b(one-leg|single-leg|one leg)\b/i.test(text)) unilateral = "a Una Pierna";
    else if (/\balternat(ing|e)\b/i.test(text)) unilateral = "Alternado";

    // Detectar movimiento base
    let action = "";
    if (/\bbench press\b/i.test(text)) action = "Press de Banca";
    else if (/\bshoulder press\b/i.test(text) || /\bmilitary press\b/i.test(text) || /\boverhead press\b/i.test(text)) action = "Press Militar";
    else if (/\bchest press\b/i.test(text)) action = "Press de Pecho";
    else if (/\bleg press\b/i.test(text)) action = "Prensa de Piernas";
    else if (/\bpress\b/i.test(text)) action = "Press";
    else if (/\bhack squat\b/i.test(text)) action = "Sentadilla Hack";
    else if (/\bfront squat\b/i.test(text)) action = "Sentadilla Frontal";
    else if (/\bsquats?\b/i.test(text)) action = "Sentadilla";
    else if (/\bdeadlifts?\b/i.test(text)) action = "Peso Muerto";
    else if (/\bleg extensions?\b/i.test(text)) action = "Extensiones de Cuádriceps";
    else if (/\bleg curls?\b/i.test(text)) action = "Curl Femoral";
    else if (/\bcalf raises?\b/i.test(text)) action = "Elevación de Talones";
    else if (/\bhammer curls?\b/i.test(text)) action = "Curl Martillo";
    else if (/\bpreacher curls?\b/i.test(text)) action = "Curl Predicador";
    else if (/\bbiceps? curls?\b/i.test(text) || /\bcurls?\b/i.test(text)) action = "Curl de Bíceps";
    else if (/\bpushdowns?\b/i.test(text)) action = "Extensión de Tríceps (Pushdown)";
    else if (/\blat pulldowns?\b/i.test(text)) action = "Jalón al Pecho";
    else if (/\bpulldowns?\b/i.test(text)) action = "Jalón";
    else if (/\blateral raises?\b/i.test(text)) action = "Elevaciones Laterales";
    else if (/\bfront raises?\b/i.test(text)) action = "Elevaciones Frontales";
    else if (/\brear delt\b/i.test(text)) action = "Pájaros Posteriores";
    else if (/\bflyes?\b/i.test(text) || /\bflys\b/i.test(text)) action = "Aperturas";
    else if (/\brows?\b/i.test(text)) action = "Remo";
    else if (/\bpullovers?\b/i.test(text)) action = "Pullover";
    else if (/\blunges?\b/i.test(text)) action = "Zancadas";
    else if (/\bcrunches?\b/i.test(text)) action = "Crunch Abdominal";
    else if (/\bleg raises?\b/i.test(text)) action = "Elevación de Piernas";
    else if (/\bshrugs?\b/i.test(text)) action = "Encogimiento de Trapecio";
    else if (/\bclean\b/i.test(text)) action = "Cargada (Clean)";
    else if (/\bsnatch\b/i.test(text)) action = "Arrancada (Snatch)";
    else if (/\bstretch\b/i.test(text)) action = "Estiramiento";
    else if (/\bhip thrust\b/i.test(text)) action = "Hip Thrust";
    else if (/\bglute bridge\b/i.test(text)) action = "Puente de Glúteos";

    let result = text;
    if (action) {
        const parts = [action, posture, unilateral, equipment].filter(Boolean);
        result = parts.join(" ");
    } else {
        // Reemplazos de palabras genéricas si no coincidió con ninguna acción base
        result = result
            .replace(/\bBarbell\b/gi, "con Barra")
            .replace(/\bDumbbell\b/gi, "con Mancuerna")
            .replace(/\bDumbbells\b/gi, "con Mancuernas")
            .replace(/\bCable\b/gi, "en Polea")
            .replace(/\bMachine\b/gi, "en Máquina")
            .replace(/\bSquat\b/gi, "Sentadilla")
            .replace(/\bDeadlift\b/gi, "Peso Muerto")
            .replace(/\bPress\b/gi, "Press")
            .replace(/\bRow\b/gi, "Remo")
            .replace(/\bCurl\b/gi, "Curl")
            .replace(/\bRaise\b/gi, "Elevación")
            .replace(/\bStretch\b/gi, "Estiramiento")
            .replace(/\s+/g, " ")
            .trim();
    }

    TRANSLATION_CACHE.set(key, result);
    return result;
}
