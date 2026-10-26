// src/components/apex/MuscleTargetDrawer.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MuscleGroup, ExerciseItem, EXERCISE_DATABASE } from "@/lib/hypertrophy-engine";
import { ExerciseMotionViewer } from "./ExerciseMotionViewer";
import { MUSCLE_PALETTE } from "./AnatomyVisualizer";
import { X, Plus, Sparkles, Check, CheckCircle2, Play, ExternalLink } from "lucide-react";

interface MuscleTargetDrawerProps {
    selectedMuscle: MuscleGroup | null;
    onClose: () => void;
    onInjectExercise: (exercise: ExerciseItem) => void;
    onToggleSpecialization?: (muscle: MuscleGroup) => void;
    specializedMuscle?: string | null;
}

const RESISTANCE_LABELS: Record<string, { label: string; color: string }> = {
    lengthened_bias: { label: "Estiramiento Máximo (Tier S)", color: "text-white border-white/20 bg-white/[0.06]" },
    mid_range_overload: { label: "Sobrecarga Pesada (Fuerza)", color: "text-[#FF2A2A] border-[#FF2A2A]/30 bg-[#FF2A2A]/10" },
    shortened_peak: { label: "Contracción Pico", color: "text-zinc-300 border-white/10 bg-white/[0.04]" }
};

const EQUIPMENT_OPTIONS = [
    { key: "ALL", label: "Todos" },
    { key: "barbell", label: "Barras" },
    { key: "dumbbell", label: "Mancuernas" },
    { key: "machine", label: "Máquinas" },
    { key: "cable", label: "Poleas" }
];

const EQUIPMENT_TRANSLATION: Record<string, string> = {
    barbell: "Barra",
    dumbbell: "Mancuerna",
    machine: "Máquina",
    cable: "Polea",
    bodyweight: "Peso corporal"
};

