"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    X,
    Search,
    ArrowLeftRight,
    Check,
    Dumbbell,
    Layers,
    Sparkles,
    Shield,
    Flame,
    Zap,
    RotateCcw
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

    // Keyboard ESC & body overflow lock
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

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
                : EXERCISE_DATABASE.filter(e => currentExercise && e.primary_muscle === currentExercise.primary_muscle && e.id !== currentExercise.id);
        } else if (filterMode === "ALL") {
            list = EXERCISE_DATABASE;
        } else {
            list = EXERCISE_DATABASE.filter(e => e.primary_muscle === filterMode);
        }

        // Apply text search
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
        <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white overflow-y-auto animate-in fade-in duration-200">
            {/* Floating Close Button: accessible at any scroll position */}
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-[#121214]/90 hover:bg-white text-zinc-300 hover:text-black border border-white/20 hover:border-white backdrop-blur-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95"
                title="Cerrar selector de reemplazo (Esc)"
                aria-label="Cerrar modal de swap"
            >
                <X size={20} />
            </button>

            {/* Main Full-Screen Content Container */}
            <div className="w-full max-w-6xl mx-auto min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header (se desplaza naturalmente con el scroll de la página) */}
                <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5 pt-2">
                    <div className="flex items-center gap-3 min-w-0 pr-12 sm:pr-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <ArrowLeftRight size={24} className="text-[#FF2A2A]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                                    SELECTOR DE REEMPLAZO (SWAP)
                                </h2>
                                <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                                    {candidates.length} OPCIONES
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">
                                Reemplaza este movimiento por una alternativa biomecánica equivalente o busca cualquier ejercicio de la librería.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Banner: Current Exercise Being Replaced */}
                <div className="px-5 py-4 bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap shadow-md">
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold shrink-0">
                            REEMPLAZANDO ACTUALMENTE:
                        </span>
                        <span className="font-bold text-white truncate text-sm">
                            {currentExercise.name}
                        </span>
                        <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0"
                            style={{
                                color: currentMuscleMeta.hex,
                                borderColor: `${currentMuscleMeta.hex}40`,
                                backgroundColor: `${currentMuscleMeta.hex}15`
                            }}
                        >
                            {currentMuscleMeta.name}
                        </span>
                        <span className="text-zinc-400 font-mono text-[10px]">
                            Tier {currentExercise.hypertrophy_tier} • {EQUIPMENT_TRANSLATIONS[currentExercise.equipment] || currentExercise.equipment}
                        </span>
                    </div>
                </div>

                {/* Search & Filter Toolbar (se desplaza con el scroll) */}
                <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
                    {/* Search Input */}
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar ejercicio para swap por nombre, subdivisión o equipamiento..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.1] focus:border-white/40 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all shadow-inner"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                                title="Borrar búsqueda"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills - flex-wrap to NEVER cut off chips */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                            OPCIONES DE SWAP
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {/* Direct Swaps Button */}
                            <button
                                onClick={() => setFilterMode("DIRECT_SWAPS")}
                                className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 border active:scale-95 ${
                                    filterMode === "DIRECT_SWAPS"
                                        ? "bg-white text-black border-white font-bold shadow-md"
                                        : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                <Sparkles size={13} className={filterMode === "DIRECT_SWAPS" ? "text-amber-600" : "text-amber-400"} />
                                <span>Equivalentes Biomecánicos</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                    filterMode === "DIRECT_SWAPS" ? "bg-black/10 text-black font-bold" : "bg-white/[0.06] text-zinc-400"
                                }`}>
                                    {directSwaps.length}
                                </span>
                            </button>

                            {/* All Exercises Button */}
                            <button
                                onClick={() => setFilterMode("ALL")}
                                className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 border active:scale-95 ${
                                    filterMode === "ALL"
                                        ? "bg-white text-black border-white font-bold shadow-md"
                                        : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                <span>Toda la Librería</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
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
                                        className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-2 border active:scale-95 ${
                                            isSelected
                                                ? "bg-white text-black border-white font-bold shadow-md"
                                                : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                        }`}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: meta.hex }}
                                        />
                                        <span>{meta.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Candidate Exercises List (en el mismo flujo vertical con el resto de la página) */}
                <div className="space-y-4 flex-1">
                    {candidates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {candidates.map(ex => {
                                const isCurrent = ex.id === currentExercise.id;
                                const isInSession = activeExerciseIds.includes(ex.id) && !isCurrent;
                                const muscleMeta = MUSCLE_PALETTE[ex.primary_muscle];
                                const resistance = RESISTANCE_LABELS[ex.resistance_profile] || {
                                    label: ex.resistance_profile,
                                    badgeClass: "bg-white/[0.04] text-zinc-300 border-white/10"
                                };

                                return (
                                    <div
                                        key={ex.id}
                                        className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between group shadow-lg ${
                                            isCurrent
                                                ? "bg-white/[0.08] border-white/30 ring-1 ring-white/20"
                                                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            {/* Badges Bar */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {/* Muscle Group Badge */}
                                                    <span
                                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1"
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

                                                    {/* Tier Badge */}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                        ex.hypertrophy_tier === "S"
                                                            ? "bg-[#FF2A2A]/20 text-[#FF2A2A] border-[#FF2A2A]/40"
                                                            : "bg-white/[0.06] text-white border-white/20"
                                                    }`}>
                                                        Tier {ex.hypertrophy_tier}
                                                    </span>

                                                    {/* Equipment */}
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                                                        {EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment}
                                                    </span>
                                                </div>

                                                {/* Activation % */}
                                                {ex.activation_pct ? (
                                                    <span className="text-[10px] font-mono font-semibold text-[#10B981] flex items-center gap-1 shrink-0">
                                                        <Zap size={10} />
                                                        {ex.activation_pct}% EMG
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Exercise Title */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                                                        {ex.name}
                                                    </h3>
                                                    {isCurrent && (
                                                        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/20 text-white shrink-0">
                                                            ACTUAL
                                                        </span>
                                                    )}
                                                </div>
                                                {ex.anatomical_subdivision && (
                                                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                                                        Enfoque: {ex.anatomical_subdivision}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Biomechanical Cue */}
                                            {ex.biomechanical_cue && (
                                                <p className="text-xs text-zinc-400 leading-relaxed font-normal bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                                                    &ldquo;{ex.biomechanical_cue}&rdquo;
                                                </p>
                                            )}

                                            {/* Target parameters summary */}
                                            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
                                                <span>{ex.default_sets} series</span>
                                                <span>•</span>
                                                <span>{ex.rep_range_min}-{ex.rep_range_max} reps</span>
                                                <span>•</span>
                                                <span>RIR {ex.target_rir}</span>
                                                <span>•</span>
                                                <span>{ex.rest_seconds}s</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${resistance.badgeClass}`}>
                                                {resistance.label}
                                            </span>

                                            {isCurrent ? (
                                                <span className="text-xs text-zinc-500 font-medium italic">
                                                    Ejercicio actual
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => onSelectSwap(ex)}
                                                    className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md bg-white hover:bg-zinc-200 text-black font-bold"
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>Seleccionar para Swap</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-white/[0.08] rounded-3xl space-y-3 bg-[#121214]/40">
                            <p className="text-sm font-semibold text-zinc-300">
                                No se encontraron alternativas con los filtros seleccionados
                            </p>
                            <p className="text-xs text-zinc-500 font-normal">
                                Prueba seleccionando &ldquo;Toda la Librería&rdquo; o limpiando el término de búsqueda.
                            </p>
                            <button
                                onClick={() => {
                                    setFilterMode("ALL");
                                    setSearchQuery("");
                                }}
                                className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white rounded-full transition-all border border-white/[0.08]"
                            >
                                Ver Toda la Librería
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <footer className="pt-6 pb-12 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-4">
                    <span className="font-mono">
                        {candidates.length} alternativas disponibles para swap
                    </span>

                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded-full hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                    >
                        Cancelar y Volver
                    </button>
                </footer>
            </div>
        </div>
    );
};
