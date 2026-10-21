from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.services.receipt_scanner import parse_hardware_receipt, ReceiptExtraction
from backend.routers.gemini_vision import router as gemini_router
from backend.routers.optimizer import router as optimizer_router

app = FastAPI(
    title="Arco Maestro - AI Welding Backend API",
    description="Microservicio de visión computacional, OCR estructurado y optimización 1D para herrería residencial en Mérida",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gemini_router)
app.include_router(optimizer_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Arco Maestro AI Backend",
        "model": "gemini-2.5-flash"
    }

@app.post("/api/scan-receipt", response_model=ReceiptExtraction)
async def scan_receipt(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        extracted_data = parse_hardware_receipt(image_bytes)
        return extracted_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al analizar el ticket con Gemini Vision: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
