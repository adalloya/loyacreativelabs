// src/components/apex/v2/ApexV2View.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Dumbbell,
    Flame,
    HeartPulse,
    Layers,
    Sparkles,
    Shield,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Sliders
} from "lucide-react";
import {
    calculateTodayTarget,
    ExerciseItem,
    ReadinessState,
    EXERCISE_DATABASE,
    CardioType,
    DailyCardioEntry,
    isBodyweightExercise
} from "@/lib/hypertrophy-engine";
import { translateExerciseNameToSpanish } from "@/lib/spanish-exercise-translator";
import { getInitialTheme, Theme } from "@/lib/theme";
import { ApexV2BottomNav, ApexV2Tab } from "./ApexV2BottomNav";
import { ApexV2ExerciseCard } from "./ApexV2ExerciseCard";
import { ApexV2NutritionCalendarHub } from "./ApexV2NutritionCalendarHub";
import { ApexV2AnatomyView } from "./ApexV2AnatomyView";
import { ApexV2CardioFinisher } from "./ApexV2CardioFinisher";
import { ApexV2SettingsView } from "./ApexV2SettingsView";
import { ApexV2Footer } from "./ApexV2Footer";
import { useApexVoiceAgent, VoiceAgentActionResult, VoiceAgentWorkoutResult } from "@/hooks/useApexVoiceAgent";
import { ApexVoiceExercisePickerModal } from "./ApexVoiceExercisePickerModal";
import {
    DailyNutritionLog,
    createEmptyDailyNutritionLog,
    FoodItem,
    getLocalDateString
} from "@/lib/nutrition-tracker";
import {
    spotifyPlay,
    spotifyPause,
    spotifyNext,
    spotifyPrevious,
    spotifyPlayCuratedPlaylist,
    spotifySearchAndPlay
} from "@/services/spotifyService";

interface ApexV2ViewProps {
    profile: any;
    timeGreeting: string;
    todayFormattedDate: string;
    isScreenLocked: boolean;
    environmentMode: string;
    setEnvironmentMode: (mode: any) => void;
    weightUnit: "lbs" | "kg";
    setWeightUnit: (unit: "lbs" | "kg") => void;
    trainingMethodology: "traditional" | "cycled_circuits";
    setTrainingMethodology: (m: "traditional" | "cycled_circuits") => void;
    readiness: ReadinessState;
    setReadiness: (r: ReadinessState) => void;
    weeklyProgram: any[];
    currentRoutine: any;
    activeDayIndex: number;
    handleDaySelect: (idx: number) => void;
    activeExercises: ExerciseItem[];
    exerciseMemory: Record<string, { weight: number; reps: number }>;
    completedSets: Record<string, boolean>;
    setInputs: Record<string, { weight: number | string; reps: number | string }>;
    handleSetInputChange: (key: string, field: "weight" | "reps", value: any) => void;
    handleCompleteSet: (exerciseId: string, setIdx: number, restSeconds: number, customWeight?: number, customReps?: number) => void;
    tempoActive: Record<string, boolean>;
    setTempoActive: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    startTempoLoop: (id: string) => void;
    stopTempoLoop: (id: string) => void;
    handleRandomSwapExercise: (exIdx: number) => void;
    setSwapTargetIndex: (idx: number | null) => void;
    setPlateModalWeight: (w: number) => void;
    setIsPlateModalOpen: (open: boolean) => void;
    setVbtExerciseName: (name: string) => void;
    setIsVbtModalOpen: (open: boolean) => void;
    setIsScannerOpen: (open: boolean) => void;
    setIsExerciseLibraryOpen: (open: boolean) => void;
    setIsRoutineImporterOpen: (open: boolean) => void;
    setIsDietPrefModalOpen: (open: boolean) => void;
    setIsInstallModalOpen: (open: boolean) => void;
    setIsSpotifyModalOpen: (open: boolean) => void;
    isSpotifyLinked: boolean;
    setIsOnboardingModalOpen: (open: boolean) => void;
    setIsFeedbackModalOpen: (open: boolean) => void;
    pdfProfile: any;
    pdfDiet: any;
    macros: any;
    supplements: any[];
    setSupplements?: (sups: any[]) => void;
    allNutritionLogs: any;
    handleSaveNutritionLog: (date: string, log: any) => void;
    activeNutritionDate: string;
    setActiveNutritionDate: (date: string) => void;
    dietPlan: any;
    groceryList: any;
    restRemaining: number | null;
    handleSkipRest: () => void;
    selectedMuscle: any;
    setSelectedMuscle: (m: any) => void;
    activeMusclesToday: any[];
    catalogCount: number;
    onSwitchToStable: () => void;
    exerciseNotes: Record<string, string>;
    setExerciseNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    isPlateLoadedExercise: (equipment?: string, name?: string) => boolean;
    onAddExercise?: (ex: ExerciseItem) => void;
    todayCardio?: DailyCardioEntry;
    onUpdateCardio?: (typeOrUpdates: CardioType | (Partial<DailyCardioEntry> & { type?: CardioType }), minutes?: number, completed?: boolean) => void;
    onRemoveExercise?: (index: number) => void;
}

