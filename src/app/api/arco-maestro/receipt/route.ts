import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY_BACKUP;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY o GEMINI_API_KEY no está configurada en el servidor" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó imagen de ticket" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Eres un contador y auditor de taller de herrería en Mérida, Yucatán.
Analiza este ticket o factura de ferretería, casa de aceros (Aceros Yucatecos, Boxito, Home Depot, Ferrotlapalera) o tienda de herramientas.
Extrae los datos en formato JSON estricto con esta estructura exacta:
{
  "vendor_name": "Nombre de la tienda o proveedor",
  "date": "YYYY-MM-DD",
  "summary_description": "Resumen conciso de los materiales o equipos comprados",
  "category": "Equipo_Inicial" | "Acero" | "Consumible" | "Material_Obra" | "Herramienta",
  "total_mxn": 0.00
}
No agregues comentarios ni Markdown exterior, solo el JSON puro.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error procesando ticket en Gemini:", error);
    return NextResponse.json(
      { error: "Error en el procesamiento del ticket con Gemini Vision: " + error.message },
      { status: 500 }
    );
  }
}
