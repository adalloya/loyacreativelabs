// src/components/apex/v2/ApexV2AnatomyView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Camera,
    Search
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
        <div className="space-y-3 max-w-xl mx-auto select-none">
            {/* 1. Selector CENTRADO Frontal / Posterior (Cero texto arriba) */}
            <div className="flex items-center justify-center">
                <div className={`flex items-center gap-1 p-1 rounded-full border shadow-sm ${
                    isLight ? "bg-slate-100/90 border-slate-200" : "bg-zinc-950/80 border-white/10"
                }`}>
                    <button
                        type="button"
                        onClick={() => setAnatomyView("anterior")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
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
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            anatomyView === "posterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Posterior
                    </button>
                </div>
            </div>

            {/* 2. Tarjeta Unificada Cero Scroll:
               - Visualizador Anatómico 3D (Izquierda) + Selector de Músculos (Derecha)
               - Botones Inferiores: Biblioteca de Ejercicios + Identificar Máquina IA
            */}
            <div className={`backdrop-blur-2xl rounded-3xl p-3.5 sm:p-4 shadow-xl border transition-colors ${
                isLight
                    ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.03]"
                    : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                    {/* Visualizador Anatómico 3D (Cuerpo humano interactivo sin cabeceras) */}
                    <div className="col-span-5 sm:col-span-5 flex items-center justify-center">
                        <AnatomyVisualizer
                            selectedMuscle={selectedMuscle}
                            activeMusclesToday={activeMusclesToday}
                            onSelectMuscle={onSelectMuscle}
                            hideHeader={true}
                            hideLegend={true}
                            view={anatomyView}
                            onViewChange={setAnatomyView}
                            height={230}
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

                {/* 3. Botones de Acción Inferiores:
                   - Biblioteca / Ver todos los ejercicios
                   - Identificar máquina con IA
                */}
                <div className={`mt-3.5 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 ${
                    isLight ? "border-slate-200/80" : "border-white/[0.08]"
                }`}>
                    {/* Botón Ver Todos los Ejercicios / Biblioteca */}
                    <button
                        type="button"
                        onClick={onOpenExerciseLibrary}
                        className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 border ${
                            isLight
                                ? "bg-slate-900 hover:bg-black text-white border-slate-900 shadow-slate-900/10"
                                : "bg-white hover:bg-zinc-200 text-black border-white shadow-white/5"
                        }`}
                        title="Ver todos los ejercicios en la biblioteca"
                    >
                        <Search className="w-4 h-4 text-rose-500" />
                        <span>Biblioteca de Ejercicios</span>
                        <span className="text-[10px] font-mono opacity-65">({catalogCount})</span>
                    </button>

                    {/* Botón Identificar Máquina con IA */}
                    <button
                        type="button"
                        onClick={onOpenScanner}
                        className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 border ${
                            isLight
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/35"
                        }`}
                        title="Escanear e identificar máquinas del gimnasio con Visión Artificial"
                    >
                        <Camera className="w-4 h-4 text-emerald-500" />
                        <span>Identificar Máquina IA</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
