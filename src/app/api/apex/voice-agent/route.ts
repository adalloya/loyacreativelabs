// src/app/api/apex/voice-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_BACKUP
].filter(Boolean) as string[];

const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash-lite"
].filter(Boolean) as string[];

async function queryGemini(prompt: string, systemInstruction: string): Promise<string> {
    if (API_KEYS.length === 0) {
        throw new Error("No Google API Key configured.");
    }

    let lastErr: any = null;
    for (const key of API_KEYS) {
        const genAI = new GoogleGenerativeAI(key);
        for (const modelName of CANDIDATE_MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.2
                    }
                });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                if (text) return text;
            } catch (err: any) {
                console.warn(`[VoiceAgent] Model ${modelName} error:`, err?.message || err);
                lastErr = err;
            }
        }
    }
    throw lastErr || new Error("All Gemini models failed.");
}

const SYSTEM_PROMPT = `
Eres el Asistente Inteligente de Voz de APEX Hypertrophy OS (en español).
Tu tarea es analizar el dictado de voz del usuario y extraer la intención y los datos estructurados con máxima precisión y rapidez.

CATEGORÍAS DE INTENCIÓN POSIBLES:
1. "LOG_WORKOUT":
   El usuario dictó una serie, repeticiones, peso o ejercicio.
   Ejemplos:
   - "press de banca 4 de 10 con 80 kilos"
   - "hice 10 repeticiones con 135 libras"
   - "sentadilla búlgara 3 series de 12 reps con 20 kilos"
   - "80 kilos 10 reps"
   - "saqué 12 repeticiones"
   Campos a extraer:
   - exerciseName: string o null (nombre del ejercicio mencionado)
   - sets: number (por defecto 1 si no especificó cuántas series)
   - reps: number (número de repeticiones)
   - weight: number o null (peso numérico)
   - weightUnit: "kg" | "lbs" (si dijo libras/lbs o kilos/kg, o null si no dijo)

2. "LOG_NUTRITION":
   El usuario dictó qué comió y/o a qué hora del día.
   Ejemplos:
   - "comí 3 huevos con 2 tortillas en el desayuno"
   - "me comí un sándwich de pollo y una manzana a media tarde"
   - "de cena 200 gramos de carne con puré de papa"
   - "en el almuerzo comí atún con arroz"
   Campos a extraer:
   - mealCategory: "breakfast" | "lunch" | "dinner" | "snack1" | "snack2"
     (inferir según palabras clave: "desayuno" -> breakfast, "comida/almuerzo" -> lunch, "cena" -> dinner, "merienda/snack/media tarde" -> snack1 o snack2)
   - foods: Array de objetos { name: string, calories: number, proteinG: number, carbsG: number, fatsG: number }
     (Estima macronutrientes realistas y precisos para los alimentos dictados)

3. "LOG_DIET_PLAN":
   El usuario dijo que comió lo de su dieta programada o plan nutricional.
   Ejemplos:
   - "comí lo de la dieta"
   - "comi mi dieta"
   - "lo del plan"
   - "seguí la dieta de hoy"
   - "comí todo lo de mi plan nutricional"

4. "SEARCH_EXERCISE":
   El usuario quiere buscar o ver ejercicios en el catálogo o anatomía.
   Ejemplos:
   - "busca ejercicios con mancuernas"
   - "mancuernas"
   - "quiero ver ejercicios de pecho"
   - "ejercicios con polea"
   - "busca sentadilla"
   Campos a extraer:
   - query: string (término clave de búsqueda ej. "mancuernas", "pecho", "polea", "curl")

5. "NAVIGATE":
   El usuario pide ir a una sección ("ve a nutrición", "ir al gym", "abrir ajustes", "ver anatomía").
   Campos a extraer:
   - targetTab: "workout" | "nutrition" | "anatomy" | "settings"

6. "MUSIC_CONTROL":
   El usuario pide reproducir música, controlar Spotify, cambiar tempo/BPM, o buscar artistas/canciones/playlists.
   Ejemplos:
   - "pon música" / "reproduce música" / "pon una lista" / "pon la lista" / "música para entrenar" / "música" -> action: "play_bpm", bpmCategory: "high", query: "gym-phonk" (IMPORTANTE: en una app de gimnasio, si pide música o una lista, debe iniciar una playlist de entrenamiento como gym-phonk).
   - "pon música más calmada escoge playlist con bpm bajo" / "música tranquila" -> action: "play_bpm", bpmCategory: "low", query: "lofi-recovery"
   - "música calmada" / "bpm bajo" / "música tranquila" -> action: "play_bpm", bpmCategory: "low", query: "lofi-recovery"
   - "quiero más intensidad sube a otro bpm" / "más intensidad" / "sube bpm" -> action: "play_bpm", bpmCategory: "high", query: "gym-phonk"
   - "reggaeton" / "perreo" -> action: "play_bpm", bpmCategory: "mid", query: "mansion-reggaeton"
   - "rock" / "metal" -> action: "play_bpm", bpmCategory: "high", query: "rock-metal"
   - "quiero bad bunny" / "pon bad bunny" / "badbunny" -> action: "search_play", query: "Bad Bunny"
   - "reproduce [canción o artista]" -> action: "search_play", query: "[canción o artista]"
   - "reanuda" / "play" / "sigue la música" -> action: "play"
   - "pausa la música" / "pausar" -> action: "pause"
   - "siguiente canción" / "siguiente" -> action: "next"
   - "canción anterior" / "anterior" -> action: "previous"
   Campos a extraer:
   - action: "play" | "pause" | "next" | "previous" | "play_bpm" | "search_play"
   - bpmCategory: "low" | "mid" | "high" | null
   - query: string | null (nombre del artista, canción o playlist)

REGLAS DE MÚLTIPLES ÓRDENES (COMPOUND MULTI-ACTIONS):
- El usuario puede dictar UNA o MÚLTIPLES órdenes en la misma grabación.
- Ejemplos de órdenes múltiples:
  * "Press de banca 4 de 10 con 80 kilos y después remo con barra 3 de 12 con 60 kilos" -> 2 acciones LOG_WORKOUT.
  * "Press inclinado 12 reps con 50 libras y pon más intensidad sube el bpm" -> 1 LOG_WORKOUT y 1 MUSIC_CONTROL.
  * "10 reps con 80 kilos y de almuerzo comí 200 gramos de pollo con arroz" -> 1 LOG_WORKOUT y 1 LOG_NUTRITION.
  * "Comí lo de la dieta y pon a Bad Bunny" -> 1 LOG_DIET_PLAN y 1 MUSIC_CONTROL.
- Si el usuario dictó varias cosas, DEBES generar un elemento separado en el arreglo "actions" para CADA orden identificada. NUNCA descartes una orden para quedarte solo con la primera.

REGLA DE CONMUTACIÓN DE SECCIONES (CROSS-TAB SWITCHING):
- Si el usuario actualmente está en "workout" pero dictó comida, esa acción debe tener targetTab "nutrition".
- Si el usuario está en "nutrition" pero dictó series/peso, esa acción debe tener targetTab "workout".
- Si el usuario pide buscar ejercicios, esa acción debe tener targetTab "anatomy".
- Para "MUSIC_CONTROL", targetTab se mantiene en la sección actual del usuario.

Devuelve SIEMPRE ÚNICAMENTE JSON con este esquema exacto:
{
  "actions": [
    {
      "intent": "LOG_WORKOUT" | "LOG_NUTRITION" | "LOG_DIET_PLAN" | "SEARCH_EXERCISE" | "NAVIGATE" | "MUSIC_CONTROL",
      "targetTab": "workout" | "nutrition" | "anatomy" | "settings",
      "summary": "Resumen ultracorto y claro de esta orden (ej: 'Press de banca: 80 kg × 10 reps')",
      "workout": {
        "exerciseName": string | null,
        "sets": number,
        "reps": number | null,
        "weight": number | null,
        "weightUnit": "kg" | "lbs" | null
      },
      "nutrition": {
        "mealCategory": "breakfast" | "lunch" | "dinner" | "snack1" | "snack2",
        "foods": [
          {
            "name": string,
            "calories": number,
            "proteinG": number,
            "carbsG": number,
            "fatsG": number
          }
        ]
      },
      "search": {
        "query": string
      },
      "music": {
        "action": "play" | "pause" | "next" | "previous" | "play_bpm" | "search_play",
        "bpmCategory": "low" | "mid" | "high" | null,
        "query": string | null
      }
    }
  ],
  "overallSummary": "Resumen conciso de 5 a 10 palabras que reúne todo lo ordenado (ej: 'Press de banca (80kg × 10) + Playlist BPM bajo')"
}
`;

