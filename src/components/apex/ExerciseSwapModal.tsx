"use client";

import React, { useState, useMemo } from "react";
import {
    X,
    Search,
    ArrowLeftRight,
    RotateCcw,
    Zap,
    Check,
    Sparkles,
    Shield
} from "lucide-react";
import {
    MuscleGroup,
    ExerciseItem,
    EXERCISE_DATABASE,
    findBiomechanicalSwaps
} from "@/lib/hypertrophy-engine";
import {
    MUSCLE_PALETTE,
    ORDERED_MUSCLE_GROUPS
} from "./AnatomyVisualizer";

interface ExerciseSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentExercise: ExerciseItem | null;
    onSelectSwap: (replacement: ExerciseItem) => void;
    activeExerciseIds: string[];
}

const EQUIPMENT_TRANSLATIONS: Record<string, string> = {
    barbell: "Barra Olímpica",
    dumbbell: "Mancuernas",
    machine: "Máquina Guiada",
    cable: "Poleas / Cables",
    bodyweight: "Peso Corporal / Calistenia",
    smith: "Máquina Smith",
    ez_bar: "Barra Z"
};

const RESISTANCE_LABELS: Record<string, { label: string; badgeClass: string }> = {
    lengthened_bias: {
        label: "Máximo Estiramiento (Tier S)",
        badgeClass: "bg-white/[0.08] text-white border-white/20"
    },
    mid_range_overload: {
        label: "Sobrecarga Pesada (Fuerza)",
        badgeClass: "bg-[#FF2A2A]/15 text-[#FF2A2A] border-[#FF2A2A]/30"
    },
    shortened_peak: {
        label: "Contracción Pico",
        badgeClass: "bg-white/[0.04] text-zinc-300 border-white/10"
    }
};

