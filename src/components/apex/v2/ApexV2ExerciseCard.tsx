// src/components/apex/v2/ApexV2ExerciseCard.tsx
"use client";

import React, { useState } from "react";
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
    onSaveNotes
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [localNotes, setLocalNotes] = useState(notes);
    const [showIndividualSets, setShowIndividualSets] = useState(false);

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
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-white">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase">
                            {exercise.blockTitle || `CIRCUITO // ${exercise.blockRounds || 3} VUELTAS`}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                        Descanso al final de vuelta
                    </span>
                </div>
            )}

            {/* Tarjeta Principal "Zero-Scroll" con Glassmorphism */}
            <div className={`backdrop-blur-2xl bg-zinc-900/70 border ${
                exercise.blockId ? "border-l-4 border-l-emerald-500 border-white/10" : "border-white/10"
            } rounded-3xl overflow-hidden shadow-2xl transition-all`}>
                
                {/* 1. Cabecera con Animación del Ejercicio Visible en Vivo */}
                <div className="p-3.5 sm:p-4 pb-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent">
                    <div className="flex items-center gap-3">
                        {/* Animación del Ejercicio en Bucle (800ms) para Identificación Inmediata */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 bg-black shrink-0 shadow-md">
                            <ExerciseMotionViewer
                                githubId={exercise.github_id || exercise.name}
                                exerciseName={exercise.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Título, Insignias y Biomecánica */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-[#FF2A2A]/15 text-[#FF6B6B] border border-[#FF2A2A]/30 px-2 py-0.5 rounded-full uppercase">
                                    TIER {exercise.hypertrophy_tier || "S"}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-medium bg-white/[0.06] text-zinc-300 px-2 py-0.5 rounded-full border border-white/[0.08]">
                                    {exercise.anatomical_subdivision}
                                </span>
                                <span className="text-[10px] text-zinc-400 capitalize hidden xs:inline">
                                    • {exercise.equipment}
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight">
                                {exercise.name}
                            </h3>

                            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 truncate leading-tight font-normal">
                                {exercise.biomechanical_cue}
                            </p>
                        </div>

                        {/* Botón Menú (...) */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                            title="Opciones avanzadas del ejercicio"
                            aria-label="Más opciones"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Barra Horizontal de Métricas Condensadas de un Vistazo */}
                <div className="px-4 py-2 bg-black/40 border-b border-white/[0.04] grid grid-cols-4 gap-1 text-center font-mono">
                    <div className="px-1 border-r border-white/[0.06]">
                        <span className="text-[9px] text-zinc-500 uppercase block font-sans">Último</span>
                        <span className="text-xs font-semibold text-zinc-300 truncate block">
                            {memory.reps > 0 ? `${memory.weight}${weightUnit}×${memory.reps}` : `0×0`}
                        </span>
                    </div>
                    <div className="px-1 border-r border-white/[0.06]">
                        <span className="text-[9px] text-emerald-400/80 uppercase block font-sans">Meta Hoy</span>
                        <span className="text-xs font-bold text-white truncate block">
                            {target.suggestedReps > 0 ? `${target.suggestedWeight}${weightUnit}×${target.suggestedReps}` : `${exercise.rep_range_min}-${exercise.rep_range_max}`}
                        </span>
                    </div>
                    <div className="px-1 border-r border-white/[0.06]">
                        <span className="text-[9px] text-zinc-500 uppercase block font-sans">1RM</span>
                        <span className="text-xs font-semibold text-zinc-300 truncate block">
                            {target.estimated1RM > 0 ? `${target.estimated1RM}${weightUnit}` : `—`}
                        </span>
                    </div>
                    <div className="px-1">
                        <span className="text-[9px] text-zinc-500 uppercase block font-sans">RIR</span>
                        <span className="text-xs font-semibold text-white truncate block">
                            {target.targetRir}
                        </span>
                    </div>
                </div>

                {/* 3. Acción Inmediata: Entrada Rápida Unificada (Series × Peso × Reps) */}
                <div className="p-3 sm:p-3.5 space-y-2">
                    <div className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all gap-2 ${
                        isAllCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                            : "bg-white/[0.03] border-white/[0.06] text-zinc-300"
                    }`}>
                        {/* Selector de número de series hechas */}
                        <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSeriesCount((prev) => Math.max(1, prev - 1))}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                                title="Menos series"
                            >
                                -
                            </button>
                            <div className="px-1.5 text-center min-w-[36px]">
                                <span className="text-xs font-mono font-bold text-white block leading-none">{seriesCount}</span>
                                <span className="text-[8px] font-mono text-zinc-400 block uppercase mt-0.5 leading-none">sets</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSeriesCount((prev) => prev + 1)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none"
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
                                    className="w-full h-9 bg-black/60 border border-white/10 rounded-xl text-center text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-white/40 transition-colors pr-6"
                                />
                                <span className="absolute right-1.5 top-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">
                                    {weightUnit}
                                </span>
                            </div>

                            <span className="text-zinc-600 font-mono text-xs">×</span>

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
                                    className="w-full h-9 bg-black/60 border border-white/10 rounded-xl text-center text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-white/40 transition-colors pr-6"
                                />
                                <span className="absolute right-1.5 top-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none">
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
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                    : "bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white border border-white/10"
                            }`}
                            title={isAllCompleted ? "Series completadas (clic para deshacer)" : `Marcar las ${seriesCount} series completadas`}
                            aria-label="Completar series"
                        >
                            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${isAllCompleted ? "stroke-[3]" : "stroke-[2]"}`} />
                        </button>
                    </div>

                    {/* Estado de completado & Enlace para desglosar por serie */}
                    <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-500">
                        <span className={completedCount > 0 ? "text-emerald-400 font-semibold" : ""}>
                            {completedCount > 0 ? `✓ ${completedCount}/${seriesCount} series completadas` : `${seriesCount} series programadas`}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowIndividualSets(!showIndividualSets)}
                            className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <span>{showIndividualSets ? "Ocultar desglose" : "Desglosar por serie"}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showIndividualSets ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    {/* Desglose individual (Solo si el usuario desea drop sets o pesos distintos) */}
                    {showIndividualSets && (
                        <div className="space-y-1.5 pt-2 border-t border-white/[0.04] animate-in fade-in">
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
                                            isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-white" : "bg-black/30 border-white/5 text-zinc-300"
                                        }`}
                                    >
                                        <span className="font-mono font-bold text-[11px] text-zinc-400">S{sIdx + 1}</span>
                                        <div className="flex items-center gap-2 flex-1 justify-center max-w-[180px]">
                                            <input
                                                type="number"
                                                value={currentInput.weight ?? ""}
                                                onChange={(e) => onSetInputChange(key, "weight", e.target.value)}
                                                className="w-14 h-7 bg-black/60 border border-white/10 rounded-lg text-center text-xs font-mono font-bold text-white focus:outline-none"
                                            />
                                            <span className="text-zinc-600 font-mono text-[10px]">×</span>
                                            <input
                                                type="number"
                                                value={currentInput.reps ?? ""}
                                                onChange={(e) => onSetInputChange(key, "reps", e.target.value)}
                                                className="w-14 h-7 bg-black/60 border border-white/10 rounded-lg text-center text-xs font-mono font-bold text-white focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onCompleteSet(exercise, sIdx, Number(currentInput.weight), Number(currentInput.reps))}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                                isCompleted ? "bg-emerald-500 text-black" : "bg-white/10 text-zinc-400"
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

            {/* 4. Menú Desplegable Superior con Vaul */}
            <Drawer.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity" />
                    <Drawer.Content className="bg-zinc-950/95 backdrop-blur-2xl border-t border-white/15 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 p-5 pb-8 text-white max-w-lg mx-auto shadow-2xl">
                        <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-zinc-700 mb-4" />
                        
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                                    {exercise.name}
                                </h4>
                                <p className="text-xs text-zinc-400 font-mono">Herramientas & Opciones</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
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
                                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <Play className="w-4 h-4 fill-white text-white shrink-0" />
                                <div className="text-left min-w-0">
                                    <div className="font-semibold text-white">YouTube</div>
                                    <div className="text-[10px] text-zinc-400 font-sans">Ver técnica</div>
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
                                        ? "bg-[#FF2A2A]/20 border-[#FF2A2A] text-white"
                                        : "bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                                }`}
                            >
                                <Activity className={`w-4 h-4 shrink-0 ${tempoActive ? "text-[#FF2A2A] animate-pulse" : ""}`} />
                                <div className="text-left min-w-0">
                                    <div className="font-semibold text-white">Tempo 3-1-1</div>
                                    <div className="text-[10px] text-zinc-400 font-sans">{tempoActive ? "Activado" : "Sonar"}</div>
                                </div>
                            </button>

                            {/* VBT Cámara */}
                            <button
                                type="button"
                                onClick={() => {
                                    onOpenVbt();
                                    setIsMenuOpen(false);
                                }}
                                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <Gauge className="w-4 h-4 text-zinc-300 shrink-0" />
                                <div className="text-left min-w-0">
                                    <div className="font-semibold text-white">Cámara VBT</div>
                                    <div className="text-[10px] text-zinc-400 font-sans">Velocidad IA</div>
                                </div>
                            </button>

                            {/* Swap Aleatorio Biomecánico */}
                            <button
                                type="button"
                                onClick={() => {
                                    onRandomSwap();
                                    setIsMenuOpen(false);
                                }}
                                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <Shuffle className="w-4 h-4 text-zinc-300 shrink-0" />
                                <div className="text-left min-w-0">
                                    <div className="font-semibold text-white">Swap Random</div>
                                    <div className="text-[10px] text-zinc-400 font-sans">Mismo músculo</div>
                                </div>
                            </button>

                            {/* Cambiar por catálogo completo de los 873 */}
                            <button
                                type="button"
                                onClick={() => {
                                    onOpenSwapModal();
                                    setIsMenuOpen(false);
                                }}
                                className="col-span-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <RefreshCw className="w-4 h-4 text-white shrink-0" />
                                    <div className="text-left">
                                        <div className="font-semibold text-white">Cambiar Ejercicio</div>
                                        <div className="text-[10px] text-zinc-400 font-sans">Buscador en los 873 ejercicios del catálogo</div>
                                    </div>
                                </div>
                                <span className="text-xs text-zinc-400 font-sans">873+ →</span>
                            </button>

                            {/* Desglose de Discos (si aplica) */}
                            {isPlateLoaded && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenPlateModal(Number(unifiedWeight) || target.suggestedWeight);
                                        setIsMenuOpen(false);
                                    }}
                                    className="col-span-2 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Disc className="w-4 h-4 text-zinc-300 shrink-0" />
                                        <div className="text-left">
                                            <div className="font-semibold text-white">Desglose de Discos Olímpicos</div>
                                            <div className="text-[10px] text-zinc-400 font-mono">
                                                {formatPlatesSummary(Number(unifiedWeight) || target.suggestedWeight, weightUnit === "lbs" ? 45 : 20, weightUnit)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-zinc-400 font-sans">Ver →</span>
                                </button>
                            )}
                        </div>

                        {/* Notas Privadas del Ejercicio */}
                        {onSaveNotes && (
                            <div className="mt-4 pt-3 border-t border-white/10">
                                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
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
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 resize-none font-sans"
                                />
                            </div>
                        )}
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </div>
    );
};
