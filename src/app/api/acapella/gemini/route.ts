import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
  process.env.GOOGLE_API_KEY,
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY_BACKUP,
].filter(Boolean) as string[];

const SYSTEM_INSTRUCTION = `
Eres el Vocal Coach Profesional de VoxStudio Pro / Acapella en Loya Creative Lab.
Eres un maestro de canto de élite y fonoaudiólogo vocal (estilo Seth Riggs, Speech Level Singing y técnica de Bel Canto moderno).
Tus respuestas son concisas, técnicas, motivadoras, amables y altamente prácticas.
Usa terminología precisa (apoyo costodiafragmático, resonadores faciales/máscara, velo del paladar, passaggi, voz de pecho, mixta, de cabeza, cierre cordal, twang y libertad laríngea).
Responde siempre en español.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const apiKey = API_KEYS[0];
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API Key no configurada",
          diagnosis: "Configura tu GOOGLE_API_KEY para recibir feedback vocal inteligente en tiempo real."
        },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
    ].filter(Boolean) as string[];

    let prompt = "";

    if (action === "analyze-take") {
      const { title, durationSec, avgAccuracy, dominantNote } = payload || {};
      prompt = `
Analiza la siguiente toma vocal grabada por el alumno:
- Título/Canción: "${title || "Práctica vocal"}"
- Duración: ${durationSec || 0} segundos
- Precisión de afinación media: ${avgAccuracy || 0}%
- Centro tonal / Nota predominante: ${dominantNote || "N/D"}

Proporciona un diagnóstico vocal exprés de 3 partes:
1. 🎯 Diagnóstico de Afinación y Resonancia (breve análisis del porcentaje y nota).
2. 💡 Consejo Técnico Corporal (postura, velo del paladar, mandíbula o aire).
3. 🚀 Ejercicio de 1 minuto recomendado (ej. Trino de labios, Sirena en 'Ng', o 'Gu-Gu').
Sé directo, inspirador y profesional (máximo 140 palabras).
`;
    } else if (action === "repertoire-breakdown") {
      const { songTitle, artist, lyrics } = payload || {};
      prompt = `
El alumno quiere cantar la canción "${songTitle}" de "${artist}".
Frase o fragmento: "${lyrics}".

Proporciona:
1. Registro vocal recomendado para este fragmento (Voz de Pecho, Mixta o Cabeza).
2. Dónde colocar la marca de respiración diafragmática.
3. Tip de vocalización o fonética correctiva para las vocales difíciles de esa frase.
Máximo 100 palabras.
`;
    } else {
      prompt = `Proporciona 3 tips fundamentales de calentamiento vocal y cuidado de la voz para cantantes profesionales en 100 palabras.`;
    }

    let responseText = "";
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Acapella Gemini] Model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("No se pudo obtener respuesta del modelo Gemini");
    }

    return NextResponse.json({
      success: true,
      result: responseText,
    });
  } catch (error: any) {
    console.error("[Acapella Gemini Route] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error procesando solicitud con Gemini",
        result: "Excelente esfuerzo en la toma. Para optimizar la afinación, mantén el apoyo abdominal firme al inhalar y abre espacio vertical en el paladar blando sin tensionar la mandíbula.",
      },
      { status: 200 }
    );
  }
}
