import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No se envió imagen del ticket" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Extrae todos los datos de este ticket de ferretería o casa de aceros en México.
Devuelve únicamente un JSON estricto con la siguiente estructura:
{
  "vendor_name": "Nombre del proveedor o tienda",
  "date": "YYYY-MM-DD",
  "summary_description": "Resumen de materiales comprados",
  "category": "Equipo_CAPEX" | "Acero" | "Consumible" | "Pintura" | "Herramienta",
  "total_mxn": 0.00
}
`;

    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const text = response.response.text();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error en gemini receipt OCR:", error);
    return NextResponse.json(
      { error: "Error procesando ticket con Gemini: " + error.message },
      { status: 500 }
    );
  }
}
