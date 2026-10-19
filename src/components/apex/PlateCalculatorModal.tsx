// src/components/apex/PlateCalculatorModal.tsx
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10 font-sans text-white">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <Disc size={18} className="text-white" />
                        <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight uppercase text-white">
                            CALCULADORA DE DISCOS & APROXIMACIÓN
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Weight Input Selector */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4 text-center">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
                        PESO OBJETIVO DE TRABAJO
                    </span>
                    <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white my-2 tracking-tight">
                        {targetWeight} <span className="text-xl font-normal text-zinc-500">kg</span>
                    </div>

                    {/* Quick Steppers */}
                    <div className="flex justify-center gap-2 font-mono text-xs mt-3 flex-wrap">
                        {[-10, -2.5, +2.5, +5, +10].map(val => (
                            <button
                                key={val}
                                onClick={() => adjustWeight(val)}
                                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-semibold transition-all active:scale-95"
                            >
                                {val > 0 ? `+${val}` : val} kg
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plates Visual Breakdown per Side */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                            <Layers size={14} className="text-white" /> CARGA POR CADA LADO (BARRA {barWeight}KG)
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                            {((targetWeight - barWeight) / 2).toFixed(1)} kg por lado
                        </span>
                    </div>

                    {platesPerSide.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                            {platesPerSide.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between"
                                >
                                    <span className="text-zinc-400">Disco {p.plateKg} kg:</span>
                                    <span className="text-white font-bold text-xs bg-white/[0.08] px-2 py-0.5 rounded-lg border border-white/[0.08]">
                                        ×{p.countPerSide}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs font-mono text-zinc-500 text-center py-2">
                            Solo la barra olímpica de {barWeight} kg (sin discos adicionales).
                        </p>
                    )}
                </div>

                {/* Warmup Protocol (Zero Glucolytic Fatigue) */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-mono font-semibold text-[#FF2A2A]">
                        <Flame size={14} /> SERIES DE APROXIMACIÓN (CERO FATIGA)
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                        {warmupSets.map(w => (
                            <div
                                key={w.setNumber}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                            >
                                <div>
                                    <span className="text-white font-semibold mr-2">Serie {w.setNumber}:</span>
                                    <span className="text-white font-bold">{w.weightKg} kg</span>
                                    <span className="text-zinc-400 text-[11px] ml-1.5">× {w.reps} reps ({w.percentage}%)</span>
                                </div>
                                <span className="text-[10px] text-zinc-500">Pausa: {w.restSeconds}s</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                    Listo para Entrenar
                </button>
            </div>
        </div>
    );
}
