"use client";

import { useState } from "react";
import { calculatePlatesPerSide, generateWarmupProtocol } from "@/lib/hypertrophy-engine";
import { X, Disc, Flame, Layers } from "lucide-react";

interface PlateCalculatorModalProps {
    initialWeightKg?: number;
    onClose: () => void;
}

export function PlateCalculatorModal({
    initialWeightKg = 80,
    onClose
}: PlateCalculatorModalProps) {
    const [targetWeight, setTargetWeight] = useState(initialWeightKg);
    const [barWeight, setBarWeight] = useState(20);

    const platesPerSide = calculatePlatesPerSide(targetWeight, barWeight);
    const warmupSets = generateWarmupProtocol(targetWeight, barWeight);

    const adjustWeight = (delta: number) => {
        setTargetWeight(prev => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 font-sans text-white">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#1E2633] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Disc size={18} className="text-[#38BDF8]" />
                        <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight uppercase">
                            CALCULADORA DE DISCOS & WARM-UP
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[#8892B0] hover:text-white rounded-lg hover:bg-[#161C26]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Weight Input Selector */}
                <div className="bg-[#10141D] border border-[#1E2633] rounded-xl p-4 mb-4 text-center">
                    <span className="text-[11px] font-mono text-[#8892B0] tracking-widest uppercase">
                        PESO OBJETIVO DE TRABAJO
                    </span>
                    <div className="text-4xl font-extrabold font-mono text-white my-2">
                        {targetWeight} <span className="text-xl font-normal text-[#8892B0]">kg</span>
                    </div>

                    {/* Quick Steppers */}
                    <div className="flex justify-center gap-2 font-mono text-xs mt-3 flex-wrap">
                        {[-10, -2.5, +2.5, +5, +10].map(val => (
                            <button
                                key={val}
                                onClick={() => adjustWeight(val)}
                                className="px-3 py-1.5 rounded-lg bg-[#161C26] hover:bg-[#202938] border border-[#2B3547] text-slate-200 font-semibold transition-all active:scale-95"
                            >
                                {val > 0 ? `+${val}` : val} kg
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plates Visual Breakdown per Side */}
                <div className="bg-[#10141D] border border-[#1E2633] rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-xs font-mono font-semibold text-[#64FFDA] flex items-center gap-1.5">
                            <Layers size={14} /> CARGA POR CADA LADO (BARRA {barWeight}KG)
                        </span>
                        <span className="text-[10px] font-mono text-[#8892B0]">
                            Total por lado: {((targetWeight - barWeight) / 2).toFixed(1)} kg
                        </span>
                    </div>

                    {platesPerSide.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                            {platesPerSide.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-[#161C26] border border-[#2B3547] flex items-center justify-between"
                                >
                                    <span className="text-[#8892B0]">Disco {p.plateKg} kg:</span>
                                    <span className="text-white font-bold text-sm bg-[#0A0D12] px-2 py-0.5 rounded border border-[#334155]">
                                        ×{p.countPerSide}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs font-mono text-[#717C96] text-center py-2">
                            Solo la barra olímpica de {barWeight} kg (sin discos adicionales).
                        </p>
                    )}
                </div>

                {/* Warmup Protocol (Zero Glucolytic Fatigue) */}
                <div className="bg-[#10141D] border border-[#1E2633] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-mono font-semibold text-[#F59E0B]">
                        <Flame size={14} /> SERIES DE APROXIMACIÓN (SIN FATIGA)
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                        {warmupSets.map(w => (
                            <div
                                key={w.setNumber}
                                className="flex items-center justify-between p-2 rounded-lg bg-[#161C26]/70 border border-[#232D3F]"
                            >
                                <div>
                                    <span className="text-white font-semibold mr-2">Serie {w.setNumber}:</span>
                                    <span className="text-[#64FFDA]">{w.weightKg} kg</span>
                                    <span className="text-[#8892B0] text-[11px] ml-1">× {w.reps} reps ({w.percentage}%)</span>
                                </div>
                                <span className="text-[10px] text-[#717C96]">Descanso: {w.restSeconds}s</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 bg-white hover:bg-slate-200 text-black font-semibold rounded-xl text-sm transition-all active:scale-95"
                >
                    Listo para Entrenar
                </button>
            </div>
        </div>
    );
}
