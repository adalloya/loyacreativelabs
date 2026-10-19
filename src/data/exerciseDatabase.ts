// src/data/exerciseDatabase.ts
// APEX - CATÁLOGO MAESTRO Y RESPALDO LOCAL DE FREE-EXERCISE-DB (876 EJERCICIOS)

import rawExerciseData from "./free-exercise-db.json";

export interface FreeExerciseItem {
  id: string;
  name: string;
  force?: string | null;
  level?: string;
  mechanic?: string | null;
  equipment?: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// Respaldo maestro local de los 876 ejercicios cargados en memoria
export const ALL_FREE_EXERCISES: FreeExerciseItem[] = rawExerciseData as FreeExerciseItem[];

// Mapa indexado en memoria O(1) por ID y por nombre normalizado
const ID_INDEX = new Map<string, FreeExerciseItem>();
const NAME_INDEX = new Map<string, FreeExerciseItem>();

ALL_FREE_EXERCISES.forEach((item) => {
  if (item.id) {
    ID_INDEX.set(item.id.toLowerCase(), item);
    ID_INDEX.set(item.id, item);
  }
  if (item.name) {
    NAME_INDEX.set(item.name.toLowerCase().trim(), item);
  }
});

// Diccionario maestro optimizado para mapeo en español y términos comunes
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
 * Normaliza cualquier nombre de ejercicio (IA, español o inglés)
 * y devuelve el identificador oficial de GitHub en free-exercise-db (con respaldo offline de 876 items).
 */
export function getExerciseGitHubId(exerciseName: string): string {
  if (!exerciseName) return "Barbell_Bench_Press_-_Medium_Grip";

  const raw = exerciseName.trim();
  const normalized = raw.toLowerCase();

  // 1. Si ya es un ID exacto del repositorio en memoria
  if (ID_INDEX.has(raw)) {
    return ID_INDEX.get(raw)!.id;
  }
  if (ID_INDEX.has(normalized)) {
    return ID_INDEX.get(normalized)!.id;
  }

  // 2. Si coincide con un nombre en inglés en el catálogo de 876
  if (NAME_INDEX.has(normalized)) {
    return NAME_INDEX.get(normalized)!.id;
  }

  // 3. Búsqueda en el diccionario maestro en español
  for (const [key, id] of Object.entries(EXERCISE_MASTER_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return id;
    }
  }

  // 4. Mapeos heurísticos inteligentes
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

  // 5. Búsqueda por subcadena en los 876 nombres del repositorio
  for (const item of ALL_FREE_EXERCISES) {
    const itemNorm = item.name.toLowerCase();
    if (normalized.includes(itemNorm) || itemNorm.includes(normalized)) {
      return item.id;
    }
  }

  // Fallback seguro a ejercicio multiarticular estándar
  return "Barbell_Bench_Press_-_Medium_Grip";
}

/**
 * Obtiene el objeto completo de un ejercicio por su ID oficial
 */
export function getExerciseDetails(id: string): FreeExerciseItem | undefined {
  return ID_INDEX.get(id) || ID_INDEX.get(id.toLowerCase());
}

/**
 * Busca ejercicios en el catálogo de 876 items
 */
export function searchExercises(query: string, maxResults = 20): FreeExerciseItem[] {
  if (!query) return ALL_FREE_EXERCISES.slice(0, maxResults);
  const q = query.toLowerCase().trim();
  return ALL_FREE_EXERCISES.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(q))
  ).slice(0, maxResults);
}
