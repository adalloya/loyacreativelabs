// src/components/apex/v2/ApexV2NutritionCalendarHub.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Dumbbell,
    Pill,
    Check,
    Camera,
    Plus,
    Trash2,
    ShoppingCart,
    ClipboardList,
    Sparkles,
    Activity,
    Layers,
    X,
    Flame
} from "lucide-react";
import {
    DailyNutritionLog,
    createEmptyDailyNutritionLog,
    calculateDailyNutritionTotals,
    getLocalDateString,
    formatFriendlyDate,
    MEAL_CATEGORIES,
    MealCategory
} from "@/lib/nutrition-tracker";
import { SupplementDose } from "@/lib/nutrition-logistics";
import { localDb, ExerciseLog } from "@/lib/local-db";
import { FoodCameraScannerModal } from "@/components/nutrition/FoodCameraScannerModal";
import { Drawer } from "vaul";
import { getInitialTheme, Theme } from "@/lib/theme";

interface ApexV2NutritionCalendarHubProps {
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG?: number;
    targetFatsG?: number;
    supplements: SupplementDose[];
    onUpdateSupplements?: (sups: SupplementDose[]) => void;
    allNutritionLogs: Record<string, DailyNutritionLog>;
    onSaveNutritionLog: (date: string, log: DailyNutritionLog) => void;
    activeDate: string;
    onSelectDate: (date: string) => void;
    dietPlan?: any;
    onOpenDietPlanModal?: () => void;
    groceryList?: any;
    onGoToGym?: () => void;
}