function normalizeIntent(raw: string): "LOG_WORKOUT" | "LOG_NUTRITION" | "LOG_DIET_PLAN" | "SEARCH_EXERCISE" | "NAVIGATE" | "MUSIC_CONTROL" | "UNKNOWN" {
    const s = String(raw || "").toUpperCase();
    if (s.includes("MUSIC") || s.includes("SPOTIFY") || s.includes("BPM") || s.includes("PLAYLIST") || s.includes("SONG")) {
        return "MUSIC_CONTROL";
    }
    if (s.includes("DIET") || s.includes("PLAN")) {
        return "LOG_DIET_PLAN";
    }
    if (s.includes("WORKOUT") || s.includes("TRAIN") || s.includes("EXERCISE_LOG") || s.includes("SET") || s.includes("REP")) {
        return "LOG_WORKOUT";
    }
    if (s.includes("NUTRITION") || s.includes("MEAL") || s.includes("FOOD")) {
        return "LOG_NUTRITION";
    }
    if (s.includes("SEARCH")) {
        return "SEARCH_EXERCISE";
    }
    if (s.includes("NAVIGATE")) {
        return "NAVIGATE";
    }
    return "UNKNOWN";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transcript, currentTab = "workout", activeExerciseNames = [] } = body;

        if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
            return NextResponse.json(
                { error: "Transcript vacío o no provisto." },
                { status: 400 }
            );
        }

        const userPrompt = `
Dictado del usuario: "${transcript.trim()}"
Sección actual de la app: "${currentTab}"
Ejercicios actualmente en la rutina de hoy: ${JSON.stringify(activeExerciseNames)}
`;

        const rawJson = await queryGemini(userPrompt, SYSTEM_PROMPT);
        const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        // Si Gemini devolvió un array "actions" directo o un objeto con "intent"
        let rawActions: any[] = [];
        if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            rawActions = parsed.actions;
        } else if (parsed.intent) {
            rawActions = [parsed];
        } else if (Array.isArray(parsed) && parsed.length > 0) {
            rawActions = parsed;
        }

        // Normalizar cada acción
        const normalizedActions = rawActions.map((act) => {
            const intent = normalizeIntent(act.intent);
            let targetTab = act.targetTab || currentTab;

            if (intent === "SEARCH_EXERCISE") {
                targetTab = "anatomy";
            } else if (intent === "LOG_WORKOUT" && targetTab !== "workout") {
                targetTab = "workout";
            } else if ((intent === "LOG_NUTRITION" || intent === "LOG_DIET_PLAN") && targetTab !== "nutrition") {
                targetTab = "nutrition";
            }

            // Normalización de nutrition foods
            if (act.nutrition && (!act.nutrition.foods || !Array.isArray(act.nutrition.foods))) {
                const singleName = act.nutrition.foodName || act.nutrition.name || "Alimento registrado";
                act.nutrition.foods = [
                    {
                        name: singleName,
                        calories: act.nutrition.calories || 350,
                        proteinG: act.nutrition.proteinG || 25,
                        carbsG: act.nutrition.carbsG || 30,
                        fatsG: act.nutrition.fatsG || 12
                    }
                ];
            }

            return {
                intent,
                targetTab,
                summary: act.summary || "Comando procesado",
                workout: act.workout,
                nutrition: act.nutrition,
                search: act.search,
                music: act.music
            };
        });

        const overallSummary = parsed.overallSummary || 
            normalizedActions.map(a => a.summary).filter(Boolean).join(" • ") || 
            "Comando procesado";

        return NextResponse.json({
            actions: normalizedActions,
            overallSummary,
            // Retrocompatibilidad con consumidores que esperan el primer intent en la raíz
            intent: normalizedActions[0]?.intent || "UNKNOWN",
            targetTab: normalizedActions[0]?.targetTab || currentTab,
            summary: overallSummary,
            workout: normalizedActions[0]?.workout,
            nutrition: normalizedActions[0]?.nutrition,
            search: normalizedActions[0]?.search,
            music: normalizedActions[0]?.music
        });
    } catch (error: any) {
        console.error("[VoiceAgent API Error]:", error);
        return NextResponse.json(
            {
                actions: [],
                intent: "UNKNOWN",
                error: error?.message || "Error procesando el comando de voz"
            },
            { status: 500 }
        );
    }
}
