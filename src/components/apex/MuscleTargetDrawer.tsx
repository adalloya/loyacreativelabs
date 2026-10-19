// src/components/apex/MuscleTargetDrawer.tsx
"use client";

import { useState } from "react";
import { MuscleGroup, ExerciseItem, EXERCISE_DATABASE } from "@/lib/hypertrophy-engine";
import { X, Plus, Sparkles, Check } from "lucide-react";

interface MuscleTargetDrawerProps {
    selectedMuscle: MuscleGroup | null;
    onClose: () => void;
    onInjectExercise: (exercise: ExerciseItem) => void;
    onToggleSpecialization?: (muscle: MuscleGroup) => void;
    specializedMuscle?: string | null;
}

const MUSCLE_NAMES: Record<MuscleGroup, string> = {
    chest: "PECTORALES",
    lats: "DORSAL ANCHO",
    upper_back: "ESPALDA ALTA & TRAPECIO",
    delts: "DELTOIDES / HOMBROS",
    quads: "CUÁDRICEPS",
    hamstrings: "ISQUIOTIBIALES",
    glutes: "GLÚTEOS",
    biceps: "BÍCEPS",
    triceps: "TRÍCEPS",
    calves: "PANTORRILLAS / GEMELOS",
    core: "CORE / ABDOMINALES"
};

const RESISTANCE_LABELS: Record<string, { label: string; color: string }> = {
    lengthened_bias: { label: "ESTIRAMIENTO MÁXIMO (TIER S)", color: "text-white border-white/20 bg-white/[0.06]" },
    mid_range_overload: { label: "SOBRECARGA PESADA (FUERZA)", color: "text-[#FF2A2A] border-[#FF2A2A]/30 bg-[#FF2A2A]/10" },
    shortened_peak: { label: "CONTRACCIÓN PICO / AISLAMIENTO", color: "text-zinc-300 border-white/10 bg-white/[0.04]" }
};

export function MuscleTargetDrawer({
    selectedMuscle,
    onClose,
    onInjectExercise,
    onToggleSpecialization,
    specializedMuscle
}: MuscleTargetDrawerProps) {
    const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");
    const [addedId, setAddedId] = useState<string | null>(null);

    if (!selectedMuscle) return null;

    const muscleExercises = EXERCISE_DATABASE.filter(e => e.primary_muscle === selectedMuscle);
    const filtered = muscleExercises.filter(e =>
        equipmentFilter === "ALL" ? true : e.equipment === equipmentFilter
    );

    const isSpecialized = specializedMuscle === selectedMuscle;

    const handleAdd = (ex: ExerciseItem) => {
        onInjectExercise(ex);
        setAddedId(ex.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#121214]/95 backdrop-blur-2xl border-t sm:border border-white/[0.08] sm:rounded-3xl rounded-t-3xl p-5 sm:p-6 flex flex-col z-10 shadow-2xl overflow-hidden font-sans text-white">
                {/* Drag bar for mobile */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/[0.06] pb-3 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                                CATÁLOGO BIOMECÁNICO // APEX
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/20">
                                HIPERTROFIA TIER S / A
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                            {MUSCLE_NAMES[selectedMuscle]}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Specialization Cycle Switch */}
                {onToggleSpecialization && (
                    <div className="mb-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className={isSpecialized ? "text-[#FF2A2A]" : "text-zinc-500"} />
                            <div>
                                <p className="text-xs font-semibold text-white">Ciclo de Especialización (4 Semanas)</p>
                                <p className="text-[10px] text-zinc-400 font-mono">Prioriza este músculo al inicio de la sesión (+4 series semanales)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleSpecialization(selectedMuscle)}
                            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all border ${isSpecialized
                                ? "bg-white text-black border-white font-bold shadow-sm"
                                : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:text-white"
                                }`}
                        >
                            {isSpecialized ? "ACTIVO" : "ACTIVAR"}
                        </button>
                    </div>
                )}

                {/* Equipment Filter Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 font-mono text-xs scrollbar-none">
                    {["ALL", "barbell", "dumbbell", "machine", "cable"].map(eq => (
                        <button
                            key={eq}
                            onClick={() => setEquipmentFilter(eq)}
                            className={`px-3 py-1.5 rounded-xl uppercase transition-all whitespace-nowrap border ${equipmentFilter === eq
                                ? "bg-white text-black border-white font-semibold shadow-sm"
                                : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                }`}
                        >
                            {eq === "ALL" ? "TODOS" : eq}
                        </button>
                    ))}
                </div>

                {/* Exercises Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {filtered.map(ex => {
                        const profile = RESISTANCE_LABELS[ex.resistance_profile] || RESISTANCE_LABELS.mid_range_overload;
                        const isAdded = addedId === ex.id;

                        return (
                            <div
                                key={ex.id}
                                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 transition-all flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                                                {ex.anatomical_subdivision}
                                            </span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${profile.color}`}>
                                                {profile.label}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-semibold text-white">
                                            {ex.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                            {ex.biomechanical_cue}
                                        </p>
                                    </div>

                                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] shrink-0 uppercase">
                                        {ex.equipment}
                                    </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center text-xs font-mono">
                                    <span className="text-zinc-500 text-[11px]">
                                        3-4 series × {ex.rep_range_min}-{ex.rep_range_max} reps (RIR {ex.target_rir})
                                    </span>

                                    <button
                                        onClick={() => handleAdd(ex)}
                                        disabled={isAdded}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${isAdded
                                            ? "bg-[#10B981] text-black font-bold"
                                            : "bg-white hover:bg-zinc-200 text-black active:scale-95 shadow-sm"
                                            }`}
                                    >
                                        {isAdded ? (
                                            <>
                                                <Check size={14} /> Agregado
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={14} /> Inyectar a Hoy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-10 font-mono text-xs text-zinc-500">
                            No hay ejercicios con este filtro de equipamiento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
