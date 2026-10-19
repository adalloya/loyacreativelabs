"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    X,
    Search,
    Plus,
    Check,
    Dumbbell,
    Layers,
    Sparkles,
    Filter,
    Shield,
    Flame,
    Zap,
    ArrowRight,
    Camera,
    ChevronDown,
    BookOpen
} from "lucide-react";
import {
    MuscleGroup,
    ExerciseItem,
    EXERCISE_DATABASE
} from "@/lib/hypertrophy-engine";
import {
    MUSCLE_PALETTE,
    ORDERED_MUSCLE_GROUPS
} from "./AnatomyVisualizer";
import { getExerciseImageUrl } from "@/data/exerciseDatabase";
import { GymEquipmentScannerModal } from "./GymEquipmentScannerModal";

interface ExerciseLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExercise: (exercise: ExerciseItem) => void;
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

/**
 * Componente de Vista Previa de Imágenes (0.jpg / 1.jpg) e Instrucciones
 */
const ExerciseLibraryImagePreview: React.FC<{
    exerciseId: string;
    name: string;
    instructions?: string[];
}> = ({ exerciseId, name, instructions = [] }) => {
    const [frame, setFrame] = useState<0 | 1>(0);
    const [imgError, setImgError] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const imgUrl = getExerciseImageUrl(exerciseId, frame);

    return (
        <div className="space-y-2.5">
            {/* Contenedor de la foto */}
            <div className="w-full h-44 bg-zinc-950 rounded-2xl relative overflow-hidden border border-white/[0.08] group/img shadow-inner">
                {!imgError ? (
                    <img
                        src={imgUrl}
                        alt={name}
                        loading="lazy"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover object-center transition-all duration-300 group-hover/img:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1.5 p-4">
                        <Dumbbell size={24} className="opacity-40" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">Demostración Biomecánica</span>
                    </div>
                )}

                {/* Botones de Cambio de Fase 0.jpg (Inicio) y 1.jpg (Pico) */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/85 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/15 z-10 shadow-lg">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFrame(0);
                        }}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                            frame === 0 ? "bg-white text-black font-bold shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                        title="Ver posición inicial de partida (0.jpg)"
                    >
                        0.jpg (Inicio)
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFrame(1);
                        }}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                            frame === 1 ? "bg-white text-black font-bold shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                        title="Ver posición de máxima contracción (1.jpg)"
                    >
                        1.jpg (Pico)
                    </button>
                </div>
            </div>

            {/* Selector Desplegable de Instrucciones Paso a Paso en Español */}
            {instructions && instructions.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInstructions(prev => !prev);
                        }}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all py-0.5"
                    >
                        <BookOpen size={12} className="text-[#FF2A2A]" />
                        <span>{showInstructions ? "Ocultar Instrucciones Técnicas" : "Ver Instrucciones Paso a Paso"}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${showInstructions ? "rotate-180" : ""}`} />
                    </button>

                    {showInstructions && (
                        <div className="mt-2 p-3 bg-black/50 border border-white/[0.06] rounded-xl text-xs text-zinc-300 space-y-2 animate-in fade-in duration-150">
                            {instructions.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                                    <span className="font-mono text-[10px] text-[#FF2A2A] font-bold mt-0.5 shrink-0 bg-[#FF2A2A]/10 px-1.5 py-0.5 rounded">
                                        Paso {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
    isOpen,
    onClose,
    onAddExercise,
    activeExerciseIds
}) => {
    // Muscle group filter: "ALL" or specific MuscleGroup
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "ALL">("ALL");
    // Search query
    const [searchQuery, setSearchQuery] = useState("");
    // Equipment filter
    const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");
    // Recently added id for visual confirmation
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);
    // Pagination limit for 60fps smooth rendering
    const [displayLimit, setDisplayLimit] = useState(48);
    // Equipment AI Scanner modal state
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Reset pagination when filters change
    useEffect(() => {
        setDisplayLimit(48);
    }, [selectedMuscle, equipmentFilter, searchQuery]);

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

    // Calculate count per muscle group
    const countsByMuscle = useMemo(() => {
        const counts: Record<string, number> = { ALL: EXERCISE_DATABASE.length };
        for (const mg of ORDERED_MUSCLE_GROUPS) {
            counts[mg] = EXERCISE_DATABASE.filter(e => {
                const pMuscles = (e.primaryMuscles || [e.primary_muscle]).map(m => m.toLowerCase());
                return e.primary_muscle === mg || pMuscles.includes(mg.toLowerCase());
            }).length;
        }
        return counts;
    }, []);

    // Filter exercises based on selectedMuscle, equipment, and searchQuery
    const filteredExercises = useMemo(() => {
        return EXERCISE_DATABASE.filter(ex => {
            // Muscle filter
            if (selectedMuscle !== "ALL") {
                const pMuscles = (ex.primaryMuscles || [ex.primary_muscle]).map(m => m.toLowerCase());
                if (ex.primary_muscle !== selectedMuscle && !pMuscles.includes(selectedMuscle.toLowerCase())) {
                    return false;
                }
            }

            // Equipment filter
            if (equipmentFilter !== "ALL") {
                if (ex.equipment !== equipmentFilter) return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchName = ex.name.toLowerCase().includes(query);
                const matchMuscle = (MUSCLE_PALETTE[ex.primary_muscle]?.name || "").toLowerCase().includes(query);
                const matchSub = (ex.anatomical_subdivision || "").toLowerCase().includes(query);
                const matchCue = (ex.biomechanical_cue || "").toLowerCase().includes(query);
                const matchEquip = (EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment).toLowerCase().includes(query);
                const matchCat = (ex.category || "").toLowerCase().includes(query);

                if (!matchName && !matchMuscle && !matchSub && !matchCue && !matchEquip && !matchCat) {
                    return false;
                }
            }

            return true;
        });
    }, [selectedMuscle, equipmentFilter, searchQuery]);

    const handleAdd = (ex: ExerciseItem) => {
        onAddExercise(ex);
        setLastAddedId(ex.id);
        setTimeout(() => {
            setLastAddedId(null);
        }, 1800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white overflow-y-auto animate-in fade-in duration-200">
            {/* Floating Close Button: visible and clickable at any scroll position */}
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-[#121214]/90 hover:bg-white text-zinc-300 hover:text-black border border-white/20 hover:border-white backdrop-blur-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95"
                title="Cerrar ventana (Esc)"
                aria-label="Cerrar biblioteca de ejercicios"
            >
                <X size={20} />
            </button>

            {/* Main Full-Screen Content Container */}
            <div className="w-full max-w-6xl mx-auto min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header (se desplaza naturalmente con el scroll de la página) */}
                <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5 pt-2">
                    <div className="flex items-center gap-3 min-w-0 pr-12 sm:pr-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Layers size={24} className="text-[#FF2A2A]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                                    BIBLIOTECA COMPLETA DE EJERCICIOS
                                </h2>
                                <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                                    CATÁLOGO ACTIVO: {EXERCISE_DATABASE.length} EJERCICIOS
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">
                                Base biomecánica con fotos reales 0.jpg y 1.jpg e instrucciones completas en español.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Search & Filter Toolbar (se desplaza naturalmente con el scroll de la página) */}
                <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
                    {/* Search Input & AI Camera Scanner Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, subdivisión, equipamiento o biomecánica..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.1] focus:border-white/40 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all shadow-inner"
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

                        {/* Botón Escáner IA de Máquinas con Cámara */}
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="px-4 py-3 rounded-2xl bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/20 hover:border-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 shadow-lg group"
                            title="Tomar foto a una máquina con la cámara para identificarla y ver sus ejercicios"
                        >
                            <Camera size={16} className="text-[#FF2A2A] group-hover:text-black shrink-0 transition-colors" />
                            <span>Escanear Máquina con IA</span>
                        </button>
                    </div>

                    {/* Muscle Groups Filter Pills - flex-wrap to NEVER cut off chips */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                            FILTRAR POR GRUPO MUSCULAR
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {/* ALL option */}
                            <button
                                onClick={() => setSelectedMuscle("ALL")}
                                className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 border active:scale-95 ${
                                    selectedMuscle === "ALL"
                                        ? "bg-white text-black border-white font-bold shadow-md"
                                        : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                <span>Todos los Músculos</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                    selectedMuscle === "ALL" ? "bg-black/10 text-black font-bold" : "bg-white/[0.06] text-zinc-400"
                                }`}>
                                    {countsByMuscle.ALL}
                                </span>
                            </button>

                            {/* Ordered muscle groups with anatomical color dots */}
                            {ORDERED_MUSCLE_GROUPS.map(mg => {
                                const meta = MUSCLE_PALETTE[mg];
                                const isSelected = selectedMuscle === mg;
                                const count = countsByMuscle[mg] || 0;

                                return (
                                    <button
                                        key={mg}
                                        onClick={() => setSelectedMuscle(mg)}
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
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                            isSelected ? "bg-black/10 text-black font-bold" : "bg-white/[0.06] text-zinc-400"
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Equipment Filter Pills - flex-wrap to NEVER cut off chips */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                            FILTRAR POR EQUIPAMIENTO
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <button
                                onClick={() => setEquipmentFilter("ALL")}
                                className={`px-3 py-1.5 rounded-xl font-medium transition-all border active:scale-95 ${
                                    equipmentFilter === "ALL"
                                        ? "bg-zinc-200 text-black border-zinc-200 font-bold"
                                        : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                }`}
                            >
                                Todo el equipamiento
                            </button>
                            {Object.entries(EQUIPMENT_TRANSLATIONS).map(([key, label]) => {
                                const isSelected = equipmentFilter === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setEquipmentFilter(key)}
                                        className={`px-3 py-1.5 rounded-xl font-medium transition-all border active:scale-95 ${
                                            isSelected
                                                ? "bg-zinc-200 text-black border-zinc-200 font-bold"
                                                : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Exercises List (en el mismo flujo vertical con el resto de la página) */}
                <div className="space-y-4 flex-1">
                    {filteredExercises.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredExercises.slice(0, displayLimit).map(ex => {
                                    const isInSession = activeExerciseIds.includes(ex.id);
                                    const isRecentlyAdded = lastAddedId === ex.id;
                                    const muscleMeta = MUSCLE_PALETTE[ex.primary_muscle];
                                    const resistance = RESISTANCE_LABELS[ex.resistance_profile] || {
                                        label: ex.resistance_profile,
                                        badgeClass: "bg-white/[0.04] text-zinc-300 border-white/10"
                                    };

                                    return (
                                        <div
                                            key={ex.id}
                                            className="p-4 sm:p-5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.14] transition-all flex flex-col justify-between group shadow-lg"
                                        >
                                            <div className="space-y-3">
                                                {/* Miniatura Interactiva de Imágenes (0.jpg / 1.jpg) e Instrucciones */}
                                                <ExerciseLibraryImagePreview
                                                    exerciseId={ex.id}
                                                    name={ex.name}
                                                    instructions={ex.instructions}
                                                />

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
                                                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                                                        {ex.name}
                                                    </h3>
                                                    {ex.anatomical_subdivision && (
                                                        <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                                                            Enfoque: {ex.anatomical_subdivision}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Biomechanical Cue en Español */}
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
                                                    <span>{ex.rest_seconds}s descanso</span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${resistance.badgeClass}`}>
                                                    {resistance.label}
                                                </span>

                                                <button
                                                    onClick={() => handleAdd(ex)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                                                        isRecentlyAdded
                                                            ? "bg-[#10B981] text-black font-bold"
                                                            : isInSession
                                                            ? "bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/[0.1]"
                                                            : "bg-white hover:bg-zinc-200 text-black shadow-md font-bold"
                                                    }`}
                                                >
                                                    {isRecentlyAdded ? (
                                                        <>
                                                            <Check size={13} strokeWidth={3} />
                                                            <span>¡Agregado!</span>
                                                        </>
                                                    ) : isInSession ? (
                                                        <>
                                                            <Check size={13} className="text-[#10B981]" />
                                                            <span>En tu sesión (+ Agregar)</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={13} />
                                                            <span>Agregar a mi Sesión</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Botón Cargar Más para Rendimiento Fluido */}
                            {filteredExercises.length > displayLimit && (
                                <div className="py-6 flex justify-center">
                                    <button
                                        onClick={() => setDisplayLimit(prev => prev + 48)}
                                        className="px-6 py-2.5 rounded-full bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/20 hover:border-white font-semibold text-xs transition-all shadow-md active:scale-95"
                                    >
                                        Cargar 48 ejercicios más (Mostrando {Math.min(displayLimit, filteredExercises.length)} de {filteredExercises.length})
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-white/[0.08] rounded-3xl space-y-3 bg-[#121214]/40">
                            <p className="text-sm font-semibold text-zinc-300">
                                No se encontraron ejercicios con los filtros seleccionados
                            </p>
                            <p className="text-xs text-zinc-500 font-normal">
                                Prueba cambiando el grupo muscular o eliminando el término de búsqueda.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedMuscle("ALL");
                                    setEquipmentFilter("ALL");
                                    setSearchQuery("");
                                }}
                                className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white rounded-full transition-all border border-white/[0.08]"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <footer className="pt-6 pb-12 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-4">
                    <span className="font-mono">
                        {filteredExercises.length} de {EXERCISE_DATABASE.length} ejercicios disponibles
                    </span>

                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded-full hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                    >
                        Listo / Volver al Entrenamiento
                    </button>
                </footer>
            </div>

            {/* Modal de Escáner IA de Máquinas con Cámara */}
            <GymEquipmentScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onAddExerciseToSession={onAddExercise}
                activeExerciseIds={activeExerciseIds}
            />
        </div>
    );
};
