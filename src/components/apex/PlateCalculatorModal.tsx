// src/components/apex/PlateCalculatorModal.tsx
"use client";

import { useState } from "react";
import { calculatePlatesPerSide, generateWarmupProtocol } from "@/lib/hypertrophy-engine";
import { X, Disc, Flame, ChevronDown, ChevronUp, Check } from "lucide-react";

interface PlateCalculatorModalProps {
    initialWeightKg?: number;
    initialWeight?: number;
    unit?: "lbs" | "kg";
    onClose: () => void;
}

const PLATE_COLORS: Record<number, { bg: string; text: string; border: string; ring: string }> = {
    // LBS Standard
    45: { bg: "bg-[#3B82F6]", text: "text-white", border: "border-blue-400", ring: "ring-blue-500/30" },
    35: { bg: "bg-[#EAB308]", text: "text-black", border: "border-yellow-300", ring: "ring-yellow-500/30" },
    // KG & LBS Shared
    25: { bg: "bg-[#EF4444]", text: "text-white", border: "border-red-400", ring: "ring-red-500/30" },
    20: { bg: "bg-[#3B82F6]", text: "text-white", border: "border-blue-400", ring: "ring-blue-500/30" },
    15: { bg: "bg-[#EAB308]", text: "text-black", border: "border-yellow-300", ring: "ring-yellow-500/30" },
    10: { bg: "bg-[#10B981]", text: "text-white", border: "border-emerald-400", ring: "ring-emerald-500/30" },
    5: { bg: "bg-[#F4F4F5]", text: "text-black", border: "border-zinc-300", ring: "ring-zinc-400/30" },
    2.5: { bg: "bg-[#27272A]", text: "text-white", border: "border-zinc-600", ring: "ring-zinc-700/30" },
    1.25: { bg: "bg-[#71717A]", text: "text-white", border: "border-zinc-500", ring: "ring-zinc-600/30" }
};

