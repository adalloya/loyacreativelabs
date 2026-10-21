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
import { AppHeaderMenu } from "@/components/ui/AppHeaderMenu";
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
        <div className={`min-h-screen font-sans antialiased selection:bg-[#FF2A2A]/30 selection:text-white pb-32 w-full max-w-full overflow-x-hidden relative transition-colors duration-200 ${
            isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0c0e14] text-[#EAEAEA]"
        }`}>
            
            {/* V2 Beta Status Bar (Sutil) */}
            <div className={`border-b px-4 py-1.5 text-xs flex items-center justify-between z-50 relative backdrop-blur-md transition-colors ${
                isLight
                    ? "bg-violet-100/80 border-violet-200 text-violet-900"
                    : "bg-gradient-to-r from-violet-950/80 via-indigo-950/80 to-purple-950/80 border-violet-500/30 text-violet-200"
            }`}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] border tracking-wider ${
                            isLight
                                ? "bg-violet-200/80 text-violet-900 border-violet-300"
                                : "bg-violet-500/30 text-violet-200 border-violet-400/40"
                        }`}>
                            V2 LIQUID GLASS
                        </span>
                        <span className={`text-[11px] hidden xs:inline sm:inline ${isLight ? "text-violet-800" : "text-violet-100"}`}>
                            Nueva experiencia táctil. Tu versión estable sigue intacta.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToStable}
                        className={`text-[10px] font-mono underline shrink-0 cursor-pointer transition-colors ${
                            isLight ? "text-violet-700 hover:text-violet-950" : "text-violet-300 hover:text-white"
                        }`}
                    >
                        Volver a v1 Estable
                    </button>
                </div>
            </div>

            {/* Top Minimalist Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b px-4 py-3 transition-colors ${
                isLight ? "bg-white/80 border-slate-200/80 text-slate-900" : "bg-[#0c0e14]/80 border-white/[0.08] text-white"
            }`}>
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Brand & Greeting */}
                    <div className="flex items-center gap-2.5">
                        <div className={`relative w-8 h-8 rounded-xl overflow-hidden border shrink-0 ${
                            isLight ? "border-slate-300 bg-slate-100" : "border-white/15 bg-zinc-900"
                        }`}>
                            <Image
                                src="/apex-logo.png"
                                alt="APEX"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className={`text-sm sm:text-base font-bold tracking-tight uppercase leading-none ${
                                isLight ? "text-slate-950" : "text-white"
                            }`}>
                                {timeGreeting}, {profile?.firstName}
                            </h1>
                            <p className={`text-[11px] mt-0.5 capitalize font-normal ${
                                isLight ? "text-slate-500" : "text-zinc-400"
                            }`}>
                                {todayFormattedDate}
                            </p>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        {isScreenLocked && (
                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>PANTALLA ACTIVA</span>
                            </div>
                        )}

                        <AppHeaderMenu
                            environmentMode={environmentMode}
                            onEnvironmentChange={setEnvironmentMode}
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
                                localStorage.removeItem("apex_user_profile");
                                window.location.reload();
                            }}
                            onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                            isSpotifyConnected={isSpotifyLinked}
                            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
                            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                            uxVersion="v2"
                            onUxVersionChange={(v) => {
                                if (v === "stable") onSwitchToStable();
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area con Transiciones de Framer Motion */}
            <main className="max-w-4xl mx-auto px-3 sm:px-4 mt-4">
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
                            {/* Selector de Días de la Semana Horizontal (Píldoras) */}
                            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-2xl p-2 shadow-lg overflow-x-auto scrollbar-none">
                                <div className="flex items-center gap-1.5 min-w-max">
                                    {weeklyProgram.map((day, idx) => {
                                        const isSelected = idx === activeDayIndex;

                                        return (
                                            <button
                                                key={day.dayNumber || idx}
                                                type="button"
                                                onClick={() => handleDaySelect(idx)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? "bg-white text-black font-bold shadow-md"
                                                        : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                                                }`}
                                            >
                                                <span>Día {day.dayNumber}</span>
                                                <span className={`text-[10px] ${isSelected ? "text-zinc-600 font-sans" : "text-zinc-500"}`}>
                                                    • {day.title?.split(" ")[0] || "Hipertrofia"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Resumen de la Sesión de Hoy & Disposición Biomecánica */}
                            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                                            {currentRoutine?.dayName || `SESIÓN ${activeDayIndex + 1}`}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-400">
                                            {activeExercises.length} ejercicios
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        {currentRoutine?.title || "Rutina Activa"}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        {currentRoutine?.focus || "Hipertrofia Miofibrilar & Tensión Mecánica"}
                                    </p>
                                </div>

                                {/* Selector Rápido de Readiness / Fatiga */}
                                <div className="flex items-center gap-1 self-start sm:self-auto bg-black/50 border border-white/10 rounded-2xl p-1">
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
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                                                    isSel
                                                        ? r === "optimal"
                                                            ? "bg-emerald-500 text-black shadow-sm"
                                                            : r === "normal"
                                                            ? "bg-amber-500 text-black shadow-sm"
                                                            : "bg-red-500 text-white shadow-sm"
                                                        : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                            >
                                                {labels[r]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

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
                                onOpenRoutineImporter={() => setIsRoutineImporterOpen(true)}
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
