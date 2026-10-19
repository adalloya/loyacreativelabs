"use client";

import { useState } from "react";
import { MuscleGroup } from "@/lib/hypertrophy-engine";
import { RotateCw, Shield, Zap } from "lucide-react";

interface AnatomyVisualizerProps {
    selectedMuscle: MuscleGroup | null;
    activeMusclesToday: MuscleGroup[];
    onSelectMuscle: (muscle: MuscleGroup) => void;
}

export function AnatomyVisualizer({
    selectedMuscle,
    activeMusclesToday,
    onSelectMuscle
}: AnatomyVisualizerProps) {
    const [view, setView] = useState<"front" | "back">("front");

    const getMuscleColor = (muscle: MuscleGroup) => {
        if (selectedMuscle === muscle) return "#FF2A2A"; // Rojo brillante seleccionado
        if (activeMusclesToday.includes(muscle)) return "#E11D48"; // Rojo activo hoy
        return "#1F242D"; // Base técnica oscura
    };

    const getMuscleStroke = (muscle: MuscleGroup) => {
        if (selectedMuscle === muscle) return "#FFFFFF";
        if (activeMusclesToday.includes(muscle)) return "#FF2A2A";
        return "#333C4D";
    };

    return (
        <div className="relative bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-4 flex flex-col items-center select-none overflow-hidden">
            {/* Header Telemetry */}
            <div className="w-full flex justify-between items-center mb-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[#8892B0]">
                    <Shield size={14} className="text-[#64FFDA]" />
                    <span className="tracking-widest uppercase">MAPA ANATÓMICO 3D</span>
                </div>
                <button
                    onClick={() => setView(v => v === "front" ? "back" : "front")}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#161C26] hover:bg-[#202938] border border-[#2B3547] rounded-full text-white text-[11px] transition-all"
                >
                    <RotateCw size={12} className={view === "back" ? "rotate-180 transition-transform" : "transition-transform"} />
                    <span>{view === "front" ? "VER ESPALDA" : "VER FRENTE"}</span>
                </button>
            </div>

            {/* Subtitle Hint */}
            <p className="text-[11px] text-[#717C96] font-mono mb-2 text-center">
                Toca cualquier grupo muscular para abrir su matriz biomecánica Tier S
            </p>

            {/* SVG Anatomy Wireframe Silhouette */}
            <div className="relative w-full max-w-[280px] h-[360px] flex items-center justify-center">
                <svg
                    viewBox="0 0 200 320"
                    className="w-full h-full drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Head & Neck Wireframe */}
                    <ellipse cx="100" cy="24" rx="14" ry="17" fill="#141822" stroke="#2B3547" strokeWidth="1.5" />
                    <path d="M93 40 L93 50 M107 40 L107 50" stroke="#2B3547" strokeWidth="1.5" />

                    {view === "front" ? (
                        <>
                            {/* DELTOIDES (FRONT DELTS) */}
                            <path
                                d="M72 52 C64 54 55 64 54 78 C54 84 57 88 62 86 C67 84 72 74 74 65 Z"
                                fill={getMuscleColor("delts")}
                                stroke={getMuscleStroke("delts")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("delts")}
                            />
                            <path
                                d="M128 52 C136 54 145 64 146 78 C146 84 143 88 138 86 C133 84 128 74 126 65 Z"
                                fill={getMuscleColor("delts")}
                                stroke={getMuscleStroke("delts")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("delts")}
                            />

                            {/* PECTORAL (CHEST) */}
                            <path
                                d="M74 55 C82 55 98 57 99 76 C95 86 78 88 71 85 C68 81 70 62 74 55 Z"
                                fill={getMuscleColor("chest")}
                                stroke={getMuscleStroke("chest")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("chest")}
                            />
                            <path
                                d="M126 55 C118 55 102 57 101 76 C105 86 122 88 129 85 C132 81 130 62 126 55 Z"
                                fill={getMuscleColor("chest")}
                                stroke={getMuscleStroke("chest")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("chest")}
                            />

                            {/* BÍCEPS */}
                            <path
                                d="M54 86 C50 90 48 106 50 118 C54 120 58 116 60 108 C62 98 60 88 54 86 Z"
                                fill={getMuscleColor("biceps")}
                                stroke={getMuscleStroke("biceps")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("biceps")}
                            />
                            <path
                                d="M146 86 C150 90 152 106 150 118 C146 120 142 116 140 108 C138 98 140 88 146 86 Z"
                                fill={getMuscleColor("biceps")}
                                stroke={getMuscleStroke("biceps")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("biceps")}
                            />

                            {/* ANTEBRAZOS */}
                            <path d="M47 122 C44 135 44 150 49 160 C53 158 56 148 55 136 Z" fill="#141822" stroke="#2B3547" strokeWidth="1" />
                            <path d="M153 122 C156 135 156 150 151 160 C147 158 144 148 145 136 Z" fill="#141822" stroke="#2B3547" strokeWidth="1" />

                            {/* CORE / ABDOMEN */}
                            <rect
                                x="84"
                                y="90"
                                width="32"
                                height="48"
                                rx="4"
                                fill={getMuscleColor("core")}
                                stroke={getMuscleStroke("core")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("core")}
                            />
                            {/* Líneas de six pack */}
                            <line x1="100" y1="90" x2="100" y2="138" stroke="#161C26" strokeWidth="1.5" />
                            <line x1="84" y1="106" x2="116" y2="106" stroke="#161C26" strokeWidth="1.5" />
                            <line x1="84" y1="122" x2="116" y2="122" stroke="#161C26" strokeWidth="1.5" />

                            {/* CUÁDRICEPS */}
                            <path
                                d="M74 148 C70 162 67 195 72 216 C78 220 86 216 90 200 C93 186 94 162 90 148 Z"
                                fill={getMuscleColor("quads")}
                                stroke={getMuscleStroke("quads")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("quads")}
                            />
                            <path
                                d="M126 148 C130 162 133 195 128 216 C122 220 114 216 110 200 C107 186 106 162 110 148 Z"
                                fill={getMuscleColor("quads")}
                                stroke={getMuscleStroke("quads")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("quads")}
                            />

                            {/* PANTORRILLAS (CALVES FRONT) */}
                            <path
                                d="M72 230 C69 248 68 274 73 290 C78 292 84 286 86 270 C88 252 87 236 82 230 Z"
                                fill={getMuscleColor("calves")}
                                stroke={getMuscleStroke("calves")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("calves")}
                            />
                            <path
                                d="M128 230 C131 248 132 274 127 290 C122 292 116 286 114 270 C112 252 113 236 118 230 Z"
                                fill={getMuscleColor("calves")}
                                stroke={getMuscleStroke("calves")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("calves")}
                            />
                        </>
                    ) : (
                        <>
                            {/* ESPALDA ALTA / TRAPECIO */}
                            <path
                                d="M84 45 L116 45 L128 62 L100 88 L72 62 Z"
                                fill={getMuscleColor("upper_back")}
                                stroke={getMuscleStroke("upper_back")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("upper_back")}
                            />

                            {/* DELTOIDES POSTERIOR */}
                            <path
                                d="M70 56 C62 58 55 68 54 82 C58 84 64 78 68 70 Z"
                                fill={getMuscleColor("delts")}
                                stroke={getMuscleStroke("delts")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("delts")}
                            />
                            <path
                                d="M130 56 C138 58 145 68 146 82 C142 84 136 78 132 70 Z"
                                fill={getMuscleColor("delts")}
                                stroke={getMuscleStroke("delts")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("delts")}
                            />

                            {/* DORSALES (LATS) */}
                            <path
                                d="M72 80 C68 96 68 122 78 132 C84 134 88 126 88 114 C88 98 84 86 72 80 Z"
                                fill={getMuscleColor("lats")}
                                stroke={getMuscleStroke("lats")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("lats")}
                            />
                            <path
                                d="M128 80 C132 96 132 122 122 132 C116 134 112 126 112 114 C112 98 116 86 128 80 Z"
                                fill={getMuscleColor("lats")}
                                stroke={getMuscleStroke("lats")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("lats")}
                            />

                            {/* TRÍCEPS */}
                            <path
                                d="M52 86 C48 95 46 112 50 120 C54 120 58 112 58 100 C58 92 56 86 52 86 Z"
                                fill={getMuscleColor("triceps")}
                                stroke={getMuscleStroke("triceps")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("triceps")}
                            />
                            <path
                                d="M148 86 C152 95 154 112 150 120 C146 120 142 112 142 100 C142 92 144 86 148 86 Z"
                                fill={getMuscleColor("triceps")}
                                stroke={getMuscleStroke("triceps")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("triceps")}
                            />

                            {/* GLÚTEOS (GLUTES) */}
                            <path
                                d="M74 140 C68 152 70 174 80 180 C90 184 96 172 98 154 C98 142 88 138 74 140 Z"
                                fill={getMuscleColor("glutes")}
                                stroke={getMuscleStroke("glutes")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("glutes")}
                            />
                            <path
                                d="M126 140 C132 152 130 174 120 180 C110 184 104 172 102 154 C102 142 112 138 126 140 Z"
                                fill={getMuscleColor("glutes")}
                                stroke={getMuscleStroke("glutes")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("glutes")}
                            />

                            {/* ISQUIOTIBIALES (HAMSTRINGS) */}
                            <path
                                d="M74 184 C70 196 68 214 74 224 C80 226 88 220 90 206 C92 196 92 186 86 182 Z"
                                fill={getMuscleColor("hamstrings")}
                                stroke={getMuscleStroke("hamstrings")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("hamstrings")}
                            />
                            <path
                                d="M126 184 C130 196 132 214 126 224 C120 226 112 220 110 206 C108 196 108 186 114 182 Z"
                                fill={getMuscleColor("hamstrings")}
                                stroke={getMuscleStroke("hamstrings")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("hamstrings")}
                            />

                            {/* PANTORRILLAS (GEMELOS POSTERIORES) */}
                            <path
                                d="M72 232 C68 250 67 274 72 290 C78 292 84 286 86 270 C88 252 88 238 82 232 Z"
                                fill={getMuscleColor("calves")}
                                stroke={getMuscleStroke("calves")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("calves")}
                            />
                            <path
                                d="M128 232 C132 250 133 274 128 290 C122 292 116 286 114 270 C112 252 112 238 118 232 Z"
                                fill={getMuscleColor("calves")}
                                stroke={getMuscleStroke("calves")}
                                strokeWidth="1.2"
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onClick={() => onSelectMuscle("calves")}
                            />
                        </>
                    )}
                </svg>
            </div>

            {/* Quick Indicator Footer */}
            <div className="w-full flex justify-center gap-4 mt-2 font-mono text-[10px] text-[#8892B0]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1F242D] border border-[#333C4D]" />
                    <span>Inactivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                    <span>Activo Hoy</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF2A2A] shadow-[0_0_8px_#FF2A2A]" />
                    <span>Seleccionado</span>
                </div>
            </div>
        </div>
    );
}
