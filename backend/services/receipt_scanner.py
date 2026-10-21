# backend/services/receipt_scanner.py
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class ReceiptItem(BaseModel):
    description: str = Field(description="Nombre del material, perfil o herramienta")
    quantity: float
    unit_price: float
    total: float
    category: str = Field(description="Clasificar en: Acero, Consumible, Herramienta, Pintura, Otro")

class ReceiptExtraction(BaseModel):
    vendor_name: str
    date: str
    items: list[ReceiptItem]
    subtotal: float
    tax_iva: float
    total_mxn: float

def parse_hardware_receipt(image_bytes: bytes) -> ReceiptExtraction:
    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            "Extrae todos los datos de este ticket de ferretería o casa de aceros en México."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ReceiptExtraction,
            temperature=0.1
        )
    )
    return ReceiptExtraction.model_validate_json(response.text)
