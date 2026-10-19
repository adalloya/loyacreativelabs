// src/data/exerciseDatabase.ts
// APEX - CATÁLOGO MAESTRO Y MAPEO DIRECTO A FREE-EXERCISE-DB (800+ EJERCICIOS)

export interface ExerciseDefinition {
  id: string; // ID exacto del repositorio open-source free-exercise-db
  name: string;
  muscleGroup: string;
  equipment: string;
  tier: number;
}

// Catálogo maestro optimizado con IDs reales verificados del repositorio oficial
export const EXERCISE_MASTER_DB: Record<string, string> = {
  // Pectoral (Pecho)
  "press inclinado con mancuernas": "Incline_Dumbbell_Press",
  "incline dumbbell press": "Incline_Dumbbell_Press",
  "press plano con barra": "Barbell_Bench_Press_-_Medium_Grip",
  "press de banca plano": "Barbell_Bench_Press_-_Medium_Grip",
  "bench press": "Barbell_Bench_Press_-_Medium_Grip",
  "aperturas en polea": "Cable_Chest_Press",
  "aperturas en pec deck": "Butterfly",
  "pec deck": "Butterfly",
  "fondos en paralelas": "Dips_-_Chest_Version",
  "chest dips": "Dips_-_Chest_Version",
  "press en maquina": "Cable_Chest_Press",
  "press declinado": "Decline_Barbell_Bench_Press",

  // Espalda y Dorsales
  "remo con barra": "Bent_Over_Barbell_Row",
  "barbell row": "Bent_Over_Barbell_Row",
  "jalón al pecho": "Close-Grip_Front_Lat_Pulldown",
  "lat pulldown": "Close-Grip_Front_Lat_Pulldown",
  "dominadas": "Weighted_Pull_Ups",
  "pull up": "Weighted_Pull_Ups",
  "remo en polea baja": "Seated_Cable_Rows",
  "seated cable row": "Seated_Cable_Rows",
  "remo con mancuerna unilateral": "One-Arm_Dumbbell_Row",
  "pullover": "Bent-Arm_Barbell_Pullover",

  // Pierna Cuádriceps
  "sentadilla libre": "Barbell_Full_Squat",
  "barbell squat": "Barbell_Full_Squat",
  "prensa": "Leg_Press",
  "leg press": "Leg_Press",
  "sentadilla hack": "Barbell_Hack_Squat",
  "hack squat": "Barbell_Hack_Squat",
  "extensiones de cuádriceps": "Leg_Extensions",
  "leg extension": "Leg_Extensions",
  "sentadilla búlgara": "Dumbbell_Lunges",

  // Pierna Cadena Posterior & Glúteos
  "peso muerto convencional": "Barbell_Deadlift",
  "deadlift": "Barbell_Deadlift",
  "peso muerto rumano": "Romanian_Deadlift",
  "romanian deadlift": "Romanian_Deadlift",
  "curl femoral tumbado": "Lying_Leg_Curls",
  "lying leg curl": "Lying_Leg_Curls",
  "curl femoral sentado": "Seated_Leg_Curl",
  "seated leg curl": "Seated_Leg_Curl",
  "hip thrust": "Barbell_Glute_Bridge",

  // Pantorrillas
  "elevación de talones": "Standing_Calf_Raises",
  "calf raise": "Standing_Calf_Raises",
  "elevación de talones sentado": "Barbell_Seated_Calf_Raise",
  "seated calf raise": "Barbell_Seated_Calf_Raise",

  // Deltoides (Hombros)
  "press militar con barra": "Barbell_Shoulder_Press",
  "shoulder press": "Barbell_Shoulder_Press",
  "elevaciones laterales": "Side_Lateral_Raise",
  "lateral raise": "Side_Lateral_Raise",
  "pájaros posteriores": "Dumbbell_Lying_Rear_Lateral_Raise",
  "face pull": "Cable_Rope_Rear-Delt_Rows",

  // Brazos: Bíceps
  "curl de bíceps con mancuernas": "Dumbbell_Bicep_Curl",
  "bicep curl": "Dumbbell_Bicep_Curl",
  "curl con barra": "Barbell_Curl",
  "curl martillo": "Alternate_Hammer_Curl",
  "hammer curl": "Alternate_Hammer_Curl",
  "curl predicador": "Preacher_Curl",

  // Brazos: Tríceps
  "extensión en polea con cuerda": "Triceps_Pushdown",
  "triceps pushdown": "Triceps_Pushdown",
  "press francés": "Lying_Triceps_Press",
  "skull crusher": "Lying_Triceps_Press",
  "fondos en banco": "Bench_Dips",
  "bench dips": "Bench_Dips",
  "copa triceps": "Lying_Dumbbell_Tricep_Extension",

  // Abdomen y Core
  "crunch abdominal": "Ab_Crunch_Machine",
  "ab crunch": "Ab_Crunch_Machine",
  "elevación de piernas": "Hanging_Leg_Raise",
  "plancha": "Plank",
  "ab roller": "Ab_Roller"
};