export const ApexV2NutritionCalendarHub: React.FC<ApexV2NutritionCalendarHubProps> = ({
    targetCalories,
    targetProteinG,
    targetCarbsG = 250,
    targetFatsG = 65,
    supplements,
    onUpdateSupplements,
    allNutritionLogs,
    onSaveNutritionLog,
    activeDate,
    onSelectDate,
    dietPlan,
    onOpenDietPlanModal,
    groceryList,
    onGoToGym
}) => {
    const todayStr = useMemo(() => getLocalDateString(), []);
    const [viewMode, setViewMode] = useState<"nutrition" | "workout">("nutrition");
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

    // Camera scanner modal state
    const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
    const [scannerCategory, setScannerCategory] = useState<MealCategory | null>(null);

    // Manual item modal/input
    const [activeAddingCategory, setActiveAddingCategory] = useState<MealCategory | null>(null);
    const [newFoodName, setNewFoodName] = useState("");
    const [newFoodCals, setNewFoodCals] = useState("");
    const [newFoodProtein, setNewFoodProtein] = useState("");

    // Plan Semanal Drawer State (Aislamiento de Planeación)
    const [isWeeklyPlanDrawerOpen, setIsWeeklyPlanDrawerOpen] = useState(false);

    // Workout logs from Dexie for activeDate
    const [dayExerciseLogs, setDayExerciseLogs] = useState<ExerciseLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingLogs(true);
        localDb.exercise_logs
            .where("workout_date")
            .equals(activeDate)
            .toArray()
            .then((logs) => {
                if (isMounted) {
                    setDayExerciseLogs(logs || []);
                    setIsLoadingLogs(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsLoadingLogs(false);
            });
        return () => {
            isMounted = false;
        };
    }, [activeDate]);

    // Active Day Nutrition Log
    const currentLog: DailyNutritionLog = useMemo(() => {
        return allNutritionLogs[activeDate] || createEmptyDailyNutritionLog(activeDate);
    }, [allNutritionLogs, activeDate]);

    const nutritionTotals = useMemo(() => {
        return calculateDailyNutritionTotals(currentLog);
    }, [currentLog]);

    // Workout Telemetry Summary
    const workoutSummary = useMemo(() => {
        const totalSets = dayExerciseLogs.length;
        const totalVolumeKg = dayExerciseLogs.reduce((acc, log) => acc + (log.weight_kg * log.reps_completed), 0);
        const uniqueExercises = new Set(dayExerciseLogs.map(l => l.exercise_id)).size;
        return { totalSets, totalVolumeKg, uniqueExercises };
    }, [dayExerciseLogs]);

    // Supplements stats
    const supplementsCount = supplements.length;
    const supplementsTakenCount = useMemo(() => {
        if (!currentLog.supplementsTaken) return 0;
        return Object.values(currentLog.supplementsTaken).filter(Boolean).length;
    }, [currentLog.supplementsTaken]);

    // Toggle Supplement
    const handleToggleSupplement = (supName: string) => {
        const currentTaken = currentLog.supplementsTaken || {};
        const isNowTaken = !currentTaken[supName];
        const updated = {
            ...currentLog,
            supplementsTaken: {
                ...currentTaken,
                [supName]: isNowTaken
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Add manual food
    const handleAddManualFood = (category: MealCategory) => {
        if (!newFoodName.trim() || !newFoodCals) return;
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const newItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: newFoodName.trim(),
            calories: Number(newFoodCals) || 0,
            proteinG: Number(newFoodProtein) || 0,
            carbsG: 0,
            fatsG: 0,
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
            isCompleted: true
        };
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: [...catItems, newItem]
            }
        };
        onSaveNutritionLog(activeDate, updated);
        setNewFoodName("");
        setNewFoodCals("");
        setNewFoodProtein("");
        setActiveAddingCategory(null);
    };

    // Remove food
    const handleRemoveFood = (category: MealCategory, foodId: string) => {
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: catItems.filter((i) => i.id !== foodId)
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Handle scanned food from camera
    const handleAddScannedFood = (category: MealCategory, item: any) => {
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: [...catItems, item]
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Form state for adding custom supplement or medication
    const [isAddingSupplement, setIsAddingSupplement] = useState(false);
    const [newSupName, setNewSupName] = useState("");
    const [newSupDosage, setNewSupDosage] = useState("");
    const [newSupTiming, setNewSupTiming] = useState("");

    const handleSaveNewSupplement = () => {
        if (!newSupName.trim()) return;
        const newSup: SupplementDose = {
            name: newSupName.trim(),
            dosage: newSupDosage.trim() || "1 dosis",
            timing: newSupTiming.trim() || "Diario",
            clinicalReason: "Personalizado"
        };
        const updated = [...supplements, newSup];
        if (onUpdateSupplements) {
            onUpdateSupplements(updated);
        }
        setNewSupName("");
        setNewSupDosage("");
        setNewSupTiming("");
        setIsAddingSupplement(false);
    };

    const handleDeleteSupplement = (e: React.MouseEvent, supName: string) => {
        e.stopPropagation();
        if (onUpdateSupplements) {
            const updated = supplements.filter((s) => s.name !== supName);
            onUpdateSupplements(updated);
        }
    };

    // Selector de 7 días centrado dinámicamente en activeDate (Idéntico a Gimnasio, Cero Scroll)
    const weekSelectorDays = useMemo(() => {
        const curr = new Date(activeDate + "T12:00:00");
        const days = [];
        for (let offset = -3; offset <= 3; offset++) {
            const d = new Date(curr);
            d.setDate(d.getDate() + offset);
            const iso = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("es-MX", { weekday: "long" }).toUpperCase();
            const shortDay = d.toLocaleDateString("es-MX", { weekday: "short" }).toUpperCase();
            const dayNum = d.getDate();
            const monthShort = d.toLocaleDateString("es-MX", { month: "short" }).toUpperCase();
            const monthLong = d.toLocaleDateString("es-MX", { month: "long" });
            const isCenter = offset === 0;
            const isToday = iso === todayStr;
            const hasMeals = !!allNutritionLogs[iso];
            days.push({
                iso,
                dayName,
                shortDay,
                dayNum,
                monthShort,
                monthLong,
                isCenter,
                isToday,
                hasMeals,
                firstLetter: dayName.charAt(0)
            });
        }
        return days;
    }, [activeDate, todayStr, allNutritionLogs]);

    const caloriePct = targetCalories > 0 ? Math.min(100, Math.round((nutritionTotals.totalCalories / targetCalories) * 100)) : 0;

    return (
        <div className="space-y-4">
            
            {/* 1. Header con Botón de Dieta Gemini AI & Plan Semanal */}
            <div className="flex items-center justify-between gap-3 px-1">
                <div>
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        Nutrición & Calendario
                    </h2>
                    <p className={`text-xs capitalize ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                    }`}>
                        {formatFriendlyDate(activeDate)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Dieta Gemini AI (Solo Icono) */}
                    {onOpenDietPlanModal && (
                        <button
                            type="button"
                            onClick={onOpenDietPlanModal}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border ${
                                isLight
                                    ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700"
                                    : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-400"
                            }`}
                            title="Personalizar o generar dieta con IA"
                            aria-label="Dieta con IA"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}

                    {/* Botón Aislado de Plan Semanal & Lista de Compras (Solo Icono: Cuadrito con Líneas) */}
                    <button
                        type="button"
                        onClick={() => setIsWeeklyPlanDrawerOpen(true)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border ${
                            isLight
                                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900"
                                : "bg-white/10 hover:bg-white/20 border-white/15 text-zinc-300 hover:text-white"
                        }`}
                        title="Ver plan semanal y lista de compras consolidada"
                        aria-label="Plan Semanal y Lista de Compras"
                    >
                        <ClipboardList className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. Selector de Días de la Semana: Ancla Central Dinámica (Idéntico a Gimnasio, Cero Scroll) */}
            <div className={`backdrop-blur-2xl rounded-2xl p-2 sm:p-2.5 shadow-md border transition-all ${
                isLight ? "bg-white/80 border-slate-200/80 shadow-slate-900/[0.04]" : "bg-zinc-950/75 border-white/10 shadow-lg"
            }`}>
                <div className="w-full flex items-center justify-between sm:justify-center sm:gap-2 px-0.5">
                    {weekSelectorDays.map((d) => {
                        if (d.isCenter) {
                            return (
                                <motion.div
                                    key={`center-${d.iso}`}
                                    layout
                                    className={`px-3.5 sm:px-5 py-1.5 rounded-2xl font-sans transition-all flex flex-col items-center justify-center shrink-0 select-none shadow-md ${
                                        isLight
                                            ? "bg-slate-900 text-white shadow-slate-900/20"
                                            : "bg-white text-zinc-950 shadow-white/10"
                                    }`}
                                >
                                    <span className="font-bold text-xs sm:text-sm uppercase tracking-tight whitespace-nowrap leading-tight">
                                        {d.dayName}
                                    </span>
                                    <span className={`text-[10px] font-mono font-medium tracking-tight mt-0.5 leading-tight ${
                                        isLight ? "text-slate-300" : "text-zinc-600"
                                    }`}>
                                        <span className="hidden xs:inline">{d.dayNum} de {d.monthLong}</span>
                                        <span className="xs:hidden">{d.dayNum} {d.monthShort}</span>
                                    </span>
                                </motion.div>
                            );
                        }

                        return (
                            <button
                                key={`dot-${d.iso}`}
                                type="button"
                                onClick={() => onSelectDate(d.iso)}
                                title={`Ver ${d.dayName} (${d.dayNum} ${d.monthShort})`}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-90 relative ${
                                    isLight
                                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200/90 shadow-xs"
                                        : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.14] border border-white/10"
                                }`}
                            >
                                <span>{d.firstLetter}</span>
                                {d.isToday && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Tarjeta Fusa: Segmented Switcher entre Resumen Nutricional y Resumen de Entrenamiento */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl border transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-2xl"
            }`}>
                {/* Switcher Segmentado */}
                <div className={`grid grid-cols-2 p-1 rounded-2xl mb-4 border ${
                    isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                }`}>
                    <button
                        type="button"
                        onClick={() => setViewMode("nutrition")}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === "nutrition"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Nutrición ({nutritionTotals.totalCalories} kcal)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("workout")}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === "workout"
                                ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>Entrenamiento ({workoutSummary.totalSets} series)</span>
                    </button>
                </div>

                {/* Contenido Dinámico: Tab Nutrición */}
                {viewMode === "nutrition" && (
                    <div className="space-y-4">
                        {/* Macro Bars Compactos (Contador de Calorías) */}
                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Calorías</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {nutritionTotals.totalCalories} / {targetCalories}
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className="text-[10px] text-emerald-500 uppercase block font-sans font-bold">Proteína</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {nutritionTotals.totalProtein}g / {targetProteinG}g
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Progreso</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {caloriePct}%
                                </span>
                            </div>
                        </div>

                        {/* Suplementación & Medicamentos (Lista Vertical Debajo del Contador de Calorías) */}
                        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                            isLight
                                ? "bg-slate-50/90 border-slate-200/90 shadow-xs"
                                : "bg-white/[0.03] border-white/[0.08]"
                        }`}>
                            <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${
                                isLight ? "border-slate-200" : "border-white/[0.06]"
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-emerald-500" />
                                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                                        isLight ? "text-slate-900" : "text-white"
                                    }`}>
                                        Suplementación & Medicamentos
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                        isLight
                                            ? "bg-slate-100 border-slate-200 text-slate-600"
                                            : "bg-white/[0.06] border-white/10 text-zinc-300"
                                    }`}>
                                        <strong className={isLight ? "text-slate-900 font-bold" : "text-white"}>{supplementsTakenCount}</strong> / {supplementsCount} Tomados
                                    </span>
                                    {onUpdateSupplements && (
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingSupplement(!isAddingSupplement)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                                                isAddingSupplement
                                                    ? (isLight ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-white/20 text-white border-white/30")
                                                    : (isLight ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30")
                                            }`}
                                            title="Añadir nuevo suplemento o medicamento"
                                        >
                                            {isAddingSupplement ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            <span>{isAddingSupplement ? "Cerrar" : "Agregar"}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Formulario Inline para Añadir Suplemento / Medicamento */}
                            {isAddingSupplement && (
                                <div className={`mb-3 p-3 rounded-xl border transition-all ${
                                    isLight ? "bg-white border-slate-300/80 shadow-xs" : "bg-black/40 border-white/10"
                                }`}>
                                    <p className={`text-[11px] font-semibold mb-2 ${isLight ? "text-slate-700" : "text-zinc-300"}`}>
                                        Registrar Suplemento o Medicamento:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre (ej. Creatina, Omega 3, Metformina)"
                                            value={newSupName}
                                            onChange={(e) => setNewSupName(e.target.value)}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                    : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                            }`}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dosis (ej. 5g, 500mg, 1 cap)"
                                            value={newSupDosage}
                                            onChange={(e) => setNewSupDosage(e.target.value)}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                    : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                            }`}
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Horario (ej. Mañana, Pre-entreno)"
                                                value={newSupTiming}
                                                onChange={(e) => setNewSupTiming(e.target.value)}
                                                className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                    isLight
                                                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                        : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSaveNewSupplement}
                                                disabled={!newSupName.trim()}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                    newSupName.trim()
                                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 shadow-sm"
                                                        : "opacity-40 bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                                }`}
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lista Vertical de Suplementos / Medicamentos */}
                            {supplements.length === 0 ? (
                                <div className={`p-3.5 text-center rounded-xl border text-xs ${
                                    isLight ? "bg-white border-slate-200 text-slate-500" : "bg-black/20 border-white/5 text-zinc-500"
                                }`}>
                                    No hay suplementos o medicamentos registrados. Toca <strong>Agregar</strong> para registrar uno.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {supplements.map((sup, idx) => {
                                        const isTaken = !!currentLog.supplementsTaken?.[sup.name];

                                        return (
                                            <div
                                                key={`${sup.name}_${idx}`}
                                                onClick={() => handleToggleSupplement(sup.name)}
                                                className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] select-none ${
                                                    isTaken
                                                        ? (isLight
                                                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                                                            : "bg-emerald-500/10 border-emerald-500/30 text-white")
                                                        : (isLight
                                                            ? "bg-white hover:bg-slate-100/80 border-slate-200/90 text-slate-800"
                                                            : "bg-black/30 hover:bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white")
                                                }`}
                                            >
                                                {/* Checkbox y Datos */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                        isTaken
                                                            ? "bg-emerald-500 text-black shadow-xs shadow-emerald-500/30"
                                                            : (isLight ? "border-2 border-slate-300 bg-white" : "border-2 border-zinc-600 bg-black/40")
                                                    }`}>
                                                        {isTaken ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`text-xs sm:text-sm font-semibold truncate ${
                                                            isTaken
                                                                ? (isLight ? "text-emerald-950 line-through decoration-emerald-600/40" : "text-zinc-200 line-through decoration-emerald-400/40")
                                                                : (isLight ? "text-slate-900" : "text-white")
                                                        }`}>
                                                            {sup.name}
                                                        </div>
                                                        <div className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1.5 ${
                                                            isLight ? "text-slate-500" : "text-zinc-400"
                                                        }`}>
                                                            <span>{sup.dosage}</span>
                                                            {sup.timing && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{sup.timing}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Estado Badge y Acción Eliminar */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${
                                                        isTaken
                                                            ? (isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300")
                                                            : (isLight ? "bg-slate-100 text-slate-500" : "bg-white/5 text-zinc-500")
                                                    }`}>
                                                        {isTaken ? "Tomado" : "Pendiente"}
                                                    </span>

                                                    {onUpdateSupplements && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteSupplement(e, sup.name)}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                isLight ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                                                            }`}
                                                            title={`Eliminar ${sup.name}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Botón Principal: Escanear Comida */}
                        <button
                            type="button"
                            onClick={() => {
                                setScannerCategory("lunch");
                                setIsFoodScannerOpen(true);
                            }}
                            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            <span>Escanear Comida</span>
                        </button>

                        {/* Desglose en 5 Tiempos */}
                        <div className="space-y-2.5 pt-1">
                            {MEAL_CATEGORIES.map((cat) => {
                                const items = currentLog.meals[cat.key] || [];
                                const cals = items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
                                const isAdding = activeAddingCategory === cat.key;

                                return (
                                    <div
                                        key={cat.key}
                                        className={`p-3 rounded-2xl border transition-all ${
                                            isLight
                                                ? "bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/80"
                                                : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span>{cat.iconEmoji}</span>
                                                <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{cat.title}</span>
                                                <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                                    ({items.length} {items.length === 1 ? "ítem" : "ítems"})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-mono font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{cals} kcal</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveAddingCategory(isAdding ? null : cat.key)}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                                                        isLight
                                                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-950"
                                                            : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
                                                    }`}
                                                    title="Añadir alimento manual"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lista de Alimentos en este tiempo */}
                                        {items.length > 0 && (
                                            <div className={`space-y-1 mt-2 pt-2 border-t ${
                                                isLight ? "border-slate-200" : "border-white/[0.04]"
                                            }`}>
                                                {items.map((item) => (
                                                    <div key={item.id} className={`flex items-center justify-between text-xs py-1 ${
                                                        isLight ? "text-slate-800" : "text-zinc-300"
                                                    }`}>
                                                        <span className="truncate pr-2">{item.name}</span>
                                                        <div className="flex items-center gap-2 shrink-0 font-mono">
                                                            <span className={isLight ? "text-slate-500" : "text-zinc-400"}>{item.calories} kcal</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFood(cat.key, item.id)}
                                                                className={`cursor-pointer transition-colors ${
                                                                    isLight ? "text-slate-400 hover:text-red-600" : "text-zinc-500 hover:text-[#FF2A2A]"
                                                                }`}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Formulario rápido para añadir manual */}
                                        {isAdding && (
                                            <div className={`mt-2.5 pt-2.5 border-t space-y-2 ${
                                                isLight ? "border-slate-200" : "border-white/[0.06]"
                                            }`}>
                                                <input
                                                    type="text"
                                                    value={newFoodName}
                                                    onChange={(e) => setNewFoodName(e.target.value)}
                                                    placeholder="Nombre del alimento (ej. 150g pechuga)"
                                                    className={`w-full h-8 rounded-xl px-2.5 text-xs focus:outline-none border ${
                                                        isLight
                                                            ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                            : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                    }`}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        value={newFoodCals}
                                                        onChange={(e) => setNewFoodCals(e.target.value)}
                                                        placeholder="Calorías (kcal)"
                                                        className={`h-8 rounded-xl px-2.5 text-xs font-mono focus:outline-none border ${
                                                            isLight
                                                                ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                                : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                        }`}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={newFoodProtein}
                                                        onChange={(e) => setNewFoodProtein(e.target.value)}
                                                        placeholder="Proteína (g)"
                                                        className={`h-8 rounded-xl px-2.5 text-xs font-mono focus:outline-none border ${
                                                            isLight
                                                                ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                                : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveAddingCategory(null)}
                                                        className={`px-2.5 py-1 text-[11px] cursor-pointer ${
                                                            isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white"
                                                        }`}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddManualFood(cat.key)}
                                                        className={`px-3 py-1 font-semibold text-xs rounded-xl cursor-pointer ${
                                                            isLight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-black"
                                                        }`}
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Contenido Dinámico: Tab Entrenamiento */}
                {viewMode === "workout" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Series</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {workoutSummary.totalSets}
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className="text-[10px] text-emerald-500 uppercase block font-sans font-bold">Tonelaje</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {Math.round(workoutSummary.totalVolumeKg)} kg
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Ejercicios</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {workoutSummary.uniqueExercises}
                                </span>
                            </div>
                        </div>

                        {dayExerciseLogs.length > 0 ? (
                            <div className="space-y-2">
                                <span className={`text-[11px] font-mono uppercase block ${
                                    isLight ? "text-slate-500" : "text-zinc-400"
                                }`}>
                                    Desglose de series registradas
                                </span>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {dayExerciseLogs.map((log, lIdx) => (
                                        <div
                                            key={lIdx}
                                            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-mono border ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-200 text-slate-800"
                                                    : "bg-white/[0.03] border-white/[0.06]"
                                            }`}
                                        >
                                            <div className="truncate pr-2">
                                                <span className={`font-sans font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{log.exercise_id}</span>
                                                <span className={`ml-2 ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Serie {log.set_number}</span>
                                            </div>
                                            <span className="text-emerald-500 font-bold shrink-0">
                                                {log.weight_kg}kg × {log.reps_completed} reps
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-8 text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No se registraron series para este día.</p>
                                {onGoToGym && (
                                    <button
                                        type="button"
                                        onClick={onGoToGym}
                                        className={`mt-3 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                            isLight
                                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                                : "bg-white/10 hover:bg-white/20 text-white"
                                        }`}
                                    >
                                        Ir al Entrenamiento Activo →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. Aislamiento de Planeación: Drawer Semanal Dedicado con Vaul */}
            <Drawer.Root open={isWeeklyPlanDrawerOpen} onOpenChange={setIsWeeklyPlanDrawerOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity" />
                    <Drawer.Content className={`backdrop-blur-2xl border-t flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 p-5 pb-8 max-w-lg mx-auto shadow-2xl ${
                        isLight
                            ? "bg-white/95 border-slate-200 text-slate-900"
                            : "bg-zinc-950/95 border-white/15 text-white"
                    }`}>
                        <Drawer.Handle className={`mx-auto w-12 h-1.5 rounded-full mb-4 ${
                            isLight ? "bg-slate-300" : "bg-zinc-700"
                        }`} />
                        
                        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
                            isLight ? "border-slate-200" : "border-white/10"
                        }`}>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-tight flex items-center gap-2 ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    <ClipboardList className="w-4 h-4 text-emerald-500" />
                                    <span>Plan Semanal & Compras</span>
                                </h4>
                                <p className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Consolidado Clínico de 7 Días</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWeeklyPlanDrawerOpen(false)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-600" : "bg-white/10 text-zinc-400 hover:text-white"
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                            {/* Gemini AI Action */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/10"
                            }`}>
                                <div>
                                    <div className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Plan Nutricional con IA</div>
                                    <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Régimen adaptativo con superávit o déficit controlado</div>
                                </div>
                                {onOpenDietPlanModal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsWeeklyPlanDrawerOpen(false);
                                            onOpenDietPlanModal();
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-full cursor-pointer transition-colors shrink-0"
                                    >
                                        Configurar
                                    </button>
                                )}
                            </div>

                            {/* Lista de Compras Consolidada */}
                            {groceryList && (
                                <div className="space-y-2">
                                    <span className={`text-[11px] font-mono uppercase tracking-wider block ${
                                        isLight ? "text-slate-500" : "text-zinc-400"
                                    }`}>
                                        Lista de Supermercado (7 Días)
                                    </span>
                                    <div className="space-y-1.5">
                                        {Object.entries(groceryList).map(([category, items]: [string, any]) => (
                                            <div key={category} className={`p-3 rounded-xl border ${
                                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.04]"
                                            }`}>
                                                <div className={`text-xs font-bold capitalize mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>{category}</div>
                                                <div className={`text-[11px] font-mono space-y-0.5 ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                                                    {Array.isArray(items) && items.map((it: any, i: number) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>• {typeof it === "string" ? it : it.name}</span>
                                                            <span className={isLight ? "text-slate-400" : "text-zinc-500"}>{it.amount || ""}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* Modal de Cámara Escáner */}
            <FoodCameraScannerModal
                isOpen={isFoodScannerOpen}
                onClose={() => setIsFoodScannerOpen(false)}
                initialCategory={scannerCategory}
                onAddFoodItem={handleAddScannedFood}
            />
        </div>
    );
};
