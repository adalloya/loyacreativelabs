// src/services/exerciseRepo.ts
// SERVICIO DE CONEXIÓN AL REPOSITORIO OFICIAL free-exercise-db (GITHUB)

import { getExerciseGitHubId } from "@/data/exerciseDatabase";

/**
 * Traduce cualquier nombre de ejercicio (IA, inglés o español)
 * al ID verificado del repositorio de GitHub free-exercise-db.
 */
export function resolveGitHubExerciseId(exerciseName: string): string {
  return getExerciseGitHubId(exerciseName);
}

/**
 * Genera la URL directa a la secuencia de imágenes del repositorio en GitHub.
 * Alterna entre el frame 0 y el frame 1 para crear la animación biomecánica de 800ms.
 */
export function getGitHubExerciseImageUrl(exerciseNameOrId: string, frameIndex: number = 0): string {
  const cleanId = exerciseNameOrId.includes(" ") 
    ? resolveGitHubExerciseId(exerciseNameOrId)
    : exerciseNameOrId;
    
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${cleanId}/${frameIndex}.jpg`;
}
