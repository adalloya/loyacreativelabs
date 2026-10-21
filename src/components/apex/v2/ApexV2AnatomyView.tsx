// src/components/apex/v2/ApexV2AnatomyView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Shield,
    Camera,
    Search,
    Dumbbell,
    Sparkles,
    Check
} from "lucide-react";
import {
    AnatomyVisualizer,
    MUSCLE_PALETTE,
    ORDERED_MUSCLE_GROUPS
} from "@/components/apex/AnatomyVisualizer";
import { MuscleGroup } from "@/lib/hypertrophy-engine";
import { getInitialTheme, Theme } from "@/lib/theme";

interface ApexV2AnatomyViewProps {
    selectedMuscle: MuscleGroup | null;
    activeMusclesToday: MuscleGroup[];
    onSelectMuscle: (muscle: MuscleGroup | null) => void;
    onOpenExerciseLibrary: () => void;
    onOpenScanner: () => void;
    catalogCount: number;
}

export const ApexV2AnatomyView: React.FC<ApexV2AnatomyViewProps> = ({
    selectedMuscle,
    activeMusclesToday,
    onSelectMuscle,
    onOpenExerciseLibrary,
    onOpenScanner,
    catalogCount
}) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const [anatomyView, setAnatomyView] = useState<"anterior" | "posterior">("anterior");

    useEffect(() => {
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

    return (
        <div className="space-y-2.5 max-w-xl mx-auto">
            {/* 1. Cabecera Minimalista Cero Texto:
               - Selector CENTRADO de Vista Frontal / Posterior estilo Cápsula Liquid Glass.
               - Accesos rápidos laterales a Catálogo y Escáner.
            */}
            <div className="flex items-center justify-between px-0.5">
                {/* Botón Catálogo a la izquierda */}
                <button
                    type="button"
                    onClick={onOpenExerciseLibrary}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 border ${
                        isLight
                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                            : "bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10"
                    }`}
                    title="Explorador y biblioteca de ejercicios"
                >
                    <Search className="w-3.5 h-3.5 text-rose-500" />
                    <span>Catálogo</span>
                    <span className="text-[10px] font-mono opacity-60">({catalogCount})</span>
                </button>

                {/* SELECTOR CENTRADO: FRONTAL / POSTERIOR */}
                <div className={`flex items-center gap-1 p-1 rounded-full border shadow-sm ${
                    isLight ? "bg-slate-100/90 border-slate-200" : "bg-zinc-950/80 border-white/10"
                }`}>
                    <button
                        type="button"
                        onClick={() => setAnatomyView("anterior")}
                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            anatomyView === "anterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Frontal
                    </button>
                    <button
                        type="button"
                        onClick={() => setAnatomyView("posterior")}
                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            anatomyView === "posterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Posterior
                    </button>
                </div>

                {/* Botón Escáner a la derecha */}
                <button
                    type="button"
                    onClick={onOpenScanner}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border shadow-xs ${
                        isLight
                            ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10"
                    }`}
                    title="Escanear máquina con IA"
                    aria-label="Escanear Máquina"
                >
                    <Camera className="w-4 h-4 text-emerald-500" />
                </button>
            </div>

            {/* 2. Tarjeta Unificada Cero Scroll:
               - Lado izquierdo: Modelo Anatómico 3D interactivo calibrado (~225px de alto).
               - Lado derecho: Selector de Músculos en cuadrícula ultra compacta.
               - Pie: Radar de Equilibrio Articular de una sola línea.
            */}
            <div className={`backdrop-blur-2xl rounded-3xl p-3 sm:p-4 shadow-xl border transition-colors ${
                isLight
                    ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.03]"
                    : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                    {/* Visualizador Anatómico 3D (Cuerpo humano interactivo sin cabeceras duplicadas) */}
                    <div className="col-span-5 sm:col-span-5 flex items-center justify-center">
                        <AnatomyVisualizer
                            selectedMuscle={selectedMuscle}
                            activeMusclesToday={activeMusclesToday}
                            onSelectMuscle={onSelectMuscle}
                            hideHeader={true}
                            hideLegend={true}
                            view={anatomyView}
                            onViewChange={setAnatomyView}
                            height={225}
                            containerClassName="p-0 border-0 bg-transparent shadow-none w-full"
                        />
                    </div>

                    {/* Selector de Músculos Compacto (11 Grupos Musculares) */}
                    <div className="col-span-7 sm:col-span-7 flex flex-col justify-center space-y-2">
                        <div className="flex items-center justify-between pb-0.5">
                            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                                isLight ? "text-slate-600" : "text-zinc-400"
                            }`}>
                                SELECTOR DE MÚSCULOS:
                            </span>
                            <span className={`text-[9px] font-mono ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                                Toca para ver
                            </span>
                        </div>

                        {/* Grid de 2 columnas de Músculos */}
                        <div className="grid grid-cols-2 gap-1.5">
                            {ORDERED_MUSCLE_GROUPS.map((mg) => {
                                const info = MUSCLE_PALETTE[mg];
                                const isSelected = selectedMuscle === mg;
                                const isToday = activeMusclesToday?.includes(mg);

                                return (
                                    <button
                                        key={mg}
                                        type="button"
                                        onClick={() => onSelectMuscle(mg)}
                                        className={`px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all border flex items-center justify-between gap-1 cursor-pointer active:scale-95 ${
                                            isSelected
                                                ? (isLight
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                    : "bg-white text-black border-white shadow-sm")
                                                : isToday
                                                ? (isLight
                                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                                                    : "bg-[#10B981]/15 text-white border-[#10B981]/40 font-bold")
                                                : (isLight
                                                    ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                                                    : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.06]")
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: info.hex }}
                                            />
                                            <span className="truncate">{info.name}</span>
                                        </div>
                                        {isToday && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Activo hoy" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Radar de Equilibrio Articular Condensado de 1 Línea */}
                <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono ${
                    isLight ? "border-slate-200/80 text-slate-600" : "border-white/[0.06] text-zinc-400"
                }`}>
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold uppercase tracking-tight">Balance Articular:</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span>Empuje/Tracción: <strong className="text-emerald-500">1.05</strong></span>
                        <span className="opacity-40">•</span>
                        <span>Cuádriceps/Isquios: <strong className="text-emerald-500">0.98</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
