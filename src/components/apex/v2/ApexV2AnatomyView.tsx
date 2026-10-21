// src/components/apex/v2/ApexV2AnatomyView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Layers,
    Shield,
    Camera,
    Search,
    Dumbbell,
    Sparkles,
    ChevronRight,
    Activity
} from "lucide-react";
import { AnatomyVisualizer } from "@/components/apex/AnatomyVisualizer";
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
        <div className="space-y-4">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        Catálogo de Ejercicios & Anatomía
                    </h2>
                    <p className={`text-xs ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                    }`}>
                        Mapa biomecánico y catálogo de {catalogCount}+ ejercicios
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenScanner}
                        className={`p-2 rounded-full border transition-all cursor-pointer ${
                            isLight
                                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                                : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                        }`}
                        title="Escanear máquina con IA"
                    >
                        <Camera className="w-4 h-4 text-emerald-500" />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenExerciseLibrary}
                        className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                            isLight
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-white text-black hover:bg-zinc-200"
                        }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>Catálogo</span>
                    </button>
                </div>
            </div>

            {/* Visualizador Anatómico 3D */}
            <div className={`backdrop-blur-2xl rounded-3xl p-5 shadow-xl border transition-colors ${
                isLight
                    ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]"
                    : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-6 xl:col-span-5">
                        <AnatomyVisualizer
                            selectedMuscle={selectedMuscle}
                            activeMusclesToday={activeMusclesToday}
                            onSelectMuscle={onSelectMuscle}
                        />
                    </div>

                    <div className="lg:col-span-6 xl:col-span-7 space-y-4">
                        {/* Radar de Equilibrio Articular */}
                        <div className={`rounded-2xl p-4 sm:p-5 space-y-3 border ${
                            isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-white/[0.03] border-white/[0.06] text-white"
                        }`}>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    Radar de Equilibrio Articular
                                </h4>
                            </div>
                            <p className={`text-xs leading-relaxed font-normal ${
                                isLight ? "text-slate-600" : "text-zinc-400"
                            }`}>
                                Proporción de volumen entre patrones antagonistas para proteger tendones y maximizar la hipertrofia simétrica.
                            </p>

                            <div className="space-y-3 text-xs pt-1">
                                <div>
                                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                                        <span className={isLight ? "text-slate-600" : "text-zinc-300"}>Empuje vs Tracción</span>
                                        <span className="text-emerald-500 font-bold">1.05 (Óptimo)</span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                                        isLight ? "bg-slate-200" : "bg-white/[0.06]"
                                    }`}>
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "52%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                                        <span className={isLight ? "text-slate-600" : "text-zinc-300"}>Cuádriceps vs Isquios</span>
                                        <span className="text-emerald-500 font-bold">0.98 (Balanceado)</span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                                        isLight ? "bg-slate-200" : "bg-white/[0.06]"
                                    }`}>
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "49%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acceso Rápido a Escáner & Librería */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={onOpenExerciseLibrary}
                                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer active:scale-98 group border ${
                                    isLight
                                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10"
                                }`}
                            >
                                <Search className={`w-4 h-4 mb-1.5 group-hover:scale-110 transition-transform ${
                                    isLight ? "text-slate-900" : "text-white"
                                }`} />
                                <div className={`font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Explorador de {catalogCount}+</div>
                                <div className={`text-[10px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Filtros por agarre y biomecánica</div>
                            </button>

                            <button
                                type="button"
                                onClick={onOpenScanner}
                                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer active:scale-98 group border ${
                                    isLight
                                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10"
                                }`}
                            >
                                <Camera className="w-4 h-4 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" />
                                <div className={`font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Escanear Máquina</div>
                                <div className={`text-[10px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Visión Artificial Gemini</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
