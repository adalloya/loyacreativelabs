// src/lib/routine-parser.ts
// APEX - PARSER INTELIGENTE DE RUTINAS EN TEXTO LIBRE ("TEXT-TO-APEX")
// Cruza ejercicios en español con los 876 ejercicios reales de GitHub (free-exercise-db)

import { ExerciseItem, RoutineDay } from "./hypertrophy-engine";
import { getExerciseGitHubId } from "@/data/exerciseDatabase";

export const DEFAULT_CIRCUIT_ROUTINE_TEXT = `LUNES (Cuádriceps)
- Curl acostado (Máquina #18 • 10 lentas y 10 rápidas)
- Sentadilla en Smith (Pirámide 15-12-10)
- Pantorrilla prensa
3x
- Extensiones de pierna (Apretando 3 seg)
- Desplante con mancuernas (12 por pierna)
3x

MARTES (Todo Parte Alta)
- Press máquina
- Laterales con mancuernas (15 reps)
- Curl de bíceps en cables
3x
- Push Down tríceps
- Remo sentada
- Mountain climber (Tabata 40 seg)
3x

MIÉRCOLES (Glúteo)
- Hip trust con barra (Apretando 3 seg arriba)
- Búlgaro con mancuernas (10 negativas)
- Rueda abdominal
3x

JUEVES (Todo Parte Alta)
- Lagartijas al fallo
- Jalón al frente polea
- Pull over
3x
- Curl predicador barra Z
- Press militar
3x

VIERNES (Pierna)
- Peso muerto Romano con mancuernas
- Zumo con mancuerna
- Prensa 45°
3x`;

interface ParsedRawLine {
  raw: string;
  name: string;
  prescription?: string;
  isRoundDelimiter?: boolean;
  roundCount?: number;
}

/**
 * Normaliza y busca el ejercicio más adecuado en el catálogo de APEX
 */
function findBestExerciseMatch(
  exerciseName: string,
  catalog: ExerciseItem[]
): ExerciseItem {
  const targetGitId = getExerciseGitHubId(exerciseName).toLowerCase();
  
  // 1. Coincidencia exacta o ID
  const directMatch = catalog.find(
    (ex) =>
      ex.id.toLowerCase() === targetGitId ||
      (ex.github_id && ex.github_id.toLowerCase() === targetGitId)
  );
  if (directMatch) return directMatch;

  // 2. Coincidencia de nombre en inglés en el catálogo
  const cleanName = exerciseName.toLowerCase().trim();
  const nameMatch = catalog.find(
    (ex) =>
      ex.name.toLowerCase() === cleanName ||
      ex.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(ex.name.toLowerCase())
  );
  if (nameMatch) return nameMatch;

  // 3. Fallback inteligente: buscar por palabra clave
  const tokens = cleanName.split(/\s+/).filter((t) => t.length > 3);
  for (const token of tokens) {
    const tokenMatch = catalog.find((ex) =>
      ex.name.toLowerCase().includes(token) || ex.id.toLowerCase().includes(token)
    );
    if (tokenMatch) return tokenMatch;
  }

  // 4. Fallback final seguro (garantizado en catálogo)
  return catalog[0];
}

/**
 * Determina el nombre del bloque según el número de ejercicios
 */
function getBlockTitle(count: number, rounds: number = 3): string {
  let type = "CIRCUITO";
  if (count === 2) type = "BISERIE";
  else if (count === 3) type = "TRISERIE";
  else if (count === 4) type = "CUATRISERIE";
  return `BLOQUE ${type} • ${rounds} VUELTAS (${rounds}x)`;
}

/**
 * Parsea un bloque de texto libre en español a RoutineDay[] estructurados
 */
