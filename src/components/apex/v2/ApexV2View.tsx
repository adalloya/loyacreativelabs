// src/components/apex/v2/ApexV2View.tsx
"use client";

import React, { useState, useEffect } from "react";
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
    Sliders
} from "lucide-react";
import { calculateTodayTarget, ExerciseItem, ReadinessState } from "@/lib/hypertrophy-engine";
import { getInitialTheme, Theme } from "@/lib/theme";
import { ApexV2BottomNav, ApexV2Tab } from "./ApexV2BottomNav";
import { ApexV2ExerciseCard } from "./ApexV2ExerciseCard";
import { ApexV2NutritionCalendarHub } from "./ApexV2NutritionCalendarHub";
import { ApexV2AnatomyView } from "./ApexV2AnatomyView";
import { ApexV2SettingsView } from "./ApexV2SettingsView";
import { ApexV2Footer } from "./ApexV2Footer";

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
    isPlateLoadedExercise
}) => {
    // Current V2 active navigation destination (Entrenar, Nutrición, Anatomía, Ajustes)
    const [activeTab, setActiveTab] = useState<ApexV2Tab>("workout");
    const [theme, setTheme] = useState<Theme>("dark");

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

                                            {/* Acceso Rápido Directo a Dieta Gemini AI */}
                                            <button
                                                type="button"
                                                onClick={() => setIsDietPrefModalOpen(true)}
                                                className={`px-3 py-1.5 rounded-2xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                                    isLight
                                                        ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 shadow-xs"
                                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                                }`}
                                                title="Crear o personalizar dieta con Gemini AI"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Dieta Gemini</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Lista de Tarjetas de Ejercicio Cero Scroll */}
                            <div className="space-y-3">
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
                                        <ApexV2ExerciseCard
                                            key={`${ex.id}_${exIdx}`}
                                            exercise={ex}
                                            exerciseIndex={exIdx}
                                            isNewBlock={isNewBlock}
                                            memory={memory}
                                            target={target}
                                            weightUnit={weightUnit}
                                            completedSets={completedSets}
                                            setInputs={setInputs}
                                            onSetInputChange={handleSetInputChange}
                                            onCompleteSet={(item, sIdx, customW, customR) => {
                                                const restSecs = item.rest_seconds || (trainingMethodology === "cycled_circuits" ? 45 : 90);
                                                handleCompleteSet(item.id, sIdx, restSecs, customW, customR);
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
                                            isLight={isLight}
                                        />
                                    );
                                })}
                            </div>
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

            {/* Unified Bottom Bar (Navigation + Liquid Glass Spotify Mini-Player) */}
            <ApexV2BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                restRemaining={restRemaining}
                onSkipRest={handleSkipRest}
            />

        </div>
    );
};
