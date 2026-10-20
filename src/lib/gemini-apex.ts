// ========================================================================
// APEX HYPERTROPHY OS - GEMINI AI INTEGRATION
// ========================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { BiometricProfile, MacroTarget } from "./nutrition-logistics";

const API_KEYS = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_BACKUP
].filter(Boolean) as string[];

const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
].filter(Boolean) as string[];

async function executeGeminiPrompt(systemPrompt: string, userPrompt: string): Promise<string> {
    if (API_KEYS.length === 0) {
        throw new Error("No API key configured for Gemini.");
    }

    let lastError: any = null;

    for (const key of API_KEYS) {
        const genAI = new GoogleGenerativeAI(key);

        for (const modelName of CANDIDATE_MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                const result = await model.generateContent(userPrompt);
                const text = result.response.text();
                if (text) return text;
            } catch (err: any) {
                console.warn(`[APEX GEMINI] Key ...${key.slice(-5)} model ${modelName} error:`, err.message || err);
                lastError = err;
            }
        }
    }

    throw lastError || new Error("All Gemini models failed.");
}

// ------------------------------------------------------------------------
// 1. GENERADOR DE DIETA (7 DÍAS ESTRUCTURADOS)
// ------------------------------------------------------------------------
export async function generateMonthlyDietWithGemini(
    bio: BiometricProfile,
    macros: MacroTarget
): Promise<any> {
    const systemPrompt = `
Eres un Fisiólogo del Ejercicio y Nutriólogo Clínico Deportivo de élite (estilo Renaissance Periodization / Jeff Nippard).
Tu tarea es generar un plan de nutrición estructurado de 7 días para máxima retención de masa magra y recomposición corporal bajo déficit calórico.
Devuelve ÚNICAMENTE código JSON válido sin rodeos ni formato markdown.
Formato JSON requerido:
{
  "monthlySummary": "Breve explicación clínica del plan en 2 líneas",
  "weeklyTemplates": [
    {
      "weekNumber": 1,
      "focus": "Adaptación glucocítica",
      "meals": [
        { "name": "Comida 1 (Desayuno)", "items": "3 huevos enteros + 60g avena con canela", "calories": 480, "proteinG": 32 },
        { "name": "Comida 2 (Almuerzo / Peri-Workout)", "items": "200g pechuga de pollo + 150g arroz jazmín + vegetales verdes", "calories": 580, "proteinG": 52 },
        { "name": "Comida 3 (Merienda)", "items": "1 scoop Whey Isolate + 1 manzana", "calories": 210, "proteinG": 27 },
        { "name": "Comida 4 (Cena)", "items": "200g lomo de res o salmón + 200g papa al horno + aguacate", "calories": 520, "proteinG": 46 }
      ]
    }
  ]
}
`;

    const goalLabel = bio.fitnessGoal === "surplus"
        ? `Superávit de +${bio.caloricAdjustmentPct || 15}% (Ganancia muscular e hipertrofia)`
        : bio.fitnessGoal === "maintenance"
        ? "Normocalórica / Mantenimiento (0% de ajuste, recomposición corporal)"
        : `Déficit de ${bio.caloricAdjustmentPct || -15}% (Pérdida de grasa / definición)`;

    const userPrompt = `
Datos del atleta:
- Género: ${bio.gender} | Edad: ${bio.age} años | Peso: ${bio.weightKg} kg | Altura: ${bio.heightCm} cm
- Grasa Corporal: ${bio.bodyFatPct ? bio.bodyFatPct + "%" : "No especificada"}
- Objetivo Fisiológico: ${goalLabel}
- Meta Diaria: ${macros.targetCalories} kcal
- Macros Clave: ${macros.proteinG}g Proteína | ${macros.carbsG}g Carbohidratos | ${macros.fatsG}g Grasas
- Entrenamiento: ${bio.trainingDaysPerWeek} días/semana.
`;

    try {
        const rawJson = await executeGeminiPrompt(systemPrompt, userPrompt);
        const clean = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Fallback to local template for diet plan:", e);
        // Fallback robusto instantáneo
        return {
            monthlySummary: `Plan estructurado para ${goalLabel} con ${macros.proteinG}g de proteína diaria (${macros.targetCalories} kcal/día).`,
            weeklyTemplates: [
                {
                    weekNumber: 1,
                    focus: bio.fitnessGoal === "surplus" ? "Superávit anabólico y recarga de glucógeno" : bio.fitnessGoal === "maintenance" ? "Recomposición corporal y balance energético" : "Estabilización de glucógeno y saciedad",
                    meals: [
                        { name: "Comida 1 (Desayuno)", items: "3 huevos al gusto + 60g de avena en hojuelas", calories: Math.round(macros.targetCalories * 0.25), proteinG: Math.round(macros.proteinG * 0.25) },
                        { name: "Comida 2 (Almuerzo Peri-Workout)", items: `${Math.round(bio.weightKg * 2.2)}g pechuga de pollo + 150g arroz cocido + espinacas`, calories: Math.round(macros.targetCalories * 0.35), proteinG: Math.round(macros.proteinG * 0.40) },
                        { name: "Comida 3 (Post-Entrenamiento)", items: "1 scoop de Whey Isolate + frutos rojos", calories: Math.round(macros.targetCalories * 0.15), proteinG: Math.round(macros.proteinG * 0.15) },
                        { name: "Comida 4 (Cena Regenerativa)", items: "200g de carne magra o pescado blanco + papa al vapor + 1/2 aguacate", calories: Math.round(macros.targetCalories * 0.25), proteinG: Math.round(macros.proteinG * 0.20) }
                    ]
                }
            ]
        };
    }
}

