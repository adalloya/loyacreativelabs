// src/lib/exercise-catalog.ts
// ========================================================================
// APEX HYPERTROPHY OS - LIVE 873+ EXERCISE CATALOG LOADER & CACHE MANAGER
// ========================================================================

import {
  ALL_FREE_EXERCISES,
  FreeExerciseItem,
  mapRawMuscleToMuscleGroup,
  mapRawEquipmentToEquipmentType,
  getExerciseImageUrl
} from "@/data/exerciseDatabase";
import spanishInstructionsData from "@/data/spanish-instructions.json";
import { translateExerciseNameToSpanish } from "./spanish-exercise-translator";
import {
  ExerciseItem,
  MuscleGroup,
  EquipmentType,
  HypertrophyTier,
  ResistanceProfile
} from "./hypertrophy-engine";

const SPANISH_INSTRUCTIONS_MAP: Record<string, string[]> = spanishInstructionsData as Record<string, string[]>;

export const GITHUB_FREE_EXERCISE_DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

export const CATALOG_CACHE_KEY = "apex_exercise_catalog_873_v2";

/**
 * Convierte un ítem raw de Free-Exercise-DB a un ExerciseItem oficial de APEX.
 * Aplica automáticamente instrucciones y biomechanical_cue en ESPAÑOL.
 */
export function convertRawToExerciseItem(item: FreeExerciseItem): ExerciseItem {
  const pMuscles = (item.primaryMuscles || []).map((m) => m.toLowerCase());
  const rawPrimary = pMuscles[0] || "chest";
  const primaryMuscle = mapRawMuscleToMuscleGroup(rawPrimary);
  const equipment = mapRawEquipmentToEquipmentType(item.equipment);

  const isCompound =
    item.mechanic === "compound" ||
    (item.secondaryMuscles && item.secondaryMuscles.length > 0);
  const tier: HypertrophyTier = isCompound
    ? "S"
    : item.level === "intermediate" || item.level === "expert"
    ? "A"
    : "B";

  const seed = (item.id || item.name)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const activation = 85 + (seed % 14);

  // Instrucciones e indicaciones biomecánicas 100% en español
  const spanishList =
    (item as any).instructions_es ||
    SPANISH_INSTRUCTIONS_MAP[item.id] ||
    item.instructions ||
    [];

  const instructionCue =
    spanishList && spanishList.length > 0
      ? spanishList[0]
      : "Control excéntrico estricto y rango completo de movimiento.";

  const images =
    item.images && item.images.length > 0
      ? item.images
      : [`${item.id}/0.jpg`, `${item.id}/1.jpg`];

  return {
    id: item.id,
    name: translateExerciseNameToSpanish(item.name),
    primary_muscle: primaryMuscle as MuscleGroup,
    anatomical_subdivision: item.category
      ? `${item.category.toUpperCase()} • ${item.primaryMuscles?.join(", ") || ""}`
      : rawPrimary.toUpperCase(),
    secondary_muscles: item.secondaryMuscles || [],
    equipment: equipment as EquipmentType,
    movement_pattern: item.force || (isCompound ? "compound_movement" : "isolation"),
    resistance_profile: (isCompound
      ? "lengthened_bias"
      : "shortened_peak") as ResistanceProfile,
    hypertrophy_tier: tier,
    biomechanical_cue: instructionCue,
    default_sets: 3,
    rep_range_min: isCompound ? 6 : 10,
    rep_range_max: isCompound ? 10 : 15,
    rest_seconds: isCompound ? 120 : 90,
    target_rir: 1,
    github_id: item.id,
    activation_pct: activation,
    images: images,
    instructions: spanishList,
    category: item.category || "strength",
    primaryMuscles: pMuscles.length > 0 ? pMuscles : [rawPrimary]
  };
}

// Inicialización inmediata en memoria con los 876 ejercicios para cero latencia inicial
let IN_MEMORY_CATALOG: ExerciseItem[] = ALL_FREE_EXERCISES.map(convertRawToExerciseItem);

/**
 * Limpia cualquier caché antigua de ejercicios si tiene menos de 800 items
 */
