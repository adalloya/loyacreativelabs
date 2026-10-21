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
    const [modelHeight, setModelHeight] = useState(340);

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

    useEffect(() => {
        const updateHeight = () => {
            const h = window.innerHeight;
            const w = window.innerWidth;
            if (w >= 1024) {
                // Desktop
                setModelHeight(Math.min(520, Math.max(400, h - 340)));
            } else if (w >= 768) {
                // Tablet
                setModelHeight(Math.min(460, Math.max(360, h - 360)));
            } else if (h < 720) {
                // Short mobile
                setModelHeight(290);
            } else if (h < 820) {
                // Standard mobile
                setModelHeight(330);
            } else {
                // Tall mobile
                setModelHeight(370);
            }
        };
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    const isLight = theme === "light";

    return (
        <div className="w-full min-h-[calc(100dvh-150px)] sm:min-h-[calc(100vh-130px)] flex flex-col justify-between space-y-3 sm:space-y-4 select-none">
            {/* 1. Selector CENTRADO Adelante / Atrás (Cero texto arriba) */}
            <div className="flex items-center justify-center shrink-0">
                <div className={`flex items-center gap-1.5 p-1 rounded-full border shadow-sm backdrop-blur-xl transition-all ${
                    isLight ? "bg-slate-100/90 border-slate-200" : "bg-zinc-950/80 border-white/10"
                }`}>
                    <button
                        type="button"
                        onClick={() => setAnatomyView("anterior")}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            anatomyView === "anterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Adelante
                    </button>
                    <button
                        type="button"
                        onClick={() => setAnatomyView("posterior")}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            anatomyView === "posterior"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        Atrás
                    </button>
                </div>
            </div>

            {/* 2. Tarjeta Principal en Toda la Pantalla:
               - Visualizador Anatómico 3D (Grande y Centrado)
               - Selector de Músculos (11 Grupos)
               - Botones Inferiores: Biblioteca Completa + Identificar Máquina
            */}
            <div className={`w-full flex-1 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all relative overflow-hidden ${
                isLight
                    ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.03]"
                    : "bg-zinc-950/75 border-white/10 text-white shadow-2xl"
            }`}>
                {/* Brillo ambiental de fondo */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none blur-3xl transition-opacity duration-700 ${
                    isLight ? "bg-emerald-500/[0.04]" : "bg-emerald-500/[0.08]"
                }`} />

                {/* Contenido Central: Visualizador 3D + Selector de Músculos */}
                <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-8 items-center justify-center py-2 sm:py-4 relative z-10 w-full">
                    {/* Visualizador Anatómico 3D */}
                    <div className="w-full flex items-center justify-center md:col-span-5 lg:col-span-5 shrink-0 my-auto">
                        <AnatomyVisualizer
                            selectedMuscle={selectedMuscle}
                            activeMusclesToday={activeMusclesToday}
                            onSelectMuscle={onSelectMuscle}
                            hideHeader={true}
                            hideLegend={true}
                            view={anatomyView}
                            onViewChange={setAnatomyView}
                            height={modelHeight}
                            containerClassName="p-0 border-0 bg-transparent shadow-none w-full flex items-center justify-center"
                        />
                    </div>

                    {/* Selector de Músculos (11 Grupos Musculares - Sin títulos de texto) */}
                    <div className="w-full md:col-span-7 lg:col-span-7 flex flex-col justify-center mt-3 md:mt-0">
                        {/* Grid responsivo: 3 cols en móvil, 2 o 3 cols en tablet/desktop */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                            {ORDERED_MUSCLE_GROUPS.map((mg) => {
                                const info = MUSCLE_PALETTE[mg];
                                const isSelected = selectedMuscle === mg;
                                const isToday = activeMusclesToday?.includes(mg);

                                return (
                                    <button
                                        key={mg}
                                        type="button"
                                        onClick={() => onSelectMuscle(mg)}
                                        className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 ${
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
                                        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
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
                   - Biblioteca Completa
                   - Identificar Máquina
                */}
                <div className={`mt-3 pt-3 sm:pt-4 border-t grid grid-cols-2 gap-2.5 sm:gap-4 shrink-0 relative z-10 ${
                    isLight ? "border-slate-200/80" : "border-white/[0.08]"
                }`}>
                    {/* Botón Ver Todos los Ejercicios / Biblioteca Completa */}
                    <button
                        type="button"
                        onClick={onOpenExerciseLibrary}
                        className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 border ${
                            isLight
                                ? "bg-slate-900 hover:bg-black text-white border-slate-900 shadow-slate-900/10"
                                : "bg-white hover:bg-zinc-200 text-black border-white shadow-white/5"
                        }`}
                        title="Ver todos los ejercicios en la biblioteca"
                    >
                        <Search className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="truncate">Biblioteca Completa</span>
                        <span className="text-[10px] sm:text-xs font-mono opacity-65 shrink-0">({catalogCount})</span>
                    </button>

                    {/* Botón Identificar Máquina con IA */}
                    <button
                        type="button"
                        onClick={onOpenScanner}
                        className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 border ${
                            isLight
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/35"
                        }`}
                        title="Escanear e identificar máquinas del gimnasio con Visión Artificial"
                    >
                        <Camera className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">Identificar Máquina</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
