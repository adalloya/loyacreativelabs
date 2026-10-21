// src/components/apex/v2/ApexV2ExerciseCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Check,
    MoreVertical,
    Play,
    Gauge,
    Disc,
    Shuffle,
    RefreshCw,
    Sparkles,
    FileText,
    X,
    ChevronDown,
    Activity
} from "lucide-react";
import { ExerciseItem, formatPlatesSummary } from "@/lib/hypertrophy-engine";
import { ExerciseMotionViewer } from "@/components/apex/ExerciseMotionViewer";
import { Drawer } from "vaul";

interface ApexV2ExerciseCardProps {
    exercise: ExerciseItem;
    exerciseIndex: number;
    isNewBlock?: boolean;
    memory: { weight: number; reps: number };
    target: {
        suggestedWeight: number;
        suggestedReps: number;
        estimated1RM: number;
        targetRir: number;
    };
    weightUnit: "lbs" | "kg";
    completedSets: Record<string, boolean>;
    setInputs: Record<string, { weight: number | string; reps: number | string }>;
    onSetInputChange: (key: string, field: "weight" | "reps", value: any) => void;
    onCompleteSet: (exercise: ExerciseItem, setIdx: number, customWeight?: number, customReps?: number) => void;
    tempoActive: boolean;
    onToggleTempo: () => void;
    onOpenVbt: () => void;
    onRandomSwap: () => void;
    onOpenSwapModal: () => void;
    onOpenPlateModal: (weight: number) => void;
    isPlateLoaded: boolean;
    notes?: string;
    onSaveNotes?: (notes: string) => void;
    isLight?: boolean;
}