// ------------------------------------------------------------------------
// 2. RECÁLCULO "COMÍ FUERA DEL PLAN"
// ------------------------------------------------------------------------
export async function recalculateOffPlanMeal(
    description: string,
    targetCalories: number,
    targetProtein: number
): Promise<{ explanation: string; adjustedDinner: string; nextDaysAdvice: string }> {
    const systemPrompt = `
Eres un Fisiólogo Deportivo. El usuario comió algo fuera de su dieta programada.
Calcula el impacto calórico estimado de forma analítica, sin juicios, y reajusta la cena o los siguientes días para que no pierda su déficit calórico mensual.
Devuelve SOLO un JSON con formato:
{
  "explanation": "Estimación técnica de lo consumido y balance",
  "adjustedDinner": "Prescripción exacta para la cena de hoy para cuadrar proteína",
  "nextDaysAdvice": "Ajuste sugerido para los próximos 2-3 días (ej. -100 kcal diarias o 15 min extra de caminata)"
}
`;

    const userPrompt = `
Comí fuera del plan: "${description}".
Mi meta diaria es: ${targetCalories} kcal y ${targetProtein}g de proteína.
¿Cómo ajusto mi cena y los siguientes 2 días?
`;

    try {
        const rawJson = await executeGeminiPrompt(systemPrompt, userPrompt);
        const clean = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
    } catch (e) {
        return {
            explanation: `Se estimaron ~${Math.min(900, Math.round(targetCalories * 0.45))} kcal en la comida libre.`,
            adjustedDinner: "Cena ligera de alta saciedad: 200g de pechuga de pollo o atún con ensalada verde abundante (lechuga, pepino, limón) y 0 carbohidratos densos.",
            nextDaysAdvice: "Ajusta -100 kcal en los carbohidratos de los próximos 2 días o añade 10 minutos de caminadora en Zona 2."
        };
    }
}

// ------------------------------------------------------------------------
// 3. PSICOLOGÍA Y MOTIVACIÓN CONTEXTUAL POR TELEMETRÍA
// ------------------------------------------------------------------------
export async function getContextualMindset(
    readiness: "optimal" | "normal" | "fatigued",
    trainingDayName: string
): Promise<string> {
    const systemPrompt = `
Eres un Psicólogo Deportivo de atletas olímpicos y de halterofilia.
Provee UNA sola frase potente, técnica y estoica (máximo 2 oraciones) orientada a la sesión de hoy.
Cero frases cliché de internet o positivismo tóxico. Háblale como un profesional que busca tensión mecánica y maestría biomecánica.
`;

    const userPrompt = `
Estado de disposición del sistema nervioso: ${readiness.toUpperCase()}.
Sesión programada: ${trainingDayName}.
`;

    try {
        const text = await executeGeminiPrompt(systemPrompt, userPrompt);
        return text.trim().replace(/^"|"$/g, "");
    } catch (e) {
        if (readiness === "fatigued") {
            return "La fatiga es una variable fisiológica, no una excusa. Hoy el estímulo se gana con pausa en el estiramiento y control excéntrico de 3 segundos.";
        }
        if (readiness === "optimal") {
            return "El sistema nervioso central está al 100%. Hoy cada repetición se ejecuta con intención explosiva; busca una repetición extra en la serie principal.";
        }
        return "La hipertrofia es la suma matemática de series efectivas a RIR 1-2 ejecutadas con disciplina técnica inquebrantable.";
    }
}
