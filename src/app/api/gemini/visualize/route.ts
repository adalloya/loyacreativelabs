import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY_BACKUP;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY o GEMINI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { presetTitle, profilesUsed, customNotes } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Actúa como un arquitecto y maestro herrero en Mérida, Yucatán.
El cliente desea visualizar e instalar en la fachada de su casa el siguiente proyecto:
- Modelo: ${presetTitle}
- Perfiles Comerciales: ${profilesUsed}
- Observaciones de vano / muro: ${customNotes || "Vano estándar residencial en Mérida"}

Genera una especificación técnica arquitectónica concisa en español (máximo 3 párrafos), abordando:
1. Recomendación de diseño y proporción visual con muros de acabado chukum o estuco blanco.
2. Sistema de fijación estructural según el sustrato (columnas de concreto vs. muro de block yucateco con taquetes o varillas a 45°).
3. Protocolo de sellado y pintura para clima tropical con salitre y humedad extrema.
`;

    const result = await model.generateContent(prompt);
    const recommendation = result.response.text();

    return NextResponse.json({ recommendation });
  } catch (error: any) {
    console.error("Error en visualize API:", error);
    return NextResponse.json(
      { error: "Error en el análisis de Gemini: " + error.message },
      { status: 500 }
    );
  }
}
