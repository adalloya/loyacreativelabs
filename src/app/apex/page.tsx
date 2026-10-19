"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Activity,
    Dumbbell,
    Flame,
    HeartPulse,
    Layers,
    Play,
    RotateCcw,
    Shield,
    Sparkles,
    CheckCircle2,
    Plus,
    Utensils,
    Smartphone,
    Volume2,
    Disc,
    ArrowRight,
    Sliders,
    Music,
    AlertCircle,
    Info,
    Calendar,
    ShoppingCart
} from "lucide-react";

import {
    MuscleGroup,
    ExerciseItem,
    EXERCISE_DATABASE,
    generateWeeklyProgram,
    calculateTodayTarget,
    RoutineDay,
    ReadinessState,
    findBiomechanicalSwaps
} from "@/lib/hypertrophy-engine";

import {
    BiometricProfile,
    calculateMetabolism,
    calculateSupplementStack,
    generateWeeklyGroceryList,
    MEASUREMENT_PROTOCOL
} from "@/lib/nutrition-logistics";

import { useGymHardware } from "@/hooks/useGymHardware";
import { AnatomyVisualizer } from "@/components/apex/AnatomyVisualizer";
import { MuscleTargetDrawer } from "@/components/apex/MuscleTargetDrawer";
import { PlateCalculatorModal } from "@/components/apex/PlateCalculatorModal";
import { PwaInstallModal } from "@/components/apex/PwaInstallModal";