export const ExerciseSwapModal: React.FC<ExerciseSwapModalProps> = ({
    isOpen,
    onClose,
    currentExercise,
    onSelectSwap,
    activeExerciseIds
}) => {
    // Mode filter: "DIRECT_SWAPS" | "ALL" | MuscleGroup
    const [filterMode, setFilterMode] = useState<string>("DIRECT_SWAPS");
    const [searchQuery, setSearchQuery] = useState("");

    // Biomechanical direct swaps for the current exercise
    const directSwaps = useMemo(() => {
        if (!currentExercise) return [];
        return findBiomechanicalSwaps(currentExercise.id);
    }, [currentExercise]);

    // Filter exercises list
    const candidates = useMemo(() => {
        let list: ExerciseItem[] = [];

        if (filterMode === "DIRECT_SWAPS") {
            list = directSwaps.length > 0
                ? directSwaps
                : EXERCISE_DATABASE.filter(e => e.primary_muscle === currentExercise?.primary_muscle);
        } else if (filterMode === "ALL") {
            list = EXERCISE_DATABASE;
        } else {
            // Specific muscle
            list = EXERCISE_DATABASE.filter(e => e.primary_muscle === filterMode);
        }

        // Apply search query filter if user types
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(ex => {
                const matchName = ex.name.toLowerCase().includes(query);
                const matchMuscle = (MUSCLE_PALETTE[ex.primary_muscle]?.name || "").toLowerCase().includes(query);
                const matchSub = (ex.anatomical_subdivision || "").toLowerCase().includes(query);
                const matchCue = (ex.biomechanical_cue || "").toLowerCase().includes(query);
                const matchEquip = (EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment).toLowerCase().includes(query);

                return matchName || matchMuscle || matchSub || matchCue || matchEquip;
            });
        }

        return list;
    }, [filterMode, directSwaps, currentExercise, searchQuery]);

    if (!isOpen || !currentExercise) return null;

    const currentMuscleMeta = MUSCLE_PALETTE[currentExercise.primary_muscle];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
            <div className="bg-[#0D0D0E] border border-white/[0.12] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-[#121214]/90 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <ArrowLeftRight size={20} className="text-[#FF2A2A]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase truncate">
                                    SELECTOR DE REEMPLAZO (SWAP)
                                </h2>
                                <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                                    {candidates.length} OPCIONES
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-normal truncate mt-0.5">
                                Reemplaza este movimiento por una alternativa biomecánica equivalente o busca el que prefieras
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all shrink-0"
                        title="Cerrar selector de reemplazo"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Banner: Current Exercise Being Replaced */}
                <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold shrink-0">
                            REEMPLAZANDO:
                        </span>
                        <span className="font-bold text-white truncate">
                            {currentExercise.name}
                        </span>
                        <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0"
                            style={{
                                color: currentMuscleMeta.hex,
                                borderColor: `${currentMuscleMeta.hex}40`,
                                backgroundColor: `${currentMuscleMeta.hex}15`
                            }}
                        >
                            {currentMuscleMeta.name}
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px] hidden sm:inline">
                            Tier {currentExercise.hypertrophy_tier} • {EQUIPMENT_TRANSLATIONS[currentExercise.equipment] || currentExercise.equipment}
                        </span>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#121214]/60 space-y-3 shrink-0">
                    {/* Search Input */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar ejercicio para swap por nombre, equipamiento o biomecánica..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-white/30 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                        {/* Direct Swaps Button */}
                        <button
                            onClick={() => setFilterMode("DIRECT_SWAPS")}
                            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                                filterMode === "DIRECT_SWAPS"
                                    ? "bg-white text-black border-white font-semibold shadow-md"
                                    : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            <Sparkles size={12} className={filterMode === "DIRECT_SWAPS" ? "text-amber-600" : "text-amber-400"} />
                            <span>Equivalentes Biomecánicos</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                filterMode === "DIRECT_SWAPS" ? "bg-black/10 text-black font-bold" : "bg-white/[0.06] text-zinc-400"
                            }`}>
                                {directSwaps.length}
                            </span>
                        </button>

                        {/* All Exercises Button */}
                        <button
                            onClick={() => setFilterMode("ALL")}
                            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                                filterMode === "ALL"
                                    ? "bg-white text-black border-white font-semibold shadow-md"
                                    : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            <span>Toda la Librería</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                filterMode === "ALL" ? "bg-black/10 text-black font-bold" : "bg-white/[0.06] text-zinc-400"
                            }`}>
                                {EXERCISE_DATABASE.length}
                            </span>
                        </button>

                        {/* Muscle Group Pills */}
                        {ORDERED_MUSCLE_GROUPS.map(mg => {
                            const meta = MUSCLE_PALETTE[mg];
                            const isSelected = filterMode === mg;

                            return (
                                <button
                                    key={mg}
                                    onClick={() => setFilterMode(mg)}
                                    className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 ${
                                        isSelected
                                            ? "bg-white text-black border-white font-semibold shadow-md"
                                            : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                    }`}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: meta.hex }}
                                    />
                                    <span>{meta.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Candidate Exercises List */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
                    {candidates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {candidates.map(ex => {
                                const isCurrent = ex.id === currentExercise.id;
                                const isAlreadyInSession = activeExerciseIds.includes(ex.id) && !isCurrent;
                                const muscleMeta = MUSCLE_PALETTE[ex.primary_muscle];
                                const resistance = RESISTANCE_LABELS[ex.resistance_profile] || {
                                    label: ex.resistance_profile,
                                    badgeClass: "bg-white/[0.04] text-zinc-300 border-white/10"
                                };

                                return (
                                    <div
                                        key={ex.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                            isCurrent
                                                ? "bg-white/[0.06] border-white/20 ring-1 ring-white/30"
                                                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.03]"
                                        }`}
                                    >
                                        <div className="space-y-2.5">
                                            {/* Badges */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1"
                                                        style={{
                                                            color: muscleMeta.hex,
                                                            borderColor: `${muscleMeta.hex}40`,
                                                            backgroundColor: `${muscleMeta.hex}15`
                                                        }}
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ backgroundColor: muscleMeta.hex }}
                                                        />
                                                        {muscleMeta.name}
                                                    </span>

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                        ex.hypertrophy_tier === "S"
                                                            ? "bg-[#FF2A2A]/20 text-[#FF2A2A] border-[#FF2A2A]/40"
                                                            : "bg-white/[0.06] text-white border-white/20"
                                                    }`}>
                                                        Tier {ex.hypertrophy_tier}
                                                    </span>

                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                                                        {EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment}
                                                    </span>
                                                </div>

                                                {ex.activation_pct ? (
                                                    <span className="text-[10px] font-mono font-semibold text-[#10B981] flex items-center gap-1 shrink-0">
                                                        <Zap size={10} />
                                                        {ex.activation_pct}% EMG
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Name */}
                                            <div>
                                                <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                                                    {ex.name}
                                                </h3>
                                                {ex.anatomical_subdivision && (
                                                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                                                        {ex.anatomical_subdivision}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Biomechanical Cue */}
                                            {ex.biomechanical_cue && (
                                                <p className="text-xs text-zinc-400 leading-relaxed font-normal bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                                                    &ldquo;{ex.biomechanical_cue}&rdquo;
                                                </p>
                                            )}

                                            {/* Parameters */}
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                                <span>{ex.default_sets} series</span>
                                                <span>•</span>
                                                <span>{ex.rep_range_min}-{ex.rep_range_max} reps</span>
                                                <span>•</span>
                                                <span>RIR {ex.target_rir}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${resistance.badgeClass}`}>
                                                {resistance.label}
                                            </span>

                                            {isCurrent ? (
                                                <span className="text-[11px] font-mono text-zinc-400 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                                                    Ejercicio Actual
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        onSelectSwap(ex);
                                                        onClose();
                                                    }}
                                                    className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>Seleccionar para Swap</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center border border-dashed border-white/[0.08] rounded-3xl space-y-3">
                            <p className="text-sm font-semibold text-zinc-300">
                                No se encontraron ejercicios para swap con el filtro actual
                            </p>
                            <p className="text-xs text-zinc-500 font-normal">
                                Prueba seleccionando "Toda la Librería" o limpiando el texto de búsqueda.
                            </p>
                            <button
                                onClick={() => {
                                    setFilterMode("ALL");
                                    setSearchQuery("");
                                }}
                                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white rounded-full transition-all"
                            >
                                Ver Toda la Librería
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#121214]/90 flex items-center justify-between text-xs text-zinc-400 shrink-0">
                    <span className="font-mono">
                        {candidates.length} opciones disponibles
                    </span>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-medium text-xs rounded-full transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
