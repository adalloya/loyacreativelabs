// src/app/api/apex/voice-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_BACKUP
].filter(Boolean) as string[];

const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash"
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

REGLA DE CONMUTACIÓN DE SECCIONES (CROSS-TAB SWITCHING):
- Si el usuario actualmente está en la sección de ejercicio/gimnasio ("workout") pero dictó comida/nutrición ("comí 3 huevos"), targetTab DEBE ser "nutrition".
- Si el usuario está en "nutrition" pero dictó series/peso ("hice 80kg en sentadilla"), targetTab DEBE ser "workout".
- Si el usuario está en cualquier lugar y pide buscar ejercicios ("busca mancuernas"), targetTab DEBE ser "anatomy".

Devuelve SIEMPRE ÚNICAMENTE JSON con este esquema exacto:
{
  "intent": "LOG_WORKOUT" | "LOG_NUTRITION" | "LOG_DIET_PLAN" | "SEARCH_EXERCISE" | "NAVIGATE" | "UNKNOWN",
  "targetTab": "workout" | "nutrition" | "anatomy" | "settings",
  "summary": "Resumen ultracorto y claro de 4 a 8 palabras para el anuncio (ej: 'Press de banca: 80 kg × 10 reps')",
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
  }
}
`;

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

        // Normalización ultra-robusta de intención
        let rawIntent = String(parsed.intent || "UNKNOWN").toUpperCase();
        let normalizedIntent: "LOG_WORKOUT" | "LOG_NUTRITION" | "LOG_DIET_PLAN" | "SEARCH_EXERCISE" | "NAVIGATE" | "UNKNOWN" = "UNKNOWN";

        if (rawIntent.includes("DIET") || rawIntent.includes("PLAN")) {
            normalizedIntent = "LOG_DIET_PLAN";
        } else if (rawIntent.includes("WORKOUT") || rawIntent.includes("TRAIN") || rawIntent.includes("EXERCISE_LOG")) {
            normalizedIntent = "LOG_WORKOUT";
        } else if (rawIntent.includes("NUTRITION") || rawIntent.includes("MEAL") || rawIntent.includes("FOOD")) {
            normalizedIntent = "LOG_NUTRITION";
        } else if (rawIntent.includes("SEARCH")) {
            normalizedIntent = "SEARCH_EXERCISE";
        } else if (rawIntent.includes("NAVIGATE")) {
            normalizedIntent = "NAVIGATE";
        }

        parsed.intent = normalizedIntent;

        // Si es búsqueda o ejercicios, asegurar que la pestaña destino sea anatomy
        if (normalizedIntent === "SEARCH_EXERCISE") {
            parsed.targetTab = "anatomy";
        }

        // Si es nutrición pero Gemini devolvió foodName en vez de foods array
        if (parsed.nutrition && (!parsed.nutrition.foods || !Array.isArray(parsed.nutrition.foods))) {
            const singleName = parsed.nutrition.foodName || parsed.nutrition.name || "Alimento registrado";
            parsed.nutrition.foods = [
                {
                    name: singleName,
                    calories: parsed.nutrition.calories || 350,
                    proteinG: parsed.nutrition.proteinG || 25,
                    carbsG: parsed.nutrition.carbsG || 30,
                    fatsG: parsed.nutrition.fatsG || 12
                }
            ];
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("[VoiceAgent API Error]:", error);
        return NextResponse.json(
            {
                intent: "UNKNOWN",
                error: error?.message || "Error procesando el comando de voz"
            },
            { status: 500 }
        );
    }
}