/**
 * Normaliza cualquier nombre de ejercicio (generado por IA, español o inglés)
 * y devuelve el identificador oficial de GitHub en free-exercise-db.
 */
export function getExerciseGitHubId(exerciseName: string): string {
  if (!exerciseName) return "Barbell_Bench_Press_-_Medium_Grip";
  
  const normalized = exerciseName.toLowerCase().trim();

  // 1. Búsqueda directa o parcial en el catálogo maestro
  for (const [key, id] of Object.entries(EXERCISE_MASTER_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return id;
    }
  }

  // 2. Mapeos semánticos basados en palabras clave clave
  if (normalized.includes("inclinad") && (normalized.includes("mancuerna") || normalized.includes("dumbbell"))) {
    return "Incline_Dumbbell_Press";
  }
  if (normalized.includes("inclinad") && (normalized.includes("barra") || normalized.includes("bench"))) {
    return "Barbell_Incline_Bench_Press_-_Medium_Grip";
  }
  if (normalized.includes("banca") || normalized.includes("bench") || normalized.includes("plano")) {
    return "Barbell_Bench_Press_-_Medium_Grip";
  }
  if (normalized.includes("apertura") || normalized.includes("fly") || normalized.includes("pec deck") || normalized.includes("mariposa")) {
    return "Butterfly";
  }
  if (normalized.includes("sentadilla") || normalized.includes("squat")) {
    if (normalized.includes("hack")) return "Barbell_Hack_Squat";
    return "Barbell_Full_Squat";
  }
  if (normalized.includes("prensa") || normalized.includes("leg press")) {
    return "Leg_Press";
  }
  if (normalized.includes("rumano") || normalized.includes("romanian")) {
    return "Romanian_Deadlift";
  }
  if (normalized.includes("muerto") || normalized.includes("deadlift")) {
    return "Barbell_Deadlift";
  }
  if (normalized.includes("femoral") || normalized.includes("leg curl")) {
    return "Lying_Leg_Curls";
  }
  if (normalized.includes("extension") && (normalized.includes("cuad") || normalized.includes("leg"))) {
    return "Leg_Extensions";
  }
  if (normalized.includes("pantorrilla") || normalized.includes("talon") || normalized.includes("calf")) {
    return "Standing_Calf_Raises";
  }
  if (normalized.includes("militar") || normalized.includes("shoulder press")) {
    return "Barbell_Shoulder_Press";
  }
  if (normalized.includes("lateral") || normalized.includes("elevacion lateral")) {
    return "Side_Lateral_Raise";
  }
  if (normalized.includes("jalon") || normalized.includes("pulldown") || normalized.includes("dorsal")) {
    return "Close-Grip_Front_Lat_Pulldown";
  }
  if (normalized.includes("remo") || normalized.includes("row")) {
    if (normalized.includes("mancuerna")) return "One-Arm_Dumbbell_Row";
    if (normalized.includes("polea")) return "Seated_Cable_Rows";
    return "Bent_Over_Barbell_Row";
  }
  if (normalized.includes("dominada") || normalized.includes("pull up")) {
    return "Weighted_Pull_Ups";
  }
  if (normalized.includes("fondo") || normalized.includes("dip")) {
    return "Dips_-_Chest_Version";
  }
  if (normalized.includes("bicep") || normalized.includes("bíceps") || normalized.includes("curl")) {
    if (normalized.includes("martillo") || normalized.includes("hammer")) return "Alternate_Hammer_Curl";
    if (normalized.includes("barra")) return "Barbell_Curl";
    return "Dumbbell_Bicep_Curl";
  }
  if (normalized.includes("tricep") || normalized.includes("tríceps")) {
    if (normalized.includes("frances") || normalized.includes("skull")) return "Lying_Triceps_Press";
    return "Triceps_Pushdown";
  }
  if (normalized.includes("abdomen") || normalized.includes("crunch") || normalized.includes("core")) {
    return "Ab_Crunch_Machine";
  }

  // Fallback seguro a ejercicio multiarticular estándar
  return "Barbell_Bench_Press_-_Medium_Grip";
}