export function parseFreeformRoutine(
  rawText: string,
  catalog: ExerciseItem[]
): RoutineDay[] {
  if (!rawText || !rawText.trim() || !catalog || catalog.length === 0) {
    return [];
  }

  const days: RoutineDay[] = [];
  const lines = rawText.split(/\r?\n/);

  const dayRegex = /^(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo|d[íi]a\s*\d+|d\d+)/i;
  const roundRegex = /^(\d+)\s*x\b|^(\d+)\s*vueltas|^circuito|^bloque/i;

  let currentDayName = "";
  let currentDayFocus = "";
  let currentLines: string[] = [];

  const processDaySection = (name: string, focus: string, contentLines: string[]) => {
    if (!name && contentLines.length === 0) return;

    const dayNumber = days.length + 1;
    const cleanDayName = (name || `DÍA ${dayNumber}`).toUpperCase();
    const cleanFocus = focus || "Entrenamiento Focalizado";

    // Detectar fase de carbohidratos según músculos
    const focusLower = (cleanDayName + " " + cleanFocus).toLowerCase();
    let carbPhase: "high_carb" | "low_carb" | "mod_carb" = "mod_carb";
    let carbLabel = "MOD CARB // FUERZA Y RENDIMIENTO";

    if (
      focusLower.includes("pierna") ||
      focusLower.includes("cuádricep") ||
      focusLower.includes("cuadricep") ||
      focusLower.includes("glúteo") ||
      focusLower.includes("gluteo") ||
      focusLower.includes("isquio")
    ) {
      carbPhase = "high_carb";
      carbLabel = "HIGH CARB DAY // CARGA DE GLUCÓGENO";
    } else if (
      focusLower.includes("alta") ||
      focusLower.includes("torso") ||
      focusLower.includes("pecho") ||
      focusLower.includes("espalda") ||
      focusLower.includes("brazo")
    ) {
      carbPhase = "low_carb";
      carbLabel = "LOW CARB // OXIDACIÓN LIPÍDICA";
    }

    // Parsear ejercicios y delimitadores de rondas (ej. 3x)
    const rawParsed: ParsedRawLine[] = [];

    for (const rawLine of contentLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const roundMatch = trimmed.match(roundRegex);
      if (roundMatch) {
        const rounds = roundMatch[1] ? parseInt(roundMatch[1], 10) : 3;
        rawParsed.push({
          raw: trimmed,
          name: "",
          isRoundDelimiter: true,
          roundCount: rounds
        });
        continue;
      }

      // Limpiar prefijos de viñetas (- , * , 1. , etc.)
      const cleaned = trimmed.replace(/^[-*•\d\.\)\s]+/, "").trim();
      if (!cleaned) continue;

      // Extraer notas entre paréntesis o separadores
      let exName = cleaned;
      let prescription = "";

      const parenMatch = cleaned.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        exName = parenMatch[1].trim();
        prescription = parenMatch[2].trim();
      } else if (cleaned.includes(" - ")) {
        const parts = cleaned.split(" - ");
        exName = parts[0].trim();
        prescription = parts.slice(1).join(" - ").trim();
      }

      rawParsed.push({
        raw: trimmed,
        name: exName,
        prescription: prescription || undefined,
        isRoundDelimiter: false
      });
    }

    // Agrupar en bloques de circuitos
    const exerciseItems: ExerciseItem[] = [];
    let pendingExercises: ParsedRawLine[] = [];
    let blockIndex = 1;

    const commitBlock = (exercises: ParsedRawLine[], rounds: number) => {
      if (exercises.length === 0) return;
      const blockId = `day-${dayNumber}-block-${blockIndex++}`;
      const blockTitle = getBlockTitle(exercises.length, rounds);

      exercises.forEach((item) => {
        const base = findBestExerciseMatch(item.name, catalog);
        exerciseItems.push({
          ...base,
          // Mantener nombre legible del usuario si es informativo
          customPrescription: item.prescription,
          blockId: exercises.length > 1 || rounds > 1 ? blockId : undefined,
          blockTitle: exercises.length > 1 || rounds > 1 ? blockTitle : undefined,
          blockRounds: rounds
        });
      });
    };

    for (const item of rawParsed) {
      if (item.isRoundDelimiter) {
        // Cierra el bloque pendiente con la cantidad de rondas indicada (ej. 3x)
        commitBlock(pendingExercises, item.roundCount || 3);
        pendingExercises = [];
      } else {
        pendingExercises.push(item);
      }
    }

    // Si quedaron ejercicios al final sin delimitador "3x" explícito
    if (pendingExercises.length > 0) {
      commitBlock(pendingExercises, pendingExercises.length > 1 ? 3 : 1);
    }

    if (exerciseItems.length > 0) {
      days.push({
        dayNumber,
        dayName: cleanDayName,
        title: `${cleanDayName}: ${cleanFocus}`,
        focus: cleanFocus,
        estimatedMinutes: 55,
        carbCyclePhase: carbPhase,
        carbCycleLabel: carbLabel,
        exercises: exerciseItems,
        cardio: {
          type: "incline_treadmill",
          durationMinutes: 15,
          protocol: "Caminata 15 min @ 12% inclinación, 4.5 km/h"
        }
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dayMatch = trimmed.match(dayRegex);
    if (dayMatch) {
      // Guardar día anterior si existe
      if (currentDayName || currentLines.length > 0) {
        processDaySection(currentDayName, currentDayFocus, currentLines);
      }

      // Iniciar nuevo día
      currentDayName = dayMatch[1].toUpperCase();
      // Extraer posible foco: ej. "LUNES (Cuádriceps)" o "LUNES: Cuádriceps"
      const rest = trimmed.replace(dayRegex, "").replace(/^[:\-\s]+/, "").trim();
      const parenMatch = rest.match(/^\((.*?)\)/);
      if (parenMatch) {
        currentDayFocus = parenMatch[1].trim();
      } else {
        currentDayFocus = rest || "Entrenamiento Principal";
      }
      currentLines = [];
    } else {
      currentLines.push(trimmed);
    }
  }

  // Procesar último día
  if (currentDayName || currentLines.length > 0) {
    processDaySection(currentDayName, currentDayFocus, currentLines);
  }

  return days;
}