export const ApexV2ExerciseCard: React.FC<ApexV2ExerciseCardProps> = ({
    exercise,
    exerciseIndex,
    isNewBlock,
    memory,
    target,
    weightUnit,
    completedSets,
    setInputs,
    onSetInputChange,
    onCompleteSet,
    tempoActive,
    onToggleTempo,
    onOpenVbt,
    onRandomSwap,
    onOpenSwapModal,
    onOpenPlateModal,
    isPlateLoaded,
    notes = "",
    onSaveNotes,
    isLight: isLightProp
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [localNotes, setLocalNotes] = useState(notes);
    const [showIndividualSets, setShowIndividualSets] = useState(false);
    const [isLightState, setIsLightState] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("light");
        }
        return false;
    });

    useEffect(() => {
        const handleThemeChange = (e: Event) => {
            const customEvt = e as CustomEvent<{ theme: string }>;
            if (customEvt.detail?.theme) {
                setIsLightState(customEvt.detail.theme === "light");
            } else if (typeof document !== "undefined") {
                setIsLightState(document.documentElement.classList.contains("light"));
            }
        };
        window.addEventListener("apex_theme_change", handleThemeChange);
        return () => window.removeEventListener("apex_theme_change", handleThemeChange);
    }, []);

    const isLight = isLightProp ?? isLightState;

    // Entrada condensada unificada: Series × Peso × Reps
    const [seriesCount, setSeriesCount] = useState<number>(exercise.default_sets || 3);
    const [unifiedWeight, setUnifiedWeight] = useState<string | number>(() => {
        return memory.reps > 0 ? memory.weight : (target.suggestedWeight || 0);
    });
    const [unifiedReps, setUnifiedReps] = useState<string | number>(() => {
        return memory.reps > 0 ? memory.reps : (target.suggestedReps || exercise.rep_range_min || 8);
    });

    // Calcular cuántas series están completadas
    const completedCount = Array.from({ length: seriesCount }).filter((_, sIdx) => {
        return Boolean(completedSets[`${exercise.id}_${sIdx}`]);
    }).length;
    const isAllCompleted = completedCount >= seriesCount && seriesCount > 0;

    // Completar o alternar todas las series en un solo clic
    const handleToggleAllSets = () => {
        const nextState = !isAllCompleted;
        const w = Number(unifiedWeight) || 0;
        const r = Number(unifiedReps) || 0;

        for (let i = 0; i < seriesCount; i++) {
            const key = `${exercise.id}_${i}`;
            onSetInputChange(key, "weight", w);
            onSetInputChange(key, "reps", r);
            
            // Si vamos a completar y la serie no estaba completada, la completamos
            if (nextState) {
                if (!completedSets[key]) {
                    onCompleteSet(exercise, i, w, r);
                }
            } else {
                // Si vamos a desmarcar y la serie estaba completada
                if (completedSets[key]) {
                    onCompleteSet(exercise, i, w, r);
                }
            }
        }
    };

    return (
        <div className="space-y-2.5">
            {/* Cabecera de Circuito (Si aplica) */}
            {isNewBlock && (
                <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border ${
                    isLight
                        ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                        : "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-white"
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className={`text-xs font-bold font-mono tracking-wider uppercase ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                            {exercise.blockTitle || `CIRCUITO // ${exercise.blockRounds || 3} VUELTAS`}
                        </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                        isLight ? "bg-white text-slate-600 border-slate-200" : "text-zinc-400 bg-black/40 border-white/10"
                    }`}>
                        Descanso al final de vuelta
                    </span>
                </div>
            )}

            {/* Tarjeta Principal "Zero-Scroll" con Glassmorphism */}
            <div className={`relative backdrop-blur-2xl border rounded-3xl overflow-hidden transition-all ${
                isLight
                    ? "bg-white/90 border-slate-200/90 shadow-sm shadow-slate-900/[0.04] text-slate-900"
                    : "bg-zinc-900/80 border-white/10 shadow-2xl text-white"
            } ${exercise.blockId ? "border-l-4 border-l-emerald-500" : ""}`}>

                {/* Fondo Animado del Ejercicio en Bucle (Limpio, escala completa y opacidad suave para alta legibilidad) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <ExerciseMotionViewer
                        githubId={exercise.github_id || exercise.name}
                        exerciseName={exercise.name}
                        showBadges={false}
                        className="w-full h-full border-0 rounded-none bg-transparent"
                        imgClassName={`w-full h-full object-cover object-right sm:object-center filter contrast-125 transition-opacity duration-300 ${
                            isLight ? "opacity-15" : "opacity-20"
                        }`}
                    />
                    {/* Degradado translúcido para garantizar legibilidad absoluta de textos, inputs y métricas */}
                    <div className={`absolute inset-0 backdrop-blur-[1px] transition-colors ${
                        isLight
                            ? "bg-gradient-to-r from-white/95 via-white/85 to-white/65"
                            : "bg-gradient-to-r from-zinc-950/95 via-zinc-950/85 to-zinc-950/65"
                    }`} />
                </div>

                {/* Contenido en Primer Plano con z-10 */}
                <div className="relative z-10">
                    {/* 1. Cabecera Espaciosa */}
                    <div className={`p-3.5 sm:p-4 pb-3 border-b ${
                        isLight ? "border-slate-200/70 bg-white/40" : "border-white/[0.06] bg-black/20"
                    }`}>
                        <div className="flex items-start justify-between gap-3">
                            {/* Título, Insignias y Biomecánica */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                                        isLight ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                    }`}>
                                        TIER {exercise.hypertrophy_tier || "S"}
                                    </span>
                                    <span className={`text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                        isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-white/[0.08] text-zinc-300 border-white/[0.1]"
                                    }`}>
                                        {exercise.anatomical_subdivision}
                                    </span>
                                    <span className={`text-[10px] capitalize hidden xs:inline ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                        • {exercise.equipment}
                                    </span>
                                </div>

                                <h3 className={`text-sm sm:text-base font-bold tracking-tight truncate leading-tight ${
                                    isLight ? "text-slate-950 font-sans" : "text-white"
                                }`}>
                                    {exercise.name}
                                </h3>

                                <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate leading-tight font-normal ${
                                    isLight ? "text-slate-600" : "text-zinc-400"
                                }`}>
                                    {exercise.biomechanical_cue}
                                </p>
                            </div>

                            {/* Botón Menú (...) */}
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(true)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 border ${
                                    isLight
                                        ? "bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-xs"
                                        : "bg-white/[0.08] hover:bg-white/[0.16] text-zinc-300 hover:text-white border-white/10"
                                }`}
                                title="Opciones avanzadas del ejercicio"
                                aria-label="Más opciones"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                {/* 2. Barra Horizontal de Métricas Condensadas de un Vistazo */}
                <div className={`px-4 py-2 border-b grid grid-cols-4 gap-1 text-center font-mono ${
                    isLight ? "bg-slate-50/90 border-slate-200/80" : "bg-black/40 border-white/[0.04]"
                }`}>
                    <div className={`px-1 border-r ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                        <span className={`text-[9px] uppercase block font-sans ${isLight ? "text-slate-500 font-medium" : "text-zinc-500"}`}>Último</span>
                        <span className={`text-xs font-semibold truncate block ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                            {memory.reps > 0 ? `${memory.weight}${weightUnit}×${memory.reps}` : `0×0`}
                        </span>
                    </div>
                    <div className={`px-1 border-r ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                        <span className={`text-[9px] uppercase block font-sans ${isLight ? "text-emerald-700 font-semibold" : "text-emerald-400/80"}`}>Meta Hoy</span>
                        <span className={`text-xs font-bold truncate block ${isLight ? "text-slate-950 font-bold" : "text-white"}`}>
                            {target.suggestedReps > 0 ? `${target.suggestedWeight}${weightUnit}×${target.suggestedReps}` : `${exercise.rep_range_min}-${exercise.rep_range_max}`}
                        </span>
                    </div>
                    <div className={`px-1 border-r ${isLight ? "border-slate-200" : "border-white/[0.06]"}`}>
                        <span className={`text-[9px] uppercase block font-sans ${isLight ? "text-slate-500 font-medium" : "text-zinc-500"}`}>1RM</span>
                        <span className={`text-xs font-semibold truncate block ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                            {target.estimated1RM > 0 ? `${target.estimated1RM}${weightUnit}` : `—`}
                        </span>
                    </div>
                    <div className="px-1">
                        <span className={`text-[9px] uppercase block font-sans ${isLight ? "text-slate-500 font-medium" : "text-zinc-500"}`}>RIR</span>
                        <span className={`text-xs font-semibold truncate block ${isLight ? "text-slate-900" : "text-white"}`}>
                            {target.targetRir}
                        </span>
                    </div>
                </div>

                {/* 3. Acción Inmediata: Entrada Rápida Unificada (Series × Peso × Reps) */}
                <div className="p-3 sm:p-3.5 space-y-2">
                    <div className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all gap-2 ${
                        isAllCompleted
                            ? (isLight ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-emerald-500/10 border-emerald-500/30 text-white")
                            : (isLight ? "bg-slate-50 border-slate-200/90 text-slate-800" : "bg-white/[0.03] border-white/[0.06] text-zinc-300")
                    }`}>
                        {/* Selector de número de series hechas */}
                        <div className={`flex items-center gap-1 rounded-xl p-1 shrink-0 border ${
                            isLight ? "bg-white border-slate-200 shadow-xs" : "bg-black/50 border-white/10"
                        }`}>
                            <button
                                type="button"
                                onClick={() => setSeriesCount((prev) => Math.max(1, prev - 1))}
                                className={`w-6 h-6 rounded-lg active:scale-90 flex items-center justify-center font-bold text-xs cursor-pointer select-none ${
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800" : "bg-white/10 hover:bg-white/20 text-white"
                                }`}
                                title="Menos series"
                            >
                                -
                            </button>
                            <div className="px-1.5 text-center min-w-[36px]">
                                <span className={`text-xs font-mono font-bold block leading-none ${isLight ? "text-slate-900" : "text-white"}`}>
                                    {seriesCount}
                                </span>
                                <span className={`text-[8px] font-mono block uppercase mt-0.5 leading-none ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    sets
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSeriesCount((prev) => prev + 1)}
                                className={`w-6 h-6 rounded-lg active:scale-90 flex items-center justify-center font-bold text-xs cursor-pointer select-none ${
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800" : "bg-white/10 hover:bg-white/20 text-white"
                                }`}
                                title="Más series"
                            >
                                +
                            </button>
                        </div>

                        {/* Inputs de Peso y Repeticiones */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center max-w-[210px]">
                            {/* Input Peso */}
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={unifiedWeight}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUnifiedWeight(val);
                                        for (let i = 0; i < seriesCount; i++) {
                                            onSetInputChange(`${exercise.id}_${i}`, "weight", val);
                                        }
                                    }}
                                    placeholder="0"
                                    className={`w-full h-9 rounded-xl text-center text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors pr-6 border ${
                                        isLight
                                            ? "bg-white border-slate-200 text-slate-900 focus:border-slate-400 placeholder:text-slate-400"
                                            : "bg-black/60 border-white/10 text-white focus:border-white/40 placeholder:text-zinc-600"
                                    }`}
                                />
                                <span className={`absolute right-1.5 top-2.5 text-[9px] font-mono pointer-events-none uppercase ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    {weightUnit}
                                </span>
                            </div>

                            <span className={`font-mono text-xs ${isLight ? "text-slate-400" : "text-zinc-600"}`}>×</span>

                            {/* Input Reps */}
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={unifiedReps}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUnifiedReps(val);
                                        for (let i = 0; i < seriesCount; i++) {
                                            onSetInputChange(`${exercise.id}_${i}`, "reps", val);
                                        }
                                    }}
                                    placeholder="0"
                                    className={`w-full h-9 rounded-xl text-center text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors pr-6 border ${
                                        isLight
                                            ? "bg-white border-slate-200 text-slate-900 focus:border-slate-400 placeholder:text-slate-400"
                                            : "bg-black/60 border-white/10 text-white focus:border-white/40 placeholder:text-zinc-600"
                                    }`}
                                />
                                <span className={`absolute right-1.5 top-2.5 text-[9px] font-mono pointer-events-none uppercase ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    reps
                                </span>
                            </div>
                        </div>

                        {/* Botón Maestro de Completado */}
                        <button
                            type="button"
                            onClick={handleToggleAllSets}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer ${
                                isAllCompleted
                                    ? (isLight ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20")
                                    : isLight
                                    ? "bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300"
                                    : "bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white border border-white/10"
                            }`}
                            title={isAllCompleted ? "Series completadas (clic para deshacer)" : `Marcar las ${seriesCount} series completadas`}
                            aria-label="Completar series"
                        >
                            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${isAllCompleted ? "stroke-[3]" : "stroke-[2]"}`} />
                        </button>
                    </div>

                    {/* Estado de completado & Enlace para desglosar por serie */}
                    <div className="flex items-center justify-between px-1 text-[10px] font-mono">
                        <span className={completedCount > 0 ? (isLight ? "text-emerald-700 font-semibold" : "text-emerald-400 font-semibold") : (isLight ? "text-slate-500" : "text-zinc-500")}>
                            {completedCount > 0 ? `✓ ${completedCount}/${seriesCount} series completadas` : `${seriesCount} series programadas`}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowIndividualSets(!showIndividualSets)}
                            className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <span>{showIndividualSets ? "Ocultar desglose" : "Desglosar por serie"}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showIndividualSets ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    {/* Desglose individual (Solo si el usuario desea drop sets o pesos distintos) */}
                    {showIndividualSets && (
                        <div className={`space-y-1.5 pt-2 border-t animate-in fade-in ${isLight ? "border-slate-200" : "border-white/[0.04]"}`}>
                            {Array.from({ length: seriesCount }).map((_, sIdx) => {
                                const key = `${exercise.id}_${sIdx}`;
                                const isCompleted = Boolean(completedSets[key]);
                                const currentInput = setInputs[key] || {
                                    weight: unifiedWeight,
                                    reps: unifiedReps
                                };

                                return (
                                    <div
                                        key={sIdx}
                                        className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl border text-xs gap-2 ${
                                            isCompleted
                                                ? (isLight ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-emerald-500/10 border-emerald-500/30 text-white")
                                                : (isLight ? "bg-slate-100/80 border-slate-200 text-slate-800" : "bg-black/30 border-white/5 text-zinc-300")
                                        }`}
                                    >
                                        <span className={`font-mono font-bold text-[11px] ${isLight ? "text-slate-600" : "text-zinc-400"}`}>S{sIdx + 1}</span>
                                        <div className="flex items-center gap-2 flex-1 justify-center max-w-[180px]">
                                            <input
                                                type="number"
                                                value={currentInput.weight ?? ""}
                                                onChange={(e) => onSetInputChange(key, "weight", e.target.value)}
                                                className={`w-14 h-7 rounded-lg text-center text-xs font-mono font-bold focus:outline-none border ${
                                                    isLight
                                                        ? "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                                                        : "bg-black/60 border-white/10 text-white focus:border-white/40"
                                                }`}
                                            />
                                            <span className={`font-mono text-[10px] ${isLight ? "text-slate-400" : "text-zinc-600"}`}>×</span>
                                            <input
                                                type="number"
                                                value={currentInput.reps ?? ""}
                                                onChange={(e) => onSetInputChange(key, "reps", e.target.value)}
                                                className={`w-14 h-7 rounded-lg text-center text-xs font-mono font-bold focus:outline-none border ${
                                                    isLight
                                                        ? "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                                                        : "bg-black/60 border-white/10 text-white focus:border-white/40"
                                                }`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onCompleteSet(exercise, sIdx, Number(currentInput.weight), Number(currentInput.reps))}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                                isCompleted
                                                    ? (isLight ? "bg-emerald-600 text-white" : "bg-emerald-500 text-black")
                                                    : (isLight ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-white/10 text-zinc-400 hover:bg-white/20")
                                            }`}
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                </div>
            </div>

            {/* 4. Menú Desplegable Superior con Vaul */}
            <Drawer.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity" />
                    <Drawer.Content className={`backdrop-blur-2xl border-t flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 p-5 pb-8 max-w-lg mx-auto shadow-2xl ${
                        isLight ? "bg-white/95 border-slate-200 text-slate-900" : "bg-zinc-950/95 border-white/15 text-white"
                    }`}>
                        <Drawer.Handle className={`mx-auto w-12 h-1.5 rounded-full mb-4 ${isLight ? "bg-slate-300" : "bg-zinc-700"}`} />
                        
                        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? "border-slate-200" : "border-white/10"}`}>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {exercise.name}
                                </h4>
                                <p className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Herramientas & Opciones</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white"
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Rejilla de Opciones */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            {/* YouTube Técnica */}
                            <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " form technique hypertrophy")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800" : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                }`}
                            >
                                <Play className={`w-4 h-4 shrink-0 ${isLight ? "fill-slate-900 text-slate-900" : "fill-white text-white"}`} />
                                <div className="text-left min-w-0">
                                    <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>YouTube</div>
                                    <div className={`text-[10px] font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Ver técnica</div>
                                </div>
                            </a>

                            {/* Sonar Tempo 3-1-1 */}
                            <button
                                type="button"
                                onClick={() => {
                                    onToggleTempo();
                                    setIsMenuOpen(false);
                                }}
                                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    tempoActive
                                        ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-white"
                                        : isLight
                                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                        : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                }`}
                            >
                                <Activity className={`w-4 h-4 shrink-0 ${tempoActive ? "text-rose-500 animate-pulse" : (isLight ? "text-slate-700" : "text-zinc-300")}`} />
                                <div className="text-left min-w-0">
                                    <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Tempo 3-1-1</div>
                                    <div className={`text-[10px] font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{tempoActive ? "Activado" : "Sonar"}</div>
                                </div>
                            </button>

                            {/* VBT Cámara */}
                            <button
                                type="button"
                                onClick={() => {
                                    onOpenVbt();
                                    setIsMenuOpen(false);
                                }}
                                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800" : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                }`}
                            >
                                <Gauge className={`w-4 h-4 shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`} />
                                <div className="text-left min-w-0">
                                    <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Cámara VBT</div>
                                    <div className={`text-[10px] font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Velocidad IA</div>
                                </div>
                            </button>

                            {/* Swap Aleatorio Biomecánico */}
                            <button
                                type="button"
                                onClick={() => {
                                    onRandomSwap();
                                    setIsMenuOpen(false);
                                }}
                                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800" : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                }`}
                            >
                                <Shuffle className={`w-4 h-4 shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`} />
                                <div className="text-left min-w-0">
                                    <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Swap Random</div>
                                    <div className={`text-[10px] font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Mismo músculo</div>
                                </div>
                            </button>

                            {/* Cambiar por catálogo completo de los 873 */}
                            <button
                                type="button"
                                onClick={() => {
                                    onOpenSwapModal();
                                    setIsMenuOpen(false);
                                }}
                                className={`col-span-2 p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                                    isLight
                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                        : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <RefreshCw className="w-4 h-4 shrink-0" />
                                    <div className="text-left">
                                        <div className="font-semibold">Cambiar Ejercicio</div>
                                        <div className={`text-[10px] font-sans ${isLight ? "text-slate-300" : "text-zinc-400"}`}>Buscador en los 873 ejercicios del catálogo</div>
                                    </div>
                                </div>
                                <span className={`text-xs font-sans ${isLight ? "text-slate-300" : "text-zinc-400"}`}>873+ →</span>
                            </button>

                            {/* Desglose de Discos (si aplica) */}
                            {isPlateLoaded && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenPlateModal(Number(unifiedWeight) || target.suggestedWeight);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`col-span-2 p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                                        isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800" : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Disc className={`w-4 h-4 shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`} />
                                        <div className="text-left">
                                            <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Desglose de Discos Olímpicos</div>
                                            <div className={`text-[10px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                {formatPlatesSummary(Number(unifiedWeight) || target.suggestedWeight, weightUnit === "lbs" ? 45 : 20, weightUnit)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Ver →</span>
                                </button>
                            )}
                        </div>

                        {/* Notas Privadas del Ejercicio */}
                        {onSaveNotes && (
                            <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                                <label className={`text-[11px] font-mono uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Notas Privadas</span>
                                </label>
                                <textarea
                                    value={localNotes}
                                    onChange={(e) => {
                                        setLocalNotes(e.target.value);
                                        onSaveNotes(e.target.value);
                                    }}
                                    placeholder="Ajustes de banca, sensación articular, peso objetivo..."
                                    rows={2}
                                    className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none resize-none font-sans transition-colors ${
                                        isLight
                                            ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400 placeholder:text-slate-400"
                                            : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                    }`}
                                />
                            </div>
                        )}
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </div>
    );
};
