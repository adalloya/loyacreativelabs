"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
    Check,
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
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Trash2,
    Shuffle,
    RefreshCw,
    Camera,
    X
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

import {
    MuscleGroup,
    ExerciseItem,
    EXERCISE_DATABASE,
    updateExerciseDatabase,
    generateWeeklyProgram,
    calculateTodayTarget,
    RoutineDay,
    ReadinessState,
    findBiomechanicalSwaps,
    formatPlatesSummary,
    CARDIO_PROTOCOLS,
    CardioType,
    DailyCardioEntry,
    calculateCardioTelemetry
} from "@/lib/hypertrophy-engine";
import {
    fetchLiveExercisesFromGitHub,
    getActiveExerciseCatalog,
    purgeOutdatedExerciseCache
} from "@/lib/exercise-catalog";

import {
    BiometricProfile,
    calculateMetabolism,
    calculateSupplementStack,
    generateWeeklyGroceryList,
    MEASUREMENT_PROTOCOL
} from "@/lib/nutrition-logistics";

import { useGymHardware } from "@/hooks/useGymHardware";
import { AnatomyVisualizer, MUSCLE_PALETTE, ORDERED_MUSCLE_GROUPS } from "@/components/apex/AnatomyVisualizer";
import { ExerciseMotionViewer } from "@/components/apex/ExerciseMotionViewer";
import { MuscleTargetDrawer } from "@/components/apex/MuscleTargetDrawer";
import { ExerciseLibraryModal } from "@/components/apex/ExerciseLibraryModal";
import { GymEquipmentScannerModal } from "@/components/apex/GymEquipmentScannerModal";
import { ExerciseSwapModal } from "@/components/apex/ExerciseSwapModal";
import { PlateCalculatorModal } from "@/components/apex/PlateCalculatorModal";
import { PwaInstallModal } from "@/components/apex/PwaInstallModal";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { DownloadPDFButton } from "@/components/pdf/DownloadPDFButton";
import { AppHeaderMenu } from "@/components/ui/AppHeaderMenu";
import { TextToApexRoutineModal } from "@/components/apex/TextToApexRoutineModal";
import { ShoppingList } from "@/components/nutrition/ShoppingList";
import { DailyMealTracker } from "@/components/nutrition/DailyMealTracker";
import { DietPreferenceModal, DietType } from "@/components/nutrition/DietPreferenceModal";
import { ApexCalendarView } from "@/components/calendar/ApexCalendarView";
import { DailyNutritionLog, getLocalDateString } from "@/lib/nutrition-tracker";
import { ApexFooter } from "@/components/apex/ApexFooter";
import { MirrorMuscleOverlay } from "@/components/vision/MirrorMuscleOverlay";
import { logSetOfflineFirst, localDb } from "@/lib/local-db";
import { playTempoPulse, startTempoLoop, stopTempoLoop } from "@/lib/tempo-sonar";
import { useVoiceLogger } from "@/hooks/useVoiceLogger";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SpotifyPlayerWidget } from "@/components/apex/SpotifyPlayerWidget";
import { SpotifySettingsModal } from "@/components/apex/SpotifySettingsModal";
import { ApexAmbientVisualizer } from "@/components/apex/ApexAmbientVisualizer";
import { isSpotifyConnected, handleSpotifyCallback } from "@/services/spotifyService";
import { OnboardingFlow, UserApexProfile } from "@/app/onboarding/OnboardingFlow";
import { ApexOnboardingModal } from "@/components/apex/ApexOnboardingModal";
import { ApexFeedbackModal } from "@/components/apex/ApexFeedbackModal";
import { getInitialUxVersion, setUxVersion, UxVersion } from "@/lib/uxVersion";
import { ApexV2View } from "@/components/apex/v2/ApexV2View";

/**
 * Determina si un ejercicio requiere cálculo de discos para barra olímpica / EZ.
 * Evita mostrar desglose de discos en mancuernas, poleas, máquinas o peso corporal donde no es necesario.
 */
function isPlateLoadedExercise(equipment?: string, name?: string): boolean {
    if (!equipment && !name) return false;
    const eq = (equipment || "").toLowerCase().trim();
    if (eq === "barbell" || eq === "e-z curl bar") return true;
    const n = (name || "").toLowerCase();
    return n.includes("barbell") || n.includes("barra olímpica") || n.includes("barra olimpica") || n.includes("barra ez");
}

