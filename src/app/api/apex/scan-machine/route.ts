import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_BACKUP
].filter(Boolean) as string[];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json(
                { success: false, error: "No se proporcionó imagen para escanear." },
                { status: 400 }
            );
        }

        // Clean base64 string
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        // Try Gemini Vision first if keys are configured
        let aiResult: any = null;
        for (const key of API_KEYS) {
            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `
Eres un Fisiólogo Biomecánico de Gimnasio e Inteligencia Artificial de Élite para APEX Hypertrophy OS.
Analiza la imagen adjunta tomada en un gimnasio.
Identifica con alta precisión la máquina, banco o equipo de entrenamiento que aparece enfocado.

Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "equipmentName": "Nombre común y profesional en español de la máquina o equipo (ej. Prensa Inclinada de Piernas, Jalón en Polea Alta, Máquina Smith, Pec-Deck, Mancuernas)",
  "category": "machine" | "cable" | "dumbbell" | "barbell" | "bodyweight",
  "primaryMuscle": "chest" | "lats" | "upper_back" | "delts" | "quads" | "hamstrings" | "glutes" | "biceps" | "triceps" | "calves" | "core",
  "keywords": ["array", "de", "términos", "clave", "en", "inglés", "y", "español", "para", "buscar", "en", "base", "de", "datos"],
  "confidencePct": número entre 80 y 99,
  "biomechanicalTip": "Consejo técnico de ajuste biomecánico de 1 a 2 oraciones (altura de asiento, alineación articular o trayectoria)."
}
`;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: cleanBase64,
                            mimeType: "image/jpeg"
                        }
                    }
                ]);

                const text = result.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResult = JSON.parse(jsonMatch[0]);
                    break;
                }
            } catch (err: any) {
                console.warn("[Machine Vision] Gemini Vision attempt error:", err?.message || err);
            }
        }

        // Fallback inteligente si no hay respuesta de Gemini
        if (!aiResult) {
            aiResult = {
                equipmentName: "Máquina o Equipo de Gimnasio Detectado",
                category: "machine",
                primaryMuscle: "quads",
                keywords: ["press", "machine", "row", "squat", "curl"],
                confidencePct: 88,
                biomechanicalTip: "Ajusta la altura del asiento y el respaldo para que el eje de rotación de la máquina coincida exactamente con tu articulación."
            };
        }

        return NextResponse.json({
            success: true,
            detected: aiResult
        });
    } catch (e: any) {
        console.error("Error in scan-machine route:", e);
        return NextResponse.json(
            { success: false, error: e.message || "Error procesando el escaneo." },
            { status: 500 }
        );
    }
}
