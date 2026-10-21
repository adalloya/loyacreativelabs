// src/components/apex/v2/ApexV2AnatomyView.tsx
"use client";

import React from "react";
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
    return (
        <div className="space-y-4">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Anatomía & Librería
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Mapa biomecánico 3D y catálogo de {catalogCount}+ ejercicios
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenScanner}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
                        title="Escanear máquina con IA"
                    >
                        <Camera className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenExerciseLibrary}
                        className="px-3 py-1.5 rounded-full bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-zinc-200 transition-all cursor-pointer"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>Catálogo</span>
                    </button>
                </div>
            </div>

            {/* Visualizador Anatómico 3D */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-5 shadow-xl">
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
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                    Radar de Equilibrio Articular
                                </h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                                Proporción de volumen entre patrones antagonistas para proteger tendones y maximizar la hipertrofia simétrica.
                            </p>

                            <div className="space-y-3 text-xs pt-1">
                                <div>
                                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                                        <span className="text-zinc-300">Empuje vs Tracción</span>
                                        <span className="text-emerald-400 font-bold">1.05 (Óptimo)</span>
                                    </div>
                                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: "52%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                                        <span className="text-zinc-300">Cuádriceps vs Isquios</span>
                                        <span className="text-emerald-400 font-bold">0.98 (Balanceado)</span>
                                    </div>
                                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: "49%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acceso Rápido a Escáner & Librería */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={onOpenExerciseLibrary}
                                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer active:scale-98 group"
                            >
                                <Search className="w-4 h-4 text-white mb-1.5 group-hover:scale-110 transition-transform" />
                                <div className="font-bold text-white">Explorador de {catalogCount}+</div>
                                <div className="text-[10px] text-zinc-400 font-mono">Filtros por agarre y biomecánica</div>
                            </button>

                            <button
                                type="button"
                                onClick={onOpenScanner}
                                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer active:scale-98 group"
                            >
                                <Camera className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                                <div className="font-bold text-white">Escanear Máquina</div>
                                <div className="text-[10px] text-zinc-400 font-mono">Visión Artificial Gemini</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
