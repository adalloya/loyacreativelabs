"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MuscleGroup } from "@/lib/hypertrophy-engine";
import type { IExerciseData, IMuscleStats, Muscle } from "react-body-highlighter";

// Import react-body-highlighter dynamically with ssr: false for zero hydration mismatches
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

// Mapping from internal MuscleGroup to react-body-highlighter Muscle identifiers
const ENGINE_TO_MODEL_MUSCLES: Record<MuscleGroup, Muscle[]> = {
    chest: ["chest"],
    lats: ["upper-back"],
    upper_back: ["trapezius", "upper-back"],
    delts: ["front-deltoids", "back-deltoids"],
    quads: ["quadriceps", "adductor", "abductors"],
    hamstrings: ["hamstring"],
    glutes: ["gluteal"],
    biceps: ["biceps"],
    triceps: ["triceps"],
    calves: ["calves", "left-soleus", "right-soleus"],
    core: ["abs", "obliques"]
};

// Map clicked model muscle string back to internal MuscleGroup
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

    // Build the data array that highlights muscles in react-body-highlighter
    const modelData: IExerciseData[] = useMemo(() => {
        const highlightedList: Muscle[] = [];

        // Add active muscles today
        activeMusclesToday.forEach(mg => {
            const mapped = ENGINE_TO_MODEL_MUSCLES[mg];
            if (mapped) highlightedList.push(...mapped);
        });

        // Add selected muscle with priority
        if (selectedMuscle) {
            const selectedMapped = ENGINE_TO_MODEL_MUSCLES[selectedMuscle];
            if (selectedMapped) highlightedList.push(...selectedMapped);
        }

        return [
            {
                name: "Highlighted Biomechanical Muscles",
                muscles: Array.from(new Set(highlightedList)),
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
            {/* Header Telemetry */}
            <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
                <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                        MAPA ANATÓMICO POLIGONAL
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                        Toca cualquier polígono para inspeccionar ejercicios Tier S
                    </p>
                </div>

                {/* View Switcher Pills */}
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

            {/* Model Container */}
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

            {/* Footer Legend */}
            <div className="w-full mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A2A]" />
                    <span className="text-[11px]">Enfoque hoy / Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F2024] border border-white/20" />
                    <span className="text-[11px]">En descanso</span>
                </div>
            </div>
        </div>
    );
}
