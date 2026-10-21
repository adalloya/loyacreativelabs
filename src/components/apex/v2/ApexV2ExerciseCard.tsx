// src/components/apex/v2/ApexV2ExerciseCard.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    MoreVertical,
    Play,
    ExternalLink,
    Gauge,
    Disc,
    Shuffle,
    RefreshCw,
    Sparkles,
    FileText,
    X,
    ChevronDown,
    Layers,
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
    onCompleteSet: (exercise: ExerciseItem, setIdx: number) => void;
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
    const [showNotesInline, setShowNotesInline] = useState(false);

    return (
        <div className="space-y-2.5">
            {/* Cabecera de Bloque / Circuito (Si aplica) */}
            {isNewBlock && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-white">
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
            <div className={`backdrop-blur-2xl bg-zinc-950/75 border ${
                exercise.blockId ? "border-l-4 border-l-emerald-500 border-white/10" : "border-white/10"
            } rounded-3xl overflow-hidden shadow-2xl transition-all`}>
                
                {/* 1. Cabecera Compacta / Banner con Animación e Insignias */}
                <div className="relative p-4 sm:p-5 pb-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Insignias Tier & Categoría */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <span className="text-[10px] font-mono font-bold bg-[#FF2A2A]/15 text-[#FF6B6B] border border-[#FF2A2A]/30 px-2 py-0.5 rounded-full uppercase">
                                    TIER {exercise.hypertrophy_tier || "S"}
                                </span>
                                <span className="text-[10px] font-medium bg-white/[0.06] text-zinc-300 px-2 py-0.5 rounded-full border border-white/[0.08]">
                                    {exercise.anatomical_subdivision}
                                </span>
                                <span className="text-[10px] text-zinc-400 capitalize">
                                    • {exercise.equipment}
                                </span>
                            </div>

                            {/* Título del Ejercicio */}
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate leading-tight">
                                {exercise.name}
                            </h3>

                            {/* Instrucción Biomecánica Breve */}
                            <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight font-normal">
                                {exercise.biomechanical_cue}
                            </p>
                        </div>

                        {/* Botón Menú de Opciones Secundarias (...) */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(true)}
                                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                title="Opciones avanzadas del ejercicio"
                                aria-label="Más opciones"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Barra Horizontal de Métricas Condensadas de un Vistazo */}
                <div className="px-4 py-2.5 bg-black/40 border-b border-white/[0.04] grid grid-cols-4 gap-1 text-center font-mono">
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

                {/* 3. Acción Inmediata: Inputs de Series Ultrarrápidos a Una Sola Mano */}
                <div className="p-3 sm:p-4 space-y-2">
                    {Array.from({ length: exercise.default_sets }).map((_, setIdx) => {
                        const key = `${exercise.id}_${setIdx}`;
                        const isCompleted = Boolean(completedSets[key]);
                        const currentInput = setInputs[key] || {
                            weight: memory.reps > 0 ? memory.weight : target.suggestedWeight,
                            reps: memory.reps > 0 ? memory.reps : target.suggestedReps
                        };

                        return (
                            <div
                                key={setIdx}
                                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all gap-2 ${
                                    isCompleted
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                                        : "bg-white/[0.03] border-white/[0.06] text-zinc-300"
                                }`}
                            >
                                {/* Número de Serie */}
                                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-xl ${
                                        isCompleted ? "bg-emerald-500 text-black font-extrabold" : "bg-white/10 text-white"
                                    }`}>
                                        S{setIdx + 1}
                                    </span>
                                </div>

                                {/* Inputs Peso & Reps */}
                                <div className="flex items-center gap-2 flex-1 justify-center max-w-[220px]">
                                    {/* Input de Peso */}
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={currentInput.weight ?? ""}
                                            onChange={(e) => onSetInputChange(key, "weight", e.target.value)}
                                            placeholder="0"
                                            className="w-full h-9 bg-black/60 border border-white/10 rounded-xl text-center text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-white/40 transition-colors pr-6"
                                        />
                                        <span className="absolute right-2 top-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">
                                            {weightUnit}
                                        </span>
                                    </div>

                                    <span className="text-zinc-600 font-mono text-xs">×</span>

                                    {/* Input de Reps */}
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={currentInput.reps ?? ""}
                                            onChange={(e) => onSetInputChange(key, "reps", e.target.value)}
                                            placeholder="0"
                                            className="w-full h-9 bg-black/60 border border-white/10 rounded-xl text-center text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-white/40 transition-colors pr-6"
                                        />
                                        <span className="absolute right-2 top-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none">
                                            reps
                                        </span>
                                    </div>
                                </div>

                                {/* Botón Ergonómico de Completar Serie */}
                                <button
                                    type="button"
                                    onClick={() => onCompleteSet(exercise, setIdx)}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer ${
                                        isCompleted
                                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                            : "bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white border border-white/10"
                                    }`}
                                    title={isCompleted ? "Serie completada (clic para deshacer)" : "Marcar serie completada"}
                                    aria-label="Completar serie"
                                >
                                    <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${isCompleted ? "stroke-[3]" : "stroke-[2]"}`} />
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* 4. Menú Desplegable Superior / Bottom Sheet de Opciones Secundarias con Vaul */}
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
                                <p className="text-xs text-zinc-400 font-mono">Herramientas y Biomecánica</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Visor Biomecánico integrado en el Drawer para no saturar la tarjeta */}
                        <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                            <ExerciseMotionViewer
                                githubId={exercise.github_id || "Barbell_Bench_Press_-_Medium_Grip"}
                                exerciseName={exercise.name}
                                activationPct={exercise.activation_pct || 94}
                            />
                        </div>

                        {/* Rejilla de Opciones Secundarias */}
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
                                        onOpenPlateModal(target.suggestedWeight);
                                        setIsMenuOpen(false);
                                    }}
                                    className="col-span-2 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Disc className="w-4 h-4 text-zinc-300 shrink-0" />
                                        <div className="text-left">
                                            <div className="font-semibold text-white">Desglose de Discos Olímpicos</div>
                                            <div className="text-[10px] text-zinc-400 font-mono">
                                                {formatPlatesSummary(target.suggestedWeight, weightUnit === "lbs" ? 45 : 20, weightUnit)}
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