export const ApexV2View: React.FC<ApexV2ViewProps> = ({
    profile,
    timeGreeting,
    todayFormattedDate,
    isScreenLocked,
    environmentMode,
    setEnvironmentMode,
    weightUnit,
    setWeightUnit,
    trainingMethodology,
    setTrainingMethodology,
    readiness,
    setReadiness,
    weeklyProgram,
    currentRoutine,
    activeDayIndex,
    handleDaySelect,
    activeExercises,
    exerciseMemory,
    completedSets,
    setInputs,
    handleSetInputChange,
    handleCompleteSet,
    tempoActive,
    setTempoActive,
    startTempoLoop,
    stopTempoLoop,
    handleRandomSwapExercise,
    setSwapTargetIndex,
    setPlateModalWeight,
    setIsPlateModalOpen,
    setVbtExerciseName,
    setIsVbtModalOpen,
    setIsScannerOpen,
    setIsExerciseLibraryOpen,
    setIsRoutineImporterOpen,
    setIsDietPrefModalOpen,
    setIsInstallModalOpen,
    setIsSpotifyModalOpen,
    isSpotifyLinked,
    setIsOnboardingModalOpen,
    setIsFeedbackModalOpen,
    pdfProfile,
    pdfDiet,
    macros,
    supplements,
    setSupplements,
    allNutritionLogs,
    handleSaveNutritionLog,
    activeNutritionDate,
    setActiveNutritionDate,
    dietPlan,
    groceryList,
    restRemaining,
    handleSkipRest,
    selectedMuscle,
    setSelectedMuscle,
    activeMusclesToday,
    catalogCount,
    onSwitchToStable,
    exerciseNotes,
    setExerciseNotes,
    isPlateLoadedExercise,
    onAddExercise,
    todayCardio,
    onUpdateCardio,
    onRemoveExercise
}) => {
    // Current V2 active navigation destination (Entrenar, Nutrición, Anatomía, Ajustes)
    const [activeTab, setActiveTab] = useState<ApexV2Tab>("workout");
    const [theme, setTheme] = useState<Theme>("dark");
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(0);
    const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState<boolean>(true);

    // Resetear al primer ejercicio pendiente al cambiar de día
    useEffect(() => {
        if (!activeExercises || activeExercises.length === 0) {
            setSelectedExerciseIndex(0);
            return;
        }
        const firstPending = activeExercises.findIndex((ex) => {
            const ts = (ex as any).target_sets || ex.default_sets || 3;
            const cc = Array.from({ length: ts }).filter(
                (_, sIdx) => completedSets[`${ex.id}_${sIdx}`]
            ).length;
            return cc < ts;
        });
        setSelectedExerciseIndex(firstPending !== -1 ? firstPending : (activeExercises.length > 0 ? -1 : 0));
    }, [activeDayIndex]);

    // Scroll hasta arriba al cambiar de pestaña / abrir menú de ajustes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [activeTab]);

    useEffect(() => {
        setTheme(getInitialTheme());
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

    // Voice Agent State & Ambiguity Modal
    const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
    const [voicePickerSpokenName, setVoicePickerSpokenName] = useState("");
    const [voicePickerCandidates, setVoicePickerCandidates] = useState<ExerciseItem[]>([]);
    const [pendingVoiceWorkoutData, setPendingVoiceWorkoutData] = useState<VoiceAgentWorkoutResult | null>(null);

    const handleApplyVoiceExercise = React.useCallback((targetEx: ExerciseItem, workoutData?: VoiceAgentWorkoutResult | null) => {
        // 1. Inyectar ejercicio si no está en la rutina de hoy
        if (!activeExercises.some(e => e.id === targetEx.id)) {
            if (onAddExercise) {
                onAddExercise(targetEx);
            }
        }

        // 2. Determinar índice de serie objetivo (la primera incompleta o la 0)
        let targetSetIdx = 0;
        for (let s = 0; s < (targetEx.default_sets || 3); s++) {
            if (!completedSets[`${targetEx.id}_${s}`]) {
                targetSetIdx = s;
                break;
            }
        }

        const weightVal = (workoutData?.weight !== undefined && workoutData?.weight !== null)
            ? workoutData.weight
            : (exerciseMemory[targetEx.id]?.weight || 0);

        const repsVal = (workoutData?.reps !== undefined && workoutData?.reps !== null)
            ? workoutData.reps
            : (targetEx.rep_range_min || 10);

        const setKey = `${targetEx.id}_${targetSetIdx}`;
        handleSetInputChange(setKey, "weight", weightVal);
        handleSetInputChange(setKey, "reps", repsVal);

        const restSecs = targetEx.rest_seconds || (trainingMethodology === "cycled_circuits" ? 45 : 90);
        handleCompleteSet(targetEx.id, targetSetIdx, restSecs, weightVal, repsVal);

        // Enfocar el ejercicio
        const foundIdx = activeExercises.findIndex(e => e.id === targetEx.id);
        if (foundIdx >= 0) {
            setSelectedExerciseIndex(foundIdx);
        }
    }, [activeExercises, completedSets, exerciseMemory, handleCompleteSet, handleSetInputChange, onAddExercise, trainingMethodology]);

    const handleCreateCustomVoiceExercise = React.useCallback((name: string, workoutData?: VoiceAgentWorkoutResult | null) => {
        const cleanName = name.trim();
        const customId = "custom_" + Date.now();
        const customEx: ExerciseItem = {
            id: customId,
            name: cleanName,
            primary_muscle: "chest",
            anatomical_subdivision: "Personalizado",
            secondary_muscles: [],
            equipment: "dumbbell",
            movement_pattern: "press",
            hypertrophy_tier: "A",
            resistance_profile: "mid_range_overload",
            biomechanical_cue: "Control excéntrico de 3 segundos y contracción controlada",
            default_sets: 3,
            rep_range_min: 8,
            rep_range_max: 12,
            target_rir: 1,
            rest_seconds: 90
        };

        handleApplyVoiceExercise(customEx, workoutData);
    }, [handleApplyVoiceExercise]);

    const handleVoiceActionResult = React.useCallback((action: VoiceAgentActionResult) => {
        // Conmutación automática de sección si el dictado pertenece a otra sección
        if (action.targetTab && action.targetTab !== activeTab) {
            setActiveTab(action.targetTab);
        }

        if (action.intent === "LOG_WORKOUT") {
            setActiveTab("workout");
            const workoutData = action.workout;
            const spokenName = workoutData?.exerciseName?.trim() || "";

            if (spokenName) {
                const normSpoken = spokenName.toLowerCase();
                // 1. Buscar en activeExercises
                const existing = activeExercises.find(e =>
                    e.name.toLowerCase().includes(normSpoken) || normSpoken.includes(e.name.toLowerCase())
                );

                if (existing) {
                    handleApplyVoiceExercise(existing, workoutData);
                    return;
                }

                // 2. Buscar en catálogo completo
                const matches = EXERCISE_DATABASE.filter(e => {
                    const eNorm = e.name.toLowerCase();
                    return eNorm.includes(normSpoken) || normSpoken.includes(eNorm);
                });

                if (matches.length === 1) {
                    handleApplyVoiceExercise(matches[0], workoutData);
                } else if (matches.length > 1) {
                    setVoicePickerCandidates(matches.slice(0, 5));
                    setVoicePickerSpokenName(spokenName);
                    setPendingVoiceWorkoutData(workoutData || null);
                    setIsVoicePickerOpen(true);
                } else {
                    setVoicePickerCandidates([]);
                    setVoicePickerSpokenName(spokenName);
                    setPendingVoiceWorkoutData(workoutData || null);
                    setIsVoicePickerOpen(true);
                }
            } else {
                // Si no especificó nombre, aplicar al ejercicio actualmente abierto/seleccionado
                const currentEx = (selectedExerciseIndex >= 0 && selectedExerciseIndex < activeExercises.length)
                    ? activeExercises[selectedExerciseIndex]
                    : activeExercises[0];

                if (currentEx) {
                    handleApplyVoiceExercise(currentEx, workoutData);
                }
            }
        } else if (action.intent === "LOG_NUTRITION") {
            setActiveTab("nutrition");
            const nutData = action.nutrition;
            if (nutData && nutData.foods && nutData.foods.length > 0) {
                const dateStr = activeNutritionDate || getLocalDateString();
                const currentLog: DailyNutritionLog = allNutritionLogs[dateStr]
                    ? JSON.parse(JSON.stringify(allNutritionLogs[dateStr]))
                    : createEmptyDailyNutritionLog(dateStr);

                const cat = nutData.mealCategory || "lunch";
                if (!currentLog.meals[cat]) {
                    currentLog.meals[cat] = [];
                }

                nutData.foods.forEach(f => {
                    currentLog.meals[cat].push({
                        id: "food_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
                        name: f.name,
                        calories: Math.round(f.calories || 0),
                        proteinG: Math.round(f.proteinG || 0),
                        carbsG: Math.round(f.carbsG || 0),
                        fatsG: Math.round(f.fatsG || 0),
                        time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                    });
                });

                handleSaveNutritionLog(dateStr, currentLog);
            }
        } else if (action.intent === "LOG_DIET_PLAN") {
            setActiveTab("nutrition");
            const dateStr = activeNutritionDate || getLocalDateString();
            const currentLog: DailyNutritionLog = allNutritionLogs[dateStr]
                ? JSON.parse(JSON.stringify(allNutritionLogs[dateStr]))
                : createEmptyDailyNutritionLog(dateStr);

            const templateMeals = (dietPlan?.thirtyDayPlan?.[0]?.meals) || (dietPlan?.weeklyTemplates?.[0]?.meals);
            if (templateMeals && Array.isArray(templateMeals) && templateMeals.length > 0) {
                const catKeys: Array<"breakfast" | "snack1" | "lunch" | "snack2" | "dinner"> = [
                    "breakfast", "snack1", "lunch", "snack2", "dinner"
                ];
                templateMeals.forEach((m: any, idx: number) => {
                    const cat = catKeys[idx % catKeys.length];
                    currentLog.meals[cat].push({
                        id: "diet_meal_" + Date.now() + "_" + idx,
                        name: m.name + (m.items ? `: ${m.items}` : ""),
                        calories: Number(m.calories) || 400,
                        proteinG: Number(m.proteinG) || 30,
                        time: idx === 0 ? "08:30" : idx === 1 ? "11:30" : idx === 2 ? "14:30" : idx === 3 ? "17:30" : "20:30"
                    });
                });
            } else {
                const targetCal = macros?.targetCalories || 2200;
                const targetProt = macros?.proteinG || 160;
                currentLog.meals.breakfast.push({
                    id: "diet_bf_" + Date.now(),
                    name: "Desayuno estructurado (Huevos + Avena con proteína)",
                    calories: Math.round(targetCal * 0.28),
                    proteinG: Math.round(targetProt * 0.28),
                    time: "08:30"
                });
                currentLog.meals.lunch.push({
                    id: "diet_lu_" + Date.now(),
                    name: "Almuerzo Anabólico (Pechuga de pollo + Arroz + Aguacate)",
                    calories: Math.round(targetCal * 0.38),
                    proteinG: Math.round(targetProt * 0.38),
                    time: "14:00"
                });
                currentLog.meals.dinner.push({
                    id: "diet_dn_" + Date.now(),
                    name: "Cena Regenerativa (Pescado o Lomo + Papa + Ensalada)",
                    calories: Math.round(targetCal * 0.34),
                    proteinG: Math.round(targetProt * 0.34),
                    time: "20:30"
                });
            }

            handleSaveNutritionLog(dateStr, currentLog);
        } else if (action.intent === "SEARCH_EXERCISE") {
            setActiveTab("anatomy");
            setIsExerciseLibraryOpen(true);
        } else if (action.intent === "NAVIGATE" && action.targetTab) {
            setActiveTab(action.targetTab);
        } else if (action.intent === "MUSIC_CONTROL" && action.music) {
            const m = action.music;
            if (m.action === "play_bpm") {
                const targetPlaylist = m.query || (
                    m.bpmCategory === "low"
                        ? "lofi-recovery"
                        : m.bpmCategory === "mid"
                            ? "mansion-reggaeton"
                            : "gym-phonk"
                );
                spotifyPlayCuratedPlaylist(targetPlaylist);
            } else if (m.action === "search_play" && m.query) {
                spotifySearchAndPlay(m.query);
            } else if (m.action === "pause") {
                spotifyPause();
            } else if (m.action === "play") {
                spotifyPlay().then((res) => {
                    if (!res) {
                        spotifyPlayCuratedPlaylist("gym-phonk");
                    }
                });
            } else if (m.action === "next") {
                spotifyNext();
            } else if (m.action === "previous") {
                spotifyPrevious();
            }
        }
    }, [
        activeTab,
        activeExercises,
        activeNutritionDate,
        allNutritionLogs,
        handleSaveNutritionLog,
        dietPlan,
        macros,
        selectedExerciseIndex,
        handleApplyVoiceExercise,
        setIsExerciseLibraryOpen
    ]);

    // Procesador de múltiples órdenes recibidas en un solo dictado de audio
    const handleBatchVoiceActions = React.useCallback((actions: VoiceAgentActionResult[]) => {
        if (!actions || actions.length === 0) return;

        // Determinar pestaña principal según el contenido prioritario
        const hasWorkout = actions.some(a => a.intent === "LOG_WORKOUT");
        const hasNutrition = actions.some(a => a.intent === "LOG_NUTRITION" || a.intent === "LOG_DIET_PLAN");
        const hasSearch = actions.some(a => a.intent === "SEARCH_EXERCISE");

        if (hasWorkout) {
            setActiveTab("workout");
        } else if (hasNutrition) {
            setActiveTab("nutrition");
        } else if (hasSearch) {
            setActiveTab("anatomy");
        }

        // 1. Procesar todas las acciones de Nutrición combinadas en una sola mutación
        const nutritionActions = actions.filter(a => a.intent === "LOG_NUTRITION");
        const dietActions = actions.filter(a => a.intent === "LOG_DIET_PLAN");

        if (nutritionActions.length > 0 || dietActions.length > 0) {
            const dateStr = activeNutritionDate || getLocalDateString();
            const currentLog: DailyNutritionLog = allNutritionLogs[dateStr]
                ? JSON.parse(JSON.stringify(allNutritionLogs[dateStr]))
                : createEmptyDailyNutritionLog(dateStr);

            if (dietActions.length > 0) {
                const templateMeals = (dietPlan?.thirtyDayPlan?.[0]?.meals) || (dietPlan?.weeklyTemplates?.[0]?.meals);
                if (templateMeals && Array.isArray(templateMeals) && templateMeals.length > 0) {
                    const catKeys: Array<"breakfast" | "snack1" | "lunch" | "snack2" | "dinner"> = [
                        "breakfast", "snack1", "lunch", "snack2", "dinner"
                    ];
                    templateMeals.forEach((m: any, idx: number) => {
                        const cat = catKeys[idx % catKeys.length];
                        currentLog.meals[cat].push({
                            id: "diet_meal_" + Date.now() + "_" + idx,
                            name: m.name + (m.items ? `: ${m.items}` : ""),
                            calories: Number(m.calories) || 400,
                            proteinG: Number(m.proteinG) || 30,
                            time: idx === 0 ? "08:30" : idx === 1 ? "11:30" : idx === 2 ? "14:30" : idx === 3 ? "17:30" : "20:30"
                        });
                    });
                } else {
                    const targetCal = macros?.targetCalories || 2200;
                    const targetProt = macros?.proteinG || 160;
                    currentLog.meals.breakfast.push({
                        id: "diet_bf_" + Date.now(),
                        name: "Desayuno estructurado (Huevos + Avena con proteína)",
                        calories: Math.round(targetCal * 0.28),
                        proteinG: Math.round(targetProt * 0.28),
                        time: "08:30"
                    });
                    currentLog.meals.lunch.push({
                        id: "diet_lu_" + Date.now(),
                        name: "Almuerzo Anabólico (Pechuga de pollo + Arroz + Aguacate)",
                        calories: Math.round(targetCal * 0.38),
                        proteinG: Math.round(targetProt * 0.38),
                        time: "14:00"
                    });
                    currentLog.meals.dinner.push({
                        id: "diet_dn_" + Date.now(),
                        name: "Cena Regenerativa (Pescado o Lomo + Papa + Ensalada)",
                        calories: Math.round(targetCal * 0.34),
                        proteinG: Math.round(targetProt * 0.34),
                        time: "20:30"
                    });
                }
            }

            nutritionActions.forEach(action => {
                const nutData = action.nutrition;
                if (nutData && nutData.foods && nutData.foods.length > 0) {
                    const cat = nutData.mealCategory || "lunch";
                    if (!currentLog.meals[cat]) {
                        currentLog.meals[cat] = [];
                    }
                    nutData.foods.forEach(f => {
                        currentLog.meals[cat].push({
                            id: "food_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
                            name: f.name,
                            calories: Math.round(f.calories || 0),
                            proteinG: Math.round(f.proteinG || 0),
                            carbsG: Math.round(f.carbsG || 0),
                            fatsG: Math.round(f.fatsG || 0),
                            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                        });
                    });
                }
            });

            handleSaveNutritionLog(dateStr, currentLog);
        }

        // 2. Procesar las demás acciones individuales (ejercicios, música, búsqueda, navegación)
        const otherActions = actions.filter(a => a.intent !== "LOG_NUTRITION" && a.intent !== "LOG_DIET_PLAN");
        otherActions.forEach(action => {
            handleVoiceActionResult(action);
        });
    }, [
        activeNutritionDate,
        allNutritionLogs,
        dietPlan,
        handleSaveNutritionLog,
        handleVoiceActionResult,
        macros
    ]);

    // Instancia del Hook del Asistente de Voz APEX
    const {
        isListening: isVoiceListening,
        isProcessing: isVoiceProcessing,
        transcript: voiceTranscript,
        interimTranscript: voiceInterimTranscript,
        toastMessage: voiceToastMessage,
        showPromoTooltip: showVoicePromoTooltip,
        setShowPromoTooltip: setShowVoicePromoTooltip,
        handlePointerDown: handleVoicePointerDown,
        handlePointerUp: handleVoicePointerUp,
        handlePointerCancel: handleVoicePointerCancel,
        getContextualTooltip: getVoiceContextualTooltip
    } = useApexVoiceAgent({
        currentTab: activeTab,
        activeExerciseNames: activeExercises.map(e => e.name),
        onActionResult: handleVoiceActionResult,
        onBatchActions: handleBatchVoiceActions
    });

    // Peso corporal del usuario (convertido a unidad activa)
    const userBodyweight = useMemo(() => {
        const rawKg = Number(profile?.weightKg) || 75;
        if (weightUnit === "lbs") {
            return Math.round(rawKg * 2.20462);
        }
        return Math.round(rawKg * 10) / 10;
    }, [profile?.weightKg, weightUnit]);

    // Estadísticas y agrupamiento de ejercicios por realizados vs pendientes
    const routineStats = useMemo(() => {
        let totalSets = 0;
        let completedSetsCount = 0;
        let completedExercisesCount = 0;

        const items = activeExercises.map((ex, exIdx) => {
            const tSets = (ex as any).target_sets || ex.default_sets || 3;
            const cCount = Array.from({ length: tSets }).filter(
                (_, sIdx) => completedSets[`${ex.id}_${sIdx}`]
            ).length;
            const isAllDone = cCount >= tSets && tSets > 0;

            totalSets += tSets;
            completedSetsCount += cCount;
            if (isAllDone) completedExercisesCount += 1;

            return {
                ex,
                exIdx,
                totalSets: tSets,
                completedCount: cCount,
                isAllDone
            };
        });

        const pending = items.filter((i) => !i.isAllDone);
        const completed = items.filter((i) => i.isAllDone);
        const percent = items.length > 0 ? Math.round((completedExercisesCount / items.length) * 100) : 0;
        const rawKg = Number(profile?.weightKg) || 75;
        // Gasto calórico estimado en hipertrofia (ACSM): ~0.075 kcal/kg por serie efectiva completada
        const burnedKcal = Math.round(completedSetsCount * (rawKg * 0.075));

        return {
            items,
            pending,
            completed,
            totalSets,
            completedSetsCount,
            completedExercisesCount,
            percent,
            burnedKcal,
            isFinished: items.length > 0 && completedExercisesCount === items.length
        };
    }, [activeExercises, completedSets, profile?.weightKg]);

    const checkExerciseAllDone = (item: ExerciseItem, overrideSetIdx?: number) => {
        const tSets = (item as any).target_sets || item.default_sets || 3;
        const cCount = Array.from({ length: tSets }).filter(
            (_, sIdx) => overrideSetIdx === sIdx || completedSets[`${item.id}_${sIdx}`]
        ).length;
        return cCount >= tSets && tSets > 0;
    };

    const renderExerciseItem = (
        ex: ExerciseItem,
        exIdx: number,
        totalSets: number,
        completedCount: number,
        isAllDone: boolean
    ) => {
        const isSelected = selectedExerciseIndex === exIdx;

        if (isSelected) {
            const isBodyweight = isBodyweightExercise(ex);
            const defaultExWeight = isBodyweight ? userBodyweight : 0;
            const rawMemory = exerciseMemory[ex.id];
            const memory = {
                weight: rawMemory && rawMemory.weight > 0 ? rawMemory.weight : defaultExWeight,
                reps: rawMemory ? rawMemory.reps : 0
            };
            const target = calculateTodayTarget(
                memory.weight,
                memory.reps,
                ex.rep_range_min,
                ex.rep_range_max,
                readiness,
                weightUnit
            );
            if (isBodyweight && target.suggestedWeight === 0) {
                target.suggestedWeight = userBodyweight;
            }
            const isNewBlock = !!(ex.blockId && (exIdx === 0 || activeExercises[exIdx - 1]?.blockId !== ex.blockId));

            return (
                <motion.div
                    key={`${ex.id}_${exIdx}_active`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 pt-1"
                >
                    {/* Barra Superior de Navegación entre Pestañas de Ejercicio */}
                    <div className="flex items-center justify-between px-2 text-xs">
                        <button
                            type="button"
                            disabled={exIdx === 0}
                            onClick={() => setSelectedExerciseIndex(Math.max(0, exIdx - 1))}
                            className={`flex items-center gap-1 font-semibold text-[11px] transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                                isLight ? "text-slate-700 hover:text-slate-950" : "text-zinc-300 hover:text-white"
                            }`}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Anterior</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                                isLight ? "text-slate-600" : "text-zinc-400"
                            }`}>
                                EJERCICIO {exIdx + 1} DE {activeExercises.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedExerciseIndex(-1)}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                    isLight
                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                        : "bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 border-white/10"
                                }`}
                                title="Plegar este ejercicio para ver todos en lista"
                            >
                                Plegar
                            </button>
                        </div>

                        <button
                            type="button"
                            disabled={exIdx === activeExercises.length - 1}
                            onClick={() => setSelectedExerciseIndex(Math.min(activeExercises.length - 1, exIdx + 1))}
                            className={`flex items-center gap-1 font-semibold text-[11px] transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                                isLight ? "text-slate-700 hover:text-slate-950" : "text-zinc-300 hover:text-white"
                            }`}
                        >
                            <span>Siguiente</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Tarjeta de Ejercicio Expandida en Grande */}
                    <ApexV2ExerciseCard
                        exercise={ex}
                        exerciseIndex={exIdx}
                        isNewBlock={isNewBlock}
                        memory={memory}
                        target={target}
                        weightUnit={weightUnit}
                        userBodyweight={userBodyweight}
                        completedSets={completedSets}
                        setInputs={setInputs}
                        onSetInputChange={handleSetInputChange}
                        onCompleteSet={(item, sIdx, customW, customR) => {
                            const restSecs = item.rest_seconds || (trainingMethodology === "cycled_circuits" ? 45 : 90);
                            handleCompleteSet(item.id, sIdx, restSecs, customW, customR);

                            // Si con este set se completa el ejercicio actual:
                            const willBeDone = checkExerciseAllDone(item, sIdx);
                            if (willBeDone) {
                                // Buscar el siguiente ejercicio pendiente posterior
                                const nextPendingIdx = activeExercises.findIndex(
                                    (otherEx, otherIdx) => otherIdx > exIdx && !checkExerciseAllDone(otherEx)
                                );
                                if (nextPendingIdx !== -1) {
                                    setSelectedExerciseIndex(nextPendingIdx);
                                } else {
                                    // Si no hay posterior, buscar el primer pendiente anterior
                                    const prevPendingIdx = activeExercises.findIndex(
                                        (otherEx, otherIdx) => otherIdx !== exIdx && !checkExerciseAllDone(otherEx)
                                    );
                                    if (prevPendingIdx !== -1) {
                                        setSelectedExerciseIndex(prevPendingIdx);
                                    } else {
                                        // Todos completados
                                        setSelectedExerciseIndex(-1);
                                    }
                                }
                            }
                        }}
                        tempoActive={Boolean(tempoActive[ex.id])}
                        onToggleTempo={() => {
                            const nextState = !tempoActive[ex.id];
                            setTempoActive((prev) => ({ ...prev, [ex.id]: nextState }));
                            if (nextState) {
                                startTempoLoop(ex.id);
                            } else {
                                stopTempoLoop(ex.id);
                            }
                        }}
                        onOpenVbt={() => {
                            setVbtExerciseName(ex.name);
                            setIsVbtModalOpen(true);
                        }}
                        onRandomSwap={() => handleRandomSwapExercise(exIdx)}
                        onOpenSwapModal={() => setSwapTargetIndex(exIdx)}
                        onOpenPlateModal={(w) => {
                            setPlateModalWeight(w);
                            setIsPlateModalOpen(true);
                        }}
                        isPlateLoaded={isPlateLoadedExercise(ex.equipment, ex.name)}
                        notes={exerciseNotes[ex.id] || ""}
                        onSaveNotes={(n) => setExerciseNotes((prev) => ({ ...prev, [ex.id]: n }))}
                        onRemoveExercise={onRemoveExercise ? () => {
                            if (tempoActive[ex.id]) {
                                setTempoActive((prev) => ({ ...prev, [ex.id]: false }));
                                stopTempoLoop(ex.id);
                            }
                            onRemoveExercise(exIdx);
                            const remaining = activeExercises.length - 1;
                            setSelectedExerciseIndex(remaining <= 0 ? -1 : Math.min(exIdx, remaining - 1));
                        } : undefined}
                        isLight={isLight}
                    />
                </motion.div>
            );
        }

        // Pestaña compacta plegada
        return (
            <motion.div
                key={`${ex.id}_${exIdx}_collapsed`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={() => setSelectedExerciseIndex(exIdx)}
                className={`w-full p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] select-none ${
                    isLight
                        ? isAllDone
                            ? "bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700 opacity-80"
                            : "bg-white/80 hover:bg-white border-slate-200/90 shadow-xs hover:shadow-sm"
                        : isAllDone
                            ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-zinc-400 opacity-75"
                            : "bg-zinc-950/45 hover:bg-white/[0.06] border-white/[0.08] hover:border-white/20 backdrop-blur-xl"
                }`}
                title={`Toca para abrir ${translateExerciseNameToSpanish(ex.name)} en grande`}
            >
                {/* Izquierda: Número o Check + Nombre + Músculo */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 border ${
                        isAllDone
                            ? (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30")
                            : (isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.06] text-zinc-400 border-white/10")
                    }`}>
                        {isAllDone ? "✓" : exIdx + 1}
                    </span>

                    <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                            isAllDone
                                ? (isLight ? "text-slate-400 line-through" : "text-zinc-500 line-through")
                                : (isLight ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-emerald-400")
                        }`}>
                            {translateExerciseNameToSpanish(ex.name)}
                        </h4>
                        <p className={`text-[10px] truncate leading-tight flex items-center gap-1.5 flex-wrap ${
                            isLight ? "text-slate-500" : "text-zinc-400"
                        }`}>
                            <span>{ex.anatomical_subdivision} • Tier {ex.hypertrophy_tier || "S"} • {ex.equipment}</span>
                            {isBodyweightExercise(ex) && (
                                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold border ${
                                    isLight ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                }`}>
                                    Peso Propio ({userBodyweight}{weightUnit})
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Derecha: Badge de Progreso de Series + Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                        isAllDone
                            ? (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30")
                            : completedCount > 0
                            ? (isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-400/15 text-amber-400 border-amber-400/30")
                            : (isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.04] text-zinc-400 border-white/10")
                    }`}>
                        {isAllDone ? `✓ ${completedCount}/${totalSets}` : `${completedCount}/${totalSets} sets`}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5 ${
                        isLight ? "text-slate-400 group-hover:text-slate-800" : "text-zinc-500 group-hover:text-white"
                    }`} />
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`min-h-screen font-sans antialiased selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900 pb-32 w-full max-w-full overflow-x-hidden relative transition-colors duration-200 ${
            isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0c0e14] text-[#EAEAEA]"
        }`}>
            {/* Main Content Area con Transiciones de Framer Motion (Sin barra superior para máximo espacio y experiencia táctil) */}
            <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
                <AnimatePresence mode="wait">
                    
                    {/* DESTINO 1: ENTRENAR (Rutina Activa & Tarjetas Inmersivas Cero Scroll) */}
                    {activeTab === "workout" && (
                        <motion.div
                            key="workout-view"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Selector de Días de la Semana: Ancla Central Dinámica (Cero Scroll Horizontal) */}
                            <div className={`backdrop-blur-2xl rounded-2xl p-2 sm:p-2.5 shadow-md border transition-all ${
                                isLight ? "bg-white/80 border-slate-200/80 shadow-slate-900/[0.04]" : "bg-zinc-950/75 border-white/10 shadow-lg"
                            }`}>
                                <div className="w-full flex items-center justify-between sm:justify-center sm:gap-2 px-0.5">
                                    {(() => {
                                        const total = weeklyProgram.length;
                                        if (total === 0) return null;

                                        const leftCount = Math.floor((total - 1) / 2);
                                        const rightCount = total - 1 - leftCount;

                                        const orderedIndices: number[] = [];
                                        for (let offset = -leftCount; offset <= rightCount; offset++) {
                                            const idx = (activeDayIndex + offset + total * 10) % total;
                                            orderedIndices.push(idx);
                                        }

                                        const defaultNames = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

                                        return orderedIndices.map((idx) => {
                                            const day = weeklyProgram[idx] || {};
                                            const isCenter = idx === activeDayIndex;
                                            const dayName = day.dayName || defaultNames[idx] || `DÍA ${day.dayNumber || idx + 1}`;
                                            const firstLetter = dayName.charAt(0).toUpperCase();
                                            const shortFocus = day.focus ? day.focus.split(",")[0].split("&")[0].trim() : (day.title?.split(" ")[0] || "Hipertrofia");

                                            if (isCenter) {
                                                return (
                                                    <motion.div
                                                        key={`center-${day.dayNumber || idx}`}
                                                        layout
                                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-sans transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 select-none ${
                                                            isLight
                                                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                                                : "bg-white text-zinc-950 shadow-lg shadow-white/10"
                                                        }`}
                                                    >
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                                            isLight ? "bg-white/20 text-white" : "bg-black/15 text-zinc-950"
                                                        }`}>
                                                            {firstLetter}
                                                        </span>
                                                        <span className="font-bold text-xs uppercase tracking-tight whitespace-nowrap">
                                                            {dayName}
                                                        </span>
                                                        <span className={`text-[10px] hidden xs:inline max-w-[80px] sm:max-w-none truncate ${
                                                            isLight ? "text-slate-300 font-normal" : "text-zinc-600 font-medium"
                                                        }`}>
                                                            • {shortFocus}
                                                        </span>
                                                    </motion.div>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={`day-dot-${day.dayNumber || idx}`}
                                                    type="button"
                                                    onClick={() => handleDaySelect(idx)}
                                                    title={`Ver ${dayName} (${shortFocus})`}
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-90 relative ${
                                                        isLight
                                                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200/90 shadow-xs"
                                                            : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.14] border border-white/10"
                                                    }`}
                                                >
                                                    <span>{firstLetter}</span>
                                                    {day.carbCyclePhase === "high_carb" && (
                                                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                                                    )}
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Encabezado de Sesión Centrado (Fuera de Contenedor, Cero Repetición de Día) */}
                            {(() => {
                                const rawTitle = currentRoutine?.title || "Rutina Activa";
                                let cleanTitle = rawTitle;
                                if (rawTitle.includes(":")) {
                                    cleanTitle = rawTitle.split(":").slice(1).join(":").trim();
                                } else {
                                    const dayNames = ["lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado", "domingo"];
                                    const lower = rawTitle.toLowerCase();
                                    for (const d of dayNames) {
                                        if (lower.startsWith(d)) {
                                            cleanTitle = rawTitle.slice(d.length).replace(/^[\s:\-–—]+/, "").trim();
                                            break;
                                        }
                                    }
                                }

                                return (
                                    <div className="py-2.5 text-center space-y-2">
                                        <div>
                                            <h2 className={`text-base sm:text-xl font-bold tracking-tight uppercase ${
                                                isLight ? "text-slate-950" : "text-white"
                                            }`}>
                                                {cleanTitle || "Entrenamiento de Hoy"}
                                            </h2>
                                            <p className={`text-xs mt-0.5 ${
                                                isLight ? "text-slate-600 font-normal" : "text-zinc-400"
                                            }`}>
                                                {currentRoutine?.focus || "Hipertrofia Miofibrilar & Tensión Mecánica"} • {activeExercises.length} ejercicios
                                            </p>
                                        </div>

                                        {/* Selector Rápido de Readiness / Fatiga & Acceso a Dieta Gemini (Centrados) */}
                                        <div className="flex items-center justify-center gap-2 pt-0.5 flex-wrap">
                                            <div className={`inline-flex items-center gap-1 rounded-2xl p-1 border ${
                                                isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                                            }`}>
                                                {(["optimal", "normal", "fatigued"] as ReadinessState[]).map((r) => {
                                                    const isSel = readiness === r;
                                                    const labels = {
                                                        optimal: "Óptimo",
                                                        normal: "Normal",
                                                        fatigued: "Fatigado"
                                                    };

                                                    return (
                                                        <button
                                                            key={r}
                                                            type="button"
                                                            onClick={() => setReadiness(r)}
                                                            className={`px-3 py-1 rounded-xl text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                                                                 isSel
                                                                    ? r === "optimal"
                                                                        ? (isLight ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-500 text-black shadow-sm")
                                                                        : r === "normal"
                                                                        ? (isLight ? "bg-amber-500 text-white shadow-xs" : "bg-amber-500 text-black shadow-sm")
                                                                        : "bg-red-500 text-white shadow-sm"
                                                                    : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-500 hover:text-zinc-300")
                                                            }`}
                                                        >
                                                            {labels[r]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Barra de Progreso de la Rutina Diaria */}
                            {activeExercises.length > 0 && (
                                <div className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                                    isLight
                                        ? "bg-white/90 border-slate-200/90 shadow-xs"
                                        : "bg-zinc-950/60 border-white/10 backdrop-blur-xl shadow-lg"
                                }`}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                                routineStats.isFinished
                                                    ? (isLight ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40")
                                                    : (isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-white/[0.06] text-zinc-300 border-white/10")
                                            }`}>
                                                {routineStats.isFinished ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-emerald-500" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                                        {routineStats.isFinished ? "¡Rutina Completada!" : "Progreso de la Rutina"}
                                                    </span>
                                                    {routineStats.isFinished && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                                            100%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] font-mono flex items-center gap-1.5 flex-wrap ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                    <span>{routineStats.completedExercisesCount} de {activeExercises.length} ejercicios completados</span>
                                                    <span>•</span>
                                                    <span>{routineStats.completedSetsCount}/{routineStats.totalSets} sets</span>
                                                    {routineStats.completedSetsCount > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                                                                <Flame className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                                                                ~{routineStats.burnedKcal} kcal quemadas
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`text-base sm:text-lg font-mono font-bold ${
                                                routineStats.isFinished
                                                    ? "text-emerald-500"
                                                    : (isLight ? "text-slate-900" : "text-white")
                                            }`}>
                                                {routineStats.percent}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra de Progreso Visual */}
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                                        isLight ? "bg-slate-100 border border-slate-200" : "bg-black/50 border border-white/[0.08]"
                                    }`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${routineStats.percent}%` }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className={`h-full rounded-full transition-all ${
                                                routineStats.isFinished
                                                    ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
                                                    : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* CLASIFICACIÓN 1: EJERCICIOS POR REALIZAR / PENDIENTES */}
                            <div className="space-y-2">
                                {activeExercises.length === 0 ? (
                                    <div className={`p-8 text-center rounded-3xl border ${
                                        isLight ? "bg-white/80 border-slate-200 text-slate-500" : "bg-black/30 border-white/10 text-zinc-400"
                                    }`}>
                                        <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-500" />
                                        <p className="text-xs font-semibold">No hay ejercicios asignados para esta sesión.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-1 pt-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${
                                                    isLight ? "text-slate-700" : "text-zinc-300"
                                                }`}>
                                                    Por Realizar
                                                </span>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                                                    routineStats.pending.length > 0
                                                        ? (isLight ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-amber-400/10 text-amber-400 border-amber-400/20")
                                                        : (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")
                                                }`}>
                                                    {routineStats.pending.length} {routineStats.pending.length === 1 ? "pendiente" : "pendientes"}
                                                </span>
                                            </div>

                                            {routineStats.pending.length > 0 && selectedExerciseIndex !== -1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedExerciseIndex(-1)}
                                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                        isLight
                                                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"
                                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 border-white/10"
                                                    }`}
                                                    title="Plegar ejercicio abierto"
                                                >
                                                    Ver todos plegados
                                                </button>
                                            )}
                                        </div>

                                        {routineStats.pending.length === 0 ? (
                                            <div className={`p-6 text-center rounded-3xl border transition-all ${
                                                isLight
                                                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                            }`}>
                                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                                <p className="text-xs font-bold">¡Has completado todos los ejercicios pendientes!</p>
                                                <p className={`text-[11px] mt-0.5 ${isLight ? "text-emerald-800/80" : "text-emerald-400/80"}`}>
                                                    Puedes revisar o editar tus series en la sección de completados abajo.
                                                </p>
                                            </div>
                                        ) : (
                                            routineStats.pending.map((item) =>
                                                renderExerciseItem(item.ex, item.exIdx, item.totalSets, item.completedCount, item.isAllDone)
                                            )
                                        )}
                                    </>
                                )}
                            </div>

                            {/* CLASIFICACIÓN 2: EJERCICIOS YA REALIZADOS / COMPLETADOS */}
                            {routineStats.completed.length > 0 && (
                                <div className="space-y-2 pt-3 border-t border-dashed border-white/10 dark:border-white/10 border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setIsCompletedSectionOpen(!isCompletedSectionOpen)}
                                        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                                            isLight
                                                ? "bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 text-slate-800"
                                                : "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 text-zinc-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-xs font-bold uppercase tracking-wider font-mono">
                                                Ya Realizados ({routineStats.completed.length})
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                            <span>{isCompletedSectionOpen ? "Ocultar" : "Ver completados"}</span>
                                            {isCompletedSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </div>
                                    </button>

                                    {isCompletedSectionOpen && (
                                        <div className="space-y-2">
                                            {routineStats.completed.map((item) =>
                                                renderExerciseItem(item.ex, item.exIdx, item.totalSets, item.completedCount, item.isAllDone)
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cardio Finisher al final de la rutina diaria */}
                            {todayCardio && onUpdateCardio && (
                                <div className="mt-4 sm:mt-5">
                                    <ApexV2CardioFinisher
                                        todayCardio={todayCardio}
                                        onUpdateCardio={onUpdateCardio}
                                        isLight={isLight}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* DESTINO 2: NUTRICIÓN & CALENDARIO */}
                    {activeTab === "nutrition" && (
                        <motion.div
                            key="nutrition-view"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ApexV2NutritionCalendarHub
                                targetCalories={macros.targetCalories}
                                targetProteinG={macros.proteinG}
                                targetCarbsG={macros.carbsG}
                                targetFatsG={macros.fatsG}
                                supplements={supplements}
                                onUpdateSupplements={setSupplements}
                                allNutritionLogs={allNutritionLogs}
                                onSaveNutritionLog={handleSaveNutritionLog}
                                activeDate={activeNutritionDate}
                                onSelectDate={setActiveNutritionDate}
                                dietPlan={dietPlan}
                                onOpenDietPlanModal={() => setIsDietPrefModalOpen(true)}
                                groceryList={groceryList}
                                onGoToGym={() => setActiveTab("workout")}
                            />
                        </motion.div>
                    )}

                    {/* DESTINO 3: ANATOMÍA & LIBRERÍA */}
                    {activeTab === "anatomy" && (
                        <motion.div
                            key="anatomy-view"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="w-full flex-1 flex flex-col"
                        >
                            <ApexV2AnatomyView
                                selectedMuscle={selectedMuscle}
                                activeMusclesToday={activeMusclesToday}
                                onSelectMuscle={setSelectedMuscle}
                                onOpenExerciseLibrary={() => setIsExerciseLibraryOpen(true)}
                                onOpenScanner={() => setIsScannerOpen(true)}
                                catalogCount={catalogCount}
                            />
                        </motion.div>
                    )}

                    {/* DESTINO 4: AJUSTES & CENTRO DE CONTROL */}
                    {activeTab === "settings" && (
                        <motion.div
                            key="settings-view"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ApexV2SettingsView
                                profile={profile}
                                macros={macros}
                                weightUnit={weightUnit}
                                onWeightUnitChange={setWeightUnit}
                                trainingMethodology={trainingMethodology}
                                onTrainingMethodologyChange={setTrainingMethodology}
                                environmentMode={environmentMode}
                                onEnvironmentChange={setEnvironmentMode}
                                readiness={readiness}
                                onReadinessChange={setReadiness}
                                onOpenRoutineImporter={() => setIsRoutineImporterOpen(true)}
                                onOpenDietPlanModal={() => setIsDietPrefModalOpen(true)}
                                onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                                isSpotifyConnected={isSpotifyLinked}
                                onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
                                onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                                pdfProfile={pdfProfile}
                                pdfRoutine={activeExercises}
                                pdfWeeklyProgram={weeklyProgram}
                                pdfDiet={pdfDiet}
                                onResetProfile={() => {
                                    localStorage.removeItem("apex_user_profile");
                                    window.location.reload();
                                }}
                                onSwitchToStable={onSwitchToStable}
                                onInstallPwa={() => setIsInstallModalOpen(true)}
                                showInstallButton={true}
                            />
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Minimalist 1-Line Footer */}
                <ApexV2Footer />
            </main>

            {/* Unified Bottom Bar (Navigation + Liquid Glass Mic + Spotify Mini-Player) */}
            <ApexV2BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                isSpotifyConnected={isSpotifyLinked}
                restRemaining={restRemaining}
                onSkipRest={handleSkipRest}
                isVoiceListening={isVoiceListening}
                isVoiceProcessing={isVoiceProcessing}
                voiceLiveTranscript={voiceTranscript}
                voiceInterimTranscript={voiceInterimTranscript}
                onVoicePointerDown={handleVoicePointerDown}
                onVoicePointerUp={handleVoicePointerUp}
                onVoicePointerCancel={handleVoicePointerCancel}
                contextualTooltipText={getVoiceContextualTooltip()}
                showPromoTooltip={showVoicePromoTooltip}
                onDismissPromoTooltip={() => setShowVoicePromoTooltip(false)}
                toastMessage={voiceToastMessage}
            />

            {/* Modal de Resolución de Ambigüedad o Creación Personalizada de Ejercicio por Voz */}
            <ApexVoiceExercisePickerModal
                isOpen={isVoicePickerOpen}
                onClose={() => setIsVoicePickerOpen(false)}
                spokenName={voicePickerSpokenName}
                candidates={voicePickerCandidates}
                onSelectExercise={(ex) => {
                    handleApplyVoiceExercise(ex, pendingVoiceWorkoutData);
                    setIsVoicePickerOpen(false);
                }}
                onCreateCustom={(name) => {
                    handleCreateCustomVoiceExercise(name, pendingVoiceWorkoutData);
                    setIsVoicePickerOpen(false);
                }}
                isLight={isLight}
            />

        </div>
    );
};
