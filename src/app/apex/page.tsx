"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
    ShoppingCart,
    Mic,
    Gauge,
    ExternalLink
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

import {
    MuscleGroup,
    ExerciseItem,
    EXERCISE_DATABASE,
    generateWeeklyProgram,
    calculateTodayTarget,
    RoutineDay,
    ReadinessState,
    findBiomechanicalSwaps,
    formatPlatesSummary
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
import { ExerciseMotionViewer } from "@/components/apex/ExerciseMotionViewer";
import { MuscleTargetDrawer } from "@/components/apex/MuscleTargetDrawer";
import { PlateCalculatorModal } from "@/components/apex/PlateCalculatorModal";
import { PwaInstallModal } from "@/components/apex/PwaInstallModal";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { DownloadPDFButton } from "@/components/pdf/DownloadPDFButton";
import { AppHeaderMenu } from "@/components/ui/AppHeaderMenu";
import { ShoppingList } from "@/components/nutrition/ShoppingList";
import { ApexFooter } from "@/components/apex/ApexFooter";
import { MirrorMuscleOverlay } from "@/components/vision/MirrorMuscleOverlay";
import { logSetOfflineFirst } from "@/lib/local-db";
import { playTempoPulse, startTempoLoop, stopTempoLoop } from "@/lib/tempo-sonar";
import { useVoiceLogger } from "@/hooks/useVoiceLogger";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { OnboardingFlow, UserApexProfile } from "@/app/onboarding/OnboardingFlow";

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

    // Hot-Swap: VBT Velocity Modal State
    const [isVbtModalOpen, setIsVbtModalOpen] = useState(false);
    const [vbtExerciseName, setVbtExerciseName] = useState("Press de Banca");

    // Hot-Swap: Tempo Sonar state per exercise (default OFF)
    const [tempoActive, setTempoActive] = useState<Record<string, boolean>>({});

    // Inline Plate breakdown state
    const [inlinePlatesExId, setInlinePlatesExId] = useState<string | null>(null);

    // Tactile editable inputs per set: { [exId_setIdx]: { weight: number, reps: number } }
    const [setInputs, setSetInputs] = useState<Record<string, { weight: number; reps: number }>>({});

    // Hot-Swap: Voice Logger active target
    const [voiceActiveSet, setVoiceActiveSet] = useState<{ exerciseId: string; setIdx: number } | null>(null);

    // Profile state from localStorage
    const [profile, setProfile] = useLocalStorage<UserApexProfile | null>("apex_user_profile", null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Biometrics State adapted from calibrated profile
    const bio: BiometricProfile = useMemo(() => {
        const goal = profile?.fitnessGoal || "deficit";
        const adj = typeof profile?.caloricAdjustmentPct === "number"
            ? profile.caloricAdjustmentPct
            : (profile?.caloricDeficitPct ? -Math.abs(profile.caloricDeficitPct) : -15);
        return {
            gender: profile?.gender || "male",
            age: profile?.age || 38,
            weightKg: profile?.weightKg || 80,
            heightCm: profile?.heightCm || 178,
            bodyFatPct: profile?.bodyFatPct || 14.5,
            skeletalMusclePct: 42.0,
            trainingDaysPerWeek: profile?.trainingDaysPerWeek || 6,
            fitnessGoal: goal,
            caloricAdjustmentPct: adj,
            caloricDeficitPct: adj < 0 ? Math.abs(adj) : 0
        };
    }, [profile]);

    const setBio = (updated: BiometricProfile) => {
        if (!profile) return;
        setProfile({
            ...profile,
            gender: updated.gender,
            age: updated.age,
            weightKg: updated.weightKg,
            heightCm: updated.heightCm,
            bodyFatPct: updated.bodyFatPct,
            trainingDaysPerWeek: updated.trainingDaysPerWeek,
            fitnessGoal: updated.fitnessGoal || profile.fitnessGoal || "deficit",
            caloricAdjustmentPct: updated.caloricAdjustmentPct !== undefined ? updated.caloricAdjustmentPct : profile.caloricAdjustmentPct,
            caloricDeficitPct: updated.caloricDeficitPct !== undefined ? updated.caloricDeficitPct : profile.caloricDeficitPct
        });
    };

    // Calculated Metabolism
    const macros = useMemo(() => calculateMetabolism(bio), [bio]);
    const supplements = useMemo(() => calculateSupplementStack(bio.weightKg), [bio.weightKg]);
    const groceryList = useMemo(() => generateWeeklyGroceryList(bio.weightKg), [bio.weightKg]);

    // Weekly Routine & Current Day
    const weeklyProgram = useMemo(() => {
        return generateWeeklyProgram(
            profile?.trainingDaysPerWeek || 6,
            profile?.sessionDurationMins || 60,
            (profile?.preferredCardio && profile.preferredCardio !== "none")
                ? profile.preferredCardio
                : "incline_treadmill"
        );
    }, [profile?.trainingDaysPerWeek, profile?.sessionDurationMins, profile?.preferredCardio]);

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

    // Cleanup active tempo sonar loops on unmount
    useEffect(() => {
        return () => {
            stopTempoLoop();
        };
    }, []);

    // Desactivar / ocultar el botón flotante del asistente en toda la sección de APEX
    useEffect(() => {
        const hideWidget = () => {
            const el = document.getElementById("loya-ai-widget");
            if (el) el.style.setProperty("display", "none", "important");
        };
        hideWidget();
        const timer = setInterval(hideWidget, 500);
        return () => {
            clearInterval(timer);
            const el = document.getElementById("loya-ai-widget");
            if (el) el.style.display = "flex";
        };
    }, []);

    // Nike Editorial PDF Blueprint Data
    const pdfProfile = useMemo(() => ({
        weightKg: bio.weightKg,
        caloricDeficitPct: bio.caloricDeficitPct,
        calculatedTdee: macros.tdee,
        targetCalories: macros.targetCalories,
        targetProteinG: macros.proteinG
    }), [bio, macros]);

    const pdfDiet = useMemo(() => ({
        dailySupplements: supplements
    }), [supplements]);

    // Set Completion with Dexie.js Offline-First logging
    const handleCompleteSet = (exerciseId: string, setIdx: number, restSeconds: number, customWeight?: number, customReps?: number) => {
        const key = `${exerciseId}_${setIdx}`;
        const newState = !completedSets[key];

        setCompletedSets(prev => ({ ...prev, [key]: newState }));

        const exMemory = exerciseMemory[exerciseId] || { weight: 60, reps: 10 };
        const inputVal = setInputs[key];
        const weightToLog = customWeight !== undefined ? customWeight : (inputVal?.weight !== undefined ? inputVal.weight : exMemory.weight);
        const repsToLog = customReps !== undefined ? customReps : (inputVal?.reps !== undefined ? inputVal.reps : exMemory.reps);

        if (newState) {
            setRestTotal(restSeconds);
            setRestRemaining(restSeconds);

            // Update memory with real executed values
            setExerciseMemory(prev => ({
                ...prev,
                [exerciseId]: { weight: weightToLog, reps: repsToLog }
            }));

            // A. Motor Offline-First Dexie (< 2ms)
            logSetOfflineFirst({
                exercise_id: exerciseId,
                workout_date: new Date().toISOString().split("T")[0],
                set_number: setIdx + 1,
                weight_kg: weightToLog,
                reps_completed: repsToLog,
                rir_perceived: readiness === "optimal" ? 1 : readiness === "normal" ? 1 : 2
            }).catch(() => {});
        }
    };

    // Voice Logger Hook
    const { isListening: isVoiceListening, startListening: startVoiceLogging } = useVoiceLogger((result) => {
        if (voiceActiveSet) {
            const key = `${voiceActiveSet.exerciseId}_${voiceActiveSet.setIdx}`;
            setSetInputs(prev => ({
                ...prev,
                [key]: { weight: result.weightKg, reps: result.reps }
            }));
            handleCompleteSet(voiceActiveSet.exerciseId, voiceActiveSet.setIdx, 90, result.weightKg, result.reps);
            setVoiceActiveSet(null);
        }
    });

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

    // Si no hay perfil configurado, mostramos obligatoriamente el formulario y ocultamos todo lo demás
    if (!profile || !profile.isConfigured) {
        return (
            <OnboardingFlow
                onComplete={(savedProfile) => {
                    if (savedProfile) {
                        setProfile(savedProfile);
                    }
                    setRefreshKey(prev => prev + 1);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-[#EAEAEA] font-sans antialiased selection:bg-[#FF2A2A]/30 selection:text-white pb-24">
            {/* Top Navigation & Telemetry Header */}
            <header className="sticky top-0 z-40 bg-[#000000]/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    {/* Brand & Greeting with APEX Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/[0.12] bg-[#111111] shrink-0 shadow-md shadow-red-950/20">
                            <Image
                                src="/apex-logo.png"
                                alt="APEX"
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase leading-none">
                                Hola {profile.firstName}
                            </h1>
                        </div>
                    </div>

                    {/* Right Controls & Hamburger Menu */}
                    <div className="flex items-center gap-2">
                        {/* Screen Lock Badge */}
                        <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScreenLocked ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
                            <span className="text-zinc-300 font-medium">{isScreenLocked ? "PANTALLA ACTIVA" : "WAKE LOCK"}</span>
                        </div>

                        {/* Menú de Tres Rayitas tipo Apple / Tesla (incluye PDF, Entorno y Configuración) */}
                        <AppHeaderMenu
                            environmentMode={environmentMode}
                            onEnvironmentChange={(mode) => setEnvironmentMode(mode as any)}
                            onInstallClick={() => setIsInstallModalOpen(true)}
                            showInstallButton={true}
                            pdfProfile={pdfProfile}
                            pdfRoutine={activeExercises}
                            pdfDiet={pdfDiet}
                            onResetProfile={() => {
                                localStorage.removeItem('apex_user_profile');
                                window.location.reload();
                            }}
                        />
                    </div>
                </div>

                {/* Sub-bar: Readiness Check (Entorno ahora vive dentro del menú de 3 rayitas) */}
                <div className="max-w-6xl mx-auto mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs flex-wrap gap-2">
                    {/* Readiness Switch */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 text-xs font-medium">DISPOSICIÓN HOY:</span>
                        {(["optimal", "normal", "fatigued"] as ReadinessState[]).map(state => (
                            <button
                                key={state}
                                onClick={() => setReadiness(state)}
                                className={`px-3 py-1 rounded-full text-xs transition-all font-medium border ${readiness === state
                                    ? "bg-white text-black border-white shadow-sm font-semibold"
                                    : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                    }`}
                            >
                                {state === "optimal" ? "Óptimo (RIR 1)" : state === "normal" ? "Normal" : "Fatigado (-5%)"}
                            </button>
                        ))}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                        ENTORNO: <span className="text-white font-semibold capitalize">{environmentMode.replace("_", " ")}</span>
                    </div>
                </div>
            </header>

            {/* Main Tabs Navigation Bar */}
            <div className="max-w-6xl mx-auto px-4 mt-5">
                <div className="grid grid-cols-4 bg-[#121214]/90 border border-white/[0.08] rounded-2xl p-1 text-xs font-medium backdrop-blur-xl">
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
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${isActive
                                    ? "bg-white text-black font-semibold shadow-lg"
                                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
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
                {/* Motivational Psychology Banner personalized by First Name */}
                <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl">
                    <span className="text-[10px] font-mono text-[#FF2A2A] uppercase tracking-wider block">
                        ESTADO MENTAL & PSICOLOGÍA DEPORTIVA
                    </span>
                    <p className="text-sm text-zinc-300 mt-2 leading-relaxed font-normal">
                        &ldquo;{profile.firstName}, tu sistema está calibrado para {profile.trainingDaysPerWeek} días semanales con un déficit enfocado en recomposición. La consistencia en las cargas de hoy dictará el músculo de mañana. Mantén el foco en el RIR 1.&rdquo;
                    </p>
                </div>
                {/* =========================================================================
                    TAB 1: WORKOUT EN VIVO
                   ========================================================================= */}
                {activeTab === "workout" && (
                    <div className="space-y-6">
                        {/* Day Selector Bar */}
                        <div className="flex items-center justify-between bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 flex-wrap gap-3 shadow-xl">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] uppercase tracking-wide">
                                        FRECUENCIA FULL-BODY
                                    </span>
                                    <span className="text-xs text-zinc-400 font-medium">
                                        Tiempo objetivo: <span className="font-mono text-white">{currentRoutine.estimatedMinutes}</span> min
                                    </span>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    {currentRoutine.title}
                                </h2>
                                <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                                    {currentRoutine.focus}
                                </p>
                            </div>

                            {/* Day pagination pills */}
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                                {weeklyProgram.map((d, idx) => (
                                    <button
                                        key={d.dayNumber}
                                        onClick={() => setCurrentDayIndex(idx)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-all ${currentDayIndex === idx
                                            ? "bg-white text-black shadow-md font-bold"
                                            : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white"
                                            }`}
                                    >
                                        D{d.dayNumber}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercises List (Apple Fitness+ 2-Column Layout) */}
                        <div className="space-y-5">
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
                                        className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl transition-all hover:border-white/[0.15]"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* Column 1 (Left): Visor Biomecánico con conexión oficial a free-exercise-db */}
                                            <div className="lg:col-span-5 xl:col-span-4">
                                                <ExerciseMotionViewer
                                                    githubId={ex.github_id || "Barbell_Bench_Press_-_Medium_Grip"}
                                                    exerciseName={ex.name}
                                                    activationPct={ex.activation_pct || 94}
                                                />
                                            </div>

                                            {/* Column 2 (Right): Telemetría, Controles y Series */}
                                            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                                                {/* Exercise Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            <span className="text-[11px] font-medium bg-white/[0.06] text-zinc-300 px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                                                                {ex.anatomical_subdivision}
                                                            </span>
                                                            <span className="text-[11px] font-semibold bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/20 px-2.5 py-0.5 rounded-full">
                                                                Tier {ex.hypertrophy_tier}
                                                            </span>
                                                            <span className="text-xs text-zinc-400 capitalize">
                                                                • {ex.equipment}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center">
                                                            {ex.name}
                                                            <Tooltip text="Seleccionado por su perfil de resistencia óptimo para generar tensión mecánica en fase de estiramiento." />
                                                        </h3>
                                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-normal">
                                                            Instrucción biomecánica: {ex.biomechanical_cue}
                                                        </p>
                                                    </div>

                                                    {/* Top Actions: Monochromatic Apple pills */}
                                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                                        {/* YouTube Direct Search Button */}
                                                        <a
                                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " form technique hypertrophy")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
                                                            title="Ver técnica en YouTube"
                                                        >
                                                            <Play className="w-3 h-3 fill-white text-white" />
                                                            <span>YouTube</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                                        </a>

                                                        {/* Tempo Sonar Pill */}
                                                        <button
                                                            onClick={() => {
                                                                const nextState = !tempoActive[ex.id];
                                                                setTempoActive(prev => ({ ...prev, [ex.id]: nextState }));
                                                                if (nextState) {
                                                                    startTempoLoop(ex.id);
                                                                } else {
                                                                    stopTempoLoop(ex.id);
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border ${
                                                                tempoActive[ex.id]
                                                                    ? "bg-[#FF2A2A] text-white border-[#FF2A2A]"
                                                                    : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/[0.08]"
                                                            }`}
                                                            title="Sonar Acústico de Tempo (3-1-1)"
                                                        >
                                                            TEMPO 3-1-1: {tempoActive[ex.id] ? "ON" : "OFF"}
                                                        </button>

                                                        {/* VBT Mode */}
                                                        <button
                                                            onClick={() => {
                                                                setVbtExerciseName(ex.name);
                                                                setIsVbtModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08] transition-all"
                                                            title="Modo Velocidad VBT y Espejo IA"
                                                        >
                                                            <Gauge size={13} className="text-zinc-300" />
                                                            <span>VBT</span>
                                                        </button>

                                                        {/* Discos Inline Toggle */}
                                                        <button
                                                            onClick={() => setInlinePlatesExId(prev => prev === ex.id ? null : ex.id)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                                inlinePlatesExId === ex.id
                                                                    ? "bg-white text-black border-white font-semibold"
                                                                    : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/[0.08]"
                                                            }`}
                                                            title="Desglose de Discos"
                                                        >
                                                            <Disc size={13} className={inlinePlatesExId === ex.id ? "text-black" : "text-zinc-300"} />
                                                            <span>Discos</span>
                                                        </button>

                                                        {/* Swap */}
                                                        <button
                                                            onClick={() => handleSwapExercise(exIdx)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08] transition-all"
                                                            title="Buscar Alternativa Biomecánica"
                                                        >
                                                            <RotateCcw size={13} className="text-zinc-300" />
                                                            <span>Swap</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Inline Plate Calculation Pill */}
                                                {inlinePlatesExId === ex.id && (
                                                    <div className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-between text-xs text-zinc-300 animate-in fade-in">
                                                        <div>
                                                            <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wide block">Desglose exacto de carga por lado (Barra olímpica 20 kg)</span>
                                                            <span className="font-mono text-white text-sm font-semibold">{formatPlatesSummary(target.suggestedWeight)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setPlateModalWeight(target.suggestedWeight);
                                                                setIsPlateModalOpen(true);
                                                            }}
                                                            className="text-[11px] text-zinc-400 hover:text-white underline font-medium ml-3"
                                                        >
                                                            Ver cálculo completo →
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Target Telemetry */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide block">ÚLTIMO REGISTRO</span>
                                                        <span className="text-white font-mono font-semibold">{memory.weight} kg × {memory.reps} reps</span>
                                                    </div>
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-400 font-medium tracking-wide block">META HOY (OVERLOAD)</span>
                                                        <span className="text-white font-mono font-semibold">{target.suggestedWeight} kg × {target.suggestedReps} reps</span>
                                                    </div>
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide block">1RM ESTIMADO</span>
                                                        <span className="text-white font-mono font-semibold">{target.estimated1RM} kg</span>
                                                    </div>
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide block">PROXIMIDAD AL FALLO</span>
                                                        <span className="text-white font-mono font-semibold">RIR {target.targetRir} (1-2 reserva)</span>
                                                    </div>
                                                </div>

                                                {/* Interactive Sets Tracker with Tactile Number Inputs */}
                                                <div className="space-y-2 pt-1">
                                                    {Array.from({ length: ex.default_sets }).map((_, setIdx) => {
                                                        const key = `${ex.id}_${setIdx}`;
                                                        const isCompleted = Boolean(completedSets[key]);
                                                        const isVoiceActive = voiceActiveSet?.exerciseId === ex.id && voiceActiveSet?.setIdx === setIdx;
                                                        const currentInput = setInputs[key] || { weight: target.suggestedWeight, reps: target.suggestedReps };

                                                        return (
                                                            <div
                                                                key={setIdx}
                                                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                                                    isCompleted
                                                                        ? "bg-[#10B981]/10 border-[#10B981]/30 text-white"
                                                                        : isVoiceActive && isVoiceListening
                                                                            ? "bg-[#FF2A2A]/10 border-[#FF2A2A]/50 text-white ring-1 ring-[#FF2A2A]"
                                                                            : "bg-white/[0.03] border-white/[0.06] text-zinc-200"
                                                                }`}
                                                            >
                                                                {/* Set Badge & Tactile Input Controls */}
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center font-bold text-white text-xs font-mono">
                                                                        S{setIdx + 1}
                                                                    </span>

                                                                    <div className="flex items-center gap-2">
                                                                        {/* Tactile Weight Input */}
                                                                        <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2.5 py-1">
                                                                            <input
                                                                                type="number"
                                                                                step="0.5"
                                                                                placeholder="Peso"
                                                                                value={currentInput.weight || ""}
                                                                                onChange={e => {
                                                                                    const val = parseFloat(e.target.value) || 0;
                                                                                    setSetInputs(prev => ({
                                                                                        ...prev,
                                                                                        [key]: { ...currentInput, weight: val }
                                                                                    }));
                                                                                }}
                                                                                className="w-16 bg-transparent text-white font-mono font-semibold text-sm sm:text-base text-center outline-none placeholder:text-zinc-600"
                                                                            />
                                                                            <span className="text-[11px] text-zinc-400 font-mono">kg</span>
                                                                        </div>

                                                                        <span className="text-zinc-500 font-mono text-xs">×</span>

                                                                        {/* Tactile Reps Input */}
                                                                        <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2.5 py-1">
                                                                            <input
                                                                                type="number"
                                                                                step="1"
                                                                                placeholder="Reps"
                                                                                value={currentInput.reps || ""}
                                                                                onChange={e => {
                                                                                    const val = parseInt(e.target.value, 10) || 0;
                                                                                    setSetInputs(prev => ({
                                                                                        ...prev,
                                                                                        [key]: { ...currentInput, reps: val }
                                                                                    }));
                                                                                }}
                                                                                className="w-12 bg-transparent text-white font-mono font-semibold text-sm sm:text-base text-center outline-none placeholder:text-zinc-600"
                                                                            />
                                                                            <span className="text-[11px] text-zinc-400 font-mono">reps</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions: Dictate & Complete */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                                                                        Descanso {ex.rest_seconds}s
                                                                    </span>

                                                                    {/* Voice Dictation Button */}
                                                                    <button
                                                                        onClick={() => {
                                                                            setVoiceActiveSet({ exerciseId: ex.id, setIdx });
                                                                            startVoiceLogging();
                                                                        }}
                                                                        className={`p-2 rounded-xl border transition-all ${
                                                                            isVoiceActive && isVoiceListening
                                                                                ? "bg-[#FF2A2A] text-white animate-pulse border-[#FF2A2A]"
                                                                                : "bg-white/[0.06] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.12]"
                                                                        }`}
                                                                        title="Dictar serie por voz (ej. '80 por 10')"
                                                                    >
                                                                        <Mic size={14} className={isVoiceActive && isVoiceListening ? "animate-bounce" : ""} />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleCompleteSet(ex.id, setIdx, ex.rest_seconds)}
                                                                        className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                                                                            isCompleted
                                                                                ? "bg-[#10B981] text-black shadow-md shadow-[#10B981]/20"
                                                                                : "bg-white hover:bg-zinc-200 text-black active:scale-95 shadow-md shadow-white/10"
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cardio Finisher Block */}
                        {currentRoutine.cardio.durationMinutes > 0 && (
                            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                                    <HeartPulse size={20} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase tracking-wide">
                                            CARDIO ZONA 2 (FINAL DE SESIÓN)
                                        </span>
                                        <span className="text-xs text-zinc-400 font-medium">
                                            <span className="font-mono text-white">{currentRoutine.cardio.durationMinutes}</span> minutos
                                        </span>
                                    </div>
                                    <h4 className="text-base font-bold text-white tracking-tight">{currentRoutine.cardio.type}</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">{currentRoutine.cardio.protocol}</p>
                                </div>
                            </div>
                        )}

                        {/* Extra Volume Button */}
                        <div className="p-6 bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl text-center space-y-2.5 shadow-xl">
                            <p className="text-xs text-zinc-400 font-normal">
                                ¿Terminaste la rutina y tienes energía extra para continuar?
                            </p>
                            <button
                                onClick={() => setSelectedMuscle("delts")}
                                className="px-6 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-full shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <Flame size={15} />
                                <span>AGREGAR VOLUMEN EXTRA A LA SESIÓN</span>
                            </button>
                            <p className="text-[11px] text-zinc-500 font-normal">
                                El motor descontará automáticamente estas series accesorias del resto de la semana.
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
                            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={16} className="text-white" />
                                    <h3 className="text-sm font-semibold text-white tracking-tight">
                                        RADAR DE EQUILIBRIO ARTICULAR
                                    </h3>
                                </div>
                                <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-normal">
                                    El visor evalúa la proporción de volumen entre patrones de movimiento antagonistas para proteger el manguito rotador y los tendones patelares.
                                </p>

                                <div className="space-y-4 text-xs">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-zinc-300">Empuje vs Tracción (Horizontal & Vertical)</span>
                                            <span className="text-[#10B981] font-mono font-semibold">1.05 (Óptimo)</span>
                                        </div>
                                        <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                                            <div className="bg-[#10B981] h-full rounded-full" style={{ width: "52%" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-zinc-300">Cuádriceps vs Cadena Posterior (Isquios/Glúteo)</span>
                                            <span className="text-white font-mono font-semibold">1.18 (Saludable)</span>
                                        </div>
                                        <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                                            <div className="bg-white h-full rounded-full" style={{ width: "55%" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Muscle Selector List */}
                            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-xl">
                                <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                    ACCESO RÁPIDO A GRUPOS MUSCULARES
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
                                            className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 rounded-2xl text-left text-zinc-300 hover:text-white transition-all flex items-center justify-between"
                                        >
                                            <span className="font-medium">{m.label}</span>
                                            <ArrowRight size={12} className="text-zinc-500" />
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
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className="text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] uppercase tracking-wide">
                                            {macros.formulaUsed}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            TMB: <span className="font-mono text-white">{macros.tmb}</span> kcal • TDEE: <span className="font-mono text-white">{macros.tdee}</span> kcal
                                        </span>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                        <span className="font-mono">{macros.targetCalories}</span>{" "}
                                        <span className="text-sm font-normal text-zinc-400">
                                            kcal/día (
                                            {bio.caloricAdjustmentPct === 0
                                                ? "Mantenimiento 0%"
                                                : (bio.caloricAdjustmentPct && bio.caloricAdjustmentPct > 0)
                                                ? `+${bio.caloricAdjustmentPct}% Superávit`
                                                : `${bio.caloricAdjustmentPct || -15}% Déficit`}
                                            )
                                        </span>
                                    </h3>
                                </div>

                                <button
                                    onClick={() => setIsOffPlanModalOpen(true)}
                                    className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all self-start sm:self-auto"
                                >
                                    <AlertCircle size={14} className="text-zinc-300" />
                                    <span>Comí Fuera del Plan</span>
                                </button>
                            </div>

                            {/* Macro Bars */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                    <span className="text-[11px] text-zinc-400 block font-medium uppercase tracking-wider">PROTEÍNA (2.2g/kg)</span>
                                    <span className="text-2xl font-bold font-mono text-white my-1 block">{macros.proteinG}g</span>
                                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="bg-white h-full rounded-full" style={{ width: "85%" }} />
                                    </div>
                                </div>

                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                    <span className="text-[11px] text-zinc-400 block font-medium uppercase tracking-wider">CARBOHIDRATOS</span>
                                    <span className="text-2xl font-bold font-mono text-white my-1 block">{macros.carbsG}g</span>
                                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="bg-zinc-400 h-full rounded-full" style={{ width: "70%" }} />
                                    </div>
                                </div>

                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                    <span className="text-[11px] text-zinc-400 block font-medium uppercase tracking-wider">GRASAS SALUDABLES</span>
                                    <span className="text-2xl font-bold font-mono text-white my-1 block">{macros.fatsG}g</span>
                                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="bg-zinc-500 h-full rounded-full" style={{ width: "65%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI 30-Day Plan Generator */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-white" />
                                    <h4 className="text-base font-bold text-white tracking-tight">
                                        PLAN DE DIETA MENSUAL CLÍNICA (30 DÍAS)
                                    </h4>
                                </div>

                                <button
                                    onClick={handleGenerateAiDiet}
                                    disabled={dietLoading}
                                    className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-full shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                    <Sparkles size={14} />
                                    <span>{dietLoading ? "GENERANDO CON GEMINI..." : "GENERAR CON GEMINI AI"}</span>
                                </button>
                            </div>

                            {dietPlan ? (
                                <div className="space-y-4 text-xs">
                                    <p className="text-zinc-300 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] leading-relaxed">
                                        {dietPlan.monthlySummary}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {dietPlan.weeklyTemplates?.[0]?.meals?.map((m: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                                                <div className="flex justify-between font-semibold text-white mb-1.5">
                                                    <span>{m.name}</span>
                                                    <span className="text-zinc-400 font-mono text-xs">{m.calories} kcal ({m.proteinG}g P)</span>
                                                </div>
                                                <p className="text-zinc-400 text-xs leading-relaxed">{m.items}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-white/[0.08] rounded-2xl text-xs text-zinc-500 font-normal">
                                    Presiona "Generar con Gemini AI" para estructurar tus 30 días de alimentación exacta calculada a tu déficit.
                                </div>
                            )}
                        </div>

                        {/* Clinical Supplements Stack */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield size={18} className="text-white" />
                                <h4 className="text-base font-bold text-white tracking-tight">
                                    STACK DE SUPLEMENTACIÓN CLÍNICA (EVIDENCIA GRADO A)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {supplements.map((sup, idx) => (
                                    <div key={idx} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col justify-between">
                                        <div>
                                            <h5 className="font-bold text-white text-xs mb-1 tracking-tight">{sup.name}</h5>
                                            <p className="text-xs text-zinc-300 font-mono font-semibold mb-1">{sup.dosage}</p>
                                            <p className="text-[11px] text-zinc-500 mb-2 font-medium">Momento: {sup.timing}</p>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/[0.06] pt-2 mt-1">
                                            {sup.clinicalReason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consolidated Grocery List */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingCart size={18} className="text-white" />
                                <h4 className="text-base font-bold text-white tracking-tight">
                                    LISTA CONSOLIDADA DE SUPERMERCADO SEMANAL (1 VIAJE)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {groceryList.map((g, idx) => (
                                    <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                            <span className="text-zinc-200 font-medium">{g.item}</span>
                                        </div>
                                        <span className="font-mono text-white text-xs font-semibold bg-white/[0.06] px-2.5 py-1 rounded-full border border-white/[0.08]">
                                            {g.totalAmount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consolidated 30-Day Checklist */}
                        <ShoppingList />
                    </div>
                )}

                {/* =========================================================================
                    TAB 4: CONFIGURACIÓN BIOMÉTRICA & PROTOCOLO
                   ========================================================================= */}
                {activeTab === "biometrics" && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl text-xs">
                            <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-5">
                                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                                    <Sliders size={18} className="text-white" /> PERFIL BIOMÉTRICO DEL ATLETA
                                </h3>
                                <button
                                    onClick={() => setIsProtocolModalOpen(true)}
                                    className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-full text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                                >
                                    <Info size={13} className="text-zinc-300" />
                                    <span>Protocolo de Medición</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">GÉNERO BIOLÓGICO</label>
                                    <select
                                        value={bio.gender}
                                        onChange={e => setBio({ ...bio, gender: e.target.value as any })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white outline-none focus:border-white/30 text-xs"
                                    >
                                        <option value="male" className="bg-zinc-900 text-white">Masculino</option>
                                        <option value="female" className="bg-zinc-900 text-white">Femenino</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">EDAD (AÑOS)</label>
                                    <input
                                        type="number"
                                        placeholder="Edad"
                                        value={bio.age}
                                        onChange={e => setBio({ ...bio, age: Number(e.target.value) })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white font-mono placeholder:text-zinc-600 outline-none focus:border-white/30 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">PESO CORPORAL (KG)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Peso corporal"
                                        value={bio.weightKg}
                                        onChange={e => setBio({ ...bio, weightKg: Number(e.target.value) })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white font-mono placeholder:text-zinc-600 outline-none focus:border-white/30 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">ESTATURA (CM)</label>
                                    <input
                                        type="number"
                                        placeholder="Estatura"
                                        value={bio.heightCm}
                                        onChange={e => setBio({ ...bio, heightCm: Number(e.target.value) })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white font-mono placeholder:text-zinc-600 outline-none focus:border-white/30 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">% GRASA CORPORAL (OPCIONAL)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="% Grasa corporal"
                                        value={bio.bodyFatPct || ""}
                                        onChange={e => setBio({ ...bio, bodyFatPct: Number(e.target.value) || undefined })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white font-mono placeholder:text-zinc-600 outline-none focus:border-white/30 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium block mb-1.5">DÍAS DE ENTRENAMIENTO / SEMANA</label>
                                    <select
                                        value={bio.trainingDaysPerWeek}
                                        onChange={e => setBio({ ...bio, trainingDaysPerWeek: Number(e.target.value) })}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-white outline-none focus:border-white/30 text-xs"
                                    >
                                        {[2, 3, 4, 5, 6, 7].map(d => (
                                            <option key={d} value={d} className="bg-zinc-900 text-white">{d} Días / Semana (Full-Body)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2 space-y-3 pt-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-zinc-400 text-xs font-medium block">
                                            OBJETIVO NUTRICIONAL & CALÓRICO
                                        </label>
                                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                                            (bio.fitnessGoal || "deficit") === "deficit"
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : (bio.fitnessGoal || "deficit") === "surplus"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        }`}>
                                            {bio.caloricAdjustmentPct && bio.caloricAdjustmentPct > 0 ? `+${bio.caloricAdjustmentPct}%` : `${bio.caloricAdjustmentPct ?? -15}%`}
                                        </span>
                                    </div>

                                    {/* 3 Botones de Objetivo */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setBio({ ...bio, fitnessGoal: "deficit", caloricAdjustmentPct: -15, caloricDeficitPct: 15 })}
                                            className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                                                (bio.fitnessGoal || "deficit") === "deficit"
                                                    ? "bg-white text-black border-white shadow-sm font-bold"
                                                    : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                            }`}
                                        >
                                            Déficit (-)
                                        </button>
                                        <button
                                            onClick={() => setBio({ ...bio, fitnessGoal: "maintenance", caloricAdjustmentPct: 0, caloricDeficitPct: 0 })}
                                            className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                                                bio.fitnessGoal === "maintenance"
                                                    ? "bg-white text-black border-white shadow-sm font-bold"
                                                    : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                            }`}
                                        >
                                            Mantener (0%)
                                        </button>
                                        <button
                                            onClick={() => setBio({ ...bio, fitnessGoal: "surplus", caloricAdjustmentPct: 15, caloricDeficitPct: 0 })}
                                            className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                                                bio.fitnessGoal === "surplus"
                                                    ? "bg-white text-black border-white shadow-sm font-bold"
                                                    : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                            }`}
                                        >
                                            Superávit (+)
                                        </button>
                                    </div>

                                    {/* Botones de Porcentaje según el Objetivo */}
                                    {(bio.fitnessGoal || "deficit") === "deficit" && (
                                        <div className="flex gap-2 pt-1">
                                            {[-10, -15, -20, -25].map(pct => (
                                                <button
                                                    key={pct}
                                                    onClick={() => setBio({ ...bio, caloricAdjustmentPct: pct, caloricDeficitPct: Math.abs(pct) })}
                                                    className={`flex-1 py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
                                                        (bio.caloricAdjustmentPct ?? -15) === pct
                                                            ? "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm"
                                                            : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                                    }`}
                                                >
                                                    {pct}%
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {bio.fitnessGoal === "maintenance" && (
                                        <div className="text-center py-1 text-zinc-400 text-xs font-mono">
                                            Balance 0% • 100% TDEE ({macros.tdee} kcal/día)
                                        </div>
                                    )}

                                    {bio.fitnessGoal === "surplus" && (
                                        <div className="flex gap-2 pt-1">
                                            {[5, 10, 15, 20].map(pct => (
                                                <button
                                                    key={pct}
                                                    onClick={() => setBio({ ...bio, caloricAdjustmentPct: pct, caloricDeficitPct: 0 })}
                                                    className={`flex-1 py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
                                                        (bio.caloricAdjustmentPct || 15) === pct
                                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm"
                                                            : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                                    }`}
                                                >
                                                    +{pct}%
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Tesla-Style Rest Timer & Spotify Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#000000]/85 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-xs">
                    {/* Spotify Telemetry Phase */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shrink-0">
                            <Music size={15} />
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-500 font-medium tracking-wide block uppercase">CADENCIA BIOMECÁNICA</span>
                            <span className="text-white font-semibold text-xs tracking-tight">
                                {restRemaining !== null
                                    ? "PAUSA ACTIVA • 110 BPM"
                                    : "SERIES EFECTIVAS • 138-145 BPM"}
                            </span>
                        </div>
                    </div>

                    {/* Rest Countdown Timer */}
                    {restRemaining !== null ? (
                        <div className="flex items-center gap-3 bg-white/[0.06] border border-white/[0.1] px-4 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                            <div>
                                <span className="text-[9px] text-zinc-400 block uppercase font-medium">DESCANSO ACTIVO</span>
                                <span className="text-base font-bold font-mono text-[#10B981]">
                                    {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                            <button
                                onClick={() => setRestRemaining(null)}
                                className="text-[10px] text-zinc-400 hover:text-white ml-2 underline font-medium"
                            >
                                Saltar
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-zinc-500 hidden sm:block font-normal">
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

            {/* VBT & Mirror Overlay Modal */}
            <MirrorMuscleOverlay
                isOpen={isVbtModalOpen}
                onClose={() => setIsVbtModalOpen(false)}
                activeExerciseName={vbtExerciseName}
            />

            {/* Protocol Modal */}
            {isProtocolModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsProtocolModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#121214] border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10 font-sans text-white">
                        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
                            <h3 className="font-semibold text-sm tracking-tight text-white">
                                {MEASUREMENT_PROTOCOL.title}
                            </h3>
                            <button onClick={() => setIsProtocolModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-3 text-xs text-zinc-300">
                            {MEASUREMENT_PROTOCOL.criteria.map((c, i) => (
                                <div key={i} className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                    <h4 className="font-semibold text-white mb-1 tracking-tight">{c.rule}</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{c.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Off-Plan Modal */}
            {isOffPlanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsOffPlanModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#121214] border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10 font-sans text-white">
                        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-3">
                            <h3 className="font-semibold text-sm tracking-tight text-white">
                                RECÁLCULO DINÁMICO: COMÍ FUERA DEL PLAN
                            </h3>
                            <button onClick={() => setIsOffPlanModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
                        </div>

                        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                            Describe lo que comiste (ej. "2 rebanadas de pizza y un refresco"). Gemini reajustará tu cena y los próximos 2 días para proteger tu déficit.
                        </p>

                        <textarea
                            value={offPlanText}
                            onChange={e => setOffPlanText(e.target.value)}
                            placeholder="Alimentos consumidos fuera del plan"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 text-xs text-white mb-3 h-24 outline-none focus:border-white/30 placeholder:text-zinc-500"
                        />

                        <button
                            onClick={handleRecalculateMeal}
                            disabled={offPlanLoading || !offPlanText.trim()}
                            className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-full transition-all disabled:opacity-50"
                        >
                            {offPlanLoading ? "RECALCULANDO CON GEMINI..." : "RECALCULAR CENA Y DÉFICIT"}
                        </button>

                        {offPlanResult && (
                            <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5 text-xs">
                                <p className="text-white font-semibold">{offPlanResult.explanation}</p>
                                <div className="p-3 bg-white/[0.04] rounded-xl">
                                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wide">CENA REAJUSTADA HOY:</span>
                                    <span className="text-white font-medium">{offPlanResult.adjustedDinner}</span>
                                </div>
                                <div className="p-3 bg-white/[0.04] rounded-xl">
                                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wide">COMPENSACIÓN SUAVE:</span>
                                    <span className="text-[#10B981] font-medium">{offPlanResult.nextDaysAdvice}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Executive Apple / Tesla Style Footer */}
            <ApexFooter />

            {/* PWA Floating Installation Prompt Banner */}
            <PWAInstallBanner />
        </div>
    );
}