export function PlateCalculatorModal({
    initialWeightKg,
    initialWeight,
    unit = "lbs",
    onClose
}: PlateCalculatorModalProps) {
    const activeUnit = unit || "lbs";
    const defaultBar = activeUnit === "lbs" ? 45 : 20;
    const defaultTarget = initialWeight !== undefined 
        ? initialWeight 
        : initialWeightKg !== undefined 
            ? initialWeightKg 
            : (activeUnit === "lbs" ? 135 : 80);

    const [targetWeight, setTargetWeight] = useState(defaultTarget);
    const [barWeight, setBarWeight] = useState(defaultBar);
    const [showWarmup, setShowWarmup] = useState(false);

    const platesPerSide = calculatePlatesPerSide(targetWeight, barWeight);
    const warmupSets = generateWarmupProtocol(targetWeight, barWeight, activeUnit);

    const adjustWeight = (delta: number) => {
        setTargetWeight(prev => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
    };

    const weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);

    // Expandir lista plana de discos para visualización de manga
    const plateListForSleeve: number[] = [];
    platesPerSide.forEach(p => {
        const val = p.plateWeight ?? p.plateKg;
        for (let i = 0; i < p.countPerSide; i++) {
            plateListForSleeve.push(val);
        }
    });

    const steppers = activeUnit === "lbs" 
        ? [-20, -10, -5, +5, +10, +20] 
        : [-10, -5, -2.5, +2.5, +5, +10];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans text-white">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                            <Disc size={18} className="text-[#FF2A2A]" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight uppercase text-white">
                                CALCULADORA DE DISCOS
                            </h2>
                            <p className="text-[11px] text-zinc-400 font-mono">
                                Barra Olímpica: {barWeight} {activeUnit}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Selector de Peso Total */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-4 text-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                        PESO TOTAL EN BARRA ({activeUnit.toUpperCase()})
                    </span>
                    <div className="flex items-center justify-center gap-1.5 my-1">
                        <input
                            type="number"
                            step={activeUnit === "lbs" ? "1" : "0.5"}
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(Math.max(barWeight, parseFloat(e.target.value) || barWeight))}
                            className="text-4xl sm:text-5xl font-extrabold font-mono text-white text-center bg-transparent outline-none w-36"
                        />
                        <span className="text-xl font-normal text-zinc-500 font-mono">{activeUnit}</span>
                    </div>

                    {/* Quick Steppers */}
                    <div className="flex justify-center gap-1.5 font-mono text-xs mt-2 flex-wrap">
                        {steppers.map(val => (
                            <button
                                key={val}
                                onClick={() => adjustWeight(val)}
                                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 hover:text-white font-semibold transition-all active:scale-95"
                            >
                                {val > 0 ? `+${val}` : val} {activeUnit}
                            </button>
                        ))}
                    </div>
                </div>

                {/* HERO RESULT: Exactamente cuánto peso de cada lado */}
                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.1] rounded-3xl p-5 mb-4 text-center">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        CARGA EN CADA LADO (IZQUIERDO Y DERECHO)
                    </span>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight my-1">
                        {weightPerSide.toFixed(1)} <span className="text-lg font-normal text-zinc-400">{activeUnit} por lado</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono mt-1">
                        {weightPerSide} {activeUnit} izq + {weightPerSide} {activeUnit} der + barra {barWeight} {activeUnit} = {targetWeight} {activeUnit} total
                    </p>

                    {/* Manga Visual de la Barra con Discos en Orden */}
                    {plateListForSleeve.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/[0.06]">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                                ORDEN EN LA MANGA DE LA BARRA (DE ADENTRO HACIA AFUERA)
                            </span>
                            <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-2 px-1">
                                {/* Cuello de la barra */}
                                <div className="w-4 h-16 bg-zinc-700 rounded-l-md border border-zinc-600 shrink-0" title="Tope de la barra" />
                                
                                {plateListForSleeve.map((plateVal, idx) => {
                                    const style = PLATE_COLORS[plateVal] || { bg: "bg-zinc-800", text: "text-white", border: "border-zinc-700" };
                                    const heightClass = plateVal >= (activeUnit === "lbs" ? 45 : 20)
                                        ? "h-20"
                                        : plateVal >= (activeUnit === "lbs" ? 25 : 10)
                                            ? "h-16"
                                            : plateVal >= (activeUnit === "lbs" ? 10 : 5)
                                                ? "h-12"
                                                : "h-10";
                                    return (
                                        <div
                                            key={idx}
                                            className={`w-9 sm:w-10 ${heightClass} ${style.bg} ${style.text} ${style.border} border-2 rounded-md flex flex-col items-center justify-center font-mono font-black text-[10px] sm:text-xs shrink-0 shadow-lg`}
                                            title={`Disco de ${plateVal} ${activeUnit}`}
                                        >
                                            <span>{plateVal}</span>
                                            <span className="text-[8px] opacity-75">{activeUnit}</span>
                                        </div>
                                    );
                                })}

                                {/* Extremo de la barra */}
                                <div className="w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-r-md shrink-0" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Desglose Directo y Sin Confusión: Qué discos poner */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-4">
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block mb-2.5">
                        DISCOS EXACTOS A COLOCAR POR LADO:
                    </span>

                    {platesPerSide.length > 0 ? (
                        <div className="space-y-2">
                            {platesPerSide.map((p, idx) => {
                                const val = p.plateWeight ?? p.plateKg;
                                const style = PLATE_COLORS[val] || { bg: "bg-zinc-800", text: "text-white", border: "border-zinc-700" };
                                return (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between font-mono"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-3.5 h-3.5 rounded-full ${style.bg} border ${style.border} shrink-0`} />
                                            <span className="text-sm font-bold text-white">
                                                {p.countPerSide} × disco{p.countPerSide > 1 ? "s" : ""} de {val} {activeUnit}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-zinc-400 bg-white/[0.06] px-2.5 py-1 rounded-xl">
                                            = {(p.countPerSide * val).toFixed(1)} {activeUnit}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-3 text-center bg-white/[0.02] rounded-xl text-xs font-mono text-zinc-400">
                            Solo la barra olímpica vacía ({barWeight} {activeUnit}). No agregues discos.
                        </div>
                    )}
                </div>

                {/* Toggle Opcional para Calentamiento (No estorba al usuario) */}
                <div className="border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
                    <button
                        onClick={() => setShowWarmup(!showWarmup)}
                        className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between text-xs font-mono text-zinc-300 font-semibold"
                    >
                        <span className="flex items-center gap-2">
                            <Flame size={14} className="text-[#FF2A2A]" />
                            <span>Series de Aproximación / Calentamiento (Opcional)</span>
                        </span>
                        {showWarmup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showWarmup && (
                        <div className="p-3.5 space-y-2 font-mono text-xs border-t border-white/[0.06] bg-black/40">
                            {warmupSets.map(w => (
                                <div
                                    key={w.setNumber}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                                >
                                    <div>
                                        <span className="text-zinc-400 font-semibold mr-2">Serie {w.setNumber}:</span>
                                        <span className="text-white font-bold">{w.weightKg} {activeUnit}</span>
                                        <span className="text-zinc-500 text-[11px] ml-1.5">× {w.reps} reps ({w.percentage}%)</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">Descanso: {w.restSeconds}s</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botón de Cierre */}
                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                    <Check size={16} strokeWidth={3} />
                    <span>Listo para Entrenar</span>
                </button>
            </div>
        </div>
    );
}