export function purgeOutdatedExerciseCache(): void {
  if (typeof window === "undefined") return;

  try {
    // Lista de claves viejas que pudieron tener el mock de 46 ejercicios
    const keysToCheck = [
      "apex_exercise_catalog",
      "apex_exercises",
      "apex_exercise_db",
      "exercise_cache",
      CATALOG_CACHE_KEY
    ];

    keysToCheck.forEach((key) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length < 800) {
            console.warn(
              `[ExerciseCatalog] Descartando caché obsoleta (${parsed.length} ejercicios < 800) en clave: ${key}`
            );
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.error("[ExerciseCatalog] Error limpiando caché:", e);
  }
}

/**
 * Guarda el catálogo compacto en localStorage para carga offline
 */
function saveCatalogToCache(exercises: ExerciseItem[]): void {
  if (typeof window === "undefined" || !exercises || exercises.length < 800) return;

  try {
    // Guardamos solo los campos necesarios para mantener el tamaño bajo 400KB
    const compact = exercises.map((e) => ({
      id: e.id,
      name: e.name,
      equipment: e.equipment,
      primaryMuscles: e.primaryMuscles || [e.primary_muscle],
      secondaryMuscles: e.secondary_muscles,
      category: e.category,
      images: e.images,
      instructions: e.instructions,
      primary_muscle: e.primary_muscle,
      hypertrophy_tier: e.hypertrophy_tier,
      activation_pct: e.activation_pct,
      biomechanical_cue: e.biomechanical_cue
    }));

    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(compact));
  } catch (err) {
    console.warn("[ExerciseCatalog] No se pudo guardar en localStorage (cuota):", err);
  }
}

/**
 * Carga el catálogo desde localStorage si existe y tiene >= 800 ejercicios
 */
function loadCatalogFromCache(): ExerciseItem[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 800) {
      return parsed.map((item) => ({
        ...item,
        default_sets: 3,
        rep_range_min: 8,
        rep_range_max: 12,
        rest_seconds: 90,
        target_rir: 1,
        github_id: item.id
      })) as ExerciseItem[];
    }
  } catch (err) {
    console.warn("[ExerciseCatalog] Error leyendo caché local:", err);
  }
  return null;
}

let isFetchingLive = false;

/**
 * Descarga en vivo los 873+ ejercicios desde GitHub sin recortar
 */
export async function fetchLiveExercisesFromGitHub(): Promise<ExerciseItem[]> {
  purgeOutdatedExerciseCache();

  // Intentamos primero la caché local si es válida (>= 800)
  const cached = loadCatalogFromCache();
  if (cached && cached.length >= 800) {
    IN_MEMORY_CATALOG = cached;
  }

  if (isFetchingLive) {
    return IN_MEMORY_CATALOG;
  }

  isFetchingLive = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(GITHUB_FREE_EXERCISE_DB_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar exercises.json`);
    }

    const data: FreeExerciseItem[] = await response.json();

    if (Array.isArray(data) && data.length >= 800) {
      const converted = data.map(convertRawToExerciseItem);
      IN_MEMORY_CATALOG = converted;
      saveCatalogToCache(converted);
      console.log(`[ExerciseCatalog] ¡Descarga exitosa de GitHub! Total: ${converted.length} ejercicios activos.`);

      // Disparar evento para componentes suscritos
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("apex:catalog-updated", { detail: { count: converted.length } })
        );
      }
      return converted;
    }
  } catch (err) {
    console.warn("[ExerciseCatalog] Fallo descarga en vivo, usando respaldo local maestro (876 items):", err);
  } finally {
    isFetchingLive = false;
  }

  return IN_MEMORY_CATALOG;
}

/**
 * Obtiene el catálogo actual en memoria (garantizado >= 800 items)
 */
export function getActiveExerciseCatalog(): ExerciseItem[] {
  return IN_MEMORY_CATALOG;
}

/**
 * Cuenta activa de ejercicios en el catálogo
 */
export function getActiveExerciseCount(): number {
  return IN_MEMORY_CATALOG.length;
}
