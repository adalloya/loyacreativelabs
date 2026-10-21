"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { MuscleGroup } from "@/lib/hypertrophy-engine";
import { getInitialTheme, Theme } from "@/lib/theme";
import type { IExerciseData, IMuscleStats, Muscle } from "react-body-highlighter";

// Importación dinámica del componente oficial Model de react-body-highlighter
const Model = dynamic(() => import("react-body-highlighter"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[380px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    )
});

interface AnatomyVisualizerProps {
    selectedMuscle: MuscleGroup | null;
    activeMusclesToday: MuscleGroup[];
    onSelectMuscle: (muscle: MuscleGroup) => void;
}

// Paleta cromática distintiva por grupo muscular
export const MUSCLE_PALETTE: Record<MuscleGroup, { name: string; hex: string; bg: string; border: string }> = {
    chest: { name: "Pectoral", hex: "#FF2A2A", bg: "bg-[#FF2A2A]/10", border: "border-[#FF2A2A]/40" },
    lats: { name: "Dorsal Ancho", hex: "#0284C7", bg: "bg-[#0284C7]/10", border: "border-[#0284C7]/40" },
    upper_back: { name: "Espalda Alta", hex: "#0D9488", bg: "bg-[#0D9488]/10", border: "border-[#0D9488]/40" },
    delts: { name: "Deltoides", hex: "#F59E0B", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/40" },
    quads: { name: "Cuádriceps", hex: "#10B981", bg: "bg-[#10B981]/10", border: "border-[#10B981]/40" },
    hamstrings: { name: "Isquiotibiales", hex: "#8B5CF6", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/40" },
    glutes: { name: "Glúteos", hex: "#EC4899", bg: "bg-[#EC4899]/10", border: "border-[#EC4899]/40" },
    biceps: { name: "Bíceps", hex: "#F97316", bg: "bg-[#F97316]/10", border: "border-[#F97316]/40" },
    triceps: { name: "Tríceps", hex: "#06B6D4", bg: "bg-[#06B6D4]/10", border: "border-[#06B6D4]/40" },
    calves: { name: "Pantorrillas", hex: "#84CC16", bg: "bg-[#84CC16]/10", border: "border-[#84CC16]/40" },
    core: { name: "Abdomen", hex: "#E11D48", bg: "bg-[#E11D48]/10", border: "border-[#E11D48]/40" }
};

export const ORDERED_MUSCLE_GROUPS: MuscleGroup[] = [
    "chest",
    "lats",
    "upper_back",
    "delts",
    "quads",
    "hamstrings",
    "glutes",
    "biceps",
    "triceps",
    "calves",
    "core"
];

// Arreglo de colores inyectado en react-body-highlighter mapeado por frecuencia 1..11
export const HIGHLIGHTED_COLORS = ORDERED_MUSCLE_GROUPS.map(mg => MUSCLE_PALETTE[mg].hex);

// Mapeo exhaustivo entre el motor biomecánico y los polígonos de react-body-highlighter
const ENGINE_TO_MODEL_MUSCLES: Record<MuscleGroup, Muscle[]> = {
    chest: ["chest"],
    lats: ["upper-back"],
    upper_back: ["trapezius"],
    delts: ["front-deltoids", "back-deltoids"],
    quads: ["quadriceps", "adductor", "abductors"],
    hamstrings: ["hamstring"],
    glutes: ["gluteal"],
    biceps: ["biceps", "forearm"],
    triceps: ["triceps"],
    calves: ["calves", "left-soleus", "right-soleus"],
    core: ["abs", "obliques"]
};

// Mapeo inverso de polígono clickeado al grupo muscular del motor
function mapModelMuscleToEngine(muscleStr: string): MuscleGroup | null {
    const m = muscleStr.toLowerCase();
    if (m === "chest") return "chest";
    if (m === "biceps" || m === "forearm") return "biceps";
    if (m === "triceps") return "triceps";
    if (m === "front-deltoids" || m === "back-deltoids") return "delts";
    if (m === "quadriceps" || m === "adductor" || m === "abductors" || m === "knees") return "quads";
    if (m === "hamstring") return "hamstrings";
    if (m === "gluteal") return "glutes";
    if (m === "calves" || m === "left-soleus" || m === "right-soleus") return "calves";
    if (m === "abs" || m === "obliques") return "core";
    if (m === "trapezius") return "upper_back";
    if (m === "upper-back") return "lats";
    if (m === "lower-back") return "hamstrings";
    return null;
}

export function AnatomyVisualizer({
    selectedMuscle,
    activeMusclesToday,
    onSelectMuscle
}: AnatomyVisualizerProps) {
    const [view, setView] = useState<"anterior" | "posterior">("anterior");
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const handleThemeChange = (e: Event) => {
            const customEvt = e as CustomEvent<{ theme: Theme }>;
            if (customEvt.detail?.theme) {
                setTheme(customEvt.detail.theme);
            }
        };
        window.addEventListener("apex_theme_change", handleThemeChange);
        return () => window.removeEventListener("apex_theme_change", handleThemeChange);
    }, []);

    const isLight = theme === "light";

    // Construye los polígonos anatómicos asignando a cada grupo su color único mediante frequency
    const modelData: IExerciseData[] = useMemo(() => {
        return ORDERED_MUSCLE_GROUPS.map((mg, index) => {
            const muscles = ENGINE_TO_MODEL_MUSCLES[mg] || [];
            return {
                name: MUSCLE_PALETTE[mg].name,
                muscles: muscles,
                frequency: index + 1
            };
        });
    }, []);

    const handleMuscleClick = (stats: IMuscleStats) => {
        if (!stats || !stats.muscle) return;
        const targetGroup = mapModelMuscleToEngine(stats.muscle);
        if (targetGroup) {
            onSelectMuscle(targetGroup);
        }
    };

    return (
        <div className={`backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center select-none w-full border transition-colors ${
            isLight ? "bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-900/5" : "bg-[#121214]/90 border-white/[0.08] text-white"
        }`}>
            {/* Cabecera y Selector de Perspectiva */}
            <div className={`w-full flex justify-between items-center mb-4 pb-3 border-b ${
                isLight ? "border-slate-200" : "border-white/[0.06]"
            }`}>
                <div>
                    <h3 className={`text-sm font-semibold tracking-tight ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        MAPA ANATÓMICO MULTICOLOR
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                    }`}>
                        Cada grupo tiene su color biomecánico. Toca para ver ejercicios.
                    </p>
                </div>

                {/* Switcher Anterior / Posterior estilo Apple */}
                <div className={`flex items-center gap-1 p-1 rounded-full border shrink-0 ${
                    isLight ? "bg-slate-100 border-slate-200" : "bg-white/[0.04] border-white/[0.06]"
                }`}>
                    <button
                        onClick={() => setView("anterior")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            view === "anterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm font-bold" : "bg-white text-black shadow-md font-semibold")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setView("posterior")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            view === "posterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm font-bold" : "bg-white text-black shadow-md font-semibold")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Posterior
                    </button>
                </div>
            </div>

            {/* Renderizado de Polígonos de react-body-highlighter */}
            <div className="relative w-full max-w-[280px] h-[380px] flex items-center justify-center py-2">
                <Model
                    data={modelData}
                    type={view}
                    bodyColor={isLight ? "#cbd5e1" : "#1B1C20"}
                    highlightedColors={HIGHLIGHTED_COLORS}
                    onClick={handleMuscleClick}
                    style={{ width: "100%", height: "100%", margin: "0 auto", cursor: "pointer" }}
                    svgStyle={{ filter: isLight ? "drop-shadow(0 4px 10px rgba(0,0,0,0.06))" : "drop-shadow(0 0 15px rgba(0,0,0,0.8))" }}
                />
            </div>

            {/* Leyenda Biomecánica Multicolor */}
            <div className={`w-full mt-4 pt-3 border-t space-y-2 ${
                isLight ? "border-slate-200" : "border-white/[0.06]"
            }`}>
                <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                    isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                    CÓDIGO CROMÁTICO BIOMECÁNICO:
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {ORDERED_MUSCLE_GROUPS.map((mg) => {
                        const info = MUSCLE_PALETTE[mg];
                        const isSelected = selectedMuscle === mg;
                        return (
                            <button
                                key={mg}
                                onClick={() => onSelectMuscle(mg)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border cursor-pointer ${
                                    isSelected
                                        ? (isLight ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold" : "bg-white text-black border-white shadow-sm font-bold")
                                        : (isLight ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" : "bg-white/[0.03] text-zinc-300 border-white/[0.06] hover:bg-white/[0.08]")
                                }`}
                            >
                                <span 
                                    className="w-2 h-2 rounded-full shrink-0" 
                                    style={{ backgroundColor: info.hex }} 
                                />
                                <span>{info.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
