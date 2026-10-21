// src/components/apex/ExerciseLibraryModal.tsx
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
import { getInitialTheme, Theme } from "@/lib/theme";

interface ExerciseLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExercise: (exercise: ExerciseItem) => void;
    activeExerciseIds: string[];
    initialSearchQuery?: string;
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

/**
 * Componente de Vista Previa de Imágenes (0.jpg / 1.jpg) e Instrucciones con soporte Light & Dark
 */
const ExerciseLibraryImagePreview: React.FC<{
    exerciseId: string;
    name: string;
    instructions?: string[];
    isLight?: boolean;
}> = ({ exerciseId, name, instructions = [], isLight = false }) => {
    const [frame, setFrame] = useState<0 | 1>(0);
    const [imgError, setImgError] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const imgUrl = getExerciseImageUrl(exerciseId, frame);

    return (
        <div className="space-y-2.5">
            {/* Contenedor de la foto */}
            <div className={`w-full h-44 rounded-2xl relative overflow-hidden border group/img shadow-inner transition-colors ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-zinc-950 border-white/[0.08]"
            }`}>
                {!imgError ? (
                    <img
                        src={imgUrl}
                        alt={name}
                        loading="lazy"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover object-center transition-all duration-300 group-hover/img:scale-105"
                    />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 ${
                        isLight ? "text-slate-400" : "text-zinc-600"
                    }`}>
                        <Dumbbell size={24} className="opacity-40" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">Demostración Biomecánica</span>
                    </div>
                )}

                {/* Botones de Cambio de Fase 0.jpg (Inicio) y 1.jpg (Pico) */}
                <div className={`absolute bottom-2 right-2 flex items-center gap-1 backdrop-blur-md px-1.5 py-0.5 rounded-lg border z-10 shadow-lg ${
                    isLight ? "bg-white/90 border-slate-200" : "bg-black/85 border-white/15"
                }`}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFrame(0);
                        }}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                            frame === 0
                                ? (isLight ? "bg-slate-900 text-white font-bold shadow-xs" : "bg-white text-black font-bold shadow-sm")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
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
                        className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                            frame === 1
                                ? (isLight ? "bg-slate-900 text-white font-bold shadow-xs" : "bg-white text-black font-bold shadow-sm")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
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
                        className={`text-[11px] font-medium flex items-center gap-1.5 transition-all py-0.5 cursor-pointer ${
                            isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <BookOpen size={12} className="text-rose-500" />
                        <span>{showInstructions ? "Ocultar Instrucciones Técnicas" : "Ver Instrucciones Paso a Paso"}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${showInstructions ? "rotate-180" : ""}`} />
                    </button>

                    {showInstructions && (
                        <div className={`mt-2 p-3 rounded-xl text-xs space-y-2 animate-in fade-in duration-150 border ${
                            isLight
                                ? "bg-slate-50 border-slate-200 text-slate-700"
                                : "bg-black/50 border-white/[0.06] text-zinc-300"
                        }`}>
                            {instructions.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                                    <span className={`font-mono text-[10px] font-bold mt-0.5 shrink-0 px-1.5 py-0.5 rounded ${
                                        isLight ? "text-rose-700 bg-rose-100" : "text-[#FF2A2A] bg-[#FF2A2A]/10"
                                    }`}>
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
    activeExerciseIds,
    initialSearchQuery = ""
}) => {
    // Muscle group filter: "ALL" or specific MuscleGroup
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "ALL">("ALL");
    // Search query
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    // Equipment filter
    const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");
    // Recently added id for visual confirmation
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);
    // Pagination limit for 60fps smooth rendering
    const [displayLimit, setDisplayLimit] = useState(48);
    // Equipment AI Scanner modal state
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
        }
    }, [initialSearchQuery, isOpen]);

    // Theme state (Claro vs Oscuro)
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        setTheme(getInitialTheme());
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

    // Dynamic counts by muscle group for filter pills
    const countsByMuscle = useMemo(() => {
        const counts: Record<string, number> = { ALL: EXERCISE_DATABASE.length };
        for (const ex of EXERCISE_DATABASE) {
            counts[ex.primary_muscle] = (counts[ex.primary_muscle] || 0) + 1;
        }
        return counts;
    }, []);

    // Filtered exercises list based on current filters and search query
    const filteredExercises = useMemo(() => {
        let list = EXERCISE_DATABASE;

        // Apply muscle filter
        if (selectedMuscle !== "ALL") {
            list = list.filter(e => {
                const pMuscles = (e.primaryMuscles || [e.primary_muscle]).map(m => m.toLowerCase());
                return e.primary_muscle === selectedMuscle || pMuscles.includes(selectedMuscle.toLowerCase());
            });
        }

        // Apply equipment filter
        if (equipmentFilter !== "ALL") {
            list = list.filter(e => e.equipment === equipmentFilter);
        }

        // Apply text search across name, muscle, biomechanical cue, and equipment
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(ex => {
                const matchName = ex.name.toLowerCase().includes(query);
                const matchMuscle = (MUSCLE_PALETTE[ex.primary_muscle]?.name || "").toLowerCase().includes(query);
                const matchSub = (ex.anatomical_subdivision || "").toLowerCase().includes(query);
                const matchCue = (ex.biomechanical_cue || "").toLowerCase().includes(query);
                const matchEquip = (EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment).toLowerCase().includes(query);
                const matchCat = (ex.category || "").toLowerCase().includes(query);
                return matchName || matchMuscle || matchSub || matchCue || matchEquip || matchCat;
            });
        }

        return list;
    }, [selectedMuscle, equipmentFilter, searchQuery]);

    // Handle adding an exercise to the active session
    const handleAdd = (ex: ExerciseItem) => {
        onAddExercise(ex);
        setLastAddedId(ex.id);
        setTimeout(() => {
            setLastAddedId(null);
        }, 1800);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-200 transition-colors ${
            isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0A0A0C] text-white"
        }`}>
            {/* Floating Close Button: visible and clickable at any scroll position */}
            <button
                onClick={onClose}
                className={`fixed top-4 right-4 z-50 w-11 h-11 rounded-full backdrop-blur-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer border ${
                    isLight
                        ? "bg-white/95 hover:bg-slate-900 text-slate-700 hover:text-white border-slate-300 shadow-slate-900/10"
                        : "bg-[#121214]/90 hover:bg-white text-zinc-300 hover:text-black border-white/20 hover:border-white shadow-2xl"
                }`}
                title="Cerrar ventana (Esc)"
                aria-label="Cerrar biblioteca de ejercicios"
            >
                <X size={20} />
            </button>

            {/* Main Full-Screen Content Container */}
            <div className="w-full max-w-6xl mx-auto min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <header className={`flex items-center justify-between gap-4 border-b pb-5 pt-2 transition-colors ${
                    isLight ? "border-slate-200" : "border-white/[0.08]"
                }`}>
                    <div className="flex items-center gap-3 min-w-0 pr-12 sm:pr-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                            isLight
                                ? "bg-white border-slate-200 text-slate-900 shadow-xs"
                                : "bg-white/[0.06] border-white/[0.1] text-white"
                        }`}>
                            <Layers size={24} className="text-rose-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className={`text-lg sm:text-xl font-bold tracking-tight uppercase ${
                                    isLight ? "text-slate-950 font-sans" : "text-white"
                                }`}>
                                    BIBLIOTECA COMPLETA DE EJERCICIOS
                                </h2>
                                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${
                                    isLight
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                                }`}>
                                    CATÁLOGO ACTIVO: {EXERCISE_DATABASE.length} EJERCICIOS
                                </span>
                            </div>
                            <p className={`text-xs sm:text-sm font-normal mt-0.5 leading-relaxed ${
                                isLight ? "text-slate-600" : "text-zinc-400"
                            }`}>
                                Base biomecánica con fotos reales e instrucciones técnicas paso a paso en español.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Search & Filter Toolbar */}
                <div className={`backdrop-blur-xl rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl border transition-colors ${
                    isLight
                        ? "bg-white/90 border-slate-200/90 shadow-slate-900/[0.03]"
                        : "bg-[#121214]/90 border-white/[0.08]"
                }`}>
                    {/* Search Input & AI Camera Scanner Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                isLight ? "text-slate-400" : "text-zinc-400"
                            }`} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, subdivisión, equipamiento o biomecánica..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={`w-full rounded-2xl pl-11 pr-11 py-3 text-sm outline-none transition-all border ${
                                    isLight
                                        ? "bg-slate-50 border-slate-300 focus:border-slate-800 text-slate-900 placeholder:text-slate-400"
                                        : "bg-black/40 border-white/[0.1] focus:border-white/40 text-white placeholder:text-zinc-500 shadow-inner"
                                }`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 cursor-pointer ${
                                        isLight ? "text-slate-400 hover:text-slate-900" : "text-zinc-400 hover:text-white"
                                    }`}
                                    title="Borrar búsqueda"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Botón Escáner IA de Máquinas con Cámara */}
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className={`px-4 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer border ${
                                isLight
                                    ? "bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white border-slate-300"
                                    : "bg-white/[0.08] hover:bg-white text-white hover:text-black border-white/20 hover:border-white"
                            }`}
                            title="Tomar foto a una máquina para identificarla y ver sus ejercicios"
                        >
                            <Camera size={16} className="text-emerald-500 shrink-0" />
                            <span>Escanear Máquina con IA</span>
                        </button>
                    </div>

                    {/* Muscle Groups Filter Pills */}
                    <div className="space-y-2">
                        <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                            isLight ? "text-slate-700" : "text-zinc-400"
                        }`}>
                            FILTRAR POR GRUPO MUSCULAR
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {/* ALL option */}
                            <button
                                onClick={() => setSelectedMuscle("ALL")}
                                className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
                                    selectedMuscle === "ALL"
                                        ? (isLight ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold" : "bg-white text-black border-white font-bold shadow-md")
                                        : (isLight ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]")
                                }`}
                            >
                                <span>Todos los Músculos</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                    selectedMuscle === "ALL"
                                        ? (isLight ? "bg-white/20 text-white" : "bg-black/10 text-black font-bold")
                                        : (isLight ? "bg-slate-200 text-slate-600" : "bg-white/[0.06] text-zinc-400")
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
                                        className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 border active:scale-95 cursor-pointer ${
                                            isSelected
                                                ? (isLight ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold" : "bg-white text-black border-white font-bold shadow-md")
                                                : (isLight ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]")
                                        }`}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: meta.hex }}
                                        />
                                        <span>{meta.name}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                            isSelected
                                                ? (isLight ? "bg-white/20 text-white" : "bg-black/10 text-black font-bold")
                                                : (isLight ? "bg-slate-200 text-slate-600" : "bg-white/[0.06] text-zinc-400")
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Equipment Filter Pills */}
                    <div className={`space-y-2 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                        <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                            isLight ? "text-slate-700" : "text-zinc-400"
                        }`}>
                            FILTRAR POR EQUIPAMIENTO
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <button
                                onClick={() => setEquipmentFilter("ALL")}
                                className={`px-3 py-1.5 rounded-xl font-semibold transition-all border active:scale-95 cursor-pointer ${
                                    equipmentFilter === "ALL"
                                        ? (isLight ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-zinc-200 text-black border-zinc-200 font-bold")
                                        : (isLight ? "bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200" : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white")
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
                                        className={`px-3 py-1.5 rounded-xl font-semibold transition-all border active:scale-95 cursor-pointer ${
                                            isSelected
                                                ? (isLight ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-zinc-200 text-black border-zinc-200 font-bold")
                                                : (isLight ? "bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200" : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white")
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Exercises Grid */}
                <div className="space-y-4 flex-1">
                    {filteredExercises.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredExercises.slice(0, displayLimit).map(ex => {
                                    const isInSession = activeExerciseIds.includes(ex.id);
                                    const isRecentlyAdded = lastAddedId === ex.id;
                                    const muscleMeta = MUSCLE_PALETTE[ex.primary_muscle];

                                    return (
                                        <div
                                            key={ex.id}
                                            className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                                                isLight
                                                    ? "bg-white border-slate-200/90 text-slate-900 hover:border-slate-300"
                                                    : "bg-[#121214]/90 border-white/[0.06] text-white hover:border-white/[0.14]"
                                            }`}
                                        >
                                            <div className="space-y-3">
                                                {/* Miniatura Interactiva de Imágenes (0.jpg / 1.jpg) e Instrucciones */}
                                                <ExerciseLibraryImagePreview
                                                    exerciseId={ex.id}
                                                    name={ex.name}
                                                    instructions={ex.instructions}
                                                    isLight={isLight}
                                                />

                                                {/* Badges Bar */}
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {/* Muscle Group Badge */}
                                                        <span
                                                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1"
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
                                                                ? (isLight ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-[#FF2A2A]/20 text-[#FF2A2A] border-[#FF2A2A]/40")
                                                                : (isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-white/[0.06] text-white border-white/20")
                                                        }`}>
                                                            Tier {ex.hypertrophy_tier}
                                                        </span>

                                                        {/* Equipment */}
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                                            isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.04] text-zinc-400 border-white/[0.06]"
                                                        }`}>
                                                            {EQUIPMENT_TRANSLATIONS[ex.equipment] || ex.equipment}
                                                        </span>
                                                    </div>

                                                    {/* Activation % */}
                                                    {ex.activation_pct ? (
                                                        <span className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                                                            <Zap size={10} />
                                                            {ex.activation_pct}% EMG
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {/* Exercise Title */}
                                                <div>
                                                    <h3 className={`text-sm font-bold tracking-tight leading-snug ${
                                                        isLight ? "text-slate-950 font-sans" : "text-white"
                                                    }`}>
                                                        {ex.name}
                                                    </h3>
                                                    {ex.anatomical_subdivision && (
                                                        <p className={`text-[11px] font-medium mt-0.5 ${
                                                            isLight ? "text-slate-600" : "text-zinc-400"
                                                        }`}>
                                                            Enfoque: {ex.anatomical_subdivision}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Biomechanical Cue en Español */}
                                                {ex.biomechanical_cue && (
                                                    <p className={`text-xs leading-relaxed font-normal p-2.5 rounded-xl border ${
                                                        isLight
                                                            ? "bg-slate-50 text-slate-700 border-slate-200/80"
                                                            : "bg-white/[0.02] text-zinc-400 border-white/[0.04]"
                                                    }`}>
                                                        &ldquo;{ex.biomechanical_cue}&rdquo;
                                                    </p>
                                                )}

                                                {/* Target parameters summary */}
                                                <div className={`flex items-center gap-3 text-[11px] font-mono flex-wrap ${
                                                    isLight ? "text-slate-500" : "text-zinc-400"
                                                }`}>
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
                                            <div className={`pt-4 mt-4 border-t flex items-center justify-between gap-3 ${
                                                isLight ? "border-slate-200" : "border-white/[0.06]"
                                            }`}>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                                    isLight
                                                        ? "bg-slate-100 text-slate-700 border-slate-200"
                                                        : "bg-white/[0.06] text-zinc-300 border-white/10"
                                                }`}>
                                                    {ex.resistance_profile.replace("_", " ")}
                                                </span>

                                                <button
                                                    onClick={() => handleAdd(ex)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer ${
                                                        isRecentlyAdded
                                                            ? "bg-[#10B981] text-black"
                                                            : isInSession
                                                            ? (isLight
                                                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                                                : "bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/[0.1]")
                                                            : (isLight
                                                                ? "bg-slate-900 hover:bg-black text-white"
                                                                : "bg-white hover:bg-zinc-200 text-black")
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
                                                            <span>En tu sesión (+1)</span>
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
                                        className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer border ${
                                            isLight
                                                ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
                                                : "bg-white/[0.08] hover:bg-white text-white hover:text-black border-white/20 hover:border-white"
                                        }`}
                                    >
                                        Cargar 48 ejercicios más (Mostrando {Math.min(displayLimit, filteredExercises.length)} de {filteredExercises.length})
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${
                            isLight
                                ? "bg-white/80 border-slate-300 text-slate-800"
                                : "bg-[#121214]/40 border-white/[0.08] text-white"
                        }`}>
                            <p className="text-sm font-semibold">
                                No se encontraron ejercicios con los filtros seleccionados
                            </p>
                            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                Prueba cambiando el grupo muscular o eliminando el término de búsqueda.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedMuscle("ALL");
                                    setEquipmentFilter("ALL");
                                    setSearchQuery("");
                                }}
                                className={`px-5 py-2.5 text-xs rounded-full transition-all border font-semibold cursor-pointer ${
                                    isLight
                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                                        : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                }`}
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <footer className={`pt-6 pb-12 border-t flex items-center justify-between text-xs flex-wrap gap-4 ${
                    isLight ? "border-slate-200 text-slate-600" : "border-white/[0.08] text-zinc-400"
                }`}>
                    <span className="font-mono">
                        {filteredExercises.length} de {EXERCISE_DATABASE.length} ejercicios disponibles
                    </span>

                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 font-bold text-xs rounded-full transition-all shadow-lg active:scale-95 cursor-pointer ${
                            isLight
                                ? "bg-slate-900 hover:bg-black text-white shadow-slate-900/10"
                                : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                        }`}
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
