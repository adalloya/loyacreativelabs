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

interface ApexV2NutritionCalendarHubProps {
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG?: number;
    targetFatsG?: number;
    supplements: SupplementDose[];
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

    // Generate 7-day carousel days centered on activeDate
    const carouselDays = useMemo(() => {
        const curr = new Date(activeDate + "T12:00:00");
        const days = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(curr);
            d.setDate(d.getDate() + i);
            const iso = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("es-MX", { weekday: "short" });
            const dayNum = d.getDate();
            days.push({ iso, dayName, dayNum, isToday: iso === todayStr });
        }
        return days;
    }, [activeDate, todayStr]);

    const caloriePct = targetCalories > 0 ? Math.min(100, Math.round((nutritionTotals.totalCalories / targetCalories) * 100)) : 0;

    return (
        <div className="space-y-4">
            
            {/* 1. Header con Botón de Aislamiento de Planeación (Plan Semanal & Compras) */}
            <div className="flex items-center justify-between gap-3 px-1">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Nutrición & Calendario
                    </h2>
                    <p className="text-xs text-zinc-400 capitalize">
                        {formatFriendlyDate(activeDate)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Aislado de Plan Semanal & Lista de Compras */}
                    <button
                        type="button"
                        onClick={() => setIsWeeklyPlanDrawerOpen(true)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Ver plan de 7 días y lista de compras consolidada"
                    >
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Plan Semanal</span>
                    </button>
                </div>
            </div>

            {/* 2. Suplementación Prioritaria (En la parte superior con contador X/5) */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-4 shadow-xl">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Suplementación Diaria
                        </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300">
                        <strong className="text-white">{supplementsTakenCount}</strong> / {supplementsCount} Tomados
                    </span>
                </div>

                {/* Checklist horizontal táctil ultrarrápido */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {supplements.map((sup, idx) => {
                        const isTaken = !!currentLog.supplementsTaken?.[sup.name];

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleSupplement(sup.name)}
                                className={`px-3 py-2 rounded-2xl border text-left shrink-0 transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                                    isTaken
                                        ? "bg-emerald-500/15 border-emerald-500/40 text-white"
                                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                                }`}
                            >
                                <div className={`w-4 h-4 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isTaken ? "bg-emerald-500 text-black" : "border border-zinc-600 bg-black/40"
                                }`}>
                                    {isTaken ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-xs font-bold whitespace-nowrap">{sup.name}</div>
                                    <div className="text-[9px] font-mono text-zinc-400">{sup.dosage}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Carrusel Superior de Calendario (7 Días) */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-3 shadow-xl">
                <div className="flex items-center justify-between gap-1">
                    {carouselDays.map((d) => {
                        const isSelected = d.iso === activeDate;
                        const hasMeals = !!allNutritionLogs[d.iso];

                        return (
                            <button
                                key={d.iso}
                                type="button"
                                onClick={() => onSelectDate(d.iso)}
                                className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                    isSelected
                                        ? "bg-white text-black font-bold shadow-lg"
                                        : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                <span className={`text-[10px] uppercase font-mono ${isSelected ? "text-black" : "text-zinc-500"}`}>
                                    {d.dayName}
                                </span>
                                <span className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${isSelected ? "text-black" : "text-white"}`}>
                                    {d.dayNum}
                                </span>
                                {/* Dot indicator */}
                                <div className="flex items-center gap-0.5 mt-1">
                                    {d.isToday && (
                                        <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-black" : "bg-emerald-400"}`} />
                                    )}
                                    {hasMeals && (
                                        <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-black" : "bg-zinc-500"}`} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Tarjeta Fusa: Segmented Switcher entre Resumen Nutricional y Resumen de Entrenamiento */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl">
                {/* Switcher Segmentado */}
                <div className="grid grid-cols-2 p-1 bg-black/50 border border-white/10 rounded-2xl mb-4">
                    <button
                        type="button"
                        onClick={() => setViewMode("nutrition")}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === "nutrition"
                                ? "bg-white text-black shadow-md"
                                : "text-zinc-400 hover:text-white"
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
                                ? "bg-white text-black shadow-md"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>Entrenamiento ({workoutSummary.totalSets} series)</span>
                    </button>
                </div>

                {/* Contenido Dinámico: Tab Nutrición */}
                {viewMode === "nutrition" && (
                    <div className="space-y-4">
                        {/* Macro Bars Compactos */}
                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-400 uppercase block font-sans">Calorías</span>
                                <span className="text-sm font-bold text-white">
                                    {nutritionTotals.totalCalories} / {targetCalories}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-emerald-400 uppercase block font-sans">Proteína</span>
                                <span className="text-sm font-bold text-white">
                                    {nutritionTotals.totalProtein}g / {targetProteinG}g
                                </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-400 uppercase block font-sans">Progreso</span>
                                <span className="text-sm font-bold text-white">
                                    {caloriePct}%
                                </span>
                            </div>
                        </div>

                        {/* Botón Principal: Escanear Comida con Cámara AI */}
                        <button
                            type="button"
                            onClick={() => {
                                setScannerCategory("lunch");
                                setIsFoodScannerOpen(true);
                            }}
                            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            <span>Escanear Comida con Cámara IA</span>
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
                                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span>{cat.iconEmoji}</span>
                                                <span className="text-xs font-bold text-white">{cat.title}</span>
                                                <span className="text-[10px] text-zinc-500">
                                                    ({items.length} {items.length === 1 ? "ítem" : "ítems"})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-white">{cals} kcal</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveAddingCategory(isAdding ? null : cat.key)}
                                                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
                                                    title="Añadir alimento manual"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lista de Alimentos en este tiempo */}
                                        {items.length > 0 && (
                                            <div className="space-y-1 mt-2 pt-2 border-t border-white/[0.04]">
                                                {items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between text-xs py-1 text-zinc-300">
                                                        <span className="truncate pr-2">{item.name}</span>
                                                        <div className="flex items-center gap-2 shrink-0 font-mono">
                                                            <span className="text-zinc-400">{item.calories} kcal</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFood(cat.key, item.id)}
                                                                className="text-zinc-500 hover:text-[#FF2A2A] transition-colors cursor-pointer"
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
                                            <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-2">
                                                <input
                                                    type="text"
                                                    value={newFoodName}
                                                    onChange={(e) => setNewFoodName(e.target.value)}
                                                    placeholder="Nombre del alimento (ej. 150g pechuga)"
                                                    className="w-full h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        value={newFoodCals}
                                                        onChange={(e) => setNewFoodCals(e.target.value)}
                                                        placeholder="Calorías (kcal)"
                                                        className="h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-white/30"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={newFoodProtein}
                                                        onChange={(e) => setNewFoodProtein(e.target.value)}
                                                        placeholder="Proteína (g)"
                                                        className="h-8 bg-black/60 border border-white/10 rounded-xl px-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-white/30"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveAddingCategory(null)}
                                                        className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddManualFood(cat.key)}
                                                        className="px-3 py-1 bg-white text-black font-semibold text-xs rounded-xl cursor-pointer"
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
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-400 uppercase block font-sans">Series</span>
                                <span className="text-sm font-bold text-white">
                                    {workoutSummary.totalSets}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-emerald-400 uppercase block font-sans">Tonelaje</span>
                                <span className="text-sm font-bold text-white">
                                    {Math.round(workoutSummary.totalVolumeKg)} kg
                                </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-400 uppercase block font-sans">Ejercicios</span>
                                <span className="text-sm font-bold text-white">
                                    {workoutSummary.uniqueExercises}
                                </span>
                            </div>
                        </div>

                        {dayExerciseLogs.length > 0 ? (
                            <div className="space-y-2">
                                <span className="text-[11px] font-mono uppercase text-zinc-400 block">
                                    Desglose de series registradas
                                </span>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {dayExerciseLogs.map((log, lIdx) => (
                                        <div
                                            key={lIdx}
                                            className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs font-mono"
                                        >
                                            <div className="truncate pr-2">
                                                <span className="text-white font-sans font-medium">{log.exercise_id}</span>
                                                <span className="text-zinc-500 ml-2">Serie {log.set_number}</span>
                                            </div>
                                            <span className="text-emerald-400 font-bold shrink-0">
                                                {log.weight_kg}kg × {log.reps_completed} reps
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-500 text-xs">
                                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No se registraron series para este día.</p>
                                {onGoToGym && (
                                    <button
                                        type="button"
                                        onClick={onGoToGym}
                                        className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold cursor-pointer transition-colors"
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
                    <Drawer.Content className="bg-zinc-950/95 backdrop-blur-2xl border-t border-white/15 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 p-5 pb-8 text-white max-w-lg mx-auto shadow-2xl">
                        <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-zinc-700 mb-4" />
                        
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                                    <span>Plan Semanal & Compras</span>
                                </h4>
                                <p className="text-xs text-zinc-400 font-mono">Consolidado Clínico de 7 Días</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWeeklyPlanDrawerOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                            {/* Gemini AI Action */}
                            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-bold text-white">Plan Nutricional Gemini AI</div>
                                    <div className="text-[10px] text-zinc-400">Régimen adaptativo con superávit o déficit controlado</div>
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
                                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                                        Lista de Supermercado (7 Días)
                                    </span>
                                    <div className="space-y-1.5">
                                        {Object.entries(groceryList).map(([category, items]: [string, any]) => (
                                            <div key={category} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                                <div className="text-xs font-bold text-white capitalize mb-1">{category}</div>
                                                <div className="text-[11px] text-zinc-400 font-mono space-y-0.5">
                                                    {Array.isArray(items) && items.map((it: any, i: number) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>• {typeof it === "string" ? it : it.name}</span>
                                                            <span className="text-zinc-500">{it.amount || ""}</span>
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
