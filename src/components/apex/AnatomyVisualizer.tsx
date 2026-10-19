"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MuscleGroup } from "@/lib/hypertrophy-engine";
import type { IExerciseData, IMuscleStats, Muscle } from "react-body-highlighter";

// Importación dinámica del componente oficial Model de react-body-highlighter
// ssr: false previene cualquier advertencia de hidratación por IDs dinámicos en los SVG
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

// Mapeo exhaustivo entre el motor biomecánico y los polígonos de react-body-highlighter
const ENGINE_TO_MODEL_MUSCLES: Record<MuscleGroup, Muscle[]> = {
    chest: ["chest"],
    lats: ["upper-back"],
    upper_back: ["trapezius", "upper-back"],
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

    // Construye el arreglo de músculos con realce cromático para react-body-highlighter
    const modelData: IExerciseData[] = useMemo(() => {
        const highlightedList: Muscle[] = [];

        // Inyecta los músculos activos programados para la sesión de hoy
        activeMusclesToday.forEach(mg => {
            const mapped = ENGINE_TO_MODEL_MUSCLES[mg];
            if (mapped) highlightedList.push(...mapped);
        });

        // Inyecta el músculo seleccionado por el usuario para inspección
        if (selectedMuscle) {
            const selectedMapped = ENGINE_TO_MODEL_MUSCLES[selectedMuscle];
            if (selectedMapped) highlightedList.push(...selectedMapped);
        }

        const uniqueMuscles = Array.from(new Set(highlightedList));

        return [
            {
                name: "Músculos Biomecánicos Activos",
                muscles: uniqueMuscles,
                frequency: 2
            }
        ];
    }, [activeMusclesToday, selectedMuscle]);

    const handleMuscleClick = (stats: IMuscleStats) => {
        if (!stats || !stats.muscle) return;
        const targetGroup = mapModelMuscleToEngine(stats.muscle);
        if (targetGroup) {
            onSelectMuscle(targetGroup);
        }
    };

    return (
        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col items-center select-none">
            {/* Cabecera y Selector de Perspectiva */}
            <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
                <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                        MAPA ANATÓMICO POLIGONAL
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                        Toca cualquier polígono muscular para desplegar ejercicios Tier S
                    </p>
                </div>

                {/* Switcher Anterior / Posterior estilo Apple */}
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.06]">
                    <button
                        onClick={() => setView("anterior")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            view === "anterior"
                                ? "bg-white text-black shadow-md font-semibold"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setView("posterior")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            view === "posterior"
                                ? "bg-white text-black shadow-md font-semibold"
                                : "text-zinc-400 hover:text-white"
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
                    bodyColor="#1F2024"
                    highlightedColors={["#FF2A2A", "#E11D48"]}
                    onClick={handleMuscleClick}
                    style={{ width: "100%", height: "100%", margin: "0 auto", cursor: "pointer" }}
                    svgStyle={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.6))" }}
                />
            </div>

            {/* Leyenda Biomecánica */}
            <div className="w-full mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A2A]" />
                    <span className="text-[11px]">Enfoque sesión / Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F2024] border border-white/20" />
                    <span className="text-[11px]">Sin carga directa</span>
                </div>
            </div>
        </div>
    );
}
