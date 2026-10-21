// src/components/apex/v2/ApexVoiceExercisePickerModal.tsx
"use client";

import React from "react";
import { X, Dumbbell, Plus, Check, Sparkles } from "lucide-react";
import { ExerciseItem } from "@/lib/hypertrophy-engine";
import { MUSCLE_PALETTE } from "@/components/apex/AnatomyVisualizer";
import { getExerciseImageUrl } from "@/data/exerciseDatabase";

interface ApexVoiceExercisePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    spokenName: string;
    candidates: ExerciseItem[];
    onSelectExercise: (ex: ExerciseItem) => void;
    onCreateCustom: (name: string) => void;
    isLight?: boolean;
}

export const ApexVoiceExercisePickerModal: React.FC<ApexVoiceExercisePickerModalProps> = ({
    isOpen,
    onClose,
    spokenName,
    candidates,
    onSelectExercise,
    onCreateCustom,
    isLight = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border transition-all ${
                    isLight
                        ? "bg-white border-slate-200 text-slate-900"
                        : "bg-[#0F0F12] border-white/15 text-white"
                }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-[#FF2A2A]/15 text-[#FF2A2A]">
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <h3 className="text-base font-bold tracking-tight">
                                ¿Cuál ejercicio buscas?
                            </h3>
                        </div>
                        <p className={`text-xs ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                            Dictaste: <span className="font-semibold text-[#FF2A2A]">&ldquo;{spokenName}&rdquo;</span>. Selecciona la opción correcta o crea una tarjeta nueva:
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`p-1.5 rounded-full transition-colors ${
                            isLight
                                ? "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        }`}
                        title="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Lista de candidatos encontrados */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {candidates.length > 0 ? (
                        candidates.map((ex) => {
                            const muscleMeta = MUSCLE_PALETTE[ex.primary_muscle] || {
                                name: ex.primary_muscle,
                                hex: "#888888"
                            };

                            return (
                                <button
                                    key={ex.id}
                                    type="button"
                                    onClick={() => onSelectExercise(ex)}
                                    className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.98] cursor-pointer group ${
                                        isLight
                                            ? "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative flex items-center justify-center border border-white/10">
                                            <img
                                                src={getExerciseImageUrl(ex.id, 0)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = "none";
                                                }}
                                            />
                                            <Dumbbell className="w-4 h-4 text-zinc-600 absolute -z-0" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                                                {ex.name}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span
                                                    className="text-[9px] font-semibold px-2 py-0.2 rounded-full border"
                                                    style={{
                                                        color: muscleMeta.hex,
                                                        borderColor: `${muscleMeta.hex}40`,
                                                        backgroundColor: `${muscleMeta.hex}15`
                                                    }}
                                                >
                                                    {muscleMeta.name}
                                                </span>
                                                <span className={`text-[9px] font-mono ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                                    Tier {ex.hypertrophy_tier}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs font-bold text-[#FF2A2A] shrink-0 opacity-80 group-hover:opacity-100">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Seleccionar</span>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className={`p-4 text-center rounded-2xl border border-dashed ${
                            isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-white/[0.02] border-white/10 text-zinc-400"
                        }`}>
                            <p className="text-xs">
                                No se encontraron coincidencias exactas en los 873 ejercicios del catálogo.
                            </p>
                        </div>
                    )}
                </div>

                {/* Opción para crear tarjeta personalizada */}
                <div className={`pt-3 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                    <button
                        type="button"
                        onClick={() => onCreateCustom(spokenName)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 bg-[#FF2A2A] hover:bg-[#D90429] text-white shadow-md cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Crear y agregar tarjeta: &ldquo;{spokenName}&rdquo;</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