export default function ApexDashboard() {
    // Hardware Hooks (Screen WakeLock & Haptic/Audio)
    const { isScreenLocked, triggerRestTimerAlert } = useGymHardware();

    // Active Navigation Tab (4 Pestañas: Gimnasio, Calendario, Nutrición, Ajustes)
    const [activeTab, setActiveTab] = useState<"workout" | "calendar" | "nutrition" | "biometrics">("workout");
    const [isMuscleMapOpen, setIsMuscleMapOpen] = useState(false);

    // Daily Nutrition Tracker persistent logs by date (YYYY-MM-DD)
    const [allNutritionLogs, setAllNutritionLogs] = useLocalStorage<Record<string, DailyNutritionLog>>("apex_daily_nutrition_logs", {});
    const [activeNutritionDate, setActiveNutritionDate] = useState<string>(() => getLocalDateString());

    const handleSaveNutritionLog = (date: string, log: DailyNutritionLog) => {
        setAllNutritionLogs(prev => ({
            ...prev,
            [date]: log
        }));
    };

    // Time-based greeting (Buenos días / Buenas tardes / Buenas noches) & Current date in Spanish
    const timeGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Buenos días";
        if (hour >= 12 && hour < 19) return "Buenas tardes";
        return "Buenas noches";
    }, []);

    const todayFormattedDate = useMemo(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        };
        const formatted = now.toLocaleDateString("es-MX", options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }, []);

    // Readiness & Environment Telemetry
    const [readiness, setReadiness] = useState<ReadinessState>("optimal");
    const [environmentMode, setEnvironmentMode] = useState<"full_gym" | "hotel_gym" | "bodyweight" | "home_gym">("full_gym");
    const [weightUnit, setWeightUnit] = useLocalStorage<"lbs" | "kg">("apex_weight_unit", "lbs");

    // Catálogo en Vivo de 873+ Ejercicios (GitHub + Caché Local)
    const [catalogCount, setCatalogCount] = useState<number>(EXERCISE_DATABASE.length);

    useEffect(() => {
        purgeOutdatedExerciseCache();
        fetchLiveExercisesFromGitHub().then(catalog => {
            if (catalog && catalog.length >= 800) {
                updateExerciseDatabase(catalog);
                setCatalogCount(catalog.length);
            }
        });

        const handleCatalogUpdated = (e: any) => {
            if (e.detail?.count) {
                setCatalogCount(e.detail.count);
            }
        };
        window.addEventListener("apex:catalog-updated", handleCatalogUpdated);
        return () => window.removeEventListener("apex:catalog-updated", handleCatalogUpdated);
    }, []);

    // UX Version Control (Stable v1 vs Beta v2)
    const [uxVersion, setUxVersionState] = useState<UxVersion>("stable");

    useEffect(() => {
        setUxVersionState(getInitialUxVersion());
        const handleUxVersionChange = (e: Event) => {
            const customEvt = e as CustomEvent<{ version: UxVersion }>;
            if (customEvt.detail?.version) {
                setUxVersionState(customEvt.detail.version);
            }
        };
        window.addEventListener("apex_ux_version_change", handleUxVersionChange);
        return () => window.removeEventListener("apex_ux_version_change", handleUxVersionChange);
    }, []);

    // Modals
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
    const [specializedMuscle, setSpecializedMuscle] = useState<MuscleGroup | null>(null);
    const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);
    const [plateModalWeight, setPlateModalWeight] = useState(135);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [isOffPlanModalOpen, setIsOffPlanModalOpen] = useState(false);
    const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
    const [isSpotifyLinked, setIsSpotifyLinked] = useState(false);
    const [isDietPrefModalOpen, setIsDietPrefModalOpen] = useState(false);
    const [dietPreference, setDietPreference] = useLocalStorage<DietType>("apex_diet_preference", "standard");
    const [dietNotes, setDietNotes] = useLocalStorage<string>("apex_diet_notes", "");

    // Spotify PKCE OAuth Callback Handler & Status Initialization
    useEffect(() => {
        setIsSpotifyLinked(isSpotifyConnected());
        handleSpotifyCallback().then((success) => {
            if (success) {
                setIsSpotifyLinked(true);
            }
        });

        const handleSpotifyConn = () => {
            setIsSpotifyLinked(true);
        };

        window.addEventListener("apex:spotify-connected", handleSpotifyConn);
        return () => {
            window.removeEventListener("apex:spotify-connected", handleSpotifyConn);
        };
    }, []);

    // Hot-Swap: VBT Velocity Modal State
    const [isVbtModalOpen, setIsVbtModalOpen] = useState(false);
    const [vbtExerciseName, setVbtExerciseName] = useState("Press de Banca");

    // Onboarding & Feedback Modals
    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    // Zen Mode State (se activa a los 3s cuando el usuario está en el footer escuchando música con FX)
    const [isZenModeActive, setIsZenModeActive] = useState(false);
    useEffect(() => {
        const handleZenMode = (e: any) => {
            setIsZenModeActive(Boolean(e?.detail?.active));
        };
        window.addEventListener("apex:zen-mode", handleZenMode);
        return () => window.removeEventListener("apex:zen-mode", handleZenMode);
    }, []);

    // Hot-Swap: Tempo Sonar state per exercise (default OFF)
    const [tempoActive, setTempoActive] = useState<Record<string, boolean>>({});

    // Inline Plate breakdown state
    const [inlinePlatesExId, setInlinePlatesExId] = useState<string | null>(null);

    // Tactile editable inputs per set: { [exId_setIdx]: { weight: number | string, reps: number | string } }
    const [setInputs, setSetInputs] = useState<Record<string, { weight: number | string; reps: number | string }>>({});
    const [exerciseNotes, setExerciseNotes] = useLocalStorage<Record<string, string>>("apex_exercise_notes", {});

    // Reset Exercise Data confirmation modal state
    const [isResetExerciseModalOpen, setIsResetExerciseModalOpen] = useState(false);
    const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

    // Hot-Swap: Voice Logger active target
    const [voiceActiveSet, setVoiceActiveSet] = useState<{ exerciseId: string; setIdx: number } | null>(null);
    const voiceActiveSetRef = useRef<{ exerciseId: string; setIdx: number } | null>(null);
    const [voiceSuccessToast, setVoiceSuccessToast] = useState<string | null>(null);

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

    // Metodología de Entrenamiento: "traditional" (Hipertrofia Lineal) vs "cycled_circuits" (Ciclado & Circuitos Metabólicos)
    const [trainingMethodology, setTrainingMethodology] = useLocalStorage<"traditional" | "cycled_circuits">(
        "apex_training_methodology",
        "cycled_circuits"
    );

    // Rutina semanal personalizada importada desde texto
    const [customWeeklyRoutine, setCustomWeeklyRoutine] = useLocalStorage<RoutineDay[] | null>(
        "apex_custom_weekly_routine",
        null
    );

    const [isRoutineImporterOpen, setIsRoutineImporterOpen] = useState(false);

    // Weekly Routine & Current Day
    const weeklyProgram = useMemo(() => {
        if (customWeeklyRoutine && customWeeklyRoutine.length > 0) {
            return customWeeklyRoutine;
        }
        return generateWeeklyProgram(
            profile?.trainingDaysPerWeek || 5,
            profile?.sessionDurationMins || 60,
            "incline_treadmill",
            environmentMode,
            EXERCISE_DATABASE
        );
    }, [customWeeklyRoutine, profile?.trainingDaysPerWeek, profile?.sessionDurationMins, environmentMode, catalogCount]);

    // Selección automática inicial basada en el día actual de la semana (Lunes = 0, ..., Domingo = 6)
    const [currentDayIndex, setCurrentDayIndex] = useState(() => {
        const jsDay = new Date().getDay();
        const mondayFirst = jsDay === 0 ? 6 : jsDay - 1;
        return mondayFirst;
    });

    // Auto-ajustar si la rutina tiene menos días que el índice actual
    useEffect(() => {
        if (weeklyProgram.length > 0 && currentDayIndex >= weeklyProgram.length) {
            setCurrentDayIndex(0);
        }
    }, [weeklyProgram.length, currentDayIndex]);

    const currentRoutine: RoutineDay = weeklyProgram[currentDayIndex] || weeklyProgram[0];

    // Daily Cardio Finisher Selection & Telemetry (configurable per session at the end of each day)
    const [dailyCardio, setDailyCardio] = useLocalStorage<Record<number, DailyCardioEntry>>("apex_daily_cardio", {});

    const routineDefaultType = (currentRoutine.cardio.durationMinutes > 0 ? "incline_treadmill" : "none") as CardioType;

    const todayCardio: DailyCardioEntry = useMemo(() => {
        const raw = dailyCardio[currentDayIndex];
        const type = raw?.type || routineDefaultType;
        const proto = CARDIO_PROTOCOLS[type] || CARDIO_PROTOCOLS.incline_treadmill;
        const minutes = raw?.minutes ?? (currentRoutine.cardio.durationMinutes || proto.defaultMinutes || 20);
        const incline = raw?.incline ?? proto.defaultIncline ?? 12;
        const speed = raw?.speed ?? proto.defaultSpeed ?? 4.8;
        const completed = raw?.completed ?? false;
        const telemetry = calculateCardioTelemetry(type, minutes, incline, speed, bio?.weightKg || 75);

        return {
            type,
            minutes,
            incline,
            speed,
            completed,
            distanceKm: raw?.distanceKm ?? telemetry.distanceKm,
            caloriesBurned: raw?.caloriesBurned ?? telemetry.caloriesBurned,
            date: raw?.date || getLocalDateString(),
            savedAt: raw?.savedAt
        };
    }, [dailyCardio, currentDayIndex, routineDefaultType, currentRoutine.cardio.durationMinutes, bio?.weightKg]);

    const handleUpdateCardio = (
        typeOrUpdates: CardioType | (Partial<DailyCardioEntry> & { type?: CardioType }),
        minutes?: number,
        completed?: boolean
    ) => {
        const updates: Partial<DailyCardioEntry> & { type?: CardioType } =
            typeof typeOrUpdates === "string"
                ? { type: typeOrUpdates, minutes, completed }
                : typeOrUpdates;

        setDailyCardio(prev => {
            const current = prev[currentDayIndex] || todayCardio;
            const nextType = updates.type ?? current.type;
            const proto = CARDIO_PROTOCOLS[nextType] || CARDIO_PROTOCOLS.incline_treadmill;

            const nextMinutes = updates.minutes !== undefined
                ? updates.minutes
                : (updates.type && updates.type !== current.type ? proto.defaultMinutes : (current.minutes || proto.defaultMinutes));

            const nextIncline = updates.incline !== undefined
                ? updates.incline
                : (updates.type && updates.type !== current.type ? proto.defaultIncline : (current.incline ?? proto.defaultIncline));

            const nextSpeed = updates.speed !== undefined
                ? updates.speed
                : (updates.type && updates.type !== current.type ? proto.defaultSpeed : (current.speed ?? proto.defaultSpeed));

            const nextCompleted = updates.completed !== undefined ? updates.completed : current.completed;

            const telemetry = calculateCardioTelemetry(nextType, nextMinutes, nextIncline, nextSpeed, bio?.weightKg || 75);

            return {
                ...prev,
                [currentDayIndex]: {
                    type: nextType,
                    minutes: nextMinutes,
                    incline: nextIncline,
                    speed: nextSpeed,
                    completed: nextCompleted,
                    distanceKm: telemetry.distanceKm,
                    caloriesBurned: telemetry.caloriesBurned,
                    date: getLocalDateString(),
                    savedAt: new Date().toISOString()
                }
            };
        });
    };

    // Workouts dynamic list (supports injecting exercises and swap)
    const [activeExercises, setActiveExercises] = useState<ExerciseItem[]>(currentRoutine.exercises);

    useEffect(() => {
        if (currentRoutine) {
            setActiveExercises(currentRoutine.exercises);
        }
    }, [currentRoutine]);

    const handleAddExerciseToSession = (exercise: ExerciseItem) => {
        setActiveExercises(prev => [...prev, exercise]);
    };

    // Completed sets tracker: { [exerciseId_setIndex]: boolean }
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
    // Ghost input memory: { [exerciseId]: { weight: number, reps: number } }
    // Inicia en {} (0 reps y 0 kg previos) hasta que el usuario guarde sus series reales
    const [exerciseMemory, setExerciseMemory] = useLocalStorage<Record<string, { weight: number; reps: number }>>(
        "apex_exercise_memory",
        {}
    );

    // Borrado completo de datos de ejercicios previos solicitado por el usuario
    const handleClearAllExerciseData = async () => {
        try {
            await localDb.exercise_logs.clear();
            setExerciseMemory({});
            localStorage.removeItem("apex_exercise_memory");
            setCompletedSets({});
            setSetInputs({});
            setIsResetExerciseModalOpen(false);
            setResetSuccessMessage("Todos los datos de ejercicios previos han sido borrados. Tus repeticiones inician en 0.");
            setTimeout(() => setResetSuccessMessage(null), 5000);
        } catch (err) {
            console.error("Error al borrar datos de ejercicio:", err);
        }
    };

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

    // APEX Editorial PDF Blueprint Data (completo con todas las decisiones del perfil)
    const pdfProfile = useMemo(() => ({
        firstName: profile?.firstName || "Atleta",
        lastName: profile?.lastName || "",
        age: profile?.age || bio.age,
        gender: profile?.gender || bio.gender,
        weightKg: profile?.weightKg || bio.weightKg,
        heightCm: profile?.heightCm || bio.heightCm,
        bodyFatPct: profile?.bodyFatPct || bio.bodyFatPct,
        trainingDaysPerWeek: profile?.trainingDaysPerWeek || bio.trainingDaysPerWeek,
        sessionDurationMins: profile?.sessionDurationMins || 60,
        fitnessGoal: profile?.fitnessGoal || bio.fitnessGoal || "deficit",
        caloricAdjustmentPct: bio.caloricAdjustmentPct,
        caloricDeficitPct: bio.caloricDeficitPct,
        calculatedBmr: macros.tmb,
        calculatedTdee: macros.tdee,
        targetCalories: macros.targetCalories,
        targetProteinG: macros.proteinG,
        targetCarbsG: macros.carbsG,
        targetFatsG: macros.fatsG,
        waterLiters: Math.round(bio.weightKg * 0.04 * 10) / 10,
        environmentMode: environmentMode,
        readiness: readiness,
        dayTitle: currentRoutine?.title || "Rutina Activa",
        dayFocus: currentRoutine?.focus || "Hipertrofia Avanzada",
        cardioType: todayCardio.type,
        cardioMinutes: todayCardio.minutes,
        cardioIncline: todayCardio.incline,
        cardioSpeed: todayCardio.speed,
        cardioCalories: todayCardio.caloriesBurned,
        cardioDistance: todayCardio.distanceKm,
        cardioProtocol: CARDIO_PROTOCOLS[todayCardio.type]?.protocol || ""
    }), [profile, bio, macros, environmentMode, readiness, currentRoutine, todayCardio]);

    // Set Completion with Dexie.js Offline-First logging
    const handleCompleteSet = (exerciseId: string, setIdx: number, restSeconds: number, customWeight?: number, customReps?: number) => {
        const key = `${exerciseId}_${setIdx}`;
        const newState = !completedSets[key];

        setCompletedSets(prev => ({ ...prev, [key]: newState }));

        const exMemory = exerciseMemory[exerciseId] || { weight: 0, reps: 0 };
        const inputVal = setInputs[key];
        const rawWeight = customWeight !== undefined ? customWeight : (inputVal?.weight !== undefined && inputVal.weight !== "" ? inputVal.weight : exMemory.weight);
        const rawReps = customReps !== undefined ? customReps : (inputVal?.reps !== undefined && inputVal.reps !== "" ? inputVal.reps : exMemory.reps);
        const weightToLog = typeof rawWeight === "number" ? rawWeight : (parseFloat(String(rawWeight)) || 0);
        const repsToLog = typeof rawReps === "number" ? rawReps : (parseInt(String(rawReps), 10) || 0);

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
    const {
        isListening: isVoiceListening,
        transcript: voiceTranscript,
        interimTranscript: voiceInterimTranscript,
        errorMessage: voiceErrorMessage,
        isSupported: isVoiceSupported,
        startListening: startVoiceLogging,
        stopListening: stopVoiceLogging,
        clearError: clearVoiceError
    } = useVoiceLogger((result) => {
        const active = voiceActiveSetRef.current || voiceActiveSet;
        if (active) {
            const key = `${active.exerciseId}_${active.setIdx}`;
            const targetEx = activeExercises.find(e => e.id === active.exerciseId);
            const memory = exerciseMemory[active.exerciseId] || { weight: 0, reps: 0 };
            const currentInputs = setInputs[key];

            const finalWeight = (result.weight !== undefined && result.weight !== null)
                ? result.weight
                : (currentInputs?.weight !== undefined && currentInputs.weight !== ""
                    ? Number(currentInputs.weight)
                    : (memory.weight > 0 ? memory.weight : 0));

            const finalReps = (result.reps !== undefined && result.reps !== null)
                ? result.reps
                : (currentInputs?.reps ? Number(currentInputs.reps) : (targetEx?.rep_range_min || 10));

            setSetInputs(prev => ({
                ...prev,
                [key]: { weight: finalWeight, reps: finalReps }
            }));

            handleCompleteSet(active.exerciseId, active.setIdx, targetEx?.rest_seconds || 90, finalWeight, finalReps);

            setVoiceSuccessToast(`${finalWeight} ${weightUnit} × ${finalReps} reps`);
            setTimeout(() => setVoiceSuccessToast(null), 3500);

            voiceActiveSetRef.current = null;
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

    // Exercise Random Swap (Acción Instantánea)
    const handleRandomSwapExercise = (index: number) => {
        const currentEx = activeExercises[index];
        if (!currentEx) return;
        const swaps = findBiomechanicalSwaps(currentEx.id);
        if (swaps.length > 0) {
            const nextEx = swaps[Math.floor(Math.random() * swaps.length)];
            const updated = [...activeExercises];
            updated[index] = nextEx;
            setActiveExercises(updated);
        }
    };

    // Exercise Manual Swap Selection (Abre Modal con Buscador)
    const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

    const handleSelectSwapReplacement = (replacement: ExerciseItem) => {
        if (swapTargetIndex !== null && swapTargetIndex >= 0 && swapTargetIndex < activeExercises.length) {
            const updated = [...activeExercises];
            updated[swapTargetIndex] = replacement;
            setActiveExercises(updated);
            setSwapTargetIndex(null);
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

    const [dietPlan, setDietPlan] = useLocalStorage<any>("apex_diet_plan", null);
    const [dietLoading, setDietLoading] = useState(false);

    const pdfDiet = useMemo(() => ({
        dailySupplements: supplements,
        groceryList: groceryList,
        macros: macros,
        dietPlan: dietPlan
    }), [supplements, groceryList, macros, dietPlan]);

    const handleGenerateAiDiet = async (selectedDiet?: DietType, customNotes?: string) => {
        const pref = selectedDiet || dietPreference || "standard";
        const notes = customNotes !== undefined ? customNotes : dietNotes;
        if (selectedDiet) setDietPreference(selectedDiet);
        if (customNotes !== undefined) setDietNotes(customNotes);

        setDietLoading(true);
        try {
            const res = await fetch("/api/gemini/diet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profile: {
                        weightKg: bio.weightKg,
                        targetCalories: macros.targetCalories,
                        targetProteinG: macros.proteinG,
                        caloricDeficitPct: bio.caloricDeficitPct,
                        fitnessGoal: bio.fitnessGoal,
                        caloricAdjustmentPct: bio.caloricAdjustmentPct
                    },
                    dietaryPreference: pref,
                    dietaryNotes: notes
                })
            });
            const data = await res.json();
            if (data && (data.thirtyDayPlan || data.weeklyTemplates || data.caloriesTarget)) {
                setDietPlan(data);
            }
        } catch (e) {
            console.error("Error generating diet with Gemini:", e);
        } finally {
            setIsDietPrefModalOpen(false);
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

    const handleSetInputChange = (key: string, field: "weight" | "reps", value: any) => {
        setSetInputs(prev => {
            const current = prev[key] || { weight: "", reps: "" };
            let parsed = value;
            if (value !== "") {
                parsed = field === "weight" ? (parseFloat(value) || 0) : (parseInt(value, 10) || 0);
            }
            return {
                ...prev,
                [key]: {
                    ...current,
                    [field]: parsed
                }
            };
        });
    };

    // Si la versión activa es la nueva V2 (Next-Level Liquid Glass), renderizamos la nueva arquitectura modular
    if (uxVersion === "v2") {
        return (
            <>
                <ApexAmbientVisualizer />
                <ApexV2View
                    profile={profile}
                    timeGreeting={timeGreeting}
                    todayFormattedDate={todayFormattedDate}
                    isScreenLocked={isScreenLocked}
                    environmentMode={environmentMode}
                    setEnvironmentMode={(mode) => setEnvironmentMode(mode as any)}
                    weightUnit={weightUnit}
                    setWeightUnit={setWeightUnit}
                    trainingMethodology={trainingMethodology}
                    setTrainingMethodology={setTrainingMethodology}
                    readiness={readiness}
                    setReadiness={setReadiness}
                    weeklyProgram={weeklyProgram}
                    currentRoutine={currentRoutine}
                    activeDayIndex={currentDayIndex}
                    handleDaySelect={(idx) => setCurrentDayIndex(idx)}
                    activeExercises={activeExercises}
                    exerciseMemory={exerciseMemory}
                    completedSets={completedSets}
                    setInputs={setInputs}
                    handleSetInputChange={handleSetInputChange}
                    handleCompleteSet={handleCompleteSet}
                    tempoActive={tempoActive}
                    setTempoActive={setTempoActive}
                    startTempoLoop={startTempoLoop}
                    stopTempoLoop={stopTempoLoop}
                    handleRandomSwapExercise={handleRandomSwapExercise}
                    setSwapTargetIndex={setSwapTargetIndex}
                    setPlateModalWeight={setPlateModalWeight}
                    setIsPlateModalOpen={setIsPlateModalOpen}
                    setVbtExerciseName={setVbtExerciseName}
                    setIsVbtModalOpen={setIsVbtModalOpen}
                    setIsScannerOpen={setIsScannerOpen}
                    setIsExerciseLibraryOpen={setIsExerciseLibraryOpen}
                    setIsRoutineImporterOpen={setIsRoutineImporterOpen}
                    setIsDietPrefModalOpen={setIsDietPrefModalOpen}
                    setIsInstallModalOpen={setIsInstallModalOpen}
                    setIsSpotifyModalOpen={setIsSpotifyModalOpen}
                    isSpotifyLinked={isSpotifyLinked}
                    setIsOnboardingModalOpen={setIsOnboardingModalOpen}
                    setIsFeedbackModalOpen={setIsFeedbackModalOpen}
                    pdfProfile={pdfProfile}
                    pdfDiet={pdfDiet}
                    macros={macros}
                    supplements={supplements}
                    allNutritionLogs={allNutritionLogs}
                    handleSaveNutritionLog={handleSaveNutritionLog}
                    activeNutritionDate={activeNutritionDate}
                    setActiveNutritionDate={setActiveNutritionDate}
                    dietPlan={dietPlan}
                    groceryList={groceryList}
                    restRemaining={restRemaining}
                    handleSkipRest={() => setRestRemaining(null)}
                    selectedMuscle={selectedMuscle}
                    setSelectedMuscle={setSelectedMuscle}
                    activeMusclesToday={activeMusclesToday}
                    catalogCount={catalogCount}
                    onSwitchToStable={() => {
                        setUxVersion("stable");
                        setUxVersionState("stable");
                    }}
                    exerciseNotes={exerciseNotes}
                    setExerciseNotes={setExerciseNotes}
                    isPlateLoadedExercise={isPlateLoadedExercise}
                />

                {/* Modales y Drawers Compartidos */}
                <MuscleTargetDrawer
                    selectedMuscle={selectedMuscle}
                    onClose={() => setSelectedMuscle(null)}
                    onInjectExercise={handleInjectExercise}
                    onToggleSpecialization={m => setSpecializedMuscle(prev => prev === m ? null : m)}
                    specializedMuscle={specializedMuscle}
                />

                {isPlateModalOpen && (
                    <PlateCalculatorModal
                        initialWeight={plateModalWeight > 0 ? plateModalWeight : (weightUnit === "lbs" ? 135 : 80)}
                        unit={weightUnit}
                        onClose={() => setIsPlateModalOpen(false)}
                    />
                )}

                <ExerciseLibraryModal
                    isOpen={isExerciseLibraryOpen}
                    onClose={() => setIsExerciseLibraryOpen(false)}
                    onAddExercise={handleAddExerciseToSession}
                    activeExerciseIds={activeExercises.map(e => e.id)}
                />

                <GymEquipmentScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onAddExerciseToSession={handleAddExerciseToSession}
                    activeExerciseIds={activeExercises.map(e => e.id)}
                />

                <SpotifySettingsModal
                    isOpen={isSpotifyModalOpen}
                    onClose={() => setIsSpotifyModalOpen(false)}
                    onStatusChange={() => setIsSpotifyLinked(isSpotifyConnected())}
                />

                <ExerciseSwapModal
                    isOpen={swapTargetIndex !== null}
                    onClose={() => setSwapTargetIndex(null)}
                    currentExercise={swapTargetIndex !== null ? activeExercises[swapTargetIndex] : null}
                    onSelectSwap={handleSelectSwapReplacement}
                    activeExerciseIds={activeExercises.map(e => e.id)}
                />

                <DietPreferenceModal
                    isOpen={isDietPrefModalOpen}
                    onClose={() => setIsDietPrefModalOpen(false)}
                    onConfirm={(selectedDiet, notes) => handleGenerateAiDiet(selectedDiet, notes)}
                    initialDiet={dietPreference}
                    initialNotes={dietNotes}
                    isLoading={dietLoading}
                />

                <TextToApexRoutineModal
                    isOpen={isRoutineImporterOpen}
                    onClose={() => setIsRoutineImporterOpen(false)}
                    onApplyRoutine={(importedDays) => {
                        setCustomWeeklyRoutine(importedDays);
                        setCurrentDayIndex(0);
                    }}
                    catalog={EXERCISE_DATABASE}
                />

                {isInstallModalOpen && (
                    <PwaInstallModal onClose={() => setIsInstallModalOpen(false)} />
                )}

                <MirrorMuscleOverlay
                    isOpen={isVbtModalOpen}
                    onClose={() => setIsVbtModalOpen(false)}
                    activeExerciseName={vbtExerciseName}
                />

                <ApexOnboardingModal
                    isOpen={isOnboardingModalOpen}
                    onClose={() => setIsOnboardingModalOpen(false)}
                />

                <ApexFeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => setIsFeedbackModalOpen(false)}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-[#EAEAEA] font-sans antialiased selection:bg-[#FF2A2A]/30 selection:text-white pb-28 w-full max-w-full overflow-x-hidden relative">
            {/* Ambient WebGL Visualizer & Reactive Lighting (100% disposed if FX: OFF) */}
            <ApexAmbientVisualizer />

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
                                {timeGreeting}, {profile.firstName}
                            </h1>
                            <p className="text-xs text-zinc-400 mt-1 capitalize font-normal">
                                {todayFormattedDate}
                            </p>
                        </div>
                    </div>

                    {/* Right Controls & Hamburger Menu */}
                    <div className="flex items-center gap-2">
                        {/* Screen Lock Badge */}
                        <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScreenLocked ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
                            <span className="text-zinc-300 font-medium">{isScreenLocked ? "PANTALLA ACTIVA" : "WAKE LOCK"}</span>
                        </div>

                        {/* Menú de Tres Rayitas tipo Apple / Tesla (incluye PDF, Entorno, Disposición Hoy y Configuración) */}
                        <AppHeaderMenu
                            environmentMode={environmentMode}
                            onEnvironmentChange={(mode) => setEnvironmentMode(mode as any)}
                            weightUnit={weightUnit}
                            onWeightUnitChange={setWeightUnit}
                            trainingMethodology={trainingMethodology}
                            onTrainingMethodologyChange={setTrainingMethodology}
                            onOpenRoutineImporter={() => setIsRoutineImporterOpen(true)}
                            readiness={readiness}
                            onReadinessChange={setReadiness}
                            onInstallClick={() => setIsInstallModalOpen(true)}
                            showInstallButton={true}
                            pdfProfile={pdfProfile}
                            pdfRoutine={activeExercises}
                            pdfWeeklyProgram={weeklyProgram}
                            pdfDiet={pdfDiet}
                            onResetProfile={() => {
                                localStorage.removeItem('apex_user_profile');
                                window.location.reload();
                            }}
                            onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                            isSpotifyConnected={isSpotifyLinked}
                            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
                            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                            uxVersion={uxVersion}
                            onUxVersionChange={setUxVersionState}
                        />
                    </div>
                </div>
            </header>

            {/* Main Tabs Navigation Bar (4 Pestañas Minimalistas: Solo Iconos) */}
            <div className="max-w-6xl mx-auto px-4 mt-5">
                <div className="grid grid-cols-4 bg-[#121214]/90 border border-white/[0.08] rounded-2xl p-1 backdrop-blur-xl">
                    {[
                        { id: "workout", label: "Gimnasio", icon: Dumbbell },
                        { id: "calendar", label: "Calendario", icon: Calendar },
                        { id: "nutrition", label: "Nutrición", icon: Utensils },
                        { id: "biometrics", label: "Ajustes", icon: Sliders }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                title={tab.label}
                                aria-label={tab.label}
                                className={`flex items-center justify-center py-2.5 rounded-xl transition-all ${isActive
                                    ? "bg-white text-black shadow-lg"
                                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                                    }`}
                            >
                                <Icon size={18} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Content */}
            <main className="max-w-6xl mx-auto px-4 mt-6 pb-24 sm:pb-28">
                {/* =========================================================================
                    TAB 1: WORKOUT EN VIVO
                   ========================================================================= */}
                {activeTab === "workout" && (
                    <div className="space-y-6">
                        {/* Day Selector Bar */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] uppercase tracking-wide">
                                            {trainingMethodology === "cycled_circuits" ? "CIRCUITOS & CICLADO METABÓLICO" : "HIPERTROFIA LINEAL"}
                                        </span>
                                        {trainingMethodology === "cycled_circuits" && currentRoutine.carbCycleLabel && (
                                            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                                                currentRoutine.carbCyclePhase === "high_carb"
                                                    ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                                                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                            }`}>
                                                {currentRoutine.carbCycleLabel}
                                            </span>
                                        )}
                                        <span className="text-xs text-zinc-400 font-medium">
                                            Tiempo: <span className="font-mono text-white">{currentRoutine.estimatedMinutes}</span> min
                                        </span>
                                    </div>
                                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                                        {currentRoutine.title}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                                        {currentRoutine.focus}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRoutineImporterOpen(true)}
                                        className="flex items-center gap-1.5 text-xs font-mono font-medium text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-3.5 py-2 rounded-2xl transition-all shadow-sm active:scale-95"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-[#FF2A2A]" />
                                        <span>Importar Rutina</span>
                                    </button>

                                    {customWeeklyRoutine && (
                                        <button
                                            type="button"
                                            onClick={() => setCustomWeeklyRoutine(null)}
                                            className="text-[10px] font-mono text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] px-2.5 py-2 rounded-2xl transition-all"
                                            title="Volver a rutina sugerida por algoritmo APEX"
                                        >
                                            Restablecer
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Selector horizontal de Días Reales de la Semana */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {weeklyProgram.map((d, idx) => {
                                    const dayName = d.dayName || ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"][idx] || `DÍA ${d.dayNumber}`;
                                    const isSelected = currentDayIndex === idx;
                                    const shortFocus = d.focus ? d.focus.split(",")[0].split("&")[0].trim() : "";

                                    return (
                                        <button
                                            key={d.dayNumber || idx}
                                            onClick={() => setCurrentDayIndex(idx)}
                                            className={`flex-1 min-w-[90px] sm:min-w-[110px] py-2.5 px-3 rounded-2xl text-left transition-all relative ${
                                                isSelected
                                                    ? "bg-white text-black shadow-xl"
                                                    : "bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider ${
                                                    isSelected ? "text-black" : "text-zinc-200"
                                                }`}>
                                                    {dayName}
                                                </span>
                                                {d.carbCyclePhase === "high_carb" && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        isSelected ? "bg-emerald-600" : "bg-[#10B981]"
                                                    }`} />
                                                )}
                                            </div>
                                            {shortFocus && (
                                                <div className={`text-[9px] sm:text-[10px] truncate mt-0.5 ${
                                                    isSelected ? "text-zinc-700 font-medium" : "text-zinc-500"
                                                }`}>
                                                    {shortFocus}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selector de Músculos & Mapa Anatómico (Contraído por defecto para ahorrar espacio) */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl transition-all">
                            <button
                                onClick={() => setIsMuscleMapOpen(!isMuscleMapOpen)}
                                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0 shadow-sm">
                                        <Activity size={18} className="text-[#FF2A2A]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                                                MAPA ANATÓMICO & SELECTOR MUSCULAR
                                            </h3>
                                            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.08]">
                                                11 GRUPOS
                                            </span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-normal">
                                            {isMuscleMapOpen ? "Toca para contraer" : "Explora músculos, agrega ejercicios y revisa balance articular"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                                        {isMuscleMapOpen ? "Ocultar" : "Expandir"}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-300 group-hover:text-white transition-all">
                                        {isMuscleMapOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </button>

                            {isMuscleMapOpen && (
                                <div className="p-5 sm:p-6 border-t border-white/[0.06] space-y-6 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                        <div className="lg:col-span-5">
                                            <AnatomyVisualizer
                                                selectedMuscle={selectedMuscle}
                                                activeMusclesToday={activeMusclesToday}
                                                onSelectMuscle={m => setSelectedMuscle(m)}
                                            />
                                        </div>

                                        <div className="lg:col-span-7 space-y-4">
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Shield size={16} className="text-white" />
                                                    <h4 className="text-xs font-semibold text-white tracking-tight uppercase">
                                                        RADAR DE EQUILIBRIO ARTICULAR
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-zinc-400 mb-3 leading-relaxed font-normal">
                                                    Proporción de volumen entre patrones antagonistas para proteger tendones y articulaciones.
                                                </p>
                                                <div className="space-y-3 text-xs">
                                                    <div>
                                                        <div className="flex justify-between text-[11px] mb-1 font-medium">
                                                            <span className="text-zinc-300">Empuje vs Tracción</span>
                                                            <span className="text-[#10B981] font-mono">1.05 (Óptimo)</span>
                                                        </div>
                                                        <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-[#10B981] h-full rounded-full" style={{ width: "52%" }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-[11px] mb-1 font-medium">
                                                            <span className="text-zinc-300">Cuádriceps vs Cadena Posterior</span>
                                                            <span className="text-white font-mono">1.18 (Saludable)</span>
                                                        </div>
                                                        <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-white h-full rounded-full" style={{ width: "55%" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                                <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                                    ACCESO RÁPIDO A GRUPOS MUSCULARES
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                                    {ORDERED_MUSCLE_GROUPS.map(mg => {
                                                        const meta = MUSCLE_PALETTE[mg];
                                                        return (
                                                            <button
                                                                key={mg}
                                                                onClick={() => setSelectedMuscle(mg)}
                                                                className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 rounded-2xl text-left text-zinc-300 hover:text-white transition-all flex items-center justify-between group active:scale-[0.98]"
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <span 
                                                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                                                                        style={{ backgroundColor: meta.hex, boxShadow: `0 0 8px ${meta.hex}60` }}
                                                                    />
                                                                    <span className="font-medium truncate">{meta.name}</span>
                                                                </div>
                                                                <ArrowRight size={12} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botón para Explorar toda la Librería de Ejercicios Disponibles */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.16] rounded-3xl p-4 sm:p-5 shadow-xl transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0 shadow-sm">
                                    <Layers size={18} className="text-[#FF2A2A]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                                            LIBRERÍA COMPLETA DE EJERCICIOS
                                        </h3>
                                        <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full font-semibold">
                                            CATÁLOGO ACTIVO: {catalogCount} EJERCICIOS
                                        </span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-zinc-400 font-normal mt-0.5">
                                        Filtra por grupo muscular, analiza la biomecánica y agrégalos a tu sesión activa
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="px-4 py-2.5 bg-white/[0.08] hover:bg-white text-white hover:text-black text-xs font-semibold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 border border-white/20 hover:border-white group"
                                    title="Escanear Máquina o Equipo con Cámara IA"
                                >
                                    <Camera size={14} className="text-[#FF2A2A] group-hover:text-black shrink-0 transition-colors" />
                                    <span>Escanear Máquina</span>
                                </button>

                                <button
                                    onClick={() => setIsExerciseLibraryOpen(true)}
                                    className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                                >
                                    <Dumbbell size={14} />
                                    <span>Ver Librería Completa</span>
                                </button>
                            </div>
                        </div>

                        {/* Exercises List (Apple Fitness+ 2-Column Layout) */}
                        <div className="space-y-5">
                            {activeExercises.map((ex, exIdx) => {
                                const memory = exerciseMemory[ex.id] || { weight: 0, reps: 0 };
                                const target = calculateTodayTarget(
                                    memory.weight,
                                    memory.reps,
                                    ex.rep_range_min,
                                    ex.rep_range_max,
                                    readiness,
                                    weightUnit
                                );

                                const isNewBlock = !!(ex.blockId && (exIdx === 0 || activeExercises[exIdx - 1]?.blockId !== ex.blockId));

                                return (
                                    <div key={`${ex.id}_${exIdx}`} className="space-y-3">
                                        {isNewBlock && (
                                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#10B981]/15 via-[#10B981]/5 to-transparent border border-[#10B981]/30 text-white">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                                                    <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                                                        {ex.blockTitle || `BLOQUE DE CIRCUITO • ${ex.blockRounds || 3} VUELTAS (${ex.blockRounds || 3}x)`}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                                                    Descanso al terminar vuelta
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`bg-[#121214]/90 backdrop-blur-xl border ${
                                                ex.blockId ? "border-l-4 border-l-[#10B981] border-white/[0.08]" : "border-white/[0.08]"
                                            } rounded-3xl p-5 sm:p-6 shadow-2xl transition-all hover:border-white/[0.15]`}
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
                                                            {ex.customPrescription && (
                                                                <div className="mb-2">
                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-[#FF2A2A]/15 text-[#FF6B6B] border border-[#FF2A2A]/30 px-3 py-1 rounded-xl shadow-sm">
                                                                        <Sparkles className="w-3.5 h-3.5 text-[#FF2A2A]" />
                                                                        <span>{ex.customPrescription}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <span className="text-[11px] font-medium bg-white/[0.06] text-zinc-300 px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                                                                    {ex.anatomical_subdivision}
                                                                </span>
                                                                <span className="text-[11px] font-semibold bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/20 px-2.5 py-0.5 rounded-full">
                                                                    Tier {ex.hypertrophy_tier}
                                                                </span>
                                                                {ex.blockTitle && (
                                                                    <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/25 uppercase font-bold">
                                                                        {ex.blockTitle.split("•")[0]?.trim() || "CIRCUITO"}
                                                                    </span>
                                                                )}
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
                                                            className="h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-mono font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
                                                            title="Ver técnica en YouTube"
                                                        >
                                                            <Play className="w-3 h-3 fill-white text-white" />
                                                            <span>YouTube</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                                        </a>

                                                        {/* Tempo Sonar Pill */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextState = !tempoActive[ex.id];
                                                                setTempoActive(prev => ({ ...prev, [ex.id]: nextState }));
                                                                if (nextState) {
                                                                    startTempoLoop(ex.id);
                                                                } else {
                                                                    stopTempoLoop(ex.id);
                                                                }
                                                            }}
                                                            className={`h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-mono font-medium transition-all border ${
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
                                                            type="button"
                                                            onClick={() => {
                                                                setVbtExerciseName(ex.name);
                                                                setIsVbtModalOpen(true);
                                                            }}
                                                            className="h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08] transition-all"
                                                            title="Modo Velocidad VBT y Espejo IA"
                                                        >
                                                            <Gauge size={13} className="text-zinc-300" />
                                                            <span>VBT</span>
                                                        </button>

                                                        {/* Discos Inline Toggle (Solo en ejercicios de barra olímpica/EZ donde aplica cargar discos) */}
                                                        {isPlateLoadedExercise(ex.equipment, ex.name) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setInlinePlatesExId(prev => prev === ex.id ? null : ex.id)}
                                                                className={`h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                                                                    inlinePlatesExId === ex.id
                                                                        ? "bg-white text-black border-white font-semibold"
                                                                        : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/[0.08]"
                                                                }`}
                                                                title="Desglose de Discos para Barra Olímpica"
                                                            >
                                                                <Disc size={13} className={inlinePlatesExId === ex.id ? "text-black" : "text-zinc-300"} />
                                                                <span>Discos</span>
                                                            </button>
                                                        )}

                                                        {/* Random Instant Biomechanical Swap */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRandomSwapExercise(exIdx)}
                                                            className="h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
                                                            title="Swap Aleatorio Biomecánico Instantáneo"
                                                        >
                                                            <Shuffle size={13} className="text-zinc-300" />
                                                            <span>Random</span>
                                                        </button>

                                                        {/* Swap Manual Selector con Buscador en los 873 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSwapTargetIndex(exIdx)}
                                                            className="h-8 flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all shadow-sm active:scale-95 group"
                                                            title="Cambiar ejercicio por cualquier otro de los 873 con foto de GitHub"
                                                        >
                                                            <RefreshCw size={12} className="text-zinc-300 group-hover:text-black shrink-0 transition-colors" />
                                                            <span>Cambiar Ejercicio</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Inline Plate Calculation Pill */}
                                                {inlinePlatesExId === ex.id && isPlateLoadedExercise(ex.equipment, ex.name) && (
                                                    <div className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-between text-xs text-zinc-300 animate-in fade-in">
                                                        <div>
                                                            <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wide block">
                                                                Desglose exacto de carga por lado (Barra olímpica {weightUnit === "lbs" ? "45 lbs" : "20 kg"})
                                                            </span>
                                                            <span className="font-mono text-white text-sm font-semibold">
                                                                {formatPlatesSummary(target.suggestedWeight, weightUnit === "lbs" ? 45 : 20, weightUnit)}
                                                            </span>
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
                                                        <span className="text-white font-mono font-semibold">
                                                            {memory.reps > 0 ? `${memory.weight} ${weightUnit} × ${memory.reps} reps` : `0 ${weightUnit} × 0 reps`}
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-400 font-medium tracking-wide block">META HOY (OVERLOAD)</span>
                                                        <span className="text-white font-mono font-semibold">
                                                            {target.suggestedReps > 0
                                                                ? `${target.suggestedWeight} ${weightUnit} × ${target.suggestedReps} reps`
                                                                : `${ex.rep_range_min}-${ex.rep_range_max} reps (0 ${weightUnit})`}
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide block">1RM ESTIMADO</span>
                                                        <span className="text-white font-mono font-semibold">
                                                            {target.estimated1RM > 0 ? `${target.estimated1RM} ${weightUnit}` : `0 ${weightUnit}`}
                                                        </span>
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
                                                        const currentInput = setInputs[key] || {
                                                            weight: memory.reps > 0 ? memory.weight : 0,
                                                            reps: 0
                                                        };

                                                        return (
                                                            <div
                                                                key={setIdx}
                                                                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all gap-1.5 sm:gap-3 ${
                                                                    isCompleted
                                                                        ? "bg-[#10B981]/10 border-[#10B981]/30 text-white"
                                                                        : isVoiceActive && isVoiceListening
                                                                            ? "bg-[#FF2A2A]/10 border-[#FF2A2A]/50 text-white ring-1 ring-[#FF2A2A]"
                                                                            : "bg-white/[0.03] border-white/[0.06] text-zinc-200"
                                                                }`}
                                                            >
                                                                {/* Set Badge & Tactile Input Controls */}
                                                                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/[0.08] flex items-center justify-center font-bold text-white text-[11px] sm:text-xs font-mono shrink-0">
                                                                        S{setIdx + 1}
                                                                    </span>

                                                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                                                        {/* Tactile Weight Input */}
                                                                        <div className="h-8 sm:h-9 flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2 sm:px-2.5">
                                                                            <input
                                                                                type="number"
                                                                                step={weightUnit === "lbs" ? "1" : "0.5"}
                                                                                placeholder="0"
                                                                                value={currentInput.weight !== undefined && currentInput.weight !== "" ? currentInput.weight : ""}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setSetInputs(prev => ({
                                                                                        ...prev,
                                                                                        [key]: { ...currentInput, weight: val === "" ? "" : (parseFloat(val) || 0) }
                                                                                    }));
                                                                                }}
                                                                                className="w-11 sm:w-14 bg-transparent text-white font-mono font-semibold text-xs sm:text-sm text-center outline-none placeholder:text-zinc-600"
                                                                            />
                                                                            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">{weightUnit}</span>
                                                                        </div>

                                                                        <span className="text-zinc-500 font-mono text-[10px] sm:text-xs px-0.5 select-none">×</span>

                                                                        {/* Tactile Reps Input */}
                                                                        <div className="h-8 sm:h-9 flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2 sm:px-2.5">
                                                                            <input
                                                                                type="number"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={currentInput.reps !== undefined && currentInput.reps !== "" ? currentInput.reps : ""}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setSetInputs(prev => ({
                                                                                        ...prev,
                                                                                        [key]: { ...currentInput, reps: val === "" ? "" : (parseInt(val, 10) || 0) }
                                                                                    }));
                                                                                }}
                                                                                className="w-8 sm:w-11 bg-transparent text-white font-mono font-semibold text-xs sm:text-sm text-center outline-none placeholder:text-zinc-600"
                                                                            />
                                                                            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">reps</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions: Dictate & Complete (Palomita Only) */}
                                                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                                    <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                                                                        Descanso {ex.rest_seconds}s
                                                                    </span>

                                                                    {/* Voice Dictation Button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isVoiceListening && voiceActiveSet?.exerciseId === ex.id && voiceActiveSet?.setIdx === setIdx) {
                                                                                stopVoiceLogging();
                                                                                voiceActiveSetRef.current = null;
                                                                                setVoiceActiveSet(null);
                                                                                return;
                                                                            }
                                                                            const target = { exerciseId: ex.id, setIdx };
                                                                            voiceActiveSetRef.current = target;
                                                                            setVoiceActiveSet(target);
                                                                            startVoiceLogging();
                                                                        }}
                                                                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 shrink-0 ${
                                                                            isVoiceActive && isVoiceListening
                                                                                ? "bg-[#FF2A2A] text-white animate-pulse border-[#FF2A2A] shadow-lg shadow-red-600/30 ring-2 ring-[#FF2A2A]/50"
                                                                                : "bg-white/[0.06] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.12]"
                                                                        }`}
                                                                        title={`Dictar serie por voz (ej. '${weightUnit === "lbs" ? "135 por 10" : "80 por 10"}')`}
                                                                        aria-label="Dictar serie por voz"
                                                                    >
                                                                        <Mic size={15} className={isVoiceActive && isVoiceListening ? "animate-bounce" : ""} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCompleteSet(ex.id, setIdx, ex.rest_seconds)}
                                                                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 shrink-0 ${
                                                                            isCompleted
                                                                                ? "bg-[#10B981] text-black shadow-md shadow-[#10B981]/20"
                                                                                : "bg-white hover:bg-zinc-200 text-black shadow-md shadow-white/10"
                                                                        }`}
                                                                        title={isCompleted ? "Completada" : "Registrar serie"}
                                                                        aria-label={isCompleted ? "Completada" : "Registrar serie"}
                                                                    >
                                                                        <Check size={16} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>

                        {/* Cardio Finisher Block (Selector Diario al Final de la Sesión con Inclinación, Velocidad y Tiempo) */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                                        <HeartPulse size={20} className={todayCardio.completed ? "text-[#10B981]" : "text-[#FF2A2A]"} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase tracking-wide">
                                                CARDIO ZONA 2 (FINAL DE SESIÓN)
                                            </span>
                                            {todayCardio.completed && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                                                    <CheckCircle2 size={11} />
                                                    COMPLETADO
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-bold text-white tracking-tight mt-0.5">
                                            {CARDIO_PROTOCOLS[todayCardio.type]?.type || "Cardio Zona 2"}
                                        </h4>
                                    </div>
                                </div>

                                {todayCardio.type !== "none" && (
                                    <button
                                        onClick={() => handleUpdateCardio({ completed: !todayCardio.completed })}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                                            todayCardio.completed
                                                ? "bg-[#10B981] text-black shadow-md shadow-[#10B981]/20 font-bold"
                                                : "bg-white hover:bg-zinc-200 text-black shadow-md shadow-white/10 active:scale-95"
                                        }`}
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>{todayCardio.completed ? "CARDIO LOGRADO" : "MARCAR REALIZADO"}</span>
                                    </button>
                                )}
                            </div>

                            {/* Selector de Modalidad Diario */}
                            <div className="space-y-2">
                                <span className="text-[11px] text-zinc-400 font-medium block">
                                    Elige tu cardio para hoy (puedes cambiarlo libremente al final de la sesión):
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {(["incline_treadmill", "stairmaster", "stationary_bike", "none"] as CardioType[]).map((key) => {
                                        const isSelected = todayCardio.type === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => handleUpdateCardio({ type: key })}
                                                className={`p-3 rounded-2xl text-left border transition-all ${
                                                    isSelected
                                                        ? "bg-white text-black border-white font-semibold shadow-md"
                                                        : "bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                                                }`}
                                            >
                                                <div className="font-bold text-xs">{CARDIO_PROTOCOLS[key]?.label}</div>
                                                <div className={`text-[10px] mt-0.5 ${isSelected ? "text-zinc-700" : "text-zinc-500"}`}>
                                                    {key === "none" ? "0 min" : `${CARDIO_PROTOCOLS[key]?.defaultMinutes} min rec.`}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Si eligió cardio, inputs detallados: Inclinación, Velocidad, Tiempo y Telemetría */}
                            {todayCardio.type !== "none" ? (
                                <div className="pt-2 space-y-4">
                                    {/* Metric Input Panels: Inclinación, Velocidad, Tiempo */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* 1. Inclinación / Pendiente */}
                                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.inclineLabel || "Inclinación"}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.inclineUnit || "%"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ incline: Math.max(0, Math.round((todayCardio.incline - (CARDIO_PROTOCOLS[todayCardio.type]?.inclineStep || 0.5)) * 10) / 10) })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    -
                                                </button>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        step={CARDIO_PROTOCOLS[todayCardio.type]?.inclineStep || 0.5}
                                                        min="0"
                                                        max="30"
                                                        value={todayCardio.incline}
                                                        onChange={(e) => handleUpdateCardio({ incline: parseFloat(e.target.value) || 0 })}
                                                        className="w-full text-center bg-black/40 border border-white/[0.1] rounded-xl py-2 px-2 text-white font-mono text-base font-bold focus:outline-none focus:border-white/40"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ incline: Math.round((todayCardio.incline + (CARDIO_PROTOCOLS[todayCardio.type]?.inclineStep || 0.5)) * 10) / 10 })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Quick Presets for Incline */}
                                            {(CARDIO_PROTOCOLS[todayCardio.type]?.inclinePresets?.length ?? 0) > 0 && (
                                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                                    <span className="text-[10px] text-zinc-500 mr-0.5">Presets:</span>
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.inclinePresets?.map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleUpdateCardio({ incline: val })}
                                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                                                                todayCardio.incline === val
                                                                    ? "bg-white text-black border-white font-bold"
                                                                    : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white"
                                                            }`}
                                                        >
                                                            {val}{CARDIO_PROTOCOLS[todayCardio.type]?.inclineUnit}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Velocidad / Cadencia */}
                                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.speedLabel || "Velocidad"}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.speedUnit || "km/h"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ speed: Math.max(0.5, Math.round((todayCardio.speed - (CARDIO_PROTOCOLS[todayCardio.type]?.speedStep || 0.1)) * 10) / 10) })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    -
                                                </button>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        step={CARDIO_PROTOCOLS[todayCardio.type]?.speedStep || 0.1}
                                                        min="0.5"
                                                        max="30"
                                                        value={todayCardio.speed}
                                                        onChange={(e) => handleUpdateCardio({ speed: parseFloat(e.target.value) || 0 })}
                                                        className="w-full text-center bg-black/40 border border-white/[0.1] rounded-xl py-2 px-2 text-white font-mono text-base font-bold focus:outline-none focus:border-white/40"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ speed: Math.round((todayCardio.speed + (CARDIO_PROTOCOLS[todayCardio.type]?.speedStep || 0.1)) * 10) / 10 })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Quick Presets for Speed */}
                                            {(CARDIO_PROTOCOLS[todayCardio.type]?.speedPresets?.length ?? 0) > 0 && (
                                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                                    <span className="text-[10px] text-zinc-500 mr-0.5">Presets:</span>
                                                    {CARDIO_PROTOCOLS[todayCardio.type]?.speedPresets?.map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleUpdateCardio({ speed: val })}
                                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                                                                todayCardio.speed === val
                                                                    ? "bg-white text-black border-white font-bold"
                                                                    : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white"
                                                            }`}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Tiempo / Duración */}
                                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                                    TIEMPO
                                                </span>
                                                <span className="text-xs font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                                    min
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ minutes: Math.max(5, todayCardio.minutes - 5) })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    -
                                                </button>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        min="1"
                                                        max="180"
                                                        value={todayCardio.minutes}
                                                        onChange={(e) => handleUpdateCardio({ minutes: parseInt(e.target.value) || 0 })}
                                                        className="w-full text-center bg-black/40 border border-white/[0.1] rounded-xl py-2 px-2 text-white font-mono text-base font-bold focus:outline-none focus:border-white/40"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCardio({ minutes: todayCardio.minutes + 5 })}
                                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Quick Presets for Time */}
                                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                                <span className="text-[10px] text-zinc-500 mr-0.5">Presets:</span>
                                                {[15, 20, 25, 30, 45].map((mins) => (
                                                    <button
                                                        key={mins}
                                                        type="button"
                                                        onClick={() => handleUpdateCardio({ minutes: mins })}
                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                                                            todayCardio.minutes === mins
                                                                ? "bg-white text-black border-white font-bold"
                                                                : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white"
                                                        }`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Telemetría Dinámica en Vivo: Gasto Calórico Estimado, Distancia y Zona Cardíaca */}
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="p-2.5 bg-black/30 rounded-xl border border-white/[0.04]">
                                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">CALORÍAS EST.</span>
                                            <span className="text-base sm:text-lg font-mono font-bold text-white">~{todayCardio.caloriesBurned} <span className="text-xs font-normal text-zinc-400">kcal</span></span>
                                        </div>
                                        <div className="p-2.5 bg-black/30 rounded-xl border border-white/[0.04]">
                                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">DISTANCIA EST.</span>
                                            <span className="text-base sm:text-lg font-mono font-bold text-white">{todayCardio.distanceKm} <span className="text-xs font-normal text-zinc-400">km</span></span>
                                        </div>
                                        <div className="p-2.5 bg-black/30 rounded-xl border border-white/[0.04]">
                                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">FRECUENCIA CARDÍACA</span>
                                            <span className="text-base sm:text-lg font-mono font-bold text-[#10B981]">120-140 <span className="text-xs font-normal text-zinc-400">BPM</span></span>
                                        </div>
                                        <div className="p-2.5 bg-black/30 rounded-xl border border-white/[0.04]">
                                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">ZONA METABÓLICA</span>
                                            <span className="text-base sm:text-lg font-mono font-bold text-white">Zona 2 <span className="text-xs font-normal text-zinc-400">(mTOR Safe)</span></span>
                                        </div>
                                    </div>

                                    {/* Protocol Details & Scientific Cue */}
                                    <div className="p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-1">
                                        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                                            {CARDIO_PROTOCOLS[todayCardio.type]?.protocol}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 font-mono">
                                            Zona 2: Estimulación mitocondrial suave sin interferir en la vía mTOR de hipertrofia muscular.
                                        </p>
                                    </div>

                                    {/* Action Save Button */}
                                    <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                                        <div className="text-xs text-zinc-400">
                                            {todayCardio.savedAt ? (
                                                <span className="text-[#10B981] flex items-center gap-1 font-medium">
                                                    <Check size={13} />
                                                    Guardado en tu historial ({new Date(todayCardio.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                </span>
                                            ) : (
                                                <span>Ajusta inclinación, velocidad y tiempo, luego pulsa guardar.</span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateCardio({ completed: true })}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>GUARDAR DATOS DE CARDIO</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-xs text-zinc-400 leading-relaxed font-normal">
                                    Has seleccionado descansar de cardio hoy. Todo el volumen metabólico se enfoca en la recuperación muscular y síntesis proteica de las series de fuerza.
                                </div>
                            )}
                        </div>

                        {/* Extra Volume Button */}
                        <div className={`p-6 bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl text-center space-y-2.5 shadow-xl transition-all duration-1000 ease-out ${
                            isZenModeActive ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}>
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
                    TAB 2: CALENDARIO & HISTORIAL UNIFICADO
                   ========================================================================= */}
                {activeTab === "calendar" && (
                    <ApexCalendarView
                        targetCalories={macros.targetCalories}
                        allNutritionLogs={allNutritionLogs}
                        dailyCardio={dailyCardio}
                        onSelectDateForNutrition={(d) => {
                            setActiveNutritionDate(d);
                            setActiveTab("nutrition");
                        }}
                        onGoToGym={() => setActiveTab("workout")}
                    />
                )}

                {/* =========================================================================
                    TAB 3: NUTRICIÓN & GEMINI CLINICAL
                   ========================================================================= */}
                {activeTab === "nutrition" && (
                    <div className="space-y-6">
                        {/* Indicador de Ciclado Nutricional (Activo cuando la metodología es Ciclado & Circuitos) */}
                        {trainingMethodology === "cycled_circuits" && (
                            <div className={`p-4 sm:p-5 rounded-3xl border flex items-center justify-between gap-4 shadow-xl transition-all ${
                                currentRoutine.carbCyclePhase === "high_carb"
                                    ? "bg-gradient-to-r from-[#10B981]/15 via-[#10B981]/5 to-transparent border-[#10B981]/30"
                                    : "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30"
                            }`}>
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold font-mono shrink-0 shadow-md ${
                                        currentRoutine.carbCyclePhase === "high_carb"
                                            ? "bg-[#10B981] text-black"
                                            : "bg-amber-500 text-black"
                                    }`}>
                                        <span className="text-[10px] leading-none">CARB</span>
                                        <span className="text-xs leading-none mt-0.5">{currentRoutine.carbCyclePhase === "high_carb" ? "ALTO" : "MOD/BAJO"}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs sm:text-sm font-bold text-white font-mono tracking-wide uppercase">
                                                {currentRoutine.carbCycleLabel || (currentRoutine.carbCyclePhase === "high_carb" ? "HIGH CARB DAY // CARGA DE GLUCÓGENO" : "LOW/MOD CARB // OXIDACIÓN LIPÍDICA")}
                                            </h4>
                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase">
                                                {currentRoutine.dayName || `DÍA ${currentRoutine.dayNumber}`}
                                            </span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">
                                            {currentRoutine.carbCyclePhase === "high_carb"
                                                ? "Día de alto impacto (Pierna / Glúteo): Prioriza carbohidratos complejos para máxima síntesis de glucógeno muscular y soporte de hipertrofia."
                                                : "Día de tren superior o torso: Mantén carbohidratos controlados para optimizar la sensibilidad a la insulina y la oxidación lipídica."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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

                        {/* Módulo de Registro Diario en 5 Tiempos & Checklist de Suplementos */}
                        <DailyMealTracker
                            targetCalories={macros.targetCalories}
                            targetProteinG={macros.proteinG}
                            supplements={supplements}
                            allNutritionLogs={allNutritionLogs}
                            onSaveLog={handleSaveNutritionLog}
                            activeDate={activeNutritionDate}
                            onSelectDate={setActiveNutritionDate}
                            dietPlan={dietPlan}
                            onGoToCalendar={() => setActiveTab("calendar")}
                        />

                        {/* AI 7-Day Plan Generator */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-white" />
                                    <h4 className="text-base font-bold text-white tracking-tight">
                                        PLAN DE DIETA CLÍNICA (7 DÍAS)
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {dietPlan && (
                                        <button
                                            onClick={() => setDietPlan(null)}
                                            className="px-3 py-1.5 bg-white/[0.04] hover:bg-[#FF2A2A]/20 text-zinc-400 hover:text-[#FF2A2A] border border-white/[0.08] hover:border-[#FF2A2A]/30 text-xs rounded-full transition-all"
                                            title="Borrar plan guardado"
                                        >
                                            Borrar Plan
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsDietPrefModalOpen(true)}
                                        disabled={dietLoading}
                                        className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-full shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
                                    >
                                        <Sparkles size={14} />
                                        <span>
                                            {dietLoading
                                                ? "GENERANDO CON GEMINI..."
                                                : dietPlan
                                                ? "REGENERAR CON GEMINI AI"
                                                : "GENERAR CON GEMINI AI"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {dietPlan ? (
                                <div className="space-y-4 text-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
                                        <div className="space-y-1.5 max-w-2xl">
                                            {dietPlan.dietaryTitle && (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20 font-mono text-[10px] font-semibold uppercase">
                                                        RÉGIMEN: {dietPlan.dietaryTitle}
                                                    </span>
                                                    {dietPlan.dietaryNotes && (
                                                        <span className="text-[10px] text-zinc-400 font-mono">
                                                            ({dietPlan.dietaryNotes})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-zinc-300 leading-relaxed">
                                                {dietPlan.monthlySummary || `Plan nutricional clínico de 7 días para ${bio.fitnessGoal === "surplus" ? "Superávit Anabólico" : bio.fitnessGoal === "maintenance" ? "Mantenimiento / Recomposición" : "Déficit Calórico"} (${dietPlan.caloriesTarget || macros.targetCalories} kcal/día • ${dietPlan.macros?.protein || macros.proteinG}g de proteína).`}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-mono text-[10px] font-semibold shrink-0 self-start sm:self-center">
                                            ● GUARDADO EN DISPOSITIVO
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {((dietPlan.thirtyDayPlan?.[0]?.meals) || (dietPlan.weeklyTemplates?.[0]?.meals) || []).map((m: any, idx: number) => {
                                            const mealName = m.mealName || m.name || `Comida ${idx + 1}`;
                                            const calories = m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)) || 0;
                                            const protein = m.proteinG || m.macros?.proteinG || 0;
                                            const items = m.items || (m.ingredients?.map((i: any) => `${i.grams}g ${i.item}`).join(" + ")) || "";
                                            return (
                                                <div key={idx} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                                                    <div className="flex justify-between font-semibold text-white mb-1.5">
                                                        <span>{mealName}</span>
                                                        <span className="text-zinc-400 font-mono text-xs">{calories} kcal ({protein}g P)</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-xs leading-relaxed">{items}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-white/[0.08] rounded-2xl text-xs text-zinc-500 font-normal">
                                    Presiona "Generar con Gemini AI" para estructurar tus 7 días de alimentación exacta calculada a tus macros. Una vez generado, quedará guardado automáticamente en tu dispositivo.
                                </div>
                            )}
                        </div>

                        {/* Lista de Compras Consolidada (solo se muestra cuando el plan ha sido generado con Gemini) */}
                        {dietPlan && (
                            <ShoppingList />
                        )}
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
                                    <div className="flex justify-between items-center flex-wrap gap-1.5">
                                        <label className="text-zinc-400 text-xs font-medium block">
                                            OBJETIVO NUTRICIONAL & CALÓRICO
                                        </label>
                                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                            (bio.fitnessGoal || "deficit") === "deficit"
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : (bio.fitnessGoal || "deficit") === "surplus"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        }`}>
                                            {macros.targetCalories.toLocaleString()} kcal/día (
                                            {bio.caloricAdjustmentPct && bio.caloricAdjustmentPct > 0 ? `+${bio.caloricAdjustmentPct}%` : `${bio.caloricAdjustmentPct ?? -15}%`}
                                            )
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

                                    {/* Botones de Porcentaje con Total Calórico Diario */}
                                    {(bio.fitnessGoal || "deficit") === "deficit" && (
                                        <div className="flex gap-2 pt-1">
                                            {[-10, -15, -20, -25].map(pct => {
                                                const cal = Math.round(macros.tdee * (1 + pct / 100));
                                                const isSelected = (bio.caloricAdjustmentPct ?? -15) === pct;
                                                return (
                                                    <button
                                                        key={pct}
                                                        onClick={() => setBio({ ...bio, caloricAdjustmentPct: pct, caloricDeficitPct: Math.abs(pct) })}
                                                        className={`flex-1 py-2 px-1 text-center rounded-xl border text-xs font-mono transition-all ${
                                                            isSelected
                                                                ? "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm font-bold"
                                                                : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                                        }`}
                                                    >
                                                        <div className="font-bold">{pct}%</div>
                                                        <div className={`text-[10px] ${isSelected ? "text-amber-300 font-semibold" : "text-zinc-500"}`}>
                                                            {cal} kcal
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {bio.fitnessGoal === "maintenance" && (
                                        <div className="text-center py-2 px-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-zinc-300 text-xs font-mono">
                                            <span className="font-bold text-white">{macros.tdee.toLocaleString()} kcal/día</span> (100% TDEE de Equilibrio)
                                        </div>
                                    )}

                                    {bio.fitnessGoal === "surplus" && (
                                        <div className="flex gap-2 pt-1">
                                            {[5, 10, 15, 20].map(pct => {
                                                const cal = Math.round(macros.tdee * (1 + pct / 100));
                                                const isSelected = (bio.caloricAdjustmentPct || 15) === pct;
                                                return (
                                                    <button
                                                        key={pct}
                                                        onClick={() => setBio({ ...bio, caloricAdjustmentPct: pct, caloricDeficitPct: 0 })}
                                                        className={`flex-1 py-2 px-1 text-center rounded-xl border text-xs font-mono transition-all ${
                                                            isSelected
                                                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm font-bold"
                                                                : "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white"
                                                        }`}
                                                    >
                                                        <div className="font-bold">+{pct}%</div>
                                                        <div className={`text-[10px] ${isSelected ? "text-emerald-300 font-semibold" : "text-zinc-500"}`}>
                                                            {cal} kcal
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mantenimiento & Borrado de Datos de Ejercicio */}
                        <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#FF2A2A]/30 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all text-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 flex items-center justify-center text-[#FF2A2A] shrink-0">
                                        <Trash2 size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white tracking-tight uppercase">
                                            MANTENIMIENTO DE DATOS DE EJERCICIO
                                        </h4>
                                        <p className="text-[11px] text-zinc-400 font-normal">
                                            Reinicia repeticiones previas, memoria de pesos y series registradas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {resetSuccessMessage && (
                                <div className="p-3.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl text-xs text-[#10B981] flex items-center gap-2">
                                    <CheckCircle2 size={16} className="shrink-0" />
                                    <span>{resetSuccessMessage}</span>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                                <div>
                                    <span className="font-semibold text-white block">
                                        Borrar Historial de Ejercicios Previos
                                    </span>
                                    <span className="text-zinc-400 text-[11px]">
                                        Limpia todas las repeticiones y pesos guardados para que inicien en 0 reps.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsResetExerciseModalOpen(true)}
                                    className="px-4 py-2 bg-[#FF2A2A]/15 hover:bg-[#FF2A2A]/25 text-[#FF2A2A] border border-[#FF2A2A]/30 rounded-xl font-semibold transition-all shrink-0 self-start sm:self-auto active:scale-95 flex items-center gap-1.5"
                                >
                                    <Trash2 size={13} />
                                    <span>Borrar Datos Previos</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Voice Dictation HUD (Apple / Tesla Style) */}
            {(isVoiceListening || voiceErrorMessage || voiceSuccessToast) && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.15] rounded-3xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                voiceErrorMessage
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : voiceSuccessToast
                                        ? "bg-[#10B981] text-black shadow-[#10B981]/25"
                                        : "bg-[#FF2A2A] text-white shadow-red-600/30 animate-pulse"
                            }`}>
                                {voiceErrorMessage ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : voiceSuccessToast ? (
                                    <Check className="w-5 h-5" strokeWidth={3} />
                                ) : (
                                    <Mic className="w-5 h-5 animate-bounce" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold font-mono tracking-wider uppercase truncate">
                                        {voiceErrorMessage
                                            ? "AVISO DE MICRÓFONO"
                                            : voiceSuccessToast
                                                ? "SERIE REGISTRADA"
                                                : "ESCUCHANDO DICTADO"}
                                    </span>
                                    {isVoiceListening && (
                                        <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-ping shrink-0" />
                                    )}
                                </div>
                                <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">
                                    {voiceErrorMessage
                                        ? voiceErrorMessage
                                        : voiceSuccessToast
                                            ? voiceSuccessToast
                                            : (voiceInterimTranscript || voiceTranscript)
                                                ? `"${voiceInterimTranscript || voiceTranscript}"`
                                                : `Di ej: "${weightUnit === "lbs" ? "135 por 10" : "80 por 10"}" o "10 reps"`}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                stopVoiceLogging();
                                clearVoiceError();
                                setVoiceSuccessToast(null);
                                voiceActiveSetRef.current = null;
                                setVoiceActiveSet(null);
                            }}
                            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 active:scale-95"
                            title="Cerrar"
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Tesla-Style Spotify Player & Rest Countdown Bar */}
            <SpotifyPlayerWidget
                onOpenSettings={() => setIsSpotifyModalOpen(true)}
                restRemaining={restRemaining}
                onSkipRest={() => setRestRemaining(null)}
            />

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
                    initialWeight={plateModalWeight > 0 ? plateModalWeight : (weightUnit === "lbs" ? 135 : 80)}
                    unit={weightUnit}
                    onClose={() => setIsPlateModalOpen(false)}
                />
            )}

            {/* Modal de Librería Completa de Ejercicios */}
            <ExerciseLibraryModal
                isOpen={isExerciseLibraryOpen}
                onClose={() => setIsExerciseLibraryOpen(false)}
                onAddExercise={handleAddExerciseToSession}
                activeExerciseIds={activeExercises.map(e => e.id)}
            />

            {/* Modal de Escáner IA de Máquinas y Equipos */}
            <GymEquipmentScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onAddExerciseToSession={handleAddExerciseToSession}
                activeExerciseIds={activeExercises.map(e => e.id)}
            />

            {/* Modal de Spotify & Playlists de Entrenamiento */}
            <SpotifySettingsModal
                isOpen={isSpotifyModalOpen}
                onClose={() => setIsSpotifyModalOpen(false)}
                onStatusChange={() => setIsSpotifyLinked(isSpotifyConnected())}
            />

            {/* Modal de Swap con Buscador y Filtros Biomecánicos */}
            <ExerciseSwapModal
                isOpen={swapTargetIndex !== null}
                onClose={() => setSwapTargetIndex(null)}
                currentExercise={swapTargetIndex !== null ? activeExercises[swapTargetIndex] : null}
                onSelectSwap={handleSelectSwapReplacement}
                activeExerciseIds={activeExercises.map(e => e.id)}
            />

            {/* Modal de Pregunta Previa: Preferencias Dietéticas (Keto, Vegetariana, etc.) para Gemini */}
            <DietPreferenceModal
                isOpen={isDietPrefModalOpen}
                onClose={() => setIsDietPrefModalOpen(false)}
                onConfirm={(selectedDiet, notes) => handleGenerateAiDiet(selectedDiet, notes)}
                initialDiet={dietPreference}
                initialNotes={dietNotes}
                isLoading={dietLoading}
            />

            {/* Modal de Importador Inteligente de Rutina en Texto Libre */}
            <TextToApexRoutineModal
                isOpen={isRoutineImporterOpen}
                onClose={() => setIsRoutineImporterOpen(false)}
                onApplyRoutine={(importedDays) => {
                    setCustomWeeklyRoutine(importedDays);
                    setCurrentDayIndex(0);
                }}
                catalog={EXERCISE_DATABASE}
            />

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

            {/* Modal de Confirmación para Borrar Historial de Ejercicios */}
            {isResetExerciseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsResetExerciseModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#121214] border border-white/[0.12] rounded-3xl p-6 shadow-2xl z-10 font-sans text-white space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 flex items-center justify-center text-[#FF2A2A] shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white uppercase">
                                    ¿BORRAR DATOS PREVIOS?
                                </h3>
                                <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            Se eliminarán todas las repeticiones previas, la memoria de pesos en ejercicios y el historial de series en tu dispositivo. Tus ejercicios volverán a iniciar en <strong>0 repeticiones</strong> hasta que los vayas guardando nuevamente.
                        </p>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsResetExerciseModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAllExerciseData}
                                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#FF2A2A] hover:bg-[#FF2A2A]/90 text-white shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <Trash2 size={13} />
                                <span>Sí, Borrar Todos los Datos</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guía y Tutorial Detallado para Todos */}
            <ApexOnboardingModal
                isOpen={isOnboardingModalOpen}
                onClose={() => setIsOnboardingModalOpen(false)}
            />

            {/* Formulario y Cuestionario de Feedback */}
            <ApexFeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
            />

            {/* Executive Apple / Tesla Style Footer */}
            <ApexFooter />

            {/* PWA Floating Installation Prompt Banner */}
            <PWAInstallBanner />
        </div>
    );
}