export function MuscleTargetDrawer({
    selectedMuscle,
    onClose,
    onInjectExercise,
    onToggleSpecialization,
    specializedMuscle
}: MuscleTargetDrawerProps) {
    const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");
    const [addedId, setAddedId] = useState<string | null>(null);
    const [addedModalExercise, setAddedModalExercise] = useState<ExerciseItem | null>(null);
    const addedTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        };
    }, []);

    if (!selectedMuscle) return null;

    const muscleExercises = EXERCISE_DATABASE.filter(e => e.primary_muscle === selectedMuscle);
    const filtered = muscleExercises.filter(e =>
        equipmentFilter === "ALL" ? true : e.equipment === equipmentFilter
    );

    const isSpecialized = specializedMuscle === selectedMuscle;
    const muscleMeta = MUSCLE_PALETTE[selectedMuscle] || { name: selectedMuscle, hex: "#FF2A2A" };

    const handleAdd = (ex: ExerciseItem) => {
        onInjectExercise(ex);
        setAddedId(ex.id);
        setAddedModalExercise(ex);

        if (addedTimerRef.current) {
            clearTimeout(addedTimerRef.current);
        }
        addedTimerRef.current = setTimeout(() => {
            setAddedModalExercise(null);
        }, 3200);

        setTimeout(() => setAddedId(null), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#121214]/95 backdrop-blur-2xl border-t sm:border border-white/[0.08] sm:rounded-3xl rounded-t-3xl p-5 sm:p-7 flex flex-col z-10 shadow-2xl overflow-hidden font-sans text-white">
                {/* Drag bar for mobile */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

                {/* Header (Apple / Tesla style with distinct muscle color badge) */}
                <div className="flex justify-between items-start border-b border-white/[0.06] pb-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span 
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: muscleMeta.hex }}
                            />
                            <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                                Catálogo Biomecánico
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                                Tier S / A
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            {muscleMeta.name}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white border border-white/[0.08] flex items-center justify-center transition-all"
                        aria-label="Cerrar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Specialization Cycle Banner */}
                {onToggleSpecialization && (
                    <div className="mb-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                                <Sparkles size={16} style={{ color: isSpecialized ? muscleMeta.hex : "#71717A" }} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white">Especialización de 4 Semanas</p>
                                <p className="text-[11px] text-zinc-400">Prioriza este músculo al inicio de la sesión (+4 series semanales adaptativas)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleSpecialization(selectedMuscle)}
                            className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-all border shrink-0 ${isSpecialized
                                ? "bg-white text-black border-white font-semibold shadow-sm"
                                : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
                                }`}
                        >
                            {isSpecialized ? "Activo" : "Activar"}
                        </button>
                    </div>
                )}

                {/* Equipment Filter Segmented Control */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 text-xs scrollbar-none">
                    {EQUIPMENT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setEquipmentFilter(opt.key)}
                            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap border text-xs font-medium ${equipmentFilter === opt.key
                                ? "bg-white text-black border-white font-semibold shadow-md"
                                : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Exercises Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {filtered.map(ex => {
                        const profile = RESISTANCE_LABELS[ex.resistance_profile] || RESISTANCE_LABELS.mid_range_overload;
                        const isAdded = addedId === ex.id;
                        const eqLabel = EQUIPMENT_TRANSLATION[ex.equipment] || ex.equipment;

                        return (
                            <div
                                key={ex.id}
                                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-4 transition-all"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                                    {/* Motion Animation Viewer (Apple Fitness+ style) */}
                                    <div className="sm:col-span-4 xl:col-span-3">
                                        <ExerciseMotionViewer
                                            githubId={ex.github_id || ex.id}
                                            exerciseName={ex.name}
                                            activationPct={ex.activation_pct || 92}
                                            className="h-32 sm:h-28"
                                        />
                                    </div>

                                    {/* Exercise Details & Actions */}
                                    <div className="sm:col-span-8 xl:col-span-9 flex flex-col justify-between h-full space-y-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="text-[11px] font-medium text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                                                    {ex.anatomical_subdivision}
                                                </span>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${profile.color}`}>
                                                    {profile.label}
                                                </span>
                                                <span className="text-xs text-zinc-400 capitalize">
                                                    • {eqLabel}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-white tracking-tight">
                                                {ex.name}
                                            </h3>
                                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                                {ex.biomechanical_cue}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap justify-between items-center gap-2 text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-zinc-400 font-mono text-[11px]">
                                                    3-4 series × {ex.rep_range_min}-{ex.rep_range_max} reps (RIR {ex.target_rir})
                                                </span>

                                                <a
                                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " tecnica biomecanica hipertrofia")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                                                    title="Ver técnica en YouTube"
                                                >
                                                    <Play className="w-2.5 h-2.5 fill-current" />
                                                    <span>YouTube</span>
                                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                                </a>
                                            </div>

                                            <button
                                                onClick={() => handleAdd(ex)}
                                                disabled={isAdded}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${isAdded
                                                    ? "bg-[#10B981] text-black font-bold"
                                                    : "bg-white hover:bg-zinc-200 text-black active:scale-95 shadow-md shadow-white/10"
                                                    }`}
                                            >
                                                {isAdded ? (
                                                    <>
                                                        <Check size={14} /> Añadido
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={14} /> Añadir a la sesión
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-xs text-zinc-500">
                            No hay ejercicios con este filtro de equipamiento para este grupo muscular.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación: Ejercicio agregado a la rutina sin cerrar la ventana */}
            <AnimatePresence>
                {addedModalExercise && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                        onClick={() => setAddedModalExercise(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 12 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center flex flex-col items-center bg-[#141416] border-white/10 text-white"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-500 shadow-sm">
                                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                            </div>

                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-2">
                                Agregado a la rutina
                            </span>

                            <h3 className="text-base sm:text-lg font-bold tracking-tight">
                                {addedModalExercise.name}
                            </h3>

                            <p className="text-xs mt-2 leading-relaxed max-w-xs text-zinc-400">
                                Se ha añadido a tu rutina de hoy. La ventana sigue abierta para que puedas seguir explorando y eligiendo más ejercicios.
                            </p>

                            <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setAddedModalExercise(null)}
                                    className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 shadow-sm bg-white hover:bg-zinc-200 text-black border-white"
                                >
                                    Seguir eligiendo
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAddedModalExercise(null);
                                        onClose();
                                    }}
                                    className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white border-white/10"
                                >
                                    Ver rutina
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
