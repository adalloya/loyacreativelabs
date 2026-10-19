"use client";

import { useState } from "react";
import { MuscleGroup, ExerciseItem, EXERCISE_DATABASE, EquipmentType } from "@/lib/hypertrophy-engine";
import { X, Plus, Sparkles, Check, Dumbbell, ShieldAlert } from "lucide-react";

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
    lengthened_bias: { label: "MÁXIMO ESTIRAMIENTO (HIPERTROFIA S)", color: "text-[#38BDF8] border-[#0284C7]/40 bg-[#082F49]/30" },
    mid_range_overload: { label: "SOBRECARGA PESADA (FUERZA MÁXIMA)", color: "text-[#F59E0B] border-[#D97706]/40 bg-[#451A03]/30" },
    shortened_peak: { label: "CONTRACCIÓN PICO / AISLAMIENTO", color: "text-[#EC4899] border-[#DB2777]/40 bg-[#500724]/30" }
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

            <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0A0D12] border-t sm:border border-[#1E2633] sm:rounded-2xl rounded-t-2xl p-4 sm:p-6 flex flex-col z-10 shadow-2xl overflow-hidden font-sans">
                {/* Drag bar for mobile */}
                <div className="w-12 h-1.5 bg-[#2B3547] rounded-full mx-auto mb-3 sm:hidden" />

                {/* Header */}
                <div className="flex justify-between items-start border-b border-[#1E2633] pb-3 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono tracking-widest text-[#8892B0] uppercase">
                                MATRIZ BIOMECÁNICA TIER S / A
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/30">
                                HIPERTROFIA CIENTÍFICA
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                            {MUSCLE_NAMES[selectedMuscle]}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-[#8892B0] hover:text-white rounded-lg hover:bg-[#161C26] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Specialization Cycle Switch */}
                {onToggleSpecialization && (
                    <div className="mb-4 p-3 bg-[#131924] border border-[#232D3F] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className={isSpecialized ? "text-[#F59E0B]" : "text-[#717C96]"} />
                            <div>
                                <p className="text-xs font-semibold text-white">Ciclo de Especialización (4 Semanas)</p>
                                <p className="text-[10px] text-[#8892B0] font-mono">Prioriza este músculo al inicio de la sesión (+4 series semanales)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleSpecialization(selectedMuscle)}
                            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all border ${isSpecialized
                                ? "bg-[#F59E0B] text-black border-[#F59E0B] font-bold"
                                : "bg-[#1E2633] text-[#CBD5E1] border-[#334155] hover:text-white"
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
                            className={`px-3 py-1 rounded-lg uppercase transition-all whitespace-nowrap border ${equipmentFilter === eq
                                ? "bg-white text-black border-white font-semibold"
                                : "bg-[#131924] text-[#8892B0] border-[#202938] hover:text-white hover:bg-[#1A2333]"
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
                                className="bg-[#10141D] border border-[#1E2633] hover:border-[#334155] rounded-xl p-3.5 transition-all flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-[10px] font-mono text-[#CBD5E1] px-1.5 py-0.5 rounded bg-[#1C2433]">
                                                {ex.anatomical_subdivision}
                                            </span>
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${profile.color}`}>
                                                {profile.label}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-semibold text-white">
                                            {ex.name}
                                        </h3>
                                        <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                                            {ex.biomechanical_cue}
                                        </p>
                                    </div>

                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161C26] text-[#64FFDA] border border-[#202938] shrink-0 uppercase">
                                        {ex.equipment}
                                    </span>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-[#1C2433] flex justify-between items-center text-xs font-mono">
                                    <span className="text-[#8892B0] text-[11px]">
                                        3-4 series × {ex.rep_range_min}-{ex.rep_range_max} reps (RIR {ex.target_rir})
                                    </span>

                                    <button
                                        onClick={() => handleAdd(ex)}
                                        disabled={isAdded}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isAdded
                                            ? "bg-[#10B981] text-white"
                                            : "bg-[#EAEAEA] hover:bg-white text-black active:scale-95"
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
                        <div className="text-center py-10 font-mono text-xs text-[#717C96]">
                            No hay ejercicios con este filtro de equipamiento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
