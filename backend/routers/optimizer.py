# backend/routers/optimizer.py
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/optimizer", tags=["1D Cut List Optimizer"])

class CutPiece(BaseModel):
    label: str
    length_m: float
    quantity: int

class OptimizeRequest(BaseModel):
    stock_length_m: float = 6.0
    kerf_mm: float = 3.0
    pieces: list[CutPiece]

class BarCut(BaseModel):
    bar_number: int
    cuts: list[dict]
    used_length_m: float
    kerf_loss_m: float
    waste_m: float
    efficiency_pct: float

class OptimizationResponse(BaseModel):
    total_bars_needed: int
    total_linear_meters: float
    total_waste_m: float
    overall_efficiency_pct: float
    bars: list[BarCut]

@router.post("/cut-list-1d", response_model=OptimizationResponse)
def optimize_cut_list(req: OptimizeRequest):
    kerf_m = req.kerf_mm / 1000.0
    pieces_flat = []

    for item in req.pieces:
        for _ in range(item.quantity):
            if item.length_m <= req.stock_length_m:
                pieces_flat.append({"label": item.label, "length_m": round(item.length_m, 3)})

    # First-Fit Decreasing
    pieces_flat.sort(key=lambda x: x["length_m"], reverse=True)

    bars: list[dict] = []

    for piece in pieces_flat:
        placed = False
        for bar in bars:
            current_total = bar["used_length_m"] + bar["kerf_loss_m"]
            extra_kerf = kerf_m if len(bar["cuts"]) > 0 else 0
            if current_total + piece["length_m"] + extra_kerf <= req.stock_length_m + 0.0001:
                bar["cuts"].append(piece)
                bar["used_length_m"] = round(bar["used_length_m"] + piece["length_m"], 3)
                bar["kerf_loss_m"] = round(len(bar["cuts"]) * kerf_m, 3)
                bar["waste_m"] = round(max(0.0, req.stock_length_m - bar["used_length_m"] - bar["kerf_loss_m"]), 3)
                bar["efficiency_pct"] = round((bar["used_length_m"] / req.stock_length_m) * 100.0, 1)
                placed = True
                break

        if not placed:
            init_kerf = kerf_m if piece["length_m"] < req.stock_length_m else 0
            waste = max(0.0, req.stock_length_m - piece["length_m"] - init_kerf)
            bars.append({
                "bar_number": len(bars) + 1,
                "cuts": [piece],
                "used_length_m": piece["length_m"],
                "kerf_loss_m": round(init_kerf, 3),
                "waste_m": round(waste, 3),
                "efficiency_pct": round((piece["length_m"] / req.stock_length_m) * 100.0, 1),
            })

    total_bars = len(bars)
    total_linear = round(sum(b["used_length_m"] for b in bars), 2)
    total_waste = round(sum(b["waste_m"] for b in bars), 2)
    overall_eff = round((total_linear / (total_bars * req.stock_length_m) * 100.0), 1) if total_bars > 0 else 0.0

    return OptimizationResponse(
        total_bars_needed=total_bars,
        total_linear_meters=total_linear,
        total_waste_m=total_waste,
        overall_efficiency_pct=overall_eff,
        bars=[BarCut(**b) for b in bars]
    )
