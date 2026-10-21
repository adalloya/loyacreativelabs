# backend/routers/gemini_vision.py
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
import os

router = APIRouter(prefix="/api/gemini", tags=["Gemini Vision Structural Analyzer"])

class CutPartSchema(BaseModel):
    profile_type: str = Field(description="Ej. PTR 2x2 Cal 14, Tubo Zintro R-300, Solera 3/16")
    piece_label: str = Field(description="Nombre de la pieza (ej. Marco perimetral, duela horizontal)")
    length_meters: float
    quantity: int
    estimated_weight_kg: float

class StructuralAnalysisSchema(BaseModel):
    project_title: str
    architectural_style: str
    suggested_profiles: list[str]
    cut_parts: list[CutPartSchema]
    total_estimated_weight_kg: float
    estimated_steel_cost_mxn: float
    recommended_welding_process: str
    merida_corrosion_notes: str
    example_blueprint_ascii: str

@router.post("/analyze-structure", response_model=StructuralAnalysisSchema)
async def analyze_structure_photo(
    file: UploadFile = File(...),
    operator: str = Form("Adal")
):
    try:
        image_bytes = await file.read()
        client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
        prompt = (
            "Eres un maestro herrero estructural experto y calculador de costos en Mérida, Yucatán. "
            "Analiza esta fotografía o plano de herrería residencial (portón, pérgola, protector o reja). "
            "Devuelve un despiece técnico detallado con perfiles comerciales reales en México (PTR, Zintro C-100/R-200/R-300, soleras), "
            "cálculo aproximado de pesos, costos estimados en pesos mexicanos (MXN), proceso de soldadura ideal, "
            "recomendaciones anticorrosivas para el clima de alta humedad y salitre en Yucatán, "
            "y un plano esquemático en formato ASCII."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=file.content_type or "image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StructuralAnalysisSchema,
                temperature=0.2
            )
        )
        return StructuralAnalysisSchema.model_validate_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis de Gemini Vision: {str(e)}")

class FacadeInpaintRequest(BaseModel):
    preset_title: str
    profiles_used: str
    custom_notes: str = ""

@router.post("/facade-consultation")
async def facade_consultation(request: FacadeInpaintRequest):
    try:
        client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
        prompt = (
            f"Actúa como un arquitecto y maestro herrero en Mérida, Yucatán. "
            f"El cliente desea instalar en su fachada el diseño: '{request.preset_title}' "
            f"utilizando los perfiles: '{request.profiles_used}'. "
            f"Detalles adicionales: '{request.custom_notes}'. "
            f"Genera una recomendación técnica concisa sobre holguras, fijación en muros yucatecos "
            f"(block o laja), espesor de primario anticorrosivo y especificación estética."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return {"recommendation": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en consulta arquitectónica: {str(e)}")