export default function ApexDashboard() {
    // Hardware Hooks (Screen WakeLock & Haptic/Audio)
    const { isScreenLocked, triggerRestTimerAlert } = useGymHardware();

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<"workout" | "anatomy" | "nutrition" | "biometrics">("workout");

    // Readiness & Environment Telemetry
    const [readiness, setReadiness] = useState<ReadinessState>("optimal");
    const [environmentMode, setEnvironmentMode] = useState<"full_gym" | "hotel_gym" | "bodyweight">("full_gym");

    // Modals
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
    const [specializedMuscle, setSpecializedMuscle] = useState<MuscleGroup | null>(null);
    const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);
    const [plateModalWeight, setPlateModalWeight] = useState(80);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [isOffPlanModalOpen, setIsOffPlanModalOpen] = useState(false);

    // Biometrics State (Stored in localStorage or initial defaults)
    const [bio, setBio] = useState<BiometricProfile>({
        gender: "male",
        age: 28,
        weightKg: 82.5,
        heightCm: 178,
        bodyFatPct: 14.5,
        skeletalMusclePct: 42.0,
        trainingDaysPerWeek: 5,
        caloricDeficitPct: 15
    });

    // Calculated Metabolism
    const macros = useMemo(() => calculateMetabolism(bio), [bio]);
    const supplements = useMemo(() => calculateSupplementStack(bio.weightKg), [bio.weightKg]);
    const groceryList = useMemo(() => generateWeeklyGroceryList(bio.weightKg), [bio.weightKg]);

    // Weekly Routine & Current Day
    const weeklyProgram = useMemo(() => {
        return generateWeeklyProgram(bio.trainingDaysPerWeek, 60, "incline_treadmill");
    }, [bio.trainingDaysPerWeek]);

    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const currentRoutine: RoutineDay = weeklyProgram[currentDayIndex] || weeklyProgram[0];

    // Workouts dynamic list (supports injecting exercises and swap)
    const [activeExercises, setActiveExercises] = useState<ExerciseItem[]>(currentRoutine.exercises);

    useEffect(() => {
        if (currentRoutine) {
            setActiveExercises(currentRoutine.exercises);
        }
    }, [currentRoutine]);

    // Completed sets tracker: { [exerciseId_setIndex]: boolean }
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
    // Ghost input memory: { [exerciseId]: { weight: number, reps: number } }
    const [exerciseMemory, setExerciseMemory] = useState<Record<string, { weight: number; reps: number }>>({
        "barbell-bench-press": { weight: 85, reps: 8 },
        "incline-dumbbell-press": { weight: 32, reps: 10 },
        "hack-squat-machine": { weight: 140, reps: 10 },
        "lat-pulldown-neutral": { weight: 75, reps: 10 }
    });

    // Rest Timer State
    const [restRemaining, setRestRemaining] = useState<number | null>(null);
    const [restTotal, setRestTotal] = useState(90);

    // Rest Timer Interval
    useEffect(() => {
        if (restRemaining === null || restRemaining <= 0) return;

        const interval = setInterval(() => {
            setRestRemaining(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    triggerRestTimerAlert("start_set");
                    return null;
                }
                if (prev === 4 || prev === 3 || prev === 2) {
                    triggerRestTimerAlert("countdown");
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [restRemaining, triggerRestTimerAlert]);

    const handleCompleteSet = (exerciseId: string, setIdx: number, restSeconds: number) => {
        const key = `${exerciseId}_${setIdx}`;
        const newState = !completedSets[key];

        setCompletedSets(prev => ({ ...prev, [key]: newState }));

        if (newState) {
            setRestTotal(restSeconds);
            setRestRemaining(restSeconds);
        }
    };

    // Inject exercise into today's session
    const handleInjectExercise = (ex: ExerciseItem) => {
        if (!activeExercises.some(e => e.id === ex.id)) {
            setActiveExercises(prev => [...prev, ex]);
        }
        setSelectedMuscle(null);
    };

    // Exercise Swap
    const handleSwapExercise = (index: number) => {
        const currentEx = activeExercises[index];
        const swaps = findBiomechanicalSwaps(currentEx.id);
        if (swaps.length > 0) {
            const nextEx = swaps[Math.floor(Math.random() * swaps.length)];
            const updated = [...activeExercises];
            updated[index] = nextEx;
            setActiveExercises(updated);
        }
    };

    // Gemini Off-Plan State
    const [offPlanText, setOffPlanText] = useState("");
    const [offPlanLoading, setOffPlanLoading] = useState(false);
    const [offPlanResult, setOffPlanResult] = useState<any>(null);

    const handleRecalculateMeal = async () => {
        if (!offPlanText.trim()) return;
        setOffPlanLoading(true);
        try {
            const res = await fetch("/api/apex", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "recalculate-meal",
                    description: offPlanText,
                    targetCalories: macros.targetCalories,
                    targetProtein: macros.proteinG
                })
            });
            const data = await res.json();
            if (data.result) {
                setOffPlanResult(data.result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setOffPlanLoading(false);
        }
    };

    // Gemini 30-Day Diet State
    const [dietPlan, setDietPlan] = useState<any>(null);
    const [dietLoading, setDietLoading] = useState(false);

    const handleGenerateAiDiet = async () => {
        setDietLoading(true);
        try {
            const res = await fetch("/api/apex", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate-diet",
                    bio,
                    macros
                })
            });
            const data = await res.json();
            if (data.plan) {
                setDietPlan(data.plan);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDietLoading(false);
        }
    };

    // Active muscle groups derived from today's exercises
    const activeMusclesToday = useMemo(() => {
        return Array.from(new Set(activeExercises.map(e => e.primary_muscle)));
    }, [activeExercises]);

    return (
        <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-sans antialiased selection:bg-[#FF2A2A]/30 selection:text-white pb-24">
            {/* Top Navigation & Telemetry Header */}
            <header className="sticky top-0 z-40 bg-[#0A0D12]/90 backdrop-blur-xl border-b border-[#1E2633] px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-[11px] font-mono text-[#8892B0] hover:text-white flex items-center gap-1 border border-[#232D3F] px-2 py-1 rounded-lg">
                            ← LOYA LABS
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-pulse" />
                            <h1 className="text-sm font-extrabold tracking-widest text-white font-mono">
                                APEX // HYPERTROPHY OS
                            </h1>
                        </div>
                    </div>

                    {/* Right Telemetry Badges */}
                    <div className="flex items-center gap-2">
                        {/* Screen Lock Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#131924] border border-[#232D3F]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScreenLocked ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
                            <span className="text-[#CBD5E1]">{isScreenLocked ? "PANTALLA ACTIVA" : "WAKE LOCK"}</span>
                        </div>

                        {/* PWA Install Trigger */}
                        <button
                            onClick={() => setIsInstallModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-[#FF2A2A] hover:bg-[#E11D48] text-white shadow-lg shadow-[#FF2A2A]/20 transition-all active:scale-95"
                            title="Instalar en tu teléfono"
                        >
                            <Smartphone size={13} />
                            <span>INSTALAR WEBAPP</span>
                        </button>
                    </div>
                </div>

                {/* Sub-bar: Readiness Check & Environment */}
                <div className="max-w-6xl mx-auto mt-2.5 pt-2 border-t border-[#161C26] flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                    {/* Readiness Switch */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#8892B0] text-[11px]">DISPOSICIÓN HOY:</span>
                        {(["optimal", "normal", "fatigued"] as ReadinessState[]).map(state => (
                            <button
                                key={state}
                                onClick={() => setReadiness(state)}
                                className={`px-2 py-0.5 rounded text-[11px] transition-all uppercase ${readiness === state
                                    ? state === "optimal"
                                        ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold"
                                        : state === "normal"
                                            ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 font-bold"
                                            : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold"
                                    : "bg-[#10141D] text-[#717C96] hover:text-white"
                                    }`}
                            >
                                {state === "optimal" ? "Óptimo (RIR 1)" : state === "normal" ? "Normal" : "Fatigado (-5%)"}
                            </button>
                        ))}
                    </div>

                    {/* Environment Switch */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#8892B0] text-[11px]">ENTORNO:</span>
                        {[
                            { id: "full_gym", label: "Gimnasio Completo" },
                            { id: "hotel_gym", label: "Hotel (Mancuernas)" },
                            { id: "bodyweight", label: "Peso Corporal" }
                        ].map(env => (
                            <button
                                key={env.id}
                                onClick={() => setEnvironmentMode(env.id as any)}
                                className={`px-2 py-0.5 rounded text-[11px] transition-all ${environmentMode === env.id
                                    ? "bg-white text-black font-bold"
                                    : "bg-[#10141D] text-[#717C96] hover:text-white"
                                    }`}
                            >
                                {env.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Tabs Navigation Bar */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                <div className="grid grid-cols-4 bg-[#0A0D12] border border-[#1E2633] rounded-xl p-1 font-mono text-xs">
                    {[
                        { id: "workout", label: "RUTINA EN VIVO", icon: Dumbbell },
                        { id: "anatomy", label: "MAPA ANATÓMICO", icon: Activity },
                        { id: "nutrition", label: "NUTRICIÓN GEMINI", icon: Utensils },
                        { id: "biometrics", label: "BIOMETRÍA", icon: Sliders }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${isActive
                                    ? "bg-white text-black font-bold shadow-lg"
                                    : "text-[#8892B0] hover:text-white hover:bg-[#131924]"
                                    }`}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Content */}
            <main className="max-w-6xl mx-auto px-4 mt-6">
                {/* =========================================================================
                    TAB 1: WORKOUT EN VIVO
                   ========================================================================= */}
                {activeTab === "workout" && (
                    <div className="space-y-6">
                        {/* Day Selector Bar */}
                        <div className="flex items-center justify-between bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-4 flex-wrap gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono text-[#64FFDA] px-2 py-0.5 rounded bg-[#64FFDA]/10 border border-[#64FFDA]/30 uppercase">
                                        FRECUENCIA FULL-BODY
                                    </span>
                                    <span className="text-xs text-[#8892B0] font-mono">
                                        Tiempo objetivo: {currentRoutine.estimatedMinutes} min
                                    </span>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    {currentRoutine.title}
                                </h2>
                                <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">
                                    {currentRoutine.focus}
                                </p>
                            </div>

                            {/* Day pagination pills */}
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                {weeklyProgram.map((d, idx) => (
                                    <button
                                        key={d.dayNumber}
                                        onClick={() => setCurrentDayIndex(idx)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${currentDayIndex === idx
                                            ? "bg-[#FF2A2A] text-white shadow-md shadow-[#FF2A2A]/30"
                                            : "bg-[#131924] text-[#8892B0] hover:text-white"
                                            }`}
                                    >
                                        D{d.dayNumber}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercises List */}
                        <div className="space-y-4">
                            {activeExercises.map((ex, exIdx) => {
                                const memory = exerciseMemory[ex.id] || { weight: 60, reps: 10 };
                                const target = calculateTodayTarget(
                                    memory.weight,
                                    memory.reps,
                                    ex.rep_range_min,
                                    ex.rep_range_max,
                                    readiness
                                );

                                return (
                                    <div
                                        key={`${ex.id}_${exIdx}`}
                                        className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-4 sm:p-5 transition-all hover:border-[#2E3A4E]"
                                    >
                                        {/* Exercise Header */}
                                        <div className="flex justify-between items-start gap-3 border-b border-[#161C26] pb-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-[10px] font-mono bg-[#161C26] text-[#CBD5E1] px-2 py-0.5 rounded uppercase">
                                                        {ex.anatomical_subdivision}
                                                    </span>
                                                    <span className="text-[10px] font-mono bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/30 px-2 py-0.5 rounded uppercase">
                                                        Tier {ex.hypertrophy_tier}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-[#8892B0] uppercase">
                                                        • {ex.equipment}
                                                    </span>
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                                    {ex.name}
                                                </h3>
                                                <p className="text-xs text-[#94A3B8] mt-1 font-mono leading-relaxed">
                                                    💡 {ex.biomechanical_cue}
                                                </p>
                                            </div>

                                            {/* Top Actions: Calculator & Swap */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setPlateModalWeight(target.suggestedWeight);
                                                        setIsPlateModalOpen(true);
                                                    }}
                                                    className="p-2 bg-[#131924] hover:bg-[#1E2633] border border-[#232D3F] rounded-lg text-slate-200 text-xs font-mono transition-all flex items-center gap-1"
                                                    title="Calculadora de Discos"
                                                >
                                                    <Disc size={14} className="text-[#38BDF8]" />
                                                    <span className="hidden sm:inline">Discos</span>
                                                </button>

                                                <button
                                                    onClick={() => handleSwapExercise(exIdx)}
                                                    className="p-2 bg-[#131924] hover:bg-[#1E2633] border border-[#232D3F] rounded-lg text-slate-200 text-xs font-mono transition-all flex items-center gap-1"
                                                    title="Buscar Alternativa Biomecánica"
                                                >
                                                    <RotateCcw size={14} className="text-[#F59E0B]" />
                                                    <span className="hidden sm:inline">Swap</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Target Telemetry (Ghost Inputs) */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-xs">
                                            <div className="p-2 rounded-lg bg-[#10141D] border border-[#161C26]">
                                                <span className="text-[10px] text-[#8892B0] block">ÚLTIMO REGISTRO</span>
                                                <span className="text-white font-bold">{memory.weight} kg × {memory.reps} reps</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#10141D] border border-[#161C26]">
                                                <span className="text-[10px] text-[#64FFDA] block">META HOY (OVERLOAD)</span>
                                                <span className="text-white font-bold">{target.suggestedWeight} kg × {target.suggestedReps} reps</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#10141D] border border-[#161C26]">
                                                <span className="text-[10px] text-[#8892B0] block">1RM ESTIMADO</span>
                                                <span className="text-white font-bold">{target.estimated1RM} kg</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#10141D] border border-[#161C26]">
                                                <span className="text-[10px] text-[#8892B0] block">PROXIMIDAD AL FALLO</span>
                                                <span className="text-white font-bold">RIR {target.targetRir} (1-2 en reserva)</span>
                                            </div>
                                        </div>

                                        {/* Interactive Sets Tracker */}
                                        <div className="space-y-2">
                                            {Array.from({ length: ex.default_sets }).map((_, setIdx) => {
                                                const key = `${ex.id}_${setIdx}`;
                                                const isCompleted = Boolean(completedSets[key]);

                                                return (
                                                    <div
                                                        key={setIdx}
                                                        className={`flex items-center justify-between p-2.5 rounded-xl border font-mono text-xs transition-all ${isCompleted
                                                            ? "bg-[#10B981]/10 border-[#10B981]/40 text-white"
                                                            : "bg-[#10141D] border-[#1C2433] text-[#CBD5E1]"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-md bg-[#161C26] flex items-center justify-center font-bold text-white text-[11px]">
                                                                S{setIdx + 1}
                                                            </span>
                                                            <span>
                                                                {target.suggestedWeight} kg × {target.suggestedReps} reps
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-[#8892B0] hidden sm:inline">
                                                                Descanso {ex.rest_seconds}s
                                                            </span>
                                                            <button
                                                                onClick={() => handleCompleteSet(ex.id, setIdx, ex.rest_seconds)}
                                                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${isCompleted
                                                                    ? "bg-[#10B981] text-black"
                                                                    : "bg-[#1E2633] hover:bg-[#2B3547] text-white active:scale-95"
                                                                    }`}
                                                            >
                                                                <CheckCircle2 size={14} />
                                                                <span>{isCompleted ? "COMPLETA" : "LOG"}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cardio Finisher Block */}
                        {currentRoutine.cardio.durationMinutes > 0 && (
                            <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-4 sm:p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
                                    <HeartPulse size={22} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/30 uppercase font-semibold">
                                            CARDIO ZONA 2 (FINAL DE SESIÓN)
                                        </span>
                                        <span className="text-xs font-mono text-[#8892B0]">{currentRoutine.cardio.durationMinutes} minutos</span>
                                    </div>
                                    <h4 className="text-base font-bold text-white">{currentRoutine.cardio.type}</h4>
                                    <p className="text-xs text-[#94A3B8] font-mono">{currentRoutine.cardio.protocol}</p>
                                </div>
                            </div>
                        )}

                        {/* Extra Volume Button */}
                        <div className="p-4 bg-[#0A0D12] border border-[#1E2633] rounded-2xl text-center space-y-2">
                            <p className="text-xs font-mono text-[#8892B0]">
                                ¿Terminaste la rutina y tienes energía extra para continuar?
                            </p>
                            <button
                                onClick={() => setSelectedMuscle("delts")}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <Flame size={16} /> ME SIENTO CON ENERGÍA: AGREGAR VOLUMEN EXTRA
                            </button>
                            <p className="text-[10px] font-mono text-[#717C96]">
                                *El motor descontará automáticamente estas series accesorias del resto de la semana.
                            </p>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 2: MAPA ANATÓMICO 3D / 2D
                   ========================================================================= */}
                {activeTab === "anatomy" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-5">
                            <AnatomyVisualizer
                                selectedMuscle={selectedMuscle}
                                activeMusclesToday={activeMusclesToday}
                                onSelectMuscle={m => setSelectedMuscle(m)}
                            />
                        </div>

                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={16} className="text-[#38BDF8]" />
                                    <h3 className="text-base font-bold text-white font-mono uppercase">
                                        RADAR DE EQUILIBRIO ARTICULAR
                                    </h3>
                                </div>
                                <p className="text-xs text-[#94A3B8] font-mono mb-4 leading-relaxed">
                                    El visor detecta la proporción de volumen entre patrones antagonistas para prevenir lesiones de manguito rotador y tendón patelar.
                                </p>

                                <div className="space-y-3 font-mono text-xs">
                                    <div>
                                        <div className="flex justify-between text-[11px] mb-1">
                                            <span className="text-slate-300">Empuje vs Tracción (Horizontal & Vertical)</span>
                                            <span className="text-[#10B981] font-bold">1.05 (Óptimo)</span>
                                        </div>
                                        <div className="w-full bg-[#161C26] h-2 rounded-full overflow-hidden">
                                            <div className="bg-[#10B981] h-full rounded-full" style={{ width: "52%" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[11px] mb-1">
                                            <span className="text-slate-300">Cuádriceps vs Cadena Posterior (Isquios/Glúteo)</span>
                                            <span className="text-[#38BDF8] font-bold">1.18 (Saludable)</span>
                                        </div>
                                        <div className="w-full bg-[#161C26] h-2 rounded-full overflow-hidden">
                                            <div className="bg-[#38BDF8] h-full rounded-full" style={{ width: "55%" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Muscle Selector List */}
                            <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                                <h4 className="text-xs font-mono font-bold text-[#8892B0] mb-3 uppercase tracking-wider">
                                    ACCESO RÁPIDO A GRUPOS MUSCULARES
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                                    {[
                                        { id: "chest", label: "Pectoral" },
                                        { id: "lats", label: "Dorsal Ancho" },
                                        { id: "upper_back", label: "Espalda Alta" },
                                        { id: "delts", label: "Deltoides" },
                                        { id: "quads", label: "Cuádriceps" },
                                        { id: "hamstrings", label: "Isquiotibiales" },
                                        { id: "glutes", label: "Glúteos" },
                                        { id: "biceps", label: "Bíceps" },
                                        { id: "triceps", label: "Tríceps" },
                                        { id: "calves", label: "Pantorrillas" },
                                        { id: "core", label: "Abdomen / Core" }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMuscle(m.id as any)}
                                            className="p-2.5 bg-[#10141D] hover:bg-[#1A2333] border border-[#1E2633] hover:border-[#38BDF8] rounded-xl text-left text-slate-200 transition-all flex items-center justify-between"
                                        >
                                            <span>{m.label}</span>
                                            <ArrowRight size={12} className="text-[#8892B0]" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 3: NUTRICIÓN & GEMINI CLINICAL
                   ========================================================================= */}
                {activeTab === "nutrition" && (
                    <div className="space-y-6">
                        {/* Macro Summary Dashboard */}
                        <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-[#64FFDA] px-2 py-0.5 rounded bg-[#64FFDA]/10 border border-[#64FFDA]/30 uppercase font-semibold">
                                            {macros.formulaUsed}
                                        </span>
                                        <span className="text-xs font-mono text-[#8892B0]">
                                            TMB: {macros.tmb} kcal • TDEE: {macros.tdee} kcal
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white font-mono">
                                        {macros.targetCalories} <span className="text-sm font-normal text-[#8892B0]">kcal/día (-{bio.caloricDeficitPct}%)</span>
                                    </h3>
                                </div>

                                <button
                                    onClick={() => setIsOffPlanModalOpen(true)}
                                    className="px-3 py-1.5 bg-[#1C2433] hover:bg-[#253247] border border-[#334155] text-amber-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all"
                                >
                                    <AlertCircle size={14} />
                                    <span>Comí Fuera del Plan</span>
                                </button>
                            </div>

                            {/* Macro Bars */}
                            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                                <div className="p-3 bg-[#10141D] rounded-xl border border-[#1E2633]">
                                    <span className="text-[10px] text-[#38BDF8] block font-bold">PROTEÍNA (2.2g/kg)</span>
                                    <span className="text-xl font-bold text-white my-1 block">{macros.proteinG}g</span>
                                    <div className="w-full bg-[#161C26] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#38BDF8] h-full rounded-full" style={{ width: "85%" }} />
                                    </div>
                                </div>

                                <div className="p-3 bg-[#10141D] rounded-xl border border-[#1E2633]">
                                    <span className="text-[10px] text-[#F59E0B] block font-bold">CARBOHIDRATOS</span>
                                    <span className="text-xl font-bold text-white my-1 block">{macros.carbsG}g</span>
                                    <div className="w-full bg-[#161C26] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: "70%" }} />
                                    </div>
                                </div>

                                <div className="p-3 bg-[#10141D] rounded-xl border border-[#1E2633]">
                                    <span className="text-[10px] text-[#EC4899] block font-bold">GRASAS SALUDABLES</span>
                                    <span className="text-xl font-bold text-white my-1 block">{macros.fatsG}g</span>
                                    <div className="w-full bg-[#161C26] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#EC4899] h-full rounded-full" style={{ width: "65%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI 30-Day Plan Generator */}
                        <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[#64FFDA]" />
                                    <h4 className="text-base font-bold text-white font-mono uppercase">
                                        PLAN DE DIETA MENSUAL CLÍNICA (30 DÍAS)
                                    </h4>
                                </div>

                                <button
                                    onClick={handleGenerateAiDiet}
                                    disabled={dietLoading}
                                    className="px-3.5 py-1.5 bg-[#FF2A2A] hover:bg-[#E11D48] text-white font-mono text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Sparkles size={14} />
                                    <span>{dietLoading ? "GENERANDO CON GEMINI..." : "GENERAR CON GEMINI AI"}</span>
                                </button>
                            </div>

                            {dietPlan ? (
                                <div className="space-y-4 font-sans text-xs">
                                    <p className="text-[#CBD5E1] bg-[#10141D] p-3 rounded-xl border border-[#1E2633] font-mono">
                                        📋 {dietPlan.monthlySummary}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {dietPlan.weeklyTemplates?.[0]?.meals?.map((m: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-[#10141D] border border-[#1E2633] rounded-xl">
                                                <div className="flex justify-between font-mono font-bold text-white mb-1">
                                                    <span>{m.name}</span>
                                                    <span className="text-[#64FFDA]">{m.calories} kcal ({m.proteinG}g P)</span>
                                                </div>
                                                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{m.items}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 border border-dashed border-[#1E2633] rounded-xl text-xs font-mono text-[#8892B0]">
                                    Presiona "Generar con Gemini AI" para estructurar tus 30 días de alimentación exacta.
                                </div>
                            )}
                        </div>

                        {/* Clinical Supplements Stack */}
                        <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={18} className="text-[#F59E0B]" />
                                <h4 className="text-base font-bold text-white font-mono uppercase">
                                    STACK DE SUPLEMENTACIÓN CLÍNICA (EVIDENCIA GRADO A)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {supplements.map((sup, idx) => (
                                    <div key={idx} className="p-3.5 bg-[#10141D] border border-[#1E2633] rounded-xl flex flex-col justify-between">
                                        <div>
                                            <h5 className="font-bold text-white text-xs mb-1">{sup.name}</h5>
                                            <p className="text-[11px] text-[#64FFDA] font-mono font-semibold mb-1">{sup.dosage}</p>
                                            <p className="text-[10px] text-[#8892B0] font-mono mb-2">⏱ {sup.timing}</p>
                                        </div>
                                        <p className="text-[11px] text-[#94A3B8] leading-relaxed border-t border-[#1C2433] pt-2">
                                            {sup.clinicalReason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consolidated Grocery List */}
                        <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingCart size={18} className="text-[#38BDF8]" />
                                <h4 className="text-base font-bold text-white font-mono uppercase">
                                    LISTA CONSOLIDADA DE SUPERMERCADO SEMANAL (1 VIAJE)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                                {groceryList.map((g, idx) => (
                                    <div key={idx} className="p-2.5 bg-[#10141D] border border-[#1E2633] rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                                            <span className="text-white">{g.item}</span>
                                        </div>
                                        <span className="text-[#64FFDA] font-bold bg-[#161C26] px-2 py-0.5 rounded border border-[#232D3F]">
                                            {g.totalAmount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    TAB 4: CONFIGURACIÓN BIOMÉTRICA & PROTOCOLO
                   ========================================================================= */}
                {activeTab === "biometrics" && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5 sm:p-6 font-mono text-xs">
                            <div className="flex justify-between items-center border-b border-[#1E2633] pb-3 mb-4">
                                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                                    <Sliders size={18} className="text-[#64FFDA]" /> PERFIL BIOMÉTRICO DEL ATLETA
                                </h3>
                                <button
                                    onClick={() => setIsProtocolModalOpen(true)}
                                    className="px-2.5 py-1 bg-[#131924] hover:bg-[#1E2633] border border-[#232D3F] rounded-lg text-slate-300 text-[11px] flex items-center gap-1.5"
                                >
                                    <Info size={13} className="text-[#38BDF8]" />
                                    <span>Protocolo de Medición</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">GÉNERO BIOLÓGICO</label>
                                    <select
                                        value={bio.gender}
                                        onChange={e => setBio({ ...bio, gender: e.target.value as any })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white"
                                    >
                                        <option value="male">Masculino</option>
                                        <option value="female">Femenino</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">EDAD (AÑOS)</label>
                                    <input
                                        type="number"
                                        value={bio.age}
                                        onChange={e => setBio({ ...bio, age: Number(e.target.value) })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">PESO CORPORAL (KG)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bio.weightKg}
                                        onChange={e => setBio({ ...bio, weightKg: Number(e.target.value) })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">ESTATURA (CM)</label>
                                    <input
                                        type="number"
                                        value={bio.heightCm}
                                        onChange={e => setBio({ ...bio, heightCm: Number(e.target.value) })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">% GRASA CORPORAL (OPCIONAL)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej. 14.5"
                                        value={bio.bodyFatPct || ""}
                                        onChange={e => setBio({ ...bio, bodyFatPct: Number(e.target.value) || undefined })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white placeholder-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="text-[#8892B0] text-[11px] block mb-1">DÍAS DE ENTRENAMIENTO / SEMANA</label>
                                    <select
                                        value={bio.trainingDaysPerWeek}
                                        onChange={e => setBio({ ...bio, trainingDaysPerWeek: Number(e.target.value) })}
                                        className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-2.5 text-white"
                                    >
                                        {[2, 3, 4, 5, 6, 7].map(d => (
                                            <option key={d} value={d}>{d} Días / Semana (Full-Body)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-[#8892B0] text-[11px] block mb-1">DÉFICIT CALÓRICO OBJETIVO (%)</label>
                                    <div className="flex gap-2">
                                        {[10, 15, 20, 25].map(pct => (
                                            <button
                                                key={pct}
                                                onClick={() => setBio({ ...bio, caloricDeficitPct: pct })}
                                                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${bio.caloricDeficitPct === pct
                                                    ? "bg-white text-black border-white"
                                                    : "bg-[#10141D] text-[#8892B0] border-[#1E2633]"
                                                    }`}
                                            >
                                                -{pct}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Tesla-Style Rest Timer & Spotify Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0D12]/95 backdrop-blur-xl border-t border-[#1E2633] px-4 py-2.5 font-mono">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-xs">
                    {/* Spotify Telemetry Phase */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shrink-0">
                            <Music size={16} />
                        </div>
                        <div>
                            <span className="text-[10px] text-[#8892B0] block">CADENCIA BIOMECÁNICA</span>
                            <span className="text-white font-bold text-[11px] sm:text-xs">
                                {restRemaining !== null
                                    ? "[PAUSA ACTIVA • 110 BPM]"
                                    : "[SERIES EFECTIVAS • 138-145 BPM]"}
                            </span>
                        </div>
                    </div>

                    {/* Rest Countdown Timer */}
                    {restRemaining !== null ? (
                        <div className="flex items-center gap-3 bg-[#10141D] border border-[#10B981]/40 px-3.5 py-1.5 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                            <div>
                                <span className="text-[9px] text-[#8892B0] block uppercase">DESCANSO ACTIVO</span>
                                <span className="text-base font-extrabold text-[#10B981]">
                                    {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                            <button
                                onClick={() => setRestRemaining(null)}
                                className="text-[10px] text-[#8892B0] hover:text-white ml-2 underline"
                            >
                                Saltar
                            </button>
                        </div>
                    ) : (
                        <div className="text-[11px] text-[#717C96] hidden sm:block">
                            Marca una serie como LOG para iniciar el temporizador de descanso
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Drawers */}
            <MuscleTargetDrawer
                selectedMuscle={selectedMuscle}
                onClose={() => setSelectedMuscle(null)}
                onInjectExercise={handleInjectExercise}
                onToggleSpecialization={m => setSpecializedMuscle(prev => prev === m ? null : m)}
                specializedMuscle={specializedMuscle}
            />

            {isPlateModalOpen && (
                <PlateCalculatorModal
                    initialWeightKg={plateModalWeight}
                    onClose={() => setIsPlateModalOpen(false)}
                />
            )}

            {isInstallModalOpen && (
                <PwaInstallModal onClose={() => setIsInstallModalOpen(false)} />
            )}

            {/* Protocol Modal */}
            {isProtocolModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsProtocolModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-6 shadow-2xl z-10 font-sans text-white">
                        <div className="flex justify-between items-center border-b border-[#1E2633] pb-3 mb-4">
                            <h3 className="font-bold text-sm font-mono tracking-tight text-[#64FFDA]">
                                {MEASUREMENT_PROTOCOL.title}
                            </h3>
                            <button onClick={() => setIsProtocolModalOpen(false)} className="text-[#8892B0]">✕</button>
                        </div>
                        <div className="space-y-3 font-mono text-xs text-[#CBD5E1]">
                            {MEASUREMENT_PROTOCOL.criteria.map((c, i) => (
                                <div key={i} className="p-3 bg-[#10141D] rounded-xl border border-[#1E2633]">
                                    <h4 className="font-bold text-white mb-1">✔ {c.rule}</h4>
                                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">{c.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Off-Plan Modal */}
            {isOffPlanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsOffPlanModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-6 shadow-2xl z-10 font-sans text-white">
                        <div className="flex justify-between items-center border-b border-[#1E2633] pb-3 mb-3">
                            <h3 className="font-bold text-sm font-mono text-amber-400">
                                RECÁLCULO DINÁMICO: "COMÍ FUERA DEL PLAN"
                            </h3>
                            <button onClick={() => setIsOffPlanModalOpen(false)} className="text-[#8892B0]">✕</button>
                        </div>

                        <p className="text-xs text-[#94A3B8] font-mono mb-3">
                            Describe lo que comiste (ej. "2 rebanadas de pizza y un refresco"). Gemini reajustará tu cena y los próximos 2 días para proteger tu déficit.
                        </p>

                        <textarea
                            value={offPlanText}
                            onChange={e => setOffPlanText(e.target.value)}
                            placeholder="Ej. Hamburguesa doble con papas a la francesa..."
                            className="w-full bg-[#10141D] border border-[#1E2633] rounded-xl p-3 text-xs font-mono text-white mb-3 h-20 outline-none focus:border-amber-400"
                        />

                        <button
                            onClick={handleRecalculateMeal}
                            disabled={offPlanLoading || !offPlanText.trim()}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                        >
                            {offPlanLoading ? "RECALCULANDO CON GEMINI..." : "RECALCULAR CENA Y DÉFICIT"}
                        </button>

                        {offPlanResult && (
                            <div className="mt-4 p-3 bg-[#10141D] border border-amber-500/30 rounded-xl space-y-2 text-xs font-mono">
                                <p className="text-amber-300 font-bold">{offPlanResult.explanation}</p>
                                <div className="p-2 bg-[#161C26] rounded-lg">
                                    <span className="text-slate-400 block text-[10px]">CENA REAJUSTADA HOY:</span>
                                    <span className="text-white">{offPlanResult.adjustedDinner}</span>
                                </div>
                                <div className="p-2 bg-[#161C26] rounded-lg">
                                    <span className="text-slate-400 block text-[10px]">COMPENSACIÓN SUAVE:</span>
                                    <span className="text-emerald-400">{offPlanResult.nextDaysAdvice}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
